import { env } from "cloudflare:workers";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Mailgun HTTP API
 * Compatible with Cloudflare Workers
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html } = options;

  const mailgunDomain = env.MAILGUN_DOMAIN;
  const mailgunApiKey = env.MAILGUN_API_KEY;

  if (!mailgunDomain || !mailgunApiKey) {
    console.error("Mailgun configuration missing");
    return false;
  }

  const url = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;

  const formData = new FormData();
  formData.append("from", `骰声回响 <no-reply@${mailgunDomain}>`);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("html", html);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mailgun API error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
