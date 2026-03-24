import { describe, test, expect, vi } from 'vitest';
import { YoutubeExtractor } from '../src/extractors/youtube';
import type { ExtractorOptions } from '../src/extractors/_base';
import { parseDocument } from './helpers';

function createExtractor(
	html = '<html><body></body></html>',
	url = 'https://www.youtube.com/watch?v=test123',
	options?: ExtractorOptions
): YoutubeExtractor {
	const doc = parseDocument(html, url);
	return new YoutubeExtractor(doc, url, undefined, options);
}

function getTranscriptPanelHtml() {
	return `
		<ytd-engagement-panel-section-list-renderer target-id="engagement-panel-searchable-transcript">
			<div id="segments-container">
				<ytd-transcript-segment-renderer>
					<div class="segment-timestamp">0:00</div>
					<div class="segment-text">Hello world.</div>
				</ytd-transcript-segment-renderer>
				<ytd-transcript-segment-renderer>
					<div class="segment-timestamp">0:05</div>
					<div class="segment-text">Second line.</div>
				</ytd-transcript-segment-renderer>
			</div>
			<div id="footer">
				<yt-sort-filter-sub-menu-renderer>
					<yt-dropdown-menu>
						<button>English (auto-generated)</button>
					</yt-dropdown-menu>
				</yt-sort-filter-sub-menu-renderer>
			</div>
		</ytd-engagement-panel-section-list-renderer>
	`;
}

function getTranscriptPanelHtmlWithoutLanguageButton() {
	return `
		<ytd-engagement-panel-section-list-renderer target-id="engagement-panel-searchable-transcript">
			<div id="segments-container">
				<ytd-transcript-segment-renderer>
					<div class="segment-timestamp">0:00</div>
					<div class="segment-text">Hello world.</div>
				</ytd-transcript-segment-renderer>
			</div>
		</ytd-engagement-panel-section-list-renderer>
	`;
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

	test('extract reads an existing transcript panel without opening it', () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" }
										}
									]
								}
							}
						};
					</script>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
					${getTranscriptPanelHtml()}
				</body>
			</html>
		`);

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');

		const result = extractor.extract();

		expect(result.variables.language).toBe('en');
		expect(result.variables.transcript).toContain('**0:00** · Hello world.');
		expect(clickSpy).not.toHaveBeenCalled();
	});

	test('fetchPlayerData prefers API caption tracks over inline player response', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" },
											"baseUrl": "https://www.youtube.com/api/timedtext?v=test123&exp=xpe&lang=en"
										}
									]
								}
							}
						};
					</script>
				</body>
			</html>
		`);

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				captions: {
					playerCaptionsTracklistRenderer: {
						captionTracks: [
							{
								languageCode: 'en',
								name: { simpleText: 'English (auto-generated)' },
								baseUrl: 'https://www.youtube.com/api/timedtext?v=test123&lang=en&fmt=srv3',
							},
						],
					},
				},
			}),
		});
		vi.stubGlobal('fetch', fetchMock);
		try {
			const playerData = await (extractor as any).fetchPlayerData('test123');
			const tracks = (extractor as any).getCaptionTracks(playerData);

			expect(tracks).toHaveLength(1);
			expect(tracks[0].baseUrl).toContain('fmt=srv3');
		} finally {
			vi.unstubAllGlobals();
		}
	});

	test('extractAsync uses an existing transcript panel before opening it', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" }
										}
									]
								}
							}
						};
					</script>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
					${getTranscriptPanelHtml()}
				</body>
			</html>
		`);

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');

		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue(undefined);

		const result = await extractor.extractAsync();

		expect(result.variables.language).toBe('en');
		expect(result.variables.transcript).toContain('**0:00** · Hello world.');
		expect(clickSpy).not.toHaveBeenCalled();
		expect((extractor as any).fetchTranscript).not.toHaveBeenCalled();
	});

	test('extractAsync prefers requested transcript language over an existing DOM transcript', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" }
										},
										{
											"languageCode": "zh",
											"name": { "simpleText": "中文" }
										}
									]
								}
							}
						};
					</script>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
					${getTranscriptPanelHtml()}
				</body>
			</html>
		`, 'https://www.youtube.com/watch?v=test123', { language: 'zh' });

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');
		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue({
			html: '<div class="youtube transcript"><h2>Transcript</h2><p class="transcript-segment"><strong><span class="timestamp" data-timestamp="0">0:00</span></strong> · 你好，世界。</p></div>',
			text: '**0:00** · 你好，世界。',
			languageCode: 'zh',
		});

		const result = await extractor.extractAsync();

		expect(result.variables.language).toBe('zh');
		expect(result.variables.transcript).toContain('**0:00** · 你好，世界。');
		expect((extractor as any).fetchTranscript).toHaveBeenCalledTimes(1);
		expect(clickSpy).not.toHaveBeenCalled();
	});

	test('extractAsync does not trust DOM transcript language when no selector is present and multiple tracks exist', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" }
										},
										{
											"languageCode": "zh",
											"name": { "simpleText": "中文" }
										}
									]
								}
							}
						};
					</script>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
					${getTranscriptPanelHtmlWithoutLanguageButton()}
				</body>
			</html>
		`, 'https://www.youtube.com/watch?v=test123', { language: 'zh' });

		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue({
			html: '<div class="youtube transcript"><h2>Transcript</h2><p class="transcript-segment"><strong><span class="timestamp" data-timestamp="0">0:00</span></strong> · 你好，世界。</p></div>',
			text: '**0:00** · 你好，世界。',
			languageCode: 'zh',
		});

		const result = await extractor.extractAsync();

		expect(result.variables.language).toBe('zh');
		expect(result.variables.transcript).toContain('**0:00** · 你好，世界。');
		expect((extractor as any).fetchTranscript).toHaveBeenCalledTimes(1);
	});

	test('pickCaptionTrack falls back from regional language tags to base language tracks', () => {
		const extractor = createExtractor(undefined, undefined, { language: 'zh-CN' });
		const track = (extractor as any).pickCaptionTrack([
			{ languageCode: 'en' },
			{ languageCode: 'zh' },
			{ languageCode: 'zh-Hant' },
		]);

		expect(track?.languageCode).toBe('zh');
	});

	test('pickCaptionTrack prefers an exact base-language track over earlier regional variants', () => {
		const extractor = createExtractor(undefined, undefined, { language: 'zh' });
		const track = (extractor as any).pickCaptionTrack([
			{ languageCode: 'zh-Hant' },
			{ languageCode: 'zh' },
			{ languageCode: 'en' },
		]);

		expect(track?.languageCode).toBe('zh');
	});

	test('extractAsync does not open the transcript panel when API transcript succeeds', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
				</body>
			</html>
		`);

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');

		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue({
			html: '<div class="youtube transcript"><h2>Transcript</h2></div>',
			text: '**0:00** · Hello world.',
			languageCode: 'en',
		});

		const result = await extractor.extractAsync();

		expect(result.variables.language).toBe('en');
		expect(result.variables.transcript).toContain('**0:00** · Hello world.');
		expect(clickSpy).not.toHaveBeenCalled();
	});

	test('falls back to transcript panel DOM and preserves language code', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English (auto-generated)" },
											"baseUrl": "https://www.youtube.com/api/timedtext?v=test123&lang=en"
										},
										{
											"languageCode": "es",
											"name": { "simpleText": "Español" },
											"baseUrl": "https://www.youtube.com/api/timedtext?v=test123&lang=es"
										}
									]
								}
							}
						};
					</script>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
				</body>
			</html>
		`);

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');
		openButton.addEventListener('click', () => {
			if (document.querySelector('#segments-container')) return;
			const panel = document.createElement('div');
			panel.innerHTML = getTranscriptPanelHtml();
			document.body.appendChild(panel.firstElementChild!);
		});

		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue(undefined);
		(extractor as any).fetchChapters = vi.fn().mockResolvedValue([]);

		const result = await extractor.extractAsync();

		expect(result.variables.language).toBe('en');
		expect(result.variables.transcript).toContain('**0:00** · Hello world.');
		expect(result.content).toContain('<h2>Transcript</h2>');
		expect(clickSpy).toHaveBeenCalledTimes(1);
	});

	test('extracts transcript from mobile YouTube DOM (m.youtube.com)', () => {
		const mobileHtml = `
			<html>
				<body>
						<script>
							var ytInitialPlayerResponse = {
								"videoDetails": { "videoId": "test123" },
								"captions": {
								"playerCaptionsTracklistRenderer": {
									"captionTracks": [
										{
											"languageCode": "en",
											"name": { "simpleText": "English" }
										}
									]
								}
							}
						};
					</script>
					<ytm-macro-markers-list-renderer class="browsing-mode">
						<div class="ytm-macro-markers-list-container">
							<ytm-item-section-renderer>
								<lazy-list>
									<macro-markers-panel-item-view-model>
										<timeline-chapter-view-model>
											<h3 class="ytwTimelineChapterViewModelTitle">Introduction</h3>
										</timeline-chapter-view-model>
									</macro-markers-panel-item-view-model>
									<macro-markers-panel-item-view-model>
										<timeline-item-view-model>
											<div class="ytwTimelineItemViewModelContentItems">
												<transcript-segment-view-model>
													<div class="ytwTranscriptSegmentViewModelTimestamp">0:00</div>
													<span class="yt-core-attributed-string" role="text">Hello and welcome to the show.</span>
												</transcript-segment-view-model>
											</div>
										</timeline-item-view-model>
									</macro-markers-panel-item-view-model>
									<macro-markers-panel-item-view-model>
										<timeline-item-view-model>
											<div class="ytwTimelineItemViewModelContentItems">
												<transcript-segment-view-model>
													<div class="ytwTranscriptSegmentViewModelTimestamp">0:05</div>
													<span class="yt-core-attributed-string" role="text">Today we discuss design.</span>
												</transcript-segment-view-model>
											</div>
										</timeline-item-view-model>
									</macro-markers-panel-item-view-model>
									<macro-markers-panel-item-view-model>
										<timeline-chapter-view-model>
											<h3 class="ytwTimelineChapterViewModelTitle">Main Topic</h3>
										</timeline-chapter-view-model>
									</macro-markers-panel-item-view-model>
									<macro-markers-panel-item-view-model>
										<timeline-item-view-model>
											<div class="ytwTimelineItemViewModelContentItems">
												<transcript-segment-view-model>
													<div class="ytwTranscriptSegmentViewModelTimestamp">1:00</div>
													<span class="yt-core-attributed-string" role="text">The design process has changed.</span>
												</transcript-segment-view-model>
											</div>
										</timeline-item-view-model>
									</macro-markers-panel-item-view-model>
								</lazy-list>
							</ytm-item-section-renderer>
						</div>
					</ytm-macro-markers-list-renderer>
				</body>
			</html>
		`;

		const extractor = createExtractor(mobileHtml, 'https://m.youtube.com/watch?v=test123');
		const result = extractor.extract();

		expect(result.variables.language).toBe('en');
		expect(result.variables.transcript).toContain('**0:00** · Hello and welcome to the show.');
		expect(result.variables.transcript).toContain('**0:05** · Today we discuss design.');
		expect(result.variables.transcript).toContain('**1:00** · The design process has changed.');

		// Chapters should be extracted from mobile DOM
		expect(result.content).toContain('Introduction');
		expect(result.content).toContain('Main Topic');
	});

	test('extractAsync skips transcript panel opening in non-browser DOM contexts', async () => {
		const extractor = createExtractor(`
			<html>
				<body>
					<ytd-video-description-transcript-section-renderer>
						<button id="open-transcript">Show transcript</button>
					</ytd-video-description-transcript-section-renderer>
				</body>
			</html>
		`);

		// Mock canOpenTranscriptPanel to simulate a non-browser context
		(extractor as any).canOpenTranscriptPanel = () => false;

		const document = (extractor as any).document as Document;
		const openButton = document.querySelector('#open-transcript') as HTMLButtonElement;
		const clickSpy = vi.spyOn(openButton, 'click');

		(extractor as any).fetchTranscript = vi.fn().mockResolvedValue(undefined);

		const result = await extractor.extractAsync();

		expect(result.variables.transcript).toBeUndefined();
		expect(clickSpy).not.toHaveBeenCalled();
	});
});
