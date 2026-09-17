import { getSiteCSS } from './styles';
import { getFooterCSS, getFooterHTML } from './footer';
import { getSearchHTML, searchTrigger } from './search';

const pages = [
	{ id: 'docs', title: 'Docs' },
	{ id: 'pricing', title: 'Pricing' },
	{ id: 'terms', title: 'Terms' },
	{ id: 'privacy', title: 'Privacy' },
] as const;

interface DocsPageOptions {
	id: typeof pages[number]['id'];
	title: string;
	description?: string;
	intro?: string;
	updated?: string;
	content: string;
	outline: string;
	styles?: string;
	script?: string;
}

const escapeHTML = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Content, outline, styles, and script are trusted, authored site markup.
export function getDocsLayout(page: DocsPageOptions): string {
	const navigation = pages.map(item => {
		const current = item.id === page.id;
		return `<div class="docs-toc-page">
			<a class="docs-toc-title${current ? ' is-current' : ''}" href="${current ? '#top' : `/${item.id}`}"${current ? ' aria-current="page"' : ''}>${item.title}</a>
			${current ? page.outline : ''}
		</div>`;
	}).join('');
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHTML(page.title)} · Defuddle</title>
	${page.description ? `<meta name="description" content="${escapeHTML(page.description)}">` : ''}
	<link rel="alternate" type="text/markdown" href="/${page.id}.md" title="${escapeHTML(page.title)} as Markdown">
	<link rel="preconnect" href="https://rsms.me/" crossorigin>
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
	<style>${getSiteCSS()}${getFooterCSS()}${page.styles ?? ''}</style>
	<link rel="stylesheet" href="/build/docs.css">
</head>
<body class="docs-page" id="top">
	<div class="site-header-slot" data-scroll-header-slot>
		<nav class="site-header" aria-label="Main navigation" data-scroll-header>
			<a href="/" class="wordmark">Defuddle</a>
			${searchTrigger}
			<a href="/playground" class="header-action sidebar-playground"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="6 3 20 12 6 21 6 3"/></svg><span>Playground</span></a>
			<button class="header-action mobile-docs-trigger" type="button" aria-label="Open documentation menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="mobile-docs-panel" data-docs-menu-trigger><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path class="mobile-docs-menu-icon" d="M4 6h16M4 12h16M4 18h16"/><path class="mobile-docs-close-icon" d="M18 6 6 18M6 6l12 12"/></svg></button>
		</nav>
	</div>
	<div class="mobile-docs-backdrop" data-docs-menu-backdrop hidden>
		<section id="mobile-docs-panel" class="mobile-docs-panel" tabindex="-1" role="dialog" aria-modal="true" aria-label="Documentation menu">
			<div class="mobile-docs-content"><a class="mobile-docs-playground" href="/playground">Playground</a><nav class="docs-navigation mobile-docs-navigation" aria-label="Documentation">${navigation}</nav></div>
		</section>
	</div>
	<main class="docs-layout">
		<article class="docs-content" aria-labelledby="docs-title">
			<header class="docs-title">
				<h1 id="docs-title">${escapeHTML(page.title)}</h1>
				${page.intro ? `<p>${escapeHTML(page.intro)}</p>` : ''}
          <div class="docs-title-actions">
            <button class="docs-title-action text-action" type="button" data-copy-markdown="/${page.id}.md" aria-live="polite">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
              <span>Copy Markdown</span>
            </button>
            <a class="docs-title-action text-action" href="/${page.id}.md">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
              <span>View Markdown</span>
            </a>
          </div>
			</header>
			<div class="markdown-doc">${page.content}</div>
			${page.updated ? `<p class="docs-updated">Last updated: ${escapeHTML(page.updated)}</p>` : ''}
			${getFooterHTML()}
		</article>
		<nav class="docs-navigation docs-toc docs-desktop-outline" aria-label="Documentation">
			${navigation}
		</nav>
	</main>
	${getSearchHTML()}
	<script type="module" src="/build/docs.js"></script>
${page.script ? `<script>${page.script}</script>` : ''}
</body>
</html>`;
}
