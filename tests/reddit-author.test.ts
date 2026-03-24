import { describe, test, expect } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

const REDDIT_URL = 'https://www.reddit.com/r/test/comments/abc123/test_post/';

const NEW_REDDIT_NO_COMMENTS_HTML = `
<html>
<head>
<title>Test Post : test</title>
</head>
<body>
<h1>Test Post Title</h1>
<shreddit-post
  author="original_poster"
  subreddit-prefixed-name="r/test"
  post-title="Test Post Title"
  score="42"
  comment-count="5"
  created-timestamp="2025-01-15T10:00:00Z"
  permalink="/r/test/comments/abc123/test_post/">
  <div slot="text-body"><p>This is the post body content.</p></div>
</shreddit-post>
<!-- No shreddit-comment elements: they haven't loaded yet -->
<span class="author">logged_in_user</span>
<span class="author">some_commenter</span>
</body>
</html>
`;

const NEW_REDDIT_WITH_COMMENTS_HTML = `
<html>
<head>
<title>Test Post : test</title>
</head>
<body>
<h1>Test Post Title</h1>
<shreddit-post
  author="original_poster"
  subreddit-prefixed-name="r/test"
  post-title="Test Post Title"
  score="42"
  comment-count="5"
  created-timestamp="2025-01-15T10:00:00Z"
  permalink="/r/test/comments/abc123/test_post/">
  <div slot="text-body"><p>This is the post body content.</p></div>
</shreddit-post>
<shreddit-comment author="commenter_one" depth="0" score="10"
  permalink="/r/test/comments/abc123/test_post/c1/"
  created="2025-01-15T11:00:00Z">
  <div slot="comment"><p>Nice post!</p></div>
</shreddit-comment>
<shreddit-comment author="commenter_two" depth="0" score="5"
  permalink="/r/test/comments/abc123/test_post/c2/"
  created="2025-01-15T12:00:00Z">
  <div slot="comment"><p>I agree.</p></div>
</shreddit-comment>
<span class="author">logged_in_user</span>
</body>
</html>
`;

describe('Reddit author extraction', () => {
	test('comments page without loaded comments returns only the post author, title, and site', () => {
		const doc = parseDocument(NEW_REDDIT_NO_COMMENTS_HTML, REDDIT_URL);
		const defuddle = new Defuddle(doc, { url: REDDIT_URL });
		const result = defuddle.parse();

		expect(result.author).toBe('original_poster');
		expect(result.site).toBe('r/test');
		expect(result.title).toBe('Test Post Title');
	});

	test('comments page with loaded comments returns only the post author', () => {
		const doc = parseDocument(NEW_REDDIT_WITH_COMMENTS_HTML, REDDIT_URL);
		const defuddle = new Defuddle(doc, { url: REDDIT_URL });
		const result = defuddle.parse();

		expect(result.author).toBe('original_poster');
	});
});
