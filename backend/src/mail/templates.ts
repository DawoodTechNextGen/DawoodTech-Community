function layout(title: string, bodyHtml: string, actionUrl: string, actionLabel: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #3d5afe; margin: 0 0 16px;">${title}</h2>
      <p style="color: #333; font-size: 15px; line-height: 1.6;">${bodyHtml}</p>
      <a href="${actionUrl}"
         style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #3d5afe; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">
        ${actionLabel}
      </a>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        If the button doesn't work, copy and paste this link:<br />
        <span style="word-break: break-all;">${actionUrl}</span>
      </p>
    </div>
  `;
}

export function verifyEmailTemplate(fullName: string, link: string): { subject: string; html: string } {
  return {
    subject: 'Verify your DawoodTech Community email',
    html: layout(
      'Welcome to DawoodTech Community',
      `Hi ${fullName}, please confirm your email address to activate your account. This link expires in 1 hour.`,
      link,
      'Verify email',
    ),
  };
}

export function resetPasswordTemplate(fullName: string, link: string): { subject: string; html: string } {
  return {
    subject: 'Reset your DawoodTech Community password',
    html: layout(
      'Reset your password',
      `Hi ${fullName}, we received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can ignore this email.`,
      link,
      'Reset password',
    ),
  };
}
