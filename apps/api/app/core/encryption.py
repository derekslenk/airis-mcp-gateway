"""Encryption utilities for secret management"""
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64


class EncryptionManager:
    """Manages encryption and decryption of secrets"""

    def __init__(self, master_key: str | None = None):
        """
        Initialize encryption manager with master key

        Args:
            master_key: Master encryption key. If None, generates or reads from env.
        """
        if master_key is None:
            master_key = os.getenv("ENCRYPTION_MASTER_KEY")
            if not master_key:
                # Generate new key if not exists
                master_key = Fernet.generate_key().decode()
                print(f"⚠️  Generated new ENCRYPTION_MASTER_KEY: {master_key}")
                print("   Add this to your .env file or environment variables")

        self.master_key = master_key
        self._fernet = self._create_fernet(master_key)

    def _create_fernet(self, master_key: str) -> Fernet:
        """Create Fernet cipher from master key"""
        # Use PBKDF2HMAC to derive a proper Fernet key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"airis-mcp-gateway-salt",  # Fixed salt for consistent keys
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        return Fernet(key)

    def encrypt(self, plaintext: str) -> bytes:
        """
        Encrypt plaintext string

        Args:
            plaintext: String to encrypt

        Returns:
            Encrypted bytes
        """
        return self._fernet.encrypt(plaintext.encode())

    def decrypt(self, encrypted: bytes) -> str:
        """
        Decrypt encrypted bytes

        Args:
            encrypted: Encrypted bytes

        Returns:
            Decrypted plaintext string
        """
        return self._fernet.decrypt(encrypted).decode()

    @staticmethod
    def generate_master_key() -> str:
        """Generate a new master encryption key"""
        return Fernet.generate_key().decode()


# Global encryption manager instance
encryption_manager = EncryptionManager()
