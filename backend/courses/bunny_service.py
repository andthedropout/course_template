"""
Bunny Stream API integration service.
Handles video creation, status polling, and signed URL generation.
"""
import base64
import hashlib
import time
import requests
from django.conf import settings
from django.core.cache import cache


class BunnyStreamService:
    """Service class for interacting with Bunny Stream API."""

    def __init__(self):
        self.library_id = settings.BUNNY_STREAM_LIBRARY_ID
        self.api_key = settings.BUNNY_STREAM_API_KEY
        self.cdn_hostname = settings.BUNNY_STREAM_CDN_HOSTNAME
        self.security_key = settings.BUNNY_STREAM_SECURITY_KEY
        self.base_url = f"https://video.bunnycdn.com/library/{self.library_id}"

    def _headers(self):
        """Return headers for Bunny API requests."""
        return {"AccessKey": self.api_key}

    def is_configured(self) -> bool:
        """Check if Bunny Stream is properly configured."""
        return bool(self.library_id and self.api_key)

    def create_video(self, title: str) -> dict:
        """
        Create a video placeholder in Bunny Stream.
        Returns GUID and TUS upload URL for direct upload.
        """
        response = requests.post(
            f"{self.base_url}/videos",
            headers=self._headers(),
            json={"title": title}
        )
        response.raise_for_status()
        data = response.json()

        return {
            "guid": data["guid"],
            "tus_upload_url": f"https://video.bunnycdn.com/tusupload",
        }

    def get_video_status(self, guid: str) -> dict:
        """
        Fetch video processing status from Bunny.

        Bunny status codes:
        0 = Created
        1 = Uploaded
        2 = Processing
        3 = Transcoding
        4 = Ready
        5 = Error
        """
        response = requests.get(
            f"{self.base_url}/videos/{guid}",
            headers=self._headers()
        )
        response.raise_for_status()
        return response.json()

    def delete_video(self, guid: str) -> bool:
        """Delete a video from Bunny Stream."""
        response = requests.delete(
            f"{self.base_url}/videos/{guid}",
            headers=self._headers()
        )
        return response.status_code == 200

    def generate_signed_url(self, guid: str, expires_hours: int = 6) -> str:
        """
        Generate a signed embed URL with expiry.
        Uses caching to avoid regenerating for every request.
        """
        cache_key = f"bunny_signed_url_{guid}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        expiry = int(time.time()) + (expires_hours * 3600)

        # Bunny signature format for iframe embeds
        # The token is a SHA256 hash of: security_key + video_id + expiry
        token_string = f"{self.security_key}{guid}{expiry}"
        token = hashlib.sha256(token_string.encode()).hexdigest()

        signed_url = (
            f"https://iframe.mediadelivery.net/embed/{self.library_id}/{guid}"
            f"?token={token}&expires={expiry}"
        )

        # Cache for 5 hours (1 hour before expiry as buffer)
        cache.set(cache_key, signed_url, timeout=5 * 3600)
        return signed_url

    def get_direct_play_url(self, guid: str) -> str:
        """
        Get a direct HLS playback URL (for custom players).
        This is the m3u8 playlist URL.
        """
        if self.cdn_hostname:
            return f"https://{self.cdn_hostname}/{guid}/playlist.m3u8"
        return f"https://vz-{self.library_id}.b-cdn.net/{guid}/playlist.m3u8"

    def generate_tus_auth_headers(self, guid: str, expires_seconds: int = 3600) -> dict:
        """
        Generate authentication headers for TUS upload.
        These headers are needed by the frontend to upload directly to Bunny.
        """
        expiry = int(time.time()) + expires_seconds

        # TUS auth signature
        signature_string = f"{self.library_id}{self.api_key}{expiry}{guid}"
        signature = hashlib.sha256(signature_string.encode()).hexdigest()

        return {
            "AuthorizationSignature": signature,
            "AuthorizationExpire": str(expiry),
            "VideoId": guid,
            "LibraryId": self.library_id,
        }

    def generate_signed_thumbnail_url(self, guid: str, expires_hours: int = 6) -> str:
        """
        Generate a signed thumbnail URL for CDN access.
        Required when token authentication is enabled on the library.
        Uses Bunny CDN token format: Base64(SHA256(security_key + path + expiry))
        """
        cache_key = f"bunny_thumb_{guid}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        expiry = int(time.time()) + (expires_hours * 3600)

        # Bunny CDN token format: Base64 encoded SHA256 hash
        # Input: security_key + path + expiry
        path = f"/{guid}/thumbnail.jpg"
        token_string = f"{self.security_key}{path}{expiry}"
        token_hash = hashlib.sha256(token_string.encode()).digest()
        # URL-safe Base64 encoding (replace + with -, / with _, remove padding)
        token = base64.urlsafe_b64encode(token_hash).decode().rstrip('=')

        signed_url = f"https://{self.cdn_hostname}{path}?token={token}&expires={expiry}"

        # Cache for 5 hours
        cache.set(cache_key, signed_url, timeout=5 * 3600)
        return signed_url

    def fetch_thumbnail_bytes(self, guid: str) -> bytes | None:
        """
        Fetch thumbnail bytes directly from Bunny Stream API.
        Returns the raw image bytes or None if not available.
        """
        # Try fetching via signed CDN URL
        signed_url = self.generate_signed_thumbnail_url(guid)
        try:
            response = requests.get(signed_url, timeout=10)
            if response.status_code == 200:
                return response.content
        except Exception:
            pass

        return None
