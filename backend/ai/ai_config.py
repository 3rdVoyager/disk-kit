"""AI Configuration Settings"""

# AI Provider configurations
AI_PROVIDERS = {
    "LM Studio": {
        "base_url": "http://127.0.0.1:1234",
        "endpoint": "/v1/chat/completions",
        "default_model": "google/gemma-3-4b-it",
    },
    "Groq": {
        "base_url": "https://api.groq.com",
        "endpoint": "/v1/chat/completions",
        "default_model": "llava-1.5-7b",
        "requires_api_key": True,
    }
}

# Default AI settings
DEFAULT_AI_SETTINGS = {
    "provider": "LM Studio",
    "model": None,  # Will use provider's default
    "max_tokens": 1024,
    "temperature": 0.1,
}


def configure_ai(provider=None, model=None, max_tokens=None, temperature=None):
    """
    Configure AI settings for the application.

    Args:
        provider: AI provider name (e.g., "LM Studio", "Groq")
        model: Model name to use
        max_tokens: Maximum tokens for response
        temperature: Creativity level (0-1)

    Returns:
        dict: AI configuration settings
    """
    settings = DEFAULT_AI_SETTINGS.copy()

    # Use provided values or defaults
    if provider:
        settings["provider"] = provider
    if model:
        settings["model"] = model
    if max_tokens is not None:
        settings["max_tokens"] = max_tokens
    if temperature is not None:
        settings["temperature"] = temperature

    # If no model specified, use provider's default
    if not settings["model"]:
        provider_config = AI_PROVIDERS.get(settings["provider"], AI_PROVIDERS["LM Studio"])
        settings["model"] = provider_config["default_model"]

    return settings


def get_provider_config(provider_name):
    """Get configuration for a specific AI provider."""
    return AI_PROVIDERS.get(provider_name, AI_PROVIDERS["LM Studio"])
