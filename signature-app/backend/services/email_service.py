import resend
import os

resend.api_key = os.getenv("RESEND_API_KEY")


def send_signing_email(
    recipient: str,
    signing_link: str,
    filename: str,
):
    resend.Emails.send({
        "from": "noreply@docsign.vijaygitnew.tech",
        "to": recipient,
        "subject": f"Please sign: {filename}",
        "html": f"""
            <h2>Document Signature Request</h2>

            <p>You have been requested to sign:</p>

            <b>{filename}</b>

            <p>
                <a href="{signing_link}">
                    Click here to sign
                </a>
            </p>

            <p>This link may expire.</p>
        """
    })