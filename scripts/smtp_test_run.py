import sys, ssl, smtplib
from email.message import EmailMessage

if len(sys.argv) < 6:
    print('Usage: smtp_test_run.py host port user pass from_email')
    sys.exit(1)

smtp_host = sys.argv[1]
smtp_port = int(sys.argv[2])
smtp_user = sys.argv[3]
smtp_pass = sys.argv[4]
from_email = sys.argv[5]

print('Using', smtp_host, smtp_port, smtp_user)

msg = EmailMessage()
msg['Subject'] = 'Test SMTP from Mailtrap'
msg['From'] = from_email
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
