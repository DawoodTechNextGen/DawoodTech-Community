import { activityTemplate, digestTemplate } from '../mail/community-templates.js';
import { localDayAndHour } from './digest-schedule.js';
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
    const { subject, html, text } = digestTemplate({
      recipientName: '<script>x</script>',
      recipientEmail: 'a@b.co',
      posts: [
        {
          title: 'A & B',
          authorName: '"Mallory"',
          authorAvatarUrl: null,
          excerpt: '<img src=x onerror=alert(1)>',
          imageUrl: 'https://api.test/uploads/posts/1.png?a=1&b="2"',
          url: 'https://community.test/post/1',
        },
      ],
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

describe('daily digest', () => {
  const post = (n: number) => ({
    title: `Post ${n}`,
    authorName: `Author ${n}`,
    authorAvatarUrl: null,
    excerpt: '',
    imageUrl: null,
    url: `https://community.test/post/${n}`,
  });
  const common = {
    recipientName: 'Ali',
    recipientEmail: 'ali@example.com',
    communityUrl: 'https://community.test',
    logoUrl: 'https://community.test/logo-full.png',
    date: new Date('2026-09-23T10:00:00Z'),
  };

  it('puts every post of the day in one email', () => {
    const { subject, html, text } = digestTemplate({ ...common, posts: [post(1), post(2), post(3)] });
    expect(subject).toBe('3 new posts in DawoodTech Community today');
    expect(html).toContain('Daily digest');
    for (const n of [1, 2, 3]) {
      expect(html).toContain(`https://community.test/post/${n}`);
      expect(text).toContain(`Post ${n}`);
    }
  });

  it('shows the first 10 posts and links to the feed for the rest', () => {
    const posts = Array.from({ length: 13 }, (_, i) => post(i + 1));
    const { html } = digestTemplate({ ...common, posts });
    expect(html).toContain('https://community.test/post/10"');
    expect(html).not.toContain('https://community.test/post/11"');
    expect(html).toContain('And 3 more new posts');
  });

  it('works out the local day and hour in the digest time zone', () => {
    // 20:30 UTC on the 23rd is 01:30 on the 24th in Pakistan (UTC+5).
    expect(localDayAndHour(new Date('2026-09-23T20:30:00Z'), 'Asia/Karachi')).toEqual({
      day: '2026-09-24',
      hour: 1,
    });
    expect(localDayAndHour(new Date('2026-09-23T03:59:00Z'), 'Asia/Karachi')).toEqual({
      day: '2026-09-23',
      hour: 8,
    });
  });
});
