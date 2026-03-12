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
<p t="0" d="5000"><s>Hello </s><s>world.</s></p>
<p t="5000" d="3000"><s>Second line.</s></p>
<p t="65000" d="2000"><s>After one minute</s></p>
</body>
</timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();
		expect(result.languageCode).toBe('en');

		// Check text format — sentences are grouped, paragraphs with (timestamp)
		const lines = result.text.split('\n');
		expect(lines[0]).toBe('**0:00** · Hello world.');
		expect(lines[1]).toBe('**0:05** · Second line.');
		expect(lines[2]).toBe('**1:05** · After one minute');

		// Check HTML uses <p> with classes and <span class="timestamp">
		expect(result.html).toContain('<p class="transcript-segment">');
		expect(result.html).toContain('<span class="timestamp"');
		expect(result.html).toContain('<h2>Transcript</h2>');
	});

	test('parses simple format (<text> elements)', () => {
		const extractor = createExtractor();
		const xml = `<?xml version="1.0" encoding="utf-8"?>
<transcript>
<text start="0" dur="5">Hello world.</text>
<text start="5.5" dur="3">Second line.</text>
<text start="3661" dur="2">Hour mark</text>
</transcript>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'es');
		expect(result).toBeDefined();
		expect(result.languageCode).toBe('es');

		const lines = result.text.split('\n');
		expect(lines[0]).toBe('**0:00** · Hello world.');
		expect(lines[1]).toBe('**0:05** · Second line.');
		expect(lines[2]).toBe('**1:01:01** · Hour mark');
	});

	test('decodes HTML entities including numeric', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="1000"><s>it&apos;s &amp; that&#39;s &quot;quoted.&quot;</s></p>
<p t="1000" d="1000"><s>&#x2019;smart&#x2019; &#8212; dash</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		expect(result).toBeDefined();

		const lines = result.text.split('\n');
		expect(lines[0]).toBe('**0:00** · it\'s & that\'s "quoted."');
		expect(lines[1]).toBe('**0:01** · \u2019smart\u2019 \u2014 dash');
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
		expect(result.text).toBe('**0:00** · Plain text without s tags');
	});

	test('groups segments by speaker turns', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="3000"><s>Welcome to the show.</s></p>
<p t="3000" d="3000"><s>&gt;&gt; Tell me about your work.</s></p>
<p t="6000" d="3000"><s>Well I started</s></p>
<p t="9000" d="3000"><s>back in 2010.</s></p>
<p t="12000" d="3000"><s>&gt;&gt; That's interesting.</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		const lines = result.text.split('\n');

		// Preamble (no speaker marker)
		expect(lines[0]).toBe('**0:00** · Welcome to the show.');
		// Blank line before first speaker change
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('**0:03** · Tell me about your work.');
		// Continuation in same turn (no blank line)
		expect(lines[3]).toBe('**0:06** · Well I started back in 2010.');
		// Blank line before next speaker
		expect(lines[4]).toBe('');
		expect(lines[5]).toBe('**0:12** · That\'s interesting.');
	});

	test('groups segments by sentences when no speaker markers', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="2000"><s>The quick brown</s></p>
<p t="2000" d="2000"><s>fox jumps over the lazy dog.</s></p>
<p t="4000" d="2000"><s>Then it ran</s></p>
<p t="6000" d="2000"><s>away quickly.</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		const lines = result.text.split('\n');

		// Sentences grouped together
		expect(lines[0]).toBe('**0:00** · The quick brown fox jumps over the lazy dog.');
		expect(lines[1]).toBe('**0:04** · Then it ran away quickly.');
	});

	test('keeps sparse caption windows together until the sentence ends', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="43000" d="3000"><s>Today I have the pleasure of interviewing George Church.</s></p>
<p t="46000" d="3000"><s>I don't know how to introduce you.</s></p>
<p t="65000" d="3000"><s>&gt;&gt; By what year would it be</s></p>
<p t="76000" d="3000"><s>the case that, if you make it to that year, technology in bio will keep progressing to such</s></p>
<p t="92000" d="3000"><s>an extent that your lifespan will increase by</s></p>
<p t="103000" d="3000"><s>a year, every year, or more?</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		const lines = result.text.split('\n');

		expect(lines[0]).toBe('**0:43** · Today I have the pleasure of interviewing George Church.');
		expect(lines[1]).toBe('**0:46** · I don\'t know how to introduce you.');
		expect(lines[2]).toBe('');
		expect(lines[3]).toBe('**1:05** · By what year would it be the case that, if you make it to that year, technology in bio will keep progressing to such an extent that your lifespan will increase by a year, every year, or more?');
	});

	test('merges longer answers within one speaker turn into fewer timestamps', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="3000"><s>Welcome to the show.</s></p>
<p t="3000" d="3000"><s>&gt;&gt; I think we're gonna be in a world where the models will make mistakes much less often than humans.</s></p>
<p t="9000" d="3000"><s>They'll be stranger mistakes.</s></p>
<p t="13000" d="3000"><s>So we need to invent slurring for LLMs.</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		const lines = result.text.split('\n');

		expect(lines[0]).toBe('**0:00** · Welcome to the show.');
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('**0:03** · I think we\'re gonna be in a world where the models will make mistakes much less often than humans. They\'ll be stranger mistakes. So we need to invent slurring for LLMs.');
	});

	test('keeps short standalone responses isolated within a speaker turn', () => {
		const extractor = createExtractor();
		const xml = `<timedtext><body>
<p t="0" d="3000"><s>Can that work?</s></p>
<p t="3000" d="3000"><s>&gt;&gt; Yes.</s></p>
<p t="6000" d="3000"><s>I think this approach is promising in a narrow set of cases.</s></p>
</body></timedtext>`;

		const result = (extractor as any).parseTranscriptXml(xml, 'en');
		const lines = result.text.split('\n');

		expect(lines[0]).toBe('**0:00** · Can that work?');
		expect(lines[1]).toBe('');
		expect(lines[2]).toBe('**0:03** · Yes.');
		expect(lines[3]).toBe('**0:06** · I think this approach is promising in a narrow set of cases.');
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
		expect(result.text).toBe('**0:00** · a <script> tag');
	});
});
