import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models import Notification, User
from backend.app.core.config import settings

def send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    delivery_channel: str = "in_app"
) -> Notification:
    """
    Creates an in-app notification and attempts email dispatch if configured.
    Tracks success, failure, and delivery logs.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        status="unread",
        delivery_channel=delivery_channel,
        sent_at=datetime.utcnow()
    )

    # If email dispatch requested and SMTP is configured
    if delivery_channel in ["email", "both"]:
        if settings.SMTP_HOST and settings.SMTP_USER:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = title
                msg["From"] = settings.EMAILS_FROM_EMAIL
                msg["To"] = user.email

                html_content = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
                      <h2 style="color: #0f172a; margin-top: 0;">{settings.COLLEGE_NAME}</h2>
                      <h3 style="color: #2563eb;">{title}</h3>
                      <p>{message}</p>
                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                      <p style="font-size: 12px; color: #64748b;">This is an automated notification from the Examination Management Portal.</p>
                    </div>
                  </body>
                </html>
                """
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(settings.EMAILS_FROM_EMAIL, user.email, msg.as_string())
            except Exception as e:
                notification.error_details = f"Email delivery failed: {str(e)}"
        else:
            notification.error_details = "SMTP credentials not configured on server (simulation logged)."

    db.add(notification)
    db.commit()
    return notification

def broadcast_timetable_published(db: Session, timetable_version_id: int):
    """
    Notifies all active students and faculty that a new timetable has been officially published.
    """
    from backend.app.models import TimetableVersion
    version = db.query(TimetableVersion).filter(TimetableVersion.id == timetable_version_id).first()
    v_name = version.name if version else "Timetable"

    users = db.query(User).filter(User.is_active == True).all()
    for u in users:
        if u.role == "student":
            msg = f"The official examination schedule '{v_name}' has been published. Please check your personalized examination admit card."
        elif u.role == "faculty":
            msg = f"The examination timetable '{v_name}' has been published. Your invigilation duty roster is now active."
        else:
            msg = f"Timetable version '{v_name}' has been published successfully."

        notif = Notification(
            user_id=u.id,
            title="Official Examination Timetable Published",
            message=msg,
            notification_type="alert",
            status="unread",
            delivery_channel="in_app",
            sent_at=datetime.utcnow()
        )
        db.add(notif)
    db.commit()
