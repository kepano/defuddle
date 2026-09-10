export function getSiteCSS(): string {
	return `
		:root {
			--font-sans: -apple-system, BlinkMacSystemFont, InterVariable, Inter, "Segoe UI", Helvetica, Arial, sans-serif;
			--font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", "IBM Plex Mono", "Roboto Mono", "DejaVu Sans Mono", "Liberation Mono", Menlo, Monaco, "Consolas", "Source Code Pro", monospace;
			--font-size-title: clamp(2rem, 4vw, 2.5rem);
			--font-size-heading: 1.25rem;
			--font-size-body: clamp(1rem, 0.875rem + 0.2vw, 1.125rem);
			--font-size-small: 0.875rem;
			--font-size-xs: 0.75rem;
			--font-size-menu: 0.8125rem;
			--code-line-height: 1.72;
			--code-gutter-width: 42px;
			--radius-small: 6px;
			--radius-panel: 12px;
			--radius-pill: 999px;
			--header-height: 64px;
			--page-width: 88vw;
			--desktop-navigation-left: max(24px, calc((100vw - var(--reading)) / 2 - 180px - clamp(40px, 3.5vw, 56px)));
			--desktop-wordmark-top: calc((var(--header-height) - var(--font-size-heading)) / 2);
			--content: 960px;
			--reading: calc(var(--font-size-body) * 42);
			--ink: #100f0f;
			--panel: #1c1b1a;
			--line: #282726;
			--line-background: var(--line);
			--line-hover: #343331;
			--line-active: #403e3c;
			--faint: #575653;
			--muted: #878580;
			--body: #cecdc3;
			--paper: #cecdc3;
			--red: #d14d41;
			--orange: #da702c;
			--yellow: #d0a215;
			--green: #879a39;
			--cyan: #3aa99f;
			--blue: #4385be;
			--purple: #8b7ec8;
			--magenta: #ce5d97;
			/* Flexoki 300 accents; base-400 punctuation and base-600 comments. */
			--syntax-red: #e8705f;
			--syntax-orange: #ec8b49;
			--syntax-yellow: #dfb431;
			--syntax-green: #a0af54;
			--syntax-cyan: #5abdac;
			--syntax-blue: #66a0c8;
			--syntax-purple: #a699d0;
			--syntax-magenta: #e47da8;
			--syntax-muted: #9f9d96;
			--syntax-comment: #6f6e69;
			--accent: var(--paper);
			--selection-background: rgb(255 252 240 / 15%);
			--error-background: #2a1a1a;
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		[hidden] { display: none !important; }
		::selection { background: var(--selection-background); }
		html { background: var(--ink); scroll-behavior: smooth; }
		body {
			min-height: 100vh;
			background: var(--ink);
			color: var(--body);
			font-family: var(--font-sans);
			font-size: var(--font-size-body);
			line-height: 1.55;
			text-rendering: optimizeLegibility;
			color-scheme: dark;
			-webkit-font-smoothing: antialiased;
		}
		button, input, textarea { font: inherit; }
		:is(button, a, input, textarea):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
		h1 { color: var(--paper); font-size: var(--font-size-title); font-weight: 600; line-height: 1.2; letter-spacing: -0.025em; }
		h2 { color: var(--paper); font-size: var(--font-size-heading); font-weight: 500; line-height: 1.4; }
		h3 { color: var(--paper); font-size: var(--font-size-body); font-weight: 600; }
		pre, code { font-family: var(--font-mono); font-size: var(--font-size-small); }
		pre { line-height: var(--code-line-height); }
		.button {
			display: inline-flex;
			min-height: 42px;
			align-items: center;
			justify-content: center;
			gap: 4px;
			border: 1px solid var(--faint);
			border-radius: var(--radius-pill);
			background: transparent;
			padding: 8px 14px;
			color: var(--paper);
			font-size: var(--font-size-small);
			font-weight: 500;
			text-decoration: none;
			cursor: pointer;
			transition: background 150ms ease, color 150ms ease;
		}
		.button-primary { border-color: var(--accent); background: var(--accent); color: var(--ink); }
		.button:disabled { opacity: 0.5; cursor: wait; }
		@media (hover: hover) {
			.button:hover { background: var(--panel); }
			.button-primary:hover { background: color-mix(in srgb, var(--accent), var(--ink) 12%); }
		}
		.segmented-control {
			--segment-count: 2;
			--selected-index: 0;
			--pill-scale: 1;
			--pill-shift: 0%;
			position: relative;
			isolation: isolate;
			display: inline-grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			max-width: 100%;
			border-radius: var(--radius-pill);
			background: var(--panel);
			font-size: var(--font-size-small);
		}
		.segmented-control::before {
			content: '';
			position: absolute;
			z-index: -1;
			inset-block: 0;
			left: 0;
			width: calc(100% / var(--segment-count));
			border-radius: var(--radius-pill);
			background: var(--line);
			pointer-events: none;
			transform: translateX(calc(var(--selected-index) * 100% + var(--pill-shift))) scaleX(var(--pill-scale));
			transform-origin: left center;
			transition: transform 200ms ease;
		}
		.segmented-control:has(> button:nth-child(2)[aria-pressed="true"]) { --selected-index: 1; }
		.segmented-control:has(> button:nth-child(3)[aria-pressed="true"]) { --selected-index: 2; }
		.segmented-control:has(> button[aria-pressed="true"] ~ button:active) { --pill-scale: 1.1; }
		.segmented-control:has(> button:active ~ button[aria-pressed="true"]) { --pill-scale: 1.1; --pill-shift: -10%; }
		.segmented-control > button {
			min-width: 0;
			border: 0;
			border-radius: var(--radius-pill);
			background: transparent;
			padding: 4px 10px;
			color: var(--muted);
			font: inherit;
			cursor: pointer;
			user-select: none;
			-webkit-user-select: none;
		}
		.segmented-control > button:hover,
		.segmented-control > button[aria-pressed="true"] { color: var(--paper); }
		@media (prefers-reduced-motion: reduce) {
			html { scroll-behavior: auto; }
			*, *::before, *::after { transition-duration: 0.01ms !important; }
			.segmented-control::before { transform: translateX(calc(var(--selected-index) * 100%)); }
		}
	`;
}
