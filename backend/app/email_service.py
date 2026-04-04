import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "biketimer@example.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

_EMAIL_HTML = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Einladung</title>
</head>
<body style="margin:0;padding:20px;background:#f4f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="480" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(45,60,89,.14);">
          <!-- Header -->
          <tr>
            <td style="background:#2D3C59;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#E5BA41;font-size:22px;font-weight:700;letter-spacing:3px;">🚴 BIKETIMER</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:12px;letter-spacing:2px;">FAHRTTERMINE PLANEN</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px;">
              <p style="margin:0 0 12px;color:#222;font-size:16px;">Hallo,</p>
              <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
                <strong style="color:#2D3C59;">{inviter_name}</strong> hat dich zu einem Radausflug eingeladen!
              </p>
              <!-- Event box -->
              <table width="100%" style="border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="background:#E5BA41;height:4px;"></td>
                </tr>
                <tr>
                  <td style="background:#f8f9fc;padding:16px 20px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#2D3C59;text-transform:uppercase;letter-spacing:1px;">Event-Details</p>
                    <p style="margin:0;color:#333;font-size:15px;">📅 &nbsp;<strong>{event_date}</strong></p>
                    <p style="margin:6px 0 0;color:#555;font-size:14px;">🚵 &nbsp;{event_type}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
                Melde dich in der App an, um die Einladung anzunehmen oder abzulehnen.
              </p>
              <div style="text-align:center;">
                <a href="{frontend_url}" style="display:inline-block;padding:13px 32px;background:#E5BA41;color:#2D3C59;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                  App öffnen &rarr;
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f8;padding:16px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:11px;">Biketimer &middot; Diese E-Mail wurde automatisch generiert.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_invitation_email(
    invitee_email: str,
    inviter_name: str,
    event_data: dict,
) -> None:
    """Send invitation email via SMTP. Errors are logged but not raised."""
    try:
        event_date = event_data.get("event_date", "Unbekannt")
        raw_type = event_data.get("event_type", "event")
        event_type = raw_type.capitalize()

        html_body = _EMAIL_HTML.format(
            inviter_name=inviter_name,
            event_date=event_date,
            event_type=event_type,
            frontend_url=FRONTEND_URL,
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Einladung zum Radausflug am {event_date}"
        msg["From"] = SMTP_FROM
        msg["To"] = invitee_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            if SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"[email] Invitation sent to {invitee_email}")
    except Exception as exc:
        # Email failure should never block the API response
        print(f"[email] ERROR sending to {invitee_email}: {exc}")


_WELCOME_HTML = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Willkommen bei Biketimer</title>
</head>
<body style="margin:0;padding:20px;background:#f4f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="480" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(45,60,89,.14);">
          <tr>
            <td style="background:#2D3C59;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#E5BA41;font-size:22px;font-weight:700;letter-spacing:3px;">🚴 BIKETIMER</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:12px;letter-spacing:2px;">FAHRTTERMINE PLANEN</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fff;padding:32px;">
              <p style="margin:0 0 12px;color:#222;font-size:16px;">Hallo {display_name},</p>
              <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
                willkommen bei <strong style="color:#2D3C59;">Biketimer</strong>! Dein Konto wurde erfolgreich erstellt.
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
                Du kannst dich ab sofort anmelden, Events einsehen und Einladungen annehmen oder ablehnen.
              </p>
              <div style="text-align:center;">
                <a href="{frontend_url}" style="display:inline-block;padding:13px 32px;background:#E5BA41;color:#2D3C59;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
                  Zur App &rarr;
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f8;padding:16px;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:11px;">Biketimer &middot; Diese E-Mail wurde automatisch generiert.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_welcome_email(recipient_email: str, display_name: str) -> None:
    """Send a welcome email after successful registration."""
    if not recipient_email:
        return
    try:
        html_body = _WELCOME_HTML.format(
            display_name=display_name or "neues Mitglied",
            frontend_url=FRONTEND_URL,
        )
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Willkommen bei Biketimer!"
        msg["From"] = SMTP_FROM
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            if SMTP_USE_TLS:
                server.starttls()
                server.ehlo()
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"[email] Welcome mail sent to {recipient_email}")
    except Exception as exc:
        print(f"[email] ERROR sending welcome mail to {recipient_email}: {exc}")
