"""Yandex SmartCaptcha verification utility."""
import httpx
from typing import Optional
from app.config import settings


async def verify_captcha(token: str, ip: Optional[str] = None) -> bool:
    """
    Verify Yandex SmartCaptcha token.
    
    Args:
        token: The captcha token from frontend
        ip: Optional client IP address
        
    Returns:
        True if verification passed, False otherwise
    """
    if not token:
        return False
    
    # If no secret key configured, skip verification (for development)
    secret_key = getattr(settings, 'SMARTCAPTCHA_SERVER_KEY', None)
    if not secret_key:
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://smartcaptcha.yandexcloud.net/validate',
                data={
                    'secret': secret_key,
                    'token': token,
                    'ip': ip or ''
                },
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('status') == 'ok'
            
            return False
    except Exception as e:
        # Log error but don't block user if captcha service is down
        print(f"Captcha verification error: {e}")
        return True  # Allow through if service unavailable

