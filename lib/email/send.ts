import { EMAIL_FROM_DEFAULT, PRODUCT_NAME } from "@/lib/brand";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? EMAIL_FROM_DEFAULT;

  if (!apiKey) {
    console.info("[email:dev]", { to, subject, text: text ?? html.replace(/<[^>]+>/g, " ") });
    return { ok: true as const, id: "dev-log" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html, text })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed: ${body}`);
  }

  const payload = (await response.json()) as { id?: string };
  return { ok: true as const, id: payload.id ?? "sent" };
}

export function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
}

export async function sendExpertVerificationInvite(input: {
  expertEmail: string;
  expertName: string;
  projectTitle: string;
  assignmentId: string;
  matchScore: number;
}) {
  const reviewUrl = `${appBaseUrl()}/expert/reviews/${input.assignmentId}`;

  const subject = `Verify research report: ${input.projectTitle}`;
  const text = `Hi ${input.expertName},

You were selected (${input.matchScore}% match) to verify a research report within your expertise.

Project: ${input.projectTitle}

Open your marketplace review:
${reviewUrl}

Sign in with your expert account to attest findings with your name and credentials, flag inaccuracies, or add comments.

— ${PRODUCT_NAME}`;

  const html = `
    <p>Hi ${input.expertName},</p>
    <p>You were selected (<strong>${input.matchScore}% match</strong>) to verify a research report within your expertise.</p>
    <p><strong>Project:</strong> ${input.projectTitle}</p>
    <p><a href="${reviewUrl}">Open verification review</a></p>
    <p>Sign in with your expert account to attest findings with your name and credentials, flag inaccuracies, or add comments.</p>
    <p>— ${PRODUCT_NAME}</p>
  `;

  return sendEmail({ to: input.expertEmail, subject, html, text });
}
