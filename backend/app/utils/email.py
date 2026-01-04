"""Email utilities."""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Template
from typing import Optional, List
from loguru import logger
from app.config import settings


async def send_email(
    to: str | List[str],
    subject: str,
    body: str,
    html: Optional[str] = None
) -> bool:
    """Send email asynchronously."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email not configured, skipping send")
        return False
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = settings.FROM_EMAIL
        message["To"] = to if isinstance(to, str) else ", ".join(to)
        message["Subject"] = subject
        
        # Add plain text
        message.attach(MIMEText(body, "plain", "utf-8"))
        
        # Add HTML if provided
        if html:
            message.attach(MIMEText(html, "html", "utf-8"))
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True
        )
        
        logger.info(f"Email sent to {to}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


async def send_registration_confirmation(team_name: str, email: str) -> bool:
    """Send registration confirmation email."""
    subject = f"Регистрация команды {team_name} - Евробот"
    body = f"""
Здравствуйте!

Ваша команда "{team_name}" успешно зарегистрирована на соревнования Евробот.

Мы свяжемся с вами для подтверждения участия.

С уважением,
Команда Евробот
    """
    
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif;">
        <h2>Регистрация команды {team_name}</h2>
        <p>Здравствуйте!</p>
        <p>Ваша команда <strong>"{team_name}"</strong> успешно зарегистрирована на соревнования Евробот.</p>
        <p>Мы свяжемся с вами для подтверждения участия.</p>
        <hr>
        <p>С уважением,<br>Команда Евробот</p>
    </body>
    </html>
    """
    
    return await send_email(email, subject, body, html)


async def send_contact_notification(name: str, email: str, topic: str, message: str) -> bool:
    """Send notification about new contact message to admin."""
    admin_email = settings.ADMIN_EMAIL
    subject = f"Новое сообщение: {topic} - от {name}"
    body = f"""
Новое сообщение с сайта Евробот

От: {name} ({email})
Тема: {topic}

Сообщение:
{message}
    """
    
    return await send_email(admin_email, subject, body)



