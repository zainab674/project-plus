# LiveKit Agent Configuration Guide

## Automatic Dispatch Setup ✅

Your LiveKit agent is configured for **automatic dispatch**, which means it will automatically join every new room created in your LiveKit project. This is the simplest setup with zero backend changes required.

### How Automatic Dispatch Works

1. **No Agent Name**: Your agent runs without specifying an `agent_name` in `WorkerOptions`
2. **Auto-Join**: LiveKit server automatically dispatches your agent to each new room
3. **Audio Subscription**: Your agent automatically subscribes to audio tracks (`AutoSubscribe.AUDIO_ONLY`)
4. **Transcription**: Real-time transcription is provided for all participants

### Current Configuration

Your `main.py` already implements automatic dispatch correctly:

```python
# Line 254 in main.py - Automatic dispatch configuration
agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=main))
```

**Note**: No `agent_name` is specified, which enables automatic dispatch.

## Environment Variables Required

Create a `.env` file in the `livekit` directory with the following variables:

```
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key

# Optional: Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=livekit_agent.log

# Optional: Agent Configuration
AGENT_NAME=transcription-agent
MAX_RETRIES=3
TIMEOUT_SECONDS=30
```

## Getting Your API Keys

### LiveKit
1. Sign up at https://livekit.io/
2. Create a new project
3. Get your API key and secret from the project dashboard
4. Use the WebSocket URL provided

### Deepgram
1. Sign up at https://deepgram.com/
2. Create a new API key
3. Use the API key for speech-to-text functionality

## Running the Agent

### Option 1: Using the batch script (Windows)
```bash
start_agent.bat
```

### Option 2: Manual setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the agent with automatic dispatch
python main.py
```

### Option 3: Environment Check (Recommended First)
```bash
# Check if all environment variables are configured
python check_env.py
```

## How Automatic Dispatch Works in Practice

1. **Start Your Agent**: Run `python main.py` - the agent will connect to LiveKit server
2. **User Creates Room**: When someone creates a new room in your LiveKit project
3. **Auto-Dispatch**: LiveKit automatically assigns your agent to that room
4. **Join & Listen**: Your agent joins the room and subscribes to audio tracks
5. **Transcribe**: Real-time transcription begins for all participants
6. **Stay Active**: Agent remains in the room until all participants leave

### Benefits of Automatic Dispatch

- ✅ **Zero Backend Changes**: No need to modify your application code
- ✅ **Simple Setup**: Just run the agent and it handles everything
- ✅ **Real-time**: Instant transcription for every new room
- ✅ **Scalable**: Supports hundreds of thousands of concurrent connections

### Important Notes

- **Every Room**: Your agent will join **every** new room in your project
- **Resource Usage**: Monitor your agent's resource consumption with many concurrent rooms
- **Billing**: Each room with your agent counts toward your LiveKit usage

## Troubleshooting

### Common Issues

1. **DuplexClosed Error**: This usually indicates IPC communication issues
   - Check your network connection
   - Verify LiveKit server is accessible
   - Ensure API keys are correct

2. **Deepgram API Error**: Speech-to-text not working
   - Verify DEEPGRAM_API_KEY is set correctly
   - Check your Deepgram account has sufficient credits

3. **Connection Timeout**: Agent can't connect to LiveKit
   - Check LIVEKIT_URL format (should start with wss://)
   - Verify firewall settings
   - Test network connectivity

### Logs

The agent creates detailed logs in:
- Console output (real-time)
- `livekit_agent.log` file (persistent)

Check these logs for detailed error information.
