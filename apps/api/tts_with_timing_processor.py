from pipecat.frames.frames import Frame, TTSStartedFrame, TTSStoppedFrame, TextFrame, OutputTransportMessageFrame
from pipecat.processors.frame_processor import FrameProcessor, FrameDirection
from pipecat.services.openai.tts import OpenAITTSService
from typing import AsyncGenerator, List, Dict, Any
import os
import time
import base64
import json
from loguru import logger
import httpx


class TTSWithTimingProcessor(FrameProcessor):
    """
    Wraps TTS service to emit word-level timing events via RTVI protocol.
    
    This processor intercepts text frames, synthesizes speech with timing data,
    and emits both audio frames and timing events via LiveKit data channels.
    
    Features:
    - Extracts native timing from Kokoro TTS /captioned_speech endpoint
    - Emits custom RTVI events: 'bot-tts-timing' with word timestamps
    - Falls back to estimation for non-Kokoro TTS services
    - Maintains audio streaming without breaking Pipecat pipeline
    - Adds sequence IDs for robust audio/timing synchronization
    
    Emits:
    - Audio frames (via wrapped TTS service)
    - DataMessageFrame: Word timing data sent via LiveKit data channel
    """
    
    def __init__(self, tts_service: OpenAITTSService):
        """
        Initialize the timing processor.
        
        Args:
            tts_service: The underlying TTS service to wrap
        """
        super().__init__()
        self.tts_service = tts_service
        self._processing_text = False
        
    async def process_frame(self, frame: Frame, direction: FrameDirection):
        """
        Process incoming frames and add timing extraction.
        
        Args:
            frame: The frame to process
            direction: The direction of frame flow
        """
        await super().process_frame(frame, direction)
        
        # Handle text frames that need TTS synthesis
        if isinstance(frame, TextFrame):
            logger.debug(f"TTS Timing: Processing text: {frame.text}")
            
            # Get timing and audio from TTS backend
            try:
                audio_frames, timings = await self._synthesize_with_timing(frame.text)
                
                # Emit timing as RTVI data message (LiveKit will send via data channel)
                # Add sequence ID for robust audio/timing synchronization
                sequence_id = int(time.time() * 1000)  # Millisecond timestamp as sequence
                
                timing_data = {
                    "type": "bot-tts-timing",
                    "sequence_id": sequence_id,
                    "words": [t["word"] for t in timings],
                    "word_times": [t["start_time"] for t in timings],
                    "word_durations": [t["end_time"] - t["start_time"] for t in timings],
                    "text": frame.text
                }
                
                logger.info(f"Emitting timing event: {len(timings)} words for text: '{frame.text[:50]}...'")
                
                # Send timing via LiveKit data channel
                await self.push_frame(OutputTransportMessageFrame(message=timing_data))
                
                # Push audio frames
                for audio_frame in audio_frames:
                    await self.push_frame(audio_frame)
                    
            except Exception as e:
                logger.error(f"Error in TTS timing processor: {e}", exc_info=True)
                # Fallback: let the original TTS service handle it
                await self.push_frame(frame, direction)
        else:
            # Pass through other frames unchanged
            await self.push_frame(frame, direction)
    
    async def _synthesize_with_timing(self, text: str) -> tuple[List[Frame], List[Dict[str, Any]]]:
        """
        Call TTS endpoint with timing support.
        
        This method attempts to use Kokoro's native /captioned_speech endpoint
        for precise word-level timing. If that fails, it falls back to standard
        TTS with estimated timing.
        
        Args:
            text: The text to synthesize
            
        Returns:
            tuple: (audio_frames, timing_data)
                - audio_frames: List of audio frames from TTS
                - timing_data: List of dict with 'word', 'start_time', 'end_time'
        """
        # Get TTS configuration from environment
        tts_base_url = os.getenv("TTS_BASE_URL")
        tts_api_key = os.getenv("TTS_API_KEY")
        tts_model = os.getenv("TTS_MODEL", "kokoro")
        tts_voice = os.getenv("TTS_VOICE", "af_heart")
        tts_backend = os.getenv("TTS_BACKEND", "kokoro")
        
        # Try native timing endpoint first (Kokoro TTS)
        if tts_backend.lower() == "kokoro" and tts_base_url:
            try:
                logger.debug(f"Attempting Kokoro /captioned_speech endpoint for timing")
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{tts_base_url}/captioned_speech",
                        headers={
                            "Authorization": f"Bearer {tts_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": tts_model,
                            "input": text,
                            "voice": tts_voice,
                            "speed": 1.0,
                            "response_format": "pcm",
                            "stream": True,
                        },
                    )
                    
                    if response.status_code == 200:
                        logger.debug("Kokoro timing endpoint successful")
                        
                        # Parse streaming response for audio and timing
                        audio_chunks = []
                        timing_data = []
                        
                        # Handle both streaming and non-streaming responses
                        content = await response.aread()
                        
                        # Try to parse as newline-delimited JSON
                        for line in content.decode('utf-8').split('\n'):
                            if line.strip():
                                try:
                                    data = json.loads(line)
                                    
                                    # Extract audio chunks
                                    if "audio" in data:
                                        audio_chunks.append(base64.b64decode(data["audio"]))
                                    
                                    # Extract timing data
                                    if "word_timings" in data:
                                        for timing in data["word_timings"]:
                                            timing_data.append({
                                                "word": timing["word"],
                                                "start_time": timing["start"],
                                                "end_time": timing["end"],
                                            })
                                except json.JSONDecodeError:
                                    # Might be raw audio data
                                    logger.debug("Non-JSON line in response, skipping")
                                    continue
                        
                        if audio_chunks and timing_data:
                            # Convert audio to frames using the wrapped TTS service
                            audio_bytes = b"".join(audio_chunks)
                            
                            # Use the TTS service to create proper audio frames
                            # We'll push the raw audio through the service's processing
                            from pipecat.frames.frames import TTSAudioRawFrame
                            audio_frames = [TTSAudioRawFrame(
                                audio=audio_bytes,
                                sample_rate=24000,
                                num_channels=1
                            )]
                            
                            logger.info(f"Successfully extracted {len(timing_data)} word timings from Kokoro")
                            return audio_frames, timing_data
                    else:
                        logger.warning(f"Kokoro /captioned_speech returned {response.status_code}")
            
            except (httpx.HTTPError, Exception) as e:
                logger.warning(f"Native timing endpoint failed: {e}, falling back to estimation")
        
        # Fallback: Use standard TTS service and estimate timing
        logger.debug("Using standard TTS with estimated timing")
        
        # Generate audio using the wrapped TTS service
        audio_frames = []
        async for frame in self.tts_service.run_tts(text):
            audio_frames.append(frame)
        
        # Estimate timing based on text
        estimated_timing = self._estimate_word_timing(text)
        
        logger.info(f"Using estimated timing for {len(estimated_timing)} words")
        return audio_frames, estimated_timing
    
    def _estimate_word_timing(self, text: str) -> List[Dict[str, Any]]:
        """
        Estimate word timing when native timing is unavailable.
        
        This provides a simple linear estimation based on word count.
        It's not as accurate as native timing but provides a reasonable
        fallback for lip-sync animation.
        
        Args:
            text: The text to estimate timing for
            
        Returns:
            List of timing dictionaries with 'word', 'start_time', 'end_time'
        """
        words = text.split()
        
        # Estimate based on average speaking rate
        # Typical rate: ~150 words per minute = 2.5 words/second = 0.4 seconds/word
        # We'll use a slightly faster rate for better responsiveness
        avg_duration_per_word = 0.35  # seconds
        
        timings = []
        current_time = 0.0
        
        for word in words:
            # Adjust duration based on word length (longer words take more time)
            word_length_factor = len(word) / 5.0  # 5 chars = 1.0 factor
            duration = avg_duration_per_word * max(0.5, min(1.5, word_length_factor))
            
            timings.append({
                "word": word,
                "start_time": current_time,
                "end_time": current_time + duration,
            })
            
            current_time += duration
        
        return timings
