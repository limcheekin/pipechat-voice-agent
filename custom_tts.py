"""Custom TTS Service for OpenAI-compatible endpoints with custom voices."""

from pipecat.services.openai import tts as openai_tts_module
from pipecat.services.openai.tts import OpenAITTSService, VALID_VOICES


# Monkey-patch: Add custom voices to the VALID_VOICES dictionary
# This allows OpenAITTSService to accept any custom voice from your backend
_original_valid_voices = VALID_VOICES.copy()


def add_custom_voice(voice_id: str):
    """Add a custom voice to the VALID_VOICES dictionary."""
    if voice_id not in VALID_VOICES:
        # Map custom voice to itself (no transformation needed)
        VALID_VOICES[voice_id] = voice_id
        # Also update the module-level VALID_VOICES
        openai_tts_module.VALID_VOICES[voice_id] = voice_id


class CustomOpenAITTSService(OpenAITTSService):
    """
    Custom OpenAI TTS Service that supports custom voices.
    
    This extends the standard OpenAITTSService to automatically register
    custom voices not in OpenAI's standard list (like kokoro voices: af_heart, etc.).
    """
    
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str | None = None,
        model: str = "gpt-4o-mini-tts",
        voice: str = "alloy",
        language: str | None = None,
        **kwargs
    ):
        """Initialize with support for custom voices and optional language parameter."""
        # Add the custom voice to VALID_VOICES before initializing parent
        add_custom_voice(voice)
        
        # Store language if provided (for later use)
        self._custom_language = language
        
        # Initialize parent class - voice is now valid
        super().__init__(
            api_key=api_key,
            base_url=base_url,
            model=model,
            voice=voice,
            **kwargs
        )
        
        # Store language for potential use in requests
        if self._custom_language:
            self._language = self._custom_language
