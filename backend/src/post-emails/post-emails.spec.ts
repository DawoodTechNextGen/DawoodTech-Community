import { activityTemplate, newPostTemplate } from '../mail/community-templates.js';
import { postExcerpt, postTitle } from './post-summary.js';
import { dedupeRecipients } from './taskdesk-recipients.service.js';

describe('dedupeRecipients', () => {
  it('merges emails case- and whitespace-insensitively and drops invalid ones', () => {
    const result = dedupeRecipients([
      { name: 'Ali', email: ' Ali@Example.com ' },
      { name: null, email: 'ali@example.com' },
      { name: 'Sara', email: 'sara@example.com' },
      { name: 'Blank', email: '' },
      { name: 'Null', email: null },
      { name: 'Bad', email: 'not-an-email' },
    ]);
    expect(result).toEqual([
      { email: 'ali@example.com', name: 'Ali' },
      { email: 'sara@example.com', name: 'Sara' },
    ]);
  });

  it('fills in a missing name from a later duplicate', () => {
    expect(
      dedupeRecipients([
        { name: '', email: 'a@b.co' },
        { name: 'Later', email: 'A@B.CO' },
      ]),
    ).toEqual([{ email: 'a@b.co', name: 'Later' }]);
  });
});

describe('post summary + template', () => {
  it('uses the first line as title and strips HTML from the excerpt', () => {
    const content = '\n  <b>Got hired!</b>  \nSecond line ' + 'x'.repeat(300);
    expect(postTitle(content)).toBe('Got hired!');
    const excerpt = postExcerpt(content);
    expect(excerpt).not.toContain('Got hired!');
    expect(excerpt.startsWith('Second line')).toBe(true);
    expect(excerpt.length).toBe(200);
    expect(postExcerpt('Just a one-liner <i>post</i>')).toBe('');
  });

  it('escapes every interpolated value in the HTML body', () => {
    const { subject, html, text } = newPostTemplate({
      recipientName: '<script>x</script>',
      recipientEmail: 'a@b.co',
      title: 'A & B',
      authorName: '"Mallory"',
      authorAvatarUrl: null,
      excerpt: '<img src=x onerror=alert(1)>',
      imageUrl: 'https://api.test/uploads/posts/1.png?a=1&b="2"',
      postUrl: 'https://community.test/post/1',
      communityUrl: 'https://community.test',
      logoUrl: 'https://community.test/logo-full.png',
      date: new Date('2026-09-23T10:00:00Z'),
    });
    expect(subject).toBe('New post in DawoodTech Community: A & B');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('src="https://api.test/uploads/posts/1.png?a=1&amp;b=&quot;2&quot;"');
    expect(html).toContain('Sep 23, 2026');
    expect(html).toContain('A &amp; B');
    expect(html).toContain('&quot;Mallory&quot;');
    expect(html).not.toContain('nsubscribe');
    expect(text).toContain('https://community.test/post/1');
  });
});

describe('activity template', () => {
  const common = {
    recipientName: 'Ali',
    recipientEmail: 'ali@example.com',
    actorName: 'Sara',
    actorAvatarUrl: null,
    commentText: null,
    communityUrl: 'https://community.test',
    logoUrl: 'https://community.test/logo-full.png',
    date: new Date('2026-09-23T10:00:00Z'),
  };

  it('renders a follow email with no post, linking to the profile', () => {
    const { subject, html, text } = activityTemplate({
      ...common,
      heading: 'New follower',
      action: 'started following you',
      post: null,
      buttonLabel: 'View profile',
      buttonUrl: 'https://community.test/profile/7',
    });
    expect(subject).toBe('Sara started following you');
    expect(html).toContain('href="https://community.test/profile/7"');
    expect(html).not.toContain('reply in the community');
    expect(text).toContain('View profile: https://community.test/profile/7');
  });

  it('renders the post preview for post activity', () => {
    const { html } = activityTemplate({
      ...common,
      heading: 'New like',
      action: 'liked your post',
      post: {
        title: 'Got hired!',
        label: 'Your post',
        imageUrl: null,
        url: 'https://community.test/post/1',
      },
      buttonLabel: 'View post',
      buttonUrl: 'https://community.test/post/1',
    });
    expect(html).toContain('Got hired!');
    expect(html).toContain('Your post');
  });
});
