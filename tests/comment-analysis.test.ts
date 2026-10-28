import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const URL = 'https://example.com/case-note';
const FIXTURE = readFileSync(join(__dirname, 'fixtures/issues--445-comment-analysis.html'), 'utf-8');
const ANALYSIS = 'The court appeared to have little difficulty';
const CONCLUSION = 'There are benefits to this approach';

async function extract(html: string) {
	return Defuddle(parseDocument(html, URL), URL);
}

describe('Comment analysis sections (#445)', () => {
	test.each(['Comment', 'Comments', 'comment', 'COMMENTS'])('preserves the label %s and following prose', async label => {
		const html = FIXTURE.replace('<strong>Comment</strong>', `<strong>${label}</strong>`);
		const result = await extract(html);

		expect(result.content).toContain(`<strong>${label}</strong>`);
		expect(result.content).toContain(ANALYSIS);
		expect(result.content).toContain(CONCLUSION);
	});

	test('still removes an explicitly marked comments section', async () => {
		const html = FIXTURE.replace('</article>', `
			<div id="comments">
				<p>Comments</p>
				<p>A reader response that should not be included.</p>
			</div>
		</article>`);
		const result = await extract(html);

		expect(result.content).toContain(ANALYSIS);
		expect(result.content).toContain(CONCLUSION);
		expect(result.content).not.toContain('Comments');
		expect(result.content).not.toContain('A reader response');
	});

	test.each(['Leave a comment', 'Leave a reply'])('still removes the trailing %s prompt', async prompt => {
		const html = FIXTURE.replace('</article>', `
			<p>${prompt}</p>
			<p>Sign in to join the discussion.</p>
		</article>`);
		const result = await extract(html);

		expect(result.content).toContain(ANALYSIS);
		expect(result.content).toContain(CONCLUSION);
		expect(result.content).not.toContain(prompt);
		expect(result.content).not.toContain('Sign in');
	});
});
