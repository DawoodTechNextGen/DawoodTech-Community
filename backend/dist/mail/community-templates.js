const BRAND = '#3d5afe';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const e = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
function formatDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function greeting(name) {
    return name ? `Hi ${name},` : 'Hi,';
}
function avatar(name, url) {
    if (url) {
        return `<img src="${e(url)}" width="28" height="28" alt="" style="display: block; width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 0;" />`;
    }
    const initial = (name.trim()[0] ?? '?').toUpperCase();
    return `<div style="width: 28px; height: 28px; border-radius: 50%; background: ${BRAND}; color: #ffffff; font-size: 13px; font-weight: 700; line-height: 28px; text-align: center;">${e(initial)}</div>`;
}
function pillButton(url, label) {
    return `<a href="${e(url)}" style="display: inline-block; padding: 10px 18px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; font-weight: 500; color: #111827; text-decoration: none;">${e(label)} &rarr;</a>`;
}
function thumbnailCell(url, href) {
    if (!url)
        return '';
    return `<td width="44%" valign="middle" style="width: 44%; padding-left: 14px;">
                <a href="${e(href)}" style="display: block; text-decoration: none;">
                  <div class="thumb" style="max-height: 170px; overflow: hidden; border-radius: 12px;">
                    <img src="${e(url)}" width="240" alt="" style="display: block; width: 100%; height: auto; border: 0;" />
                  </div>
                </a>
              </td>`;
}
function shell(input) {
    const communityUrl = e(input.communityUrl);
    const logoUrl = e(input.logoUrl);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @media (max-width: 600px) {
      .card { padding: 18px 16px !important; }
      .excerpt { display: none !important; }
      .post-title { font-size: 16px !important; font-weight: 500 !important; margin: 8px 0 12px !important; }
      .thumb { max-height: 130px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 32px 12px; font-family: ${FONT};">
    <tr><td align="center">
      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; padding: 24px 28px;">

        <tr><td style="padding-bottom: 16px; border-bottom: 1px solid ${BORDER};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top">
              <div style="font-size: 24px; font-weight: 700; color: ${BRAND};">${e(input.heading)}</div>
              <div style="font-size: 13px; color: ${MUTED}; margin-top: 4px;">${e(formatDate(input.date))}</div>
            </td>
            <td valign="top" align="right">
              <a href="${communityUrl}" style="text-decoration: none;">
                <img src="${logoUrl}" width="120" alt="DawoodTech Community" style="display: block; width: 120px; height: auto; border: 0;" />
              </a>
              <a href="${communityUrl}" style="display: inline-block; margin-top: 8px; font-size: 13px; color: ${MUTED}; text-decoration: none;">Open community</a>
            </td>
          </tr></table>
        </td></tr>

${input.bodyRows}

        <tr><td align="center" style="padding-top: 18px; border-top: 1px solid ${BORDER}; font-size: 12px; line-height: 1.8; color: ${MUTED};">
          <a href="${communityUrl}/feed" style="color: ${MUTED}; text-decoration: none;">Feed</a> |
          <a href="${communityUrl}/notifications" style="color: ${MUTED}; text-decoration: none;">Notifications</a> |
          <a href="${communityUrl}" style="color: ${MUTED}; text-decoration: none;">Community</a>
          <div style="margin-top: 12px;">
            This email was intended for <span style="color: ${BRAND};">${e(input.recipientEmail)}</span>,
            ${e(input.footerReason)}
          </div>
          <img src="${logoUrl}" width="110" alt="DawoodTech Community" style="display: block; width: 110px; height: auto; margin: 16px auto 8px; border: 0;" />
          <div>DawoodTech NextGen</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
function textFooter(input, reason) {
    return [
        '',
        '--',
        `This email was intended for ${input.recipientEmail}, ${reason}`,
    ];
}
export function newPostTemplate(input) {
    const reason = 'because you registered for a DawoodTech internship.';
    const communityUrl = e(input.communityUrl);
    const postUrl = e(input.postUrl);
    const bodyRows = `
        <tr><td style="padding: 18px 0 4px; font-size: 14px; line-height: 1.6; color: #4b5563;">
          ${e(greeting(input.recipientName))} a new post was just published in DawoodTech Community.
        </td></tr>

        <tr><td style="padding: 14px 0 22px; border-bottom: 1px solid ${BORDER};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td valign="middle" style="padding-right: 8px;">${avatar(input.authorName, input.authorAvatarUrl)}</td>
                <td valign="middle" style="font-size: 15px; color: #374151;">${e(input.authorName)}</td>
              </tr></table>
              <div class="post-title" style="font-size: 17px; font-weight: 700; line-height: 1.45; margin: 12px 0 8px;">
                <a href="${postUrl}" style="color: #111827; text-decoration: none;">${e(input.title)}</a>
              </div>
              ${input.excerpt ? `<div class="excerpt" style="font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 16px; white-space: pre-line;">${e(input.excerpt)}</div>` : '<div style="height: 8px;"></div>'}
              ${pillButton(input.postUrl, 'Read post')}
            </td>
            ${thumbnailCell(input.imageUrl, input.postUrl)}
          </tr></table>
        </td></tr>

        <tr><td style="padding: 18px 0 14px; font-size: 13px; line-height: 1.6; color: ${MUTED};">
          Looking for more stories from fellow interns?
          <a href="${communityUrl}/feed" style="color: ${MUTED}; text-decoration: underline;">Browse the latest posts in the community &rarr;</a>
        </td></tr>

        <tr><td style="padding-bottom: 22px;">
          <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; text-align: center; font-size: 15px; color: #1f2937;">
            Got a win of your own?
            <a href="${communityUrl}/feed" style="color: ${BRAND}; font-weight: 700; text-decoration: none;">Share it with the community</a>
          </div>
        </td></tr>`;
    const text = [
        `New post · ${formatDate(input.date)}`,
        '',
        `${greeting(input.recipientName)} a new post was just published in DawoodTech Community.`,
        '',
        input.authorName,
        input.title,
        input.excerpt,
        '',
        `Read post: ${input.postUrl}`,
        ...textFooter(input, reason),
    ].join('\n');
    return {
        subject: `New post in DawoodTech Community: ${input.title}`,
        html: shell({ ...input, heading: 'New post', footerReason: reason, bodyRows }),
        text,
    };
}
export function activityTemplate(input) {
    const reason = "because you're a member of DawoodTech Community.";
    const postUrl = e(input.postUrl);
    const comment = input.commentText
        ? `<div style="margin: 14px 0 0; padding: 12px 14px; background: #f9fafb; border-left: 3px solid ${BRAND}; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-line;">${e(input.commentText)}</div>`
        : '';
    const bodyRows = `
        <tr><td style="padding: 18px 0 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
          ${e(greeting(input.recipientName))}
        </td></tr>

        <tr><td style="padding: 12px 0 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td valign="middle" style="padding-right: 10px;">${avatar(input.actorName, input.actorAvatarUrl)}</td>
            <td valign="middle" style="font-size: 15px; line-height: 1.5; color: #374151;">
              <strong style="color: #111827;">${e(input.actorName)}</strong> ${e(input.action)}
            </td>
          </tr></table>
          ${comment}
        </td></tr>

        <tr><td style="padding: 0 0 22px; border-bottom: 1px solid ${BORDER};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid ${BORDER}; border-radius: 12px;"><tr>
            <td valign="middle" style="padding: 14px 16px;">
              <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: ${MUTED};">${e(input.postLabel)}</div>
              <div class="post-title" style="font-size: 16px; font-weight: 700; line-height: 1.45; margin: 6px 0 12px;">
                <a href="${postUrl}" style="color: #111827; text-decoration: none;">${e(input.postTitle)}</a>
              </div>
              ${pillButton(input.postUrl, input.buttonLabel)}
            </td>
            ${thumbnailCell(input.postImageUrl, input.postUrl).replace('padding-left: 14px;', 'padding: 12px 12px 12px 0;')}
          </tr></table>
        </td></tr>

        <tr><td style="padding: 18px 0 22px; font-size: 13px; line-height: 1.6; color: ${MUTED};">
          Keep the conversation going —
          <a href="${postUrl}" style="color: ${MUTED}; text-decoration: underline;">reply in the community &rarr;</a>
        </td></tr>`;
    const text = [
        `${input.heading} · ${formatDate(input.date)}`,
        '',
        greeting(input.recipientName),
        '',
        `${input.actorName} ${input.action}`,
        ...(input.commentText ? ['', `"${input.commentText}"`] : []),
        '',
        `${input.postLabel}: ${input.postTitle}`,
        `${input.buttonLabel}: ${input.postUrl}`,
        ...textFooter(input, reason),
    ].join('\n');
    return {
        subject: `${input.actorName} ${input.action}`,
        html: shell({ ...input, footerReason: reason, bodyRows }),
        text,
    };
}
//# sourceMappingURL=community-templates.js.map