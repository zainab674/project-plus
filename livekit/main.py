import os
import logging
import signal
import sys
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()

import asyncio
from livekit import agents, rtc
from livekit.agents import AutoSubscribe
from livekit.agents import stt as lk_stt
from livekit.plugins import deepgram  # plugin import

# Enhanced logger configuration with UTF-8 encoding
import io
import codecs

# Create UTF-8 encoded stdout wrapper for Windows compatibility
utf8_stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(utf8_stdout),
        logging.FileHandler('livekit_agent.log', encoding='utf-8')
    ]
)
logger = logging.getLogger("transcription-agent")

# Global variables for graceful shutdown
shutdown_event = asyncio.Event()
active_tasks = set()

class WebhookService:
    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8978")
        self.api_key = os.getenv("LIVEKIT_WEBHOOK_API_KEY", "your-webhook-api-key")
    
    async def send_transcription(self, meeting_id, transcription_data):
        """Send transcription data to backend"""
        try:
            url = f"{self.backend_url}/api/v1/transcription/livekit"
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            payload = {
                "meeting_id": meeting_id,
                "transcription_data": transcription_data
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            
            if response.status_code == 200:
                logger.info(f"[SUCCESS] Transcription sent to backend for meeting {meeting_id}")
                return True
            else:
                logger.error(f"[ERROR] Backend rejected transcription: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"[ERROR] Error sending transcription to backend: {e}")
            return False
    
    async def notify_meeting_started(self, meeting_id):
        """Notify backend that meeting has started"""
        try:
            url = f"{self.backend_url}/api/v1/transcription/start/{meeting_id}"
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            response = requests.post(url, json={}, headers=headers, timeout=5)
            
            if response.status_code == 200:
                logger.info(f"[SUCCESS] Meeting start notification sent for meeting {meeting_id}")
                return True
            else:
                logger.error(f"[ERROR] Backend rejected meeting start notification: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"[ERROR] Error sending meeting start notification: {e}")
            return False

# Initialize webhook service
webhook_service = WebhookService()

async def transcribe_and_forward(participant: rtc.RemoteParticipant, track: rtc.Track, room: rtc.Room):
    """Handle transcription for a participant's audio track with enhanced error handling"""
    audio_stream = None
    stt_stream = None
    forward_task = None
    
    try:
        logger.info(f"Starting transcription for participant: {participant.identity}")
        
        # Validate Deepgram API key
        if not os.getenv("DEEPGRAM_API_KEY"):
            logger.error("DEEPGRAM_API_KEY not found in environment variables")
            return
            
        # stream audio frames from this track
        audio_stream = rtc.AudioStream.from_track(track=track)
        
        # Deepgram STT with error handling
        try:
            stt = deepgram.STT(model="nova-2")
            stt_stream = stt.stream()
        except Exception as e:
            logger.error(f"Failed to initialize Deepgram STT: {e}")
            return

        async def forward_transcriptions():
            try:
                async for event in stt_stream:
                    if shutdown_event.is_set():
                        logger.info("Shutdown signal received, stopping transcription forwarding")
                        break
                        
                    if event.type == lk_stt.SpeechEventType.INTERIM_TRANSCRIPT:
                        text = event.alternatives[0].text
                        logger.info(f"Interim transcript from {participant.identity}: {text}")
                        try:
                            # INTERIM
                            payload = {
                                "type": "interim",
                                "text": text,
                                "participant": participant.identity,
                                "trackSid": track.sid,
                                "segmentId": f"{participant.identity}_{int(time.time()*1000)}",
                            }
                            
                            # Publish to LiveKit room
                            await room.local_participant.publish_data(
                                json.dumps(payload).encode("utf-8"),
                                topic="lk.transcription",
                            )
                            
                            # Send to backend for collection
                            meeting_id = room.name.replace("meeting-", "") if room.name.startswith("meeting-") else room.name
                            await webhook_service.send_transcription(meeting_id, payload)
                        except Exception as e:
                            logger.error(f"Failed to publish interim transcript: {e}")
                            
                    elif event.type == lk_stt.SpeechEventType.FINAL_TRANSCRIPT:
                        text = event.alternatives[0].text
                        logger.info(f"Final transcript from {participant.identity}: {text}")
                        try:
                            # FINAL
                            payload = {
                                "type": "final",
                                "text": text,
                                "participant": participant.identity,
                                "trackSid": track.sid,
                                "segmentId": f"{participant.identity}_{int(time.time()*1000)}",
                            }
                            
                            # Publish to LiveKit room
                            await room.local_participant.publish_data(
                                json.dumps(payload).encode("utf-8"),
                                topic="lk.transcription",
                            )
                            
                            # Send to backend for collection
                            meeting_id = room.name.replace("meeting-", "") if room.name.startswith("meeting-") else room.name
                            await webhook_service.send_transcription(meeting_id, payload)
                        except Exception as e:
                            logger.error(f"Failed to publish final transcript: {e}")
                            
            except Exception as e:
                logger.error(f"Error in transcription forwarding: {e}")

        forward_task = asyncio.create_task(forward_transcriptions())
        active_tasks.add(forward_task)
        forward_task.add_done_callback(active_tasks.discard)

        # Process audio frames with error handling
        try:
            async for audio_event in audio_stream:
                if shutdown_event.is_set():
                    logger.info("Shutdown signal received, stopping audio processing")
                    break
                    
                try:
                    stt_stream.push_frame(audio_event.frame)
                except Exception as e:
                    logger.error(f"Error pushing audio frame: {e}")
                    break
        except Exception as e:
            logger.error(f"Error processing audio stream: {e}")

        # Wait for forwarding task to complete
        if forward_task and not forward_task.done():
            try:
                await asyncio.wait_for(forward_task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("Transcription forwarding task timed out")
                forward_task.cancel()
                
    except Exception as e:
        logger.exception(f"Critical error in transcription for {participant.identity}: {e}")
    finally:
        # Enhanced cleanup with error handling
        cleanup_tasks = []
        
        if audio_stream:
            cleanup_tasks.append(audio_stream.aclose())
        if stt_stream:
            cleanup_tasks.append(stt_stream.aclose())
        if forward_task and not forward_task.done():
            forward_task.cancel()
            cleanup_tasks.append(forward_task)
            
        if cleanup_tasks:
            try:
                await asyncio.gather(*cleanup_tasks, return_exceptions=True)
            except Exception as e:
                logger.error(f"Error during cleanup: {e}")
                
        logger.info(f"Transcription cleanup completed for {participant.identity}")

async def main(ctx: agents.JobContext):
    """Transcription agent entrypoint with enhanced error handling and graceful shutdown"""
    logger.info("Starting transcription agent with enhanced error handling...")
    logger.info(f"Agent dispatched to room: {ctx.room.name}")
    
    # Note: Signal handlers cannot be set in worker threads, so we rely on room events for shutdown

    room = ctx.room
    
    # Track active transcription tasks
    transcription_tasks = set()

    @room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"Audio track subscribed from {participant.identity}")
            task = asyncio.create_task(transcribe_and_forward(participant, track, room))
            transcription_tasks.add(task)
            task.add_done_callback(transcription_tasks.discard)

    @room.on("track_unsubscribed")
    def on_track_unsubscribed(track, publication, participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"Audio track unsubscribed from {participant.identity}")

    @room.on("participant_disconnected")
    def on_participant_disconnected(participant):
        logger.info(f"Participant {participant.identity} disconnected")

    @room.on("disconnected")
    def on_disconnected():
        logger.info("Room disconnected, initiating cleanup...")
        shutdown_event.set()

    try:
        # Connect to room with retry logic
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
                logger.info("Transcription agent connected and listening for audio tracks")
                
                # Notify backend that meeting has started
                meeting_id = room.name.replace("meeting-", "") if room.name.startswith("meeting-") else room.name
                await webhook_service.notify_meeting_started(meeting_id)
                
                break
            except Exception as e:
                retry_count += 1
                logger.error(f"Connection attempt {retry_count} failed: {e}")
                if retry_count < max_retries:
                    await asyncio.sleep(2 ** retry_count)  # Exponential backoff
                else:
                    logger.error("Max connection retries reached, giving up")
                    raise

        # Wait for shutdown signal or room disconnection
        await shutdown_event.wait()
        
    except Exception as e:
        logger.exception(f"Critical error in main agent loop: {e}")
    finally:
        # Graceful cleanup
        logger.info("Starting graceful shutdown...")
        
        # Cancel all active transcription tasks
        if transcription_tasks:
            logger.info(f"Cancelling {len(transcription_tasks)} active transcription tasks")
            for task in transcription_tasks:
                if not task.done():
                    task.cancel()
            
            # Wait for tasks to complete with timeout
            try:
                await asyncio.wait_for(
                    asyncio.gather(*transcription_tasks, return_exceptions=True),
                    timeout=10.0
                )
            except asyncio.TimeoutError:
                logger.warning("Some transcription tasks did not complete within timeout")
        
        logger.info("Transcription agent shutdown completed")

def setup_environment():
    """Validate and setup environment variables"""
    required_vars = ["DEEPGRAM_API_KEY", "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please check your .env file or environment configuration")
        return False
    
    logger.info("Environment variables validated successfully")
    return True

if __name__ == "__main__":
    # Validate environment before starting
    if not setup_environment():
        logger.error("Environment validation failed, exiting...")
        sys.exit(1)
    
    # Run the agent with enhanced error handling and explicit dispatch
    try:
        # Run the agent with automatic dispatch (no agent_name)
        agents.cli.run_app(
            agents.WorkerOptions(
                entrypoint_fnc=main,
                # No agent_name = automatic dispatch to all new rooms
                permissions=agents.WorkerPermissions(
                    can_publish_data=True, 
                    can_subscribe=True
                ),
            )
        )
    except KeyboardInterrupt:
        logger.info("Agent interrupted by user")
    except Exception as e:
        logger.exception(f"Agent failed to start: {e}")
        sys.exit(1)
