import { describe, test, expect } from 'vitest';
import { YoutubeExtractor } from '../src/extractors/youtube';
import { JSDOM } from 'jsdom';

function createExtractor(): YoutubeExtractor {
	const dom = new JSDOM('<html><body></body></html>', {
		url: 'https://www.youtube.com/watch?v=test123'
	});
	return new YoutubeExtractor(dom.window.document, 'https://www.youtube.com/watch?v=test123');
}

describe('YouTube transcript parsing', () => {
	test('parses srv3 format (<p>/<s> elements)', () => {
		const extractor = createExtractor();
		const xml = `<?xml version="1.0" encoding="utf-8"?>
<timedtext>
<body>
<p t="0" d="5000"><s>Hello </s><s>world</s></p>
<p t="5000" d="3000"><s>Second line</s></p>
<p t="65000" d="2000"><s>After one minute</s></p>
</body>
</timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();
		expect(result.languageCode).toBe('en');

		// Check text format uses list items with timestamps
		const lines = result.text.split('\n');
		expect(lines[0]).toBe('- 0:00 Hello world');
		expect(lines[1]).toBe('- 0:05 Second line');
		expect(lines[2]).toBe('- 1:05 After one minute');

		// Check HTML uses <ul>/<li>
		expect(result.html).toContain('<ul class="transcript">');
		expect(result.html).toContain('<li>');
		expect(result.html).toContain('<h2>Transcript</h2>');
	});

	test('parses simple format (<text> elements)', () => {
		const extractor = createExtractor();
		const xml = `<?xml version="1.0" encoding="utf-8"?>
<transcript>
<text start="0" dur="5">Hello world</text>
<text start="5.5" dur="3">Second line</text>
<text start="3661" dur="2">Hour mark</text>
</transcript>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'es');
		expect(result).toBeDefined();
		expect(result.languageCode).toBe('es');

		const lines = result.text.split('\n');
		expect(lines[0]).toBe('- 0:00 Hello world');
		expect(lines[1]).toBe('- 0:05 Second line');
		expect(lines[2]).toBe('- 1:01:01 Hour mark');
	});

	test('decodes HTML entities including numeric', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="1000"><s>it&apos;s &amp; that&#39;s &quot;quoted&quot;</s></p>
<p t="1000" d="1000"><s>&#x2019;smart&#x2019; &#8212; dash</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();

		const lines = result.text.split('\n');
		expect(lines[0]).toBe('- 0:00 it\'s & that\'s "quoted"');
		expect(lines[1]).toBe('- 0:01 \u2019smart\u2019 \u2014 dash');
	});

	test('returns undefined for empty transcript', () => {
		const extractor = createExtractor();
		const xml = `<?xml version="1.0" encoding="utf-8"?><timedtext><body></body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeUndefined();
	});

	test('falls back to stripping tags when no <s> elements', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="5000">Plain text without s tags</p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();
		expect(result.text).toBe('- 0:00 Plain text without s tags');
	});

	test('escapes HTML in output', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="1000"><s>a &lt;script&gt; tag</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();
		// HTML output should have escaped the angle brackets
		expect(result.html).toContain('a &lt;script&gt; tag');
		// Text output should have the decoded version
		expect(result.text).toBe('- 0:00 a <script> tag');
	});
});
