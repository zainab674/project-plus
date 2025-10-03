# LiveKit Real-time Transcription Setup

This directory contains the LiveKit transcription agent that provides real-time speech-to-text (STT) for your meetings using Option A - "Agent does the STT".

## Overview

The transcription agent:
- Joins your LiveKit room automatically
- Listens to participants' audio streams
- Sends audio to Deepgram for STT processing
- Publishes transcription segments back to your app in real-time
- Supports both interim (live) and final transcriptions

## Setup

### 1. Environment Configuration

Your `.env` file should contain:
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxx
LIVEKIT_API_SECRET=xxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxx
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirement.txt
```

### 3. Run the Agent

**Option A: Using the provided scripts**
```bash
# On Windows:
run_transcription_agent.bat

# On macOS/Linux:
chmod +x run_transcription_agent.sh
./run_transcription_agent.sh
```

**Option B: Manual execution**
```bash
python transcription_agent.py
```

## How It Works

1. **Agent Connection**: The agent connects to your LiveKit room using the provided credentials
2. **Audio Subscription**: It subscribes to all participants' audio tracks
3. **STT Processing**: Audio is sent to Deepgram's nova-2 model for transcription
4. **Real-time Publishing**: Transcription segments are published back to the room
5. **Frontend Display**: The React frontend uses `useTranscriptions()` hook to display live captions

## Frontend Integration

The frontend has been updated to use LiveKit's built-in transcription hooks:

- **LiveCaptions Component**: Displays real-time captions as an overlay
- **useTranscriptions Hook**: Automatically receives transcription segments
- **Interim/Final Support**: Shows both live (interim) and final transcriptions

## Features

- ✅ Real-time transcription with interim and final segments
- ✅ Speaker identification
- ✅ Automatic room joining
- ✅ Error handling and logging
- ✅ Cross-platform support (Windows/macOS/Linux)
- ✅ Easy setup with provided scripts

## Troubleshooting

### Agent Not Connecting
- Verify your LiveKit credentials in `.env`
- Check that your LiveKit server is accessible
- Ensure the room exists and is active

### No Transcriptions Appearing
- Confirm the agent is running and connected
- Check that participants are speaking
- Verify Deepgram API key is valid
- Check browser console for any errors

### Audio Issues
- Ensure participants have microphone permissions
- Check that audio tracks are being published
- Verify network connectivity

## API Keys

- **LiveKit**: Get from your LiveKit Cloud dashboard
- **Deepgram**: Sign up at https://deepgram.com and get your API key

## Model Configuration

The agent uses Deepgram's `nova-2` model by default. You can modify this in `transcription_agent.py`:

```python
stt = DeepgramSTTNode(
    api_key=os.environ["DEEPGRAM_API_KEY"],
    model="nova-2"  # Change this to nova-2-general, nova-2-meeting, etc.
)
```

Available models:
- `nova-2`: General purpose (recommended)
- `nova-2-general`: General conversation
- `nova-2-meeting`: Optimized for meetings
- `nova-2-phonecall`: Optimized for phone calls
