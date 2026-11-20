import { describe, expect, test } from 'vitest';
import { readFileSync } from 'fs';
import { EXACT_SELECTORS, FOOTNOTE_LIST_SELECTORS, FOOTNOTE_INLINE_REFERENCES, HIDDEN_EXACT_SELECTOR, CONTENT_ELEMENT_SELECTOR, TEST_ATTRIBUTES_SELECTOR, ENTRY_POINT_ELEMENTS } from '../src/constants';
import { compileSelectors, querySelectorList } from '../src/utils/selector-matcher';
import { getFixtures, parseDocument } from './helpers';

const LISTS: Record<string, string[]> = {
	EXACT_SELECTORS,
	FOOTNOTE_LIST_SELECTORS: FOOTNOTE_LIST_SELECTORS.split(',').map(s => s.trim()),
	FOOTNOTE_INLINE_REFERENCES: FOOTNOTE_INLINE_REFERENCES.split(',').map(s => s.trim()),
	HIDDEN_EXACT_SELECTOR: HIDDEN_EXACT_SELECTOR.split(',').map(s => s.trim()),
	CONTENT_ELEMENT_SELECTOR: CONTENT_ELEMENT_SELECTOR.split(',').map(s => s.trim()),
	TEST_ATTRIBUTES_SELECTOR: TEST_ATTRIBUTES_SELECTOR.split(',').map(s => s.trim()),
	ENTRY_POINT_ELEMENTS,
};

const EDGE_CASES = `<input type=CHECKBOX class="Sidebar-x"><a rel=TAG href="/Author/x">t</a><a href="#Top">x</a>
<script type="MATH/tex">x</script><div class="AD-box"></div><div class="ad gradient-x"></div><div class="Promo"></div>
<span class="with-ad x-ad"></span><div aria-hidden="true" class="mathjax"></div><svg aria-hidden="true"></svg>
<header><p>a</p><p>b</p></header><audio></audio><video><source></video><template><nav>t</nav></template>
<li><span class="ltx_tag ltx_tag_item">1</span></li><div data-testid="load-more-posts"></div><div>after</div>
<a href="#x" class="ref ltx_ref"></a><div role="NAVIGATION"></div><div class="footnote"><ol><li>f</li></ol></div>
<sup data-fn><a href="#f">1</a></sup><div class="  pagination  "></div><div id="Comments"></div>`;

function expectSameAsQuerySelectorAll(doc: Document) {
	for (const [name, list] of Object.entries(LISTS)) {
		const expected = Array.from(doc.querySelectorAll(list.join(',')));
		expect(querySelectorList(doc, compileSelectors(list)), name).toEqual(expected);
	}
}

describe('selector matcher', () => {
	test('matches querySelectorAll on every fixture', () => {
		for (const { path } of getFixtures()) {
			expectSameAsQuerySelectorAll(parseDocument(readFileSync(path, 'utf-8'), 'https://example.com/page'));
		}
	});

	test('matches querySelectorAll on edge cases in standards and quirks mode', () => {
		expectSameAsQuerySelectorAll(parseDocument(`<!doctype html><html><body>${EDGE_CASES}</body></html>`, 'https://example.com/page'));
		expectSameAsQuerySelectorAll(parseDocument(`<html><body>${EDGE_CASES}</body></html>`, 'https://example.com/page'));
	});
});
