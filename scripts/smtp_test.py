import os, ssl, smtplib
from email.message import EmailMessage

smtp_host = os.environ.get('SMTP_HOST')
smtp_port = int(os.environ.get('SMTP_PORT', '0') or 0)
smtp_user = os.environ.get('SMTP_USER')
smtp_pass = os.environ.get('SMTP_PASS')

msg = EmailMessage()
msg['Subject'] = 'Test SMTP from Mailtrap'
msg['From'] = os.environ.get('FROM_EMAIL', smtp_user)
msg['To'] = smtp_user
msg.set_content('Hello — this is a test from local dev.')

ctx = ssl.create_default_context()
try:
    with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as s:
        s.login(smtp_user, smtp_pass)
        s.send_message(msg)
    print('sent via SSL')
except Exception as e:
    print('SSL failed:', e)
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(smtp_user, smtp_pass)
            s.send_message(msg)
        print('sent via STARTTLS')
    except Exception as e2:
        print('starttls failed:', e2)
