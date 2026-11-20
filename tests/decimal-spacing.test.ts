import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { parseDocument } from './helpers';

const FILLER = '<p>' + 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor. '.repeat(30) + '</p>';

function page(body: string): string {
	return `<!doctype html><html><head><title>T</title></head><body><article>${body}${FILLER}</article></body></html>`;
}

describe('decimal number spacing (#498)', () => {
	test('preserves space before leading-dot decimal numbers', async () => {
		const html = page('<p>Suppose team A is .700 and I get .640 overall.</p>');
		const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a', {
			separateMarkdown: true,
		});

		expect(result.content).toContain('Suppose team A is .700 and I get .640 overall.');
		expect(result.contentMarkdown).toContain('Suppose team A is .700 and I get .640 overall.');
	});

	test('preserves space before inline element starting with decimal number', async () => {
		const html = page('<p>Suppose team A <em>is</em> <span>.700</span>.</p>');
		const result = await Defuddle(parseDocument(html, 'https://example.com/a'), 'https://example.com/a', {
			separateMarkdown: true,
		});

		expect(result.contentMarkdown).toContain('Suppose team A *is* .700.');
	});
});
