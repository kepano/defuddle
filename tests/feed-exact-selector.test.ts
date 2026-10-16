import { describe, expect, test } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';
import { EXACT_SELECTORS_JOINED } from '../src/constants';
import { removeBySelector } from '../src/removals/selectors';

const URL = 'https://example.com/news/story';
const FEED_TEXT = 'A new feed item appeared on scrolling.';
const INTRO = 'This article demonstrates one controlled browser-state transition.';
const BOILERPLATE = 'Explore more topics and subscribe to daily alerts.';

function documentWithArticleFeed() {
  const dom = new JSDOM(`<!doctype html><html lang="en"><head><title>Dynamic article feed</title></head><body>
    <header><p>Read the original article below.</p></header>
    <main><article id="article"><h1>Dynamic interaction D04</h1>
      <p>${INTRO}</p>
      <div>Scroll down to load another item.</div>
      <section id="feed"></section>
    </article></main>
    <nav><p>${BOILERPLATE}</p></nav>
    <footer>Terms of use.</footer>
  </body></html>`, { url: URL });
  return dom;
}

describe('feed element exact-selector classification', () => {
  test('does not classify #feed as non-content based only on its id', () => {
    const dom = documentWithArticleFeed();
    try {
      const doc = dom.window.document;
      const feed = doc.querySelector('#feed')!;
      expect(feed.matches(EXACT_SELECTORS_JOINED)).toBe(false);
      removeBySelector(doc, false, true, false, doc.querySelector('article'));
      expect(doc.querySelector('#feed')).toBe(feed);
    } finally {
      dom.window.close();
    }
  });

  test('retains an article feed inserted after initial page load', async () => {
    const dom = documentWithArticleFeed();
    try {
      const doc = dom.window.document;
      const feed = doc.querySelector('#feed')!;
      const newItem = doc.createElement('p');
      newItem.textContent = FEED_TEXT;
      feed.append(newItem);
      const result = await Defuddle(doc, URL, { useAsync: false });
      expect(result.content).toContain(INTRO);
      expect(result.content).toContain(FEED_TEXT);
      expect(result.content).not.toContain(BOILERPLATE);
    } finally {
      dom.window.close();
    }
  });

  test('continues to remove navigation and sidebar feeds via their own selectors', () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <main><article id="article"><h1>Story</h1><p>${INTRO}</p></article></main>
      <nav id="feed"><p>NAVIGATION_FEED_SHOULD_BE_REMOVED</p></nav>
      <aside class="sidebar"><div id="related-feed"><p>SIDEBAR_FEED_SHOULD_BE_REMOVED</p></div></aside>
    </body></html>`, { url: URL });
    try {
      const doc = dom.window.document;
      const article = doc.querySelector('article')!;
      removeBySelector(doc, false, true, false, article);
      expect(doc.querySelector('nav#feed')).toBeNull();
      expect(doc.querySelector('aside.sidebar')).toBeNull();
      expect(doc.querySelector('article')).toBe(article);
    } finally {
      dom.window.close();
    }
  });
});
