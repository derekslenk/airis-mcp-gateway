"""API Key validation utilities"""
import re
from typing import Optional


class APIKeyValidator:
    """Validate API keys for different services"""

    # API Key patterns
    PATTERNS = {
        "TAVILY_API_KEY": r"^tvly-[A-Za-z0-9]{32,}$",
        "STRIPE_SECRET_KEY": r"^sk_(test|live)_[A-Za-z0-9]{24,}$",
        "FIGMA_ACCESS_TOKEN": r"^figd_[A-Za-z0-9_-]{40,}$",
        "GITHUB_PERSONAL_ACCESS_TOKEN": r"^gh[ps]_[A-Za-z0-9]{36,}$",
        "OPENAI_API_KEY": r"^sk-[A-Za-z0-9]{48,}$",
        "ANTHROPIC_API_KEY": r"^sk-ant-[A-Za-z0-9\-_]{95,}$",
        "SUPABASE_URL": r"^https://[a-z0-9]+\.supabase\.co$",
        "SUPABASE_ANON_KEY": r"^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$",  # JWT
    }

    @classmethod
    def validate(cls, key_name: str, value: str) -> tuple[bool, Optional[str]]:
        """
        Validate API key format

        Args:
            key_name: Name of the API key (e.g., "TAVILY_API_KEY")
            value: The API key value

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Basic validation
        if not value or not value.strip():
            return False, "API key cannot be empty"

        if len(value) < 10:
            return False, "API key is too short (minimum 10 characters)"

        if len(value) > 500:
            return False, "API key is too long (maximum 500 characters)"

        # Pattern-based validation
        if key_name in cls.PATTERNS:
            pattern = cls.PATTERNS[key_name]
            if not re.match(pattern, value):
                return False, f"Invalid format for {key_name}. Please check the API key."

        # Generic validation for unknown keys
        # Allow alphanumeric, hyphens, underscores, dots
        if not re.match(r"^[A-Za-z0-9\-_.]+$", value):
            return False, "API key contains invalid characters"

        return True, None


def validate_api_key(key_name: str, value: str) -> None:
    """
    Validate API key and raise ValueError if invalid

    Args:
        key_name: Name of the API key
        value: The API key value

    Raises:
        ValueError: If validation fails
    """
    is_valid, error = APIKeyValidator.validate(key_name, value)
    if not is_valid:
        raise ValueError(error)
