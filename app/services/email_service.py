import logging
import smtplib
import socket
from email.message import EmailMessage

from ..config import settings

logger = logging.getLogger(__name__)


class IPv4SMTP(smtplib.SMTP):
    def _get_socket(self, host, port, timeout):
        addresses = socket.getaddrinfo(host, port, family=socket.AF_INET, type=socket.SOCK_STREAM)
        if not addresses:
            return super()._get_socket(host, port, timeout)

        last_error = None
        for family, socktype, proto, _, sockaddr in addresses:
            sock = socket.socket(family, socktype, proto)
            sock.settimeout(timeout)
            try:
                sock.connect(sockaddr)
                return sock
            except OSError as exc:
                last_error = exc
                sock.close()

        if last_error:
            raise last_error
        return super()._get_socket(host, port, timeout)


def verification_url(token: str) -> str:
    base = settings.app_base_url.rstrip("/")
    return f"{base}/verify-email?token={token}"


def password_reset_url(token: str) -> str:
    base = settings.app_base_url.rstrip("/")
    return f"{base}/reset-password?token={token}"


def send_verification_email(to_email: str, token: str) -> bool:
    url = verification_url(token)
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.warning("SMTP is not configured. Verification link for %s: %s", to_email, url)
        return False

    msg = EmailMessage()
    msg["Subject"] = "Verify your Meet.AI account"
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(
        "Welcome to Meet.AI.\n\n"
        "Please confirm your email by opening this link:\n"
        f"{url}\n\n"
        "If you did not create this account, you can ignore this email."
    )

    try:
        with IPv4SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
        return False


def send_password_reset_email(to_email: str, token: str) -> bool:
    url = password_reset_url(token)
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.warning("SMTP is not configured. Password reset link for %s: %s", to_email, url)
        return False

    msg = EmailMessage()
    msg["Subject"] = "Reset your Meet.AI password"
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(
        "We received a request to reset your Meet.AI password.\n\n"
        "Open this link to choose a new password:\n"
        f"{url}\n\n"
        f"This link expires in {settings.password_reset_expire_minutes} minutes.\n\n"
        "If you did not request this, you can ignore this email."
    )

    try:
        with IPv4SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
        return False
