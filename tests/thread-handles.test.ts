import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Defuddle } from '../src/defuddle';
import { parseDocument } from './helpers';

describe('Thread classification', () => {
	test('keeps Mastodon replies as comments when handles are missing', () => {
		const url = 'https://mastodon.social/@user/12345678';
		const html = readFileSync(join(__dirname, 'fixtures', 'comments--mastodon.social-@user-12345678.html'), 'utf8');
		const doc = parseDocument(html, url);
		doc.querySelectorAll('.display-name__account').forEach(el => el.remove());

		const result = new Defuddle(doc, { url }).parse();

		expect(result.extractorType).toBe('mastodon');
		expect(result.content).toContain('class="mastodon comments"');
	});
});
