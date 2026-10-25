import { describe, test, expect } from 'vitest';
import { Defuddle } from '../src/node';
import { DefuddleOptions, DefuddleResponse } from '../src/types';
import { countBlockWords, findLinkClutterAnchor, removeLinkClutter } from '../src/removals/link-clutter';
import { parseDocument } from './helpers';

const URL = 'https://example.com/news/council-park-plan';
const TITLE = 'Council weighs riverside park plan';

const PARAGRAPHS = [
	'The city council met on Tuesday evening to discuss the long delayed plan for the riverside park, and members spent most of the session weighing the cost of new paths against the needs of local residents.',
	'Several speakers argued that the current budget leaves too little room for maintenance, pointing to older projects that were finished on time but quickly fell into disrepair because nobody had set aside money for repairs afterwards.',
	'Others urged the council to move faster, noting that grant funding from the regional authority expires at the end of next year and that any further delay could mean losing the money and starting over again.',
	'After a long debate the members agreed to publish a revised plan within six weeks, invite written comments from the public, and hold a final vote before the summer recess so that work can begin promptly.',
];

const HEADLINES = [
	'Regional transit board approves new late night bus routes',
	'Local bakery celebrates fifty years on the main street',
	'School district unveils plan to expand after school programs',
	'Volunteers clean up three miles of the northern shoreline',
	'Library extends weekend hours following strong public demand',
	'Community garden opens new plots for first time growers',
	'Museum announces free entry days for local families',
	'Farmers market returns to the old town square',
];

const CJK_PARAGRAPHS = [
	'市议会周二晚上召开会议，讨论拖延已久的河滨公园计划。议员们花了大半时间权衡新建步道的费用与当地居民的实际需求，会议气氛十分热烈。',
	'几位发言者认为，目前的预算几乎没有为日后维护留下空间。他们指出，一些旧项目虽然按时完工，但由于没有预留维修资金，很快就年久失修了。',
	'也有人敦促议会加快进度，因为来自地区政府的补助资金将在明年年底到期，任何进一步的拖延都可能导致资金流失，一切只能从头再来。',
	'经过长时间辩论，议员们同意在六周内公布修订后的计划，征求公众书面意见，并在夏季休会前进行最终表决，以便工程能够尽快开工。',
];

const CJK_HEADLINES = [
	'地区交通委员会批准新增夜间公交线路',
	'本地面包店庆祝在主街开业五十周年',
	'学区公布扩大课后项目的新计划方案',
	'志愿者清理北部海岸线三英里的垃圾',
];

const RTL_PARAGRAPHS = [
	'عقد مجلس المدينة اجتماعا مساء الثلاثاء لمناقشة خطة الحديقة النهرية التي تأخرت طويلا، وقضى الأعضاء معظم الجلسة في الموازنة بين تكلفة الممرات الجديدة واحتياجات السكان المحليين في الأحياء القريبة من النهر.',
	'وقال عدد من المتحدثين إن الميزانية الحالية لا تترك مجالا كافيا للصيانة، وأشاروا إلى مشاريع قديمة اكتملت في موعدها لكنها تدهورت بسرعة لأن أحدا لم يخصص أموالا لإصلاحها لاحقا بعد الافتتاح.',
	'وحث آخرون المجلس على الإسراع، مشيرين إلى أن تمويل المنحة المقدم من السلطة الإقليمية ينتهي في نهاية العام المقبل، وأن أي تأخير إضافي قد يعني خسارة المال والبدء من جديد بالكامل.',
	'وبعد نقاش طويل اتفق الأعضاء على نشر خطة معدلة خلال ستة أسابيع، ودعوة الجمهور إلى تقديم تعليقات مكتوبة، وإجراء تصويت نهائي قبل عطلة الصيف حتى يبدأ العمل في أقرب وقت ممكن.',
];

const RTL_HEADLINES = [
	'هيئة النقل الإقليمية توافق على خطوط حافلات ليلية جديدة',
	'مخبز محلي يحتفل بمرور خمسين عاما على افتتاحه في الشارع الرئيسي',
	'المكتبة تمدد ساعات العمل في عطلة نهاية الأسبوع',
];

function link(text: string, i = 0): string {
	return `<a href="https://example.com/story-${i}">${text}</a>`;
}

function linkList(items: string[], className = ''): string {
	const classAttr = className ? ` class="${className}"` : '';
	return `<div${classAttr}><ul>${items.map((h, i) => `<li>${link(h, i)}</li>`).join('')}</ul></div>`;
}

interface PageOptions {
	paragraphs?: string[];
	before?: string;
	after?: string;
	insideBody?: string;
	lang?: string;
	dir?: string;
	title?: string;
}

function page({ paragraphs = PARAGRAPHS, before = '', after = '', insideBody = '', lang = 'en', dir, title = TITLE }: PageOptions): string {
	const dirAttr = dir ? ` dir="${dir}"` : '';
	return `<!DOCTYPE html>
<html lang="${lang}"${dirAttr}>
<head><title>${title}</title></head>
<body>
<main>
<h1>${title}</h1>
${before}
<div>
${paragraphs.map(p => `<p>${p}</p>`).join('\n')}
${insideBody}
</div>
${after}
</main>
</body>
</html>`;
}

// Run with automatic selection and with the selection forced to <main>
async function extract(html: string, options: DefuddleOptions = {}): Promise<DefuddleResponse[]> {
	const results: DefuddleResponse[] = [];
	for (const contentSelector of [undefined, 'main']) {
		const doc = parseDocument(html, URL);
		results.push(await Defuddle(doc, URL, {
			debug: true,
			...(contentSelector ? { contentSelector } : {}),
			...options,
		}));
	}
	return results;
}

function clutterRemovals(result: DefuddleResponse) {
	return result.debug!.removals.filter(r => r.step === 'removeLinkClutter');
}

function expectBodyKept(result: DefuddleResponse, paragraphs: string[] = PARAGRAPHS) {
	for (const p of paragraphs) {
		expect(result.content).toContain(p.slice(0, 20));
	}
}

function expectRemovalRecords(result: DefuddleResponse) {
	const records = clutterRemovals(result);
	expect(records.length).toBeGreaterThan(0);
	for (const record of records) {
		const share = Number(record.reason!.match(/link share (\d+)%/)![1]);
		expect(share).toBeGreaterThanOrEqual(75);
	}
}

// Blocks under test carry body-sounding class names, which keep them out of
// the existing low-score and pattern removals, so these cases exercise this step.
const RAIL_HEADLINES = [
	'Regional transit board approves new late night bus routes downtown',
	'Local bakery celebrates fifty years on the busy main street',
	'School district unveils plan to expand popular after school programs',
	'Volunteers clean up three miles of the northern lake shoreline',
	'Library extends weekend opening hours following strong public demand again',
	'Community garden opens new plots for first time local growers',
];

const CARD_RAIL = `<div class="story-grid">${RAIL_HEADLINES.map((h, i) =>
	`<div class="story-card"><h2>${link(h, i)}</h2>\n<span>Yesterday</span></div>`).join('\n')}</div>`;

describe('Link clutter removal', () => {
	test('removes a rail of linked headline cards after the body', async () => {
		for (const result of await extract(page({ after: CARD_RAIL }))) {
			expectBodyKept(result);
			for (const h of RAIL_HEADLINES) {
				expect(result.content).not.toContain(h);
			}
			expectRemovalRecords(result);
		}
	});

	test('keeps a reference list beside the body', async () => {
		const refs = `<ol class="references">${HEADLINES.slice(0, 3).map((h, i) => `<li id="fn${i + 1}">${link(h, i)}</li>`).join('')}</ol>`;
		const paragraphs = PARAGRAPHS.map((p, i) => i < 3 ? `${p}<sup id="fnref${i + 1}"><a href="#fn${i + 1}">${i + 1}</a></sup>` : p);
		const html = page({ paragraphs, after: refs });
		for (const result of await extract(html)) {
			expectBodyKept(result);
			for (const h of HEADLINES.slice(0, 3)) {
				expect(result.content).toContain(h);
			}
			expect(clutterRemovals(result)).toHaveLength(0);
		}
		// The list itself is the examined sibling
		const doc = parseDocument(html, URL);
		const main = doc.querySelector('main')!;
		expect(removeLinkClutter(main, main.querySelector('main > div')!)).toEqual({ removed: 0, skipped: 'nothing proven' });
	});

	test('keeps an endnotes container that sits directly beside the body', async () => {
		const notes = `<p>Notes are listed below.</p>
<div role="doc-endnotes"><ol>${HEADLINES.slice(0, 4).map((h, i) =>
	`<li id="fn${i + 1}">${link(h, i)} <a href="#fnref${i + 1}">↩</a></li>`).join('')}</ol></div>`;
		const paragraphs = PARAGRAPHS.map((p, i) => `${p}<sup id="fnref${i + 1}"><a href="#fn${i + 1}">${i + 1}</a></sup>`);
		for (const result of await extract(page({ paragraphs, after: notes }))) {
			expectBodyKept(result);
			for (const h of HEADLINES.slice(0, 4)) {
				expect(result.content).toContain(h);
			}
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('keeps an all-link table that has header cells', async () => {
		const rows = ['1.0.0', '1.1.0', '2.0.0', '2.1.0'].map((v, i) =>
			`<tr><td>${link(`Release ${v}`, i)}</td><td>${link('checksum', i + 10)}</td></tr>`).join('');
		const table = `<table><thead><tr><th>Release</th><th>Checksum</th></tr></thead><tbody>${rows}</tbody></table>`;
		for (const result of await extract(page({ after: table }))) {
			expect(result.content).toContain('Release 2.1.0');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('keeps a gallery of figures with linked captions', async () => {
		const captions = ['View of the riverside path at dawn', 'Children playing near the old boat house', 'The proposed bridge seen from the eastern bank'];
		const gallery = `<div>${captions.map((c, i) =>
			`<figure>${link(`<img src="https://example.com/photo-${i}.jpg" alt="">`, i)}<figcaption>${link(c, i)}</figcaption></figure>`).join('')}</div>`;
		for (const result of await extract(page({ after: gallery }))) {
			for (const c of captions) {
				expect(result.content).toContain(c);
			}
			expect(result.content).toContain('photo-2.jpg');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('minified and formatted lists give the same counts and decision', async () => {
		// 69 linked words and 24 unlinked words: 74% linked, just under the threshold
		const items = HEADLINES.map((h, i) => `<li>${link(h, i)} (Example News Desk)</li>`);
		const formatted = `<div class="further">\n<ul>\n${items.join('\n')}\n</ul>\n</div>`;
		const minified = `<div class="further"><ul>${items.join('')}</ul></div>`;
		const counts = [];
		for (const block of [formatted, minified]) {
			const doc = parseDocument(page({ after: block }), URL);
			counts.push(countBlockWords(doc.querySelector('.further')!));
			for (const result of await extract(page({ after: block }))) {
				expect(result.content).toContain(HEADLINES[7]);
				expect(clutterRemovals(result)).toHaveLength(0);
			}
		}
		expect(counts[0]).toEqual(counts[1]);
		expect(counts[0].linkedWords / counts[0].words).toBeLessThan(0.75);
	});

	test('removes a CJK related list and keeps the CJK body', async () => {
		const html = page({ paragraphs: CJK_PARAGRAPHS, after: linkList(CJK_HEADLINES), lang: 'zh', title: '河滨公园计划' });
		for (const result of await extract(html)) {
			expectBodyKept(result, CJK_PARAGRAPHS);
			for (const h of CJK_HEADLINES) {
				expect(result.content).not.toContain(h);
			}
			expectRemovalRecords(result);
		}
	});

	test('keeps a CJK paragraph that contains a link', async () => {
		const block = `<div><p>据${link('当地报纸报道的最新消息')}，这项计划还将包括一条新的自行车道和若干休息区，预计将在明年春天正式向公众开放。</p></div>`;
		const html = page({ paragraphs: CJK_PARAGRAPHS, after: block, lang: 'zh', title: '河滨公园计划' });
		for (const result of await extract(html)) {
			expect(result.content).toContain('当地报纸报道的最新消息');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('removes an RTL link list and keeps an RTL paragraph with a link', async () => {
		// The linked paragraph stays shorter than the body paragraphs; a sibling
		// paragraph of similar length would make <main> the densest prose element.
		const prose = `<div><p>وأوضح المتحدث باسم المجلس أن ${link('الخطة المعدلة')} ستتضمن مسارا جديدا للدراجات ومناطق للاستراحة تفتح أبوابها للجمهور في الربيع المقبل.</p></div>`;
		const html = page({ paragraphs: RTL_PARAGRAPHS, after: linkList(RTL_HEADLINES, 'story-links') + prose, lang: 'ar', dir: 'rtl', title: 'خطة الحديقة النهرية' });
		for (const result of await extract(html)) {
			expectBodyKept(result, RTL_PARAGRAPHS);
			for (const h of RTL_HEADLINES) {
				expect(result.content).not.toContain(h);
			}
			expect(result.content).toContain('الخطة المعدلة');
			expectRemovalRecords(result);
		}
	});

	test('does nothing when the remaining content would fall under the word floor', async () => {
		const html = page({ paragraphs: PARAGRAPHS.slice(0, 3), after: linkList(HEADLINES.slice(0, 4)) });
		for (const result of await extract(html)) {
			for (const h of HEADLINES.slice(0, 4)) {
				expect(result.content).toContain(h);
			}
			expect(clutterRemovals(result)).toHaveLength(0);
		}
		const doc = parseDocument(html, URL);
		const main = doc.querySelector('main')!;
		const outcome = removeLinkClutter(main, main.querySelector('main > div')!);
		expect(outcome).toEqual({ removed: 0, skipped: 'under 120-word floor' });

		// Control: with a fourth paragraph the same list is removed
		const control = page({ after: linkList(HEADLINES.slice(0, 4)) });
		for (const result of await extract(control)) {
			for (const h of HEADLINES.slice(0, 4)) {
				expect(result.content).not.toContain(h);
			}
			expectRemovalRecords(result);
		}
	});

	test('does nothing when the anchor holds less than 20% of the selection', async () => {
		const words = 'alpha beta gamma delta epsilon zeta eta theta iota kappa'.split(' ');
		const rows = Array.from({ length: 10 }, (_, r) =>
			`<tr>${Array.from({ length: 3 }, (_, c) => `<td>${words.map(w => `${w}${r}${c}`).join(' ')}</td>`).join('')}</tr>`).join('');
		const html = page({
			paragraphs: PARAGRAPHS.slice(0, 2),
			after: `<table>${rows}</table>${linkList(HEADLINES.slice(0, 4))}`,
		});
		const doc = parseDocument(html, URL);
		const main = doc.querySelector('main')!;
		const outcome = removeLinkClutter(main, main.querySelector('main > div')!);
		expect(outcome).toEqual({ removed: 0, skipped: 'anchor share below 20%' });
		expect(main.textContent).toContain(HEADLINES[3]);
	});

	test('keeps a truncation or paywall prompt', async () => {
		const prompt = `<section class="story-extra">${link('Continue reading', 1)} ${link('Subscribe', 2)} ${link('Log in', 3)}</section>`;
		for (const result of await extract(page({ after: prompt }))) {
			expect(result.content).toContain('Continue reading');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('keeps a short linked heading before the body and removes it after', async () => {
		const series = `<section class="story-series"><h3>${link('The Riverside Renewal Series')}</h3></section>`;
		for (const result of await extract(page({ before: series }))) {
			expect(result.content).toContain('The Riverside Renewal Series');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
		for (const result of await extract(page({ after: series }))) {
			expect(result.content).not.toContain('The Riverside Renewal Series');
			expectRemovalRecords(result);
		}
	});

	test('never examines extractor output', async () => {
		const block = linkList(HEADLINES.slice(0, 5)).replace('<div>', '<div data-defuddle>');
		for (const result of await extract(page({ after: block }))) {
			expect(result.content).toContain(HEADLINES[4]);
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('removes a linked author card and keeps an author bio', async () => {
		const card = `<div class="story-author">${link('Jane Example', 1)} ${link('Follow Jane Example', 2)} ${link('Email Jane Example', 3)} ${link('All stories by Jane Example', 4)}</div>`;
		for (const result of await extract(page({ after: card }))) {
			expect(result.content).not.toContain('All stories by');
			expectRemovalRecords(result);
		}
		const bio = `<div><p>${link('Jane Example', 1)} is a staff reporter who covers city hall, local budgets and planning for the newsroom, and she previously spent six years writing about schools and transport for a regional weekly paper.</p></div>`;
		for (const result of await extract(page({ after: bio }))) {
			expect(result.content).toContain('is a staff reporter');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('never examines content inside the anchor', async () => {
		const list = `<ul>${HEADLINES.map((h, i) => `<li>${link(h, i)}</li>`).join('')}</ul>`;
		for (const result of await extract(page({ insideBody: list }))) {
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('keeps a small linked image without figure markup', async () => {
		const block = `<div class="story-extra">${link('<img src="https://example.com/riverside.jpg" alt="">', 1)} ${link('The riverside path at dawn', 1)}</div>`;
		for (const result of await extract(page({ after: block }))) {
			expect(result.content).toContain('The riverside path at dawn');
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});

	test('keeps a linked block that holds a media embed, at any size', async () => {
		// Three linked headlines are well over the small media limit, so only
		// the embed guard can keep these blocks
		const links = HEADLINES.slice(0, 3).map((h, i) => link(h, i)).join(' ');
		for (const embed of [
			'<video controls src="https://example.com/clip.mp4"></video>',
			'<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="640" height="360"></iframe>',
		]) {
			for (const result of await extract(page({ after: `<div class="story-extra">${embed}${links}</div>` }))) {
				expect(result.content).toContain(HEADLINES[2]);
				expect(clutterRemovals(result)).toHaveLength(0);
			}
		}
	});

	test('widens a section of a sectioned body, but never past an article', () => {
		const body = PARAGRAPHS.map(p => `<p>${p}</p>`).join('');
		const closing = '<section><p>A short closing note for our readers.</p></section>';
		const anchorOf = (inner: string) => findLinkClutterAnchor(parseDocument(
			`<html><head><title>T</title></head><body><main><h1>T</h1>${inner}</main></body></html>`, URL));
		expect(anchorOf(`<section>${body}</section>${closing}`)?.tagName.toLowerCase()).toBe('main');
		expect(anchorOf(`<section><article>${body}</article></section>${closing}`)?.tagName.toLowerCase()).toBe('article');
	});

	test('is disabled together with low-score removal', async () => {
		for (const result of await extract(page({ after: CARD_RAIL }), { removeLowScoring: false })) {
			for (const h of RAIL_HEADLINES) {
				expect(result.content).toContain(h);
			}
			expect(clutterRemovals(result)).toHaveLength(0);
		}
	});
});
