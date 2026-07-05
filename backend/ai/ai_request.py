"""AI API Request Functions"""
import base64
import os
import requests


def encode_image(image_path):
    """
    Encode an image file to base64 string.

    Args:
        image_path: Path to the image file (Path or string)

    Returns:
        str: Base64 encoded image data
    """
    with open(str(image_path), "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def get_mime_type(filepath):
    """
    Get MIME type based on file extension.

    Args:
        filepath: Path to the file (Path or string)

    Returns:
        str: MIME type string (e.g., "image/jpeg")
    """
    ext = os.path.splitext(str(filepath))[1].lower()
    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
    }
    return mime_types.get(ext, "image/jpeg")


def build_api_url(provider):
    """
    Build the full API URL from provider configuration.

    Args:
        provider: Provider name from AI_PROVIDERS

    Returns:
        str: Full API endpoint URL
    """
    from ai_config import get_provider_config
    config = get_provider_config(provider)
    return f"{config['base_url']}{config['endpoint']}"


def build_payload(image_path, prompt, mime_type, model, max_tokens, temperature):
    """
    Build the API request payload.

    Args:
        image_path: Path to the image file
        prompt: Text prompt for the AI
        mime_type: MIME type of the image
        model: Model name to use
        max_tokens: Maximum tokens for response
        temperature: Temperature setting

    Returns:
        dict: API request payload
    """
    encoded_image = encode_image(image_path)

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Do NOT think step by step. Do NOT show your reasoning. Respond with only the raw filename, no extra text."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{encoded_image}"
                        }
                    },
                ],
            }
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    return payload


def call_api(image_path, prompt=None, provider="LM Studio", model=None, max_tokens=None, temperature=None):
    """
    Send image to AI API and get response.

    Args:
        image_path: Path to the image file
        prompt: Text prompt for the AI (default: filename generation)
        provider: AI provider to use
        model: Model name (uses provider default if None)
        max_tokens: Maximum tokens for response
        temperature: Temperature setting

    Returns:
        str: AI response text, or None if error
    """
    from ai_config import configure_ai, get_provider_config

    # Configure AI settings
    ai_settings = configure_ai(provider, model, max_tokens, temperature)

    # Use provided prompt or default
    if prompt is None:
        prompt = "Give me a short, descriptive filename for this image without the file extension. " \
                 "Do NOT include .jpg, .png, .gif, or any other extension. " \
                 "Only respond with the raw filename, nothing else."

    # Get MIME type
    mime_type = get_mime_type(image_path)

    # Build API URL
    url = build_api_url(provider)

    # Build payload
    payload = build_payload(
        image_path, prompt, mime_type,
        ai_settings["model"],
        ai_settings["max_tokens"],
        ai_settings["temperature"]
    )

    # Build headers
    headers = {"Content-Type": "application/json"}
    provider_config = get_provider_config(provider)

    # Add API key if required
    if provider_config.get("requires_api_key"):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(f"{provider} requires API key to be set in GROQ_API_KEY environment variable")
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        print(f"Sending request to {provider}...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        print(f"Response status: {response.status_code}")
        response.raise_for_status()

        # Parse response
        data = response.json()
        message = data["choices"][0]["message"]

        # Get content from response
        ai_response = (message.get("content") or message.get("reasoning_content") or "").strip()

        if not ai_response:
            print("Warning: Model returned empty response (likely hit reasoning token limit).")
            return None

        # For thinking models: use last non-empty line
        if not message.get("content") and message.get("reasoning_content"):
            lines = ai_response.strip().splitlines()
            if lines:
                ai_response = lines[-1]

        return ai_response

    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None
    except (KeyError, IndexError) as e:
        print(f"Unexpected response format: {e}")
        return None
