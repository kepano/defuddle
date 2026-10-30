import { describe, test, expect, afterEach } from 'vitest';
import Defuddle from '../src/index';
import { parseDocument } from './helpers';

// The .g3 title Gmail renders carries no timezone, so it parses as local time.
// Deriving `published` via toISOString() converted that to UTC and rolled an
// evening timestamp into the next day for anyone west of Greenwich.
//
// npm test pins TZ=UTC, which is precisely the case that cannot fail, so these
// override the zone per case. Node applies a runtime process.env.TZ change to
// subsequent Date operations.

const GMAIL_URL = 'https://mail.google.com/mail/u/0/#inbox/thread-f:1';

// 11:02 PM is late enough that a UTC conversion lands on the next day for any
// negative offset, and early enough that it stays put for positive ones.
const SENT_AT = 'May 13, 2026, 11:02 PM';

const gmailHtml = (dateTitle: string) => `
<html>
<head><title>Kickoff - jane@example.com - Gmail</title></head>
<body>
<div role="main">
	<h2 class="hP">Kickoff</h2>
	<div class="adn ads">
		<div class="gE">
			<span email="alex@example.com" name="Alex Rivera" class="gD"><span>Alex Rivera</span></span>
			<span class="g3" title="${dateTitle}"><span>${dateTitle}</span></span>
		</div>
		<div class="ii gt"><div class="a3s aiL"><div>Morning.</div></div></div>
	</div>
</div>
</body>
</html>
`;

function publishedIn(timeZone: string, dateTitle = SENT_AT): string {
	process.env.TZ = timeZone;
	const doc = parseDocument(gmailHtml(dateTitle), GMAIL_URL);
	return new Defuddle(doc, { url: GMAIL_URL }).parse().published || '';
}

describe('Gmail published date', () => {
	const original = process.env.TZ;
	afterEach(() => { process.env.TZ = original; });

	test('reports the date Gmail rendered, whatever the reader timezone', () => {
		// Same instant, same calendar date, on both sides of Greenwich.
		expect(publishedIn('UTC')).toBe('2026-05-13');
		expect(publishedIn('America/New_York')).toBe('2026-05-13');
		expect(publishedIn('America/Los_Angeles')).toBe('2026-05-13');
		expect(publishedIn('Asia/Tokyo')).toBe('2026-05-13');
		expect(publishedIn('Pacific/Kiritimati')).toBe('2026-05-13');
	});

	test('pads single-digit months and days', () => {
		expect(publishedIn('America/New_York', 'Jan 5, 2026, 9:00 PM')).toBe('2026-01-05');
	});

	test('is empty when the locale-formatted title cannot be parsed', () => {
		// Non-English Gmail UIs render titles this parser cannot read. An empty
		// value is better than a wrong one.
		expect(publishedIn('UTC', '2026年5月13日 23:02')).toBe('');
	});
});
