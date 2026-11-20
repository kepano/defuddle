import { getSiteCSS } from './styles';
import { exampleHtml } from './client/example';
import { getSearchHTML, searchTrigger } from './search';

const icons = {
	copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
	settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
	file: '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
	reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
	clear: '<path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
	wrap: '<path d="m16 16-3 3 3 3M3 12h14.5a1 1 0 0 1 0 7H13M3 19h6M3 5h18"/>',
	check: '<path d="m20 6-11 11-5-5"/>',
};
const icon = (name: keyof typeof icons, size = 16, className = '') => `<svg class="${className}" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function panel(name: string, label: string, language: string, value = ''): string {
	return `<section class="playground-panel" id="${name}-panel" aria-labelledby="${name}-heading">
		<header class="playground-panel-header">
			<h2 id="${name}-heading">${label}</h2>
			${name === 'output' ? `<div class="segmented-control playground-output-formats" style="--segment-count: 3" role="group" aria-label="Output format">
				<button type="button" data-format="markdown" aria-pressed="true">Markdown</button>
				<button type="button" data-format="html" aria-pressed="false">HTML</button>
				<button type="button" data-format="metadata" aria-pressed="false">Metadata</button>
			</div>` : `<span class="playground-language">${language}</span>`}
			<button type="button" class="doc-code-copy playground-copy" id="copy-${name}" title="Copy ${label.toLowerCase()}" aria-label="Copy ${label.toLowerCase()}" disabled>${icon('copy', 14)}</button>
		</header>
		<div class="playground-editor" data-editor="${name}">
			<textarea id="playground-${name}" aria-label="${label}" aria-describedby="${name}-status" ${name !== 'input' ? 'readonly' : ''} spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off">${escapeHtml(value)}</textarea>
		</div>
		<div class="playground-status" id="${name}-status" role="status" aria-atomic="true"></div>
	</section>`;
}
const resizer = (left: string, right: string) => `<div class="playground-resizer" role="separator" tabindex="0" aria-label="Resize ${left} and ${right} columns" aria-orientation="vertical" aria-controls="${left}-panel ${right}-panel" aria-valuenow="50" title="Drag to resize. Use arrow keys when focused. Double-click to equalize."></div>`;

export function getPlaygroundPage(prefillHtml: string = ''): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
	<title>Playground · Defuddle</title>
	<link rel="preconnect" href="https://rsms.me/" crossorigin>
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
	<style>${getSiteCSS()}</style>
	<link rel="stylesheet" href="/build/playground.css">
	<script type="module" src="/build/playground.js"></script>
</head>
<body>
	<main class="playground" data-active-panel="input">
		<div class="playground-header-slot">
			<header class="playground-header">
				<div class="playground-brand"><a class="wordmark" href="/" aria-label="Defuddle home">Defuddle</a><h1>Playground</h1></div>
				<div class="playground-actions">
					<button class="header-action" type="button" id="playground-settings" aria-label="Playground settings" title="Settings" aria-haspopup="menu" aria-expanded="false" aria-controls="playground-settings-menu">${icon('settings', 18)}<span>Settings</span></button>
					<div id="playground-settings-menu" class="menu" role="menu" aria-labelledby="playground-settings" hidden>
						<button type="button" id="open-file" role="menuitem" tabindex="-1">${icon('file')}<span class="menu-label">Open HTML file…</span></button>
						<button type="button" id="reset-example" role="menuitem" tabindex="-1">${icon('reset')}<span class="menu-label">Reset</span></button>
						<button type="button" id="clear-playground" role="menuitem" tabindex="-1">${icon('clear')}<span class="menu-label">Clear</span></button>
						<div class="menu-separator" role="separator"></div>
						<button type="button" id="wrap-lines" role="menuitemcheckbox" aria-checked="false" tabindex="-1">${icon('wrap')}<span class="menu-label">Line wrap</span>${icon('check', 16, 'menu-check')}</button>
					</div>
					<input type="file" id="html-file" accept=".html,.htm,.txt,text/html" aria-label="Choose an HTML file" hidden>
				</div>
				${searchTrigger}
			</header>
		</div>
		<div class="playground-tabs segmented-control" style="--segment-count: 2" role="tablist" aria-label="Playground editors">
			${['input', 'output'].map(name => `<button type="button" role="tab" id="${name}-tab" aria-controls="${name}-panel" aria-selected="${name === 'input'}" tabindex="${name === 'input' ? '0' : '-1'}" data-playground-tab="${name}">${name[0].toUpperCase() + name.slice(1)}</button>`).join('\n')}
		</div>
		<div class="playground-columns">
			${panel('input', 'Input', 'HTML', prefillHtml || exampleHtml)}
			${resizer('input', 'output')}
			${panel('output', 'Output', 'Markdown')}
		</div>
		<noscript>Enable JavaScript to edit and parse HTML in the playground.</noscript>
	</main>
	${getSearchHTML()}
</body>
</html>`;
}
