# Phase 2.3: Integrate Timing Processor into Bot Pipeline - Walkthrough

## Overview

This walkthrough documents the successful integration of the `TTSWithTimingProcessor` into the Pipecat voice agent pipeline (`bot.py`). This component is critical for the 3D avatar lip-sync functionality, as it extracts word-level timing from the TTS service and emits it via LiveKit data channels.

## Changes Implemented

### 1. Bot Pipeline Integration

We integrated the timing processor into `bot.py` to wrap the standard TTS service.

```python
# apps/api/bot.py

# 1. Import the processor
from tts_with_timing_processor import TTSWithTimingProcessor

# 2. Instantiate it wrapping the TTS service
tts = CustomOpenAITTSService(...)
tts_with_timing = TTSWithTimingProcessor(tts_service=tts)

# 3. Add to pipeline
pipeline = Pipeline([
    # ...
    llm,
    tts_with_timing,  # ✅ Replaces standard tts
    transport.output(),
    # ...
])
```

### 2. LiveKit Transport Support

We updated `bot.py` to support the `livekit` transport argument via a custom argument parser, enabling:
```bash
uv run python bot.py --transport livekit
```

### 3. Fixes & Improvements

- **ImportError Fix**: Replaced `DataMessageFrame` (which doesn't exist) with `OutputTransportMessageFrame` in `tts_with_timing_processor.py`.
- **Deprecation Fixes**: Updated deprecated imports for `pipecat.services.openai` and `pipecat.transports.services.livekit`.
- **CLI Argument Parsing**: Implemented custom `argparse` logic in `bot.py` to support `livekit` choice, which was missing from the default runner.

## Verification Results

### ✅ Bot Startup Verification

The bot now starts up successfully with the LiveKit transport option.

**Command**:
```bash
uv run python bot.py --transport livekit
```

**Output**:
```
🚀 Starting Pipecat bot...
⏳ Loading models and imports (20 seconds, first run only)
...
✅ All components loaded successfully!
```

### ✅ Help Command Verification

The help command now correctly lists `livekit` as a transport option.

**Command**:
```bash
uv run python bot.py --help
```

**Output**:
```
usage: bot.py ... -t {daily,webrtc,livekit} ...
```
