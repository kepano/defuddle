export function getFooterCSS(): string {
	return `
		.site-footer {
			width: 100%;
			display: flex;
			flex-direction: column;
			flex-wrap: wrap;
			gap: 20px;
			margin-top: 72px;
			padding-block: 24px 48px;
			color: var(--muted);
		}
		.site-footer a {
			color: var(--paper);
			text-decoration: none;
			border-bottom: none;
			transition: color 150ms ease, text-decoration-color 150ms ease;
		}
		@media (hover: hover) {
			.site-footer a:hover { color: #f2f0e5; }
		}
		.footer-nav {
			display: flex;
			flex-wrap: wrap;
			gap: 20px;
		}
		.footer-author {
			margin-top: 48px;
			display: inline-flex;
			align-self: flex-start;
			align-items: center;
			gap: 12px;
		}
		.footer-author-by {
			color: var(--muted);
		}
		.footer-author > svg {
			display: block;
			width: 32px;
			height: 32px;
			flex-shrink: 0;
			border-radius: 50%;
		}
		@media (max-width: 760px) {
			.site-footer { gap: 32px; }
			.footer-nav {
				display: grid;
				grid-auto-flow: column;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				grid-template-rows: repeat(4, auto);
				gap: 16px;
			}
		}
	`;
}

export function getFooterHTML(): string {
	return `
		<footer class="site-footer">
			<span>Defuddle is <a href="https://github.com/kepano/defuddle" target="_blank" rel="noopener noreferrer">open source</a> under the MIT license.</span>
			<nav class="footer-nav" aria-label="Footer navigation">
				<a href="/">Home</a>
				<a href="/docs">Docs</a>
				<a href="/playground">Playground</a>
				<a href="https://www.npmjs.com/package/defuddle" target="_blank" rel="noopener noreferrer">NPM</a>
				<a href="/pricing">Pricing</a>
				<a href="/terms">Terms</a>
				<a href="/privacy">Privacy</a>
			</nav>
			<a class="footer-author" href="https://stephango.com" target="_blank" rel="noopener noreferrer">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32" aria-hidden="true" focusable="false" style="background-color:#FFE1C5; border-radius:50%;" >
  <g clip-path="url(#footer-avatar-clip)">
    <path fill="#FFE1C5" d="M40 19.99A19.99 19.99 0 0 0 20 0a19.99 19.99 0 1 0 20 19.98Z"/>
    <path fill="#000" d="M26.93 7.92a8.95 8.95 0 0 0-2.98.45c-2.04.65-2.1.7-1.8 1.46.23.58.51.84.8.76l1.42-.47c1.22-.4 1.22-.4 2.47-.42.7 0 1.43 0 1.64.02.42.04 1.37.45 2.4 1.04.39.23.9.48 1.14.58.53.2.57.18.9-.46.4-.73.34-1-.25-1.21a6.02 6.02 0 0 1-1.3-.63c-.27-.17-.83-.46-1.26-.66-.7-.31-.86-.36-1.5-.41-.4-.03-1.15-.05-1.68-.05Zm-15.99-.15c-.78.03-1.79.19-2.35.38-1.2.4-2.8 1.45-3.2 2.08-.29.44-.3.5-.1.99.25.66.56.66 1.5-.03 1.79-1.33 2.96-1.72 4.98-1.63.84.04.85.05 1.3.32.57.38.98.49 1.26.34.26-.13.66-.82.7-1.2.02-.24 0-.3-.21-.43a1.24 1.24 0 0 0-.51-.13c-.2 0-.39-.07-.7-.27-.4-.27-.46-.28-1.32-.36a17.5 17.5 0 0 0-1.35-.06Zm7.77 2.92a.65.65 0 0 1-.29.04c-.25-.02-.43.25-.47.71-.03.22-.18.8-.36 1.28a46.5 46.5 0 0 0-.67 2.11c-.41 1.45-1.16 3.73-2.1 6.37l-.86 2.5c-.27.84-.92 3.16-.95 3.39-.03.3.37 1.16.64 1.4.49.4.82.43 4.25.25a71 71 0 0 1 1.87-.07c.88-.03 2.16-.49 2.4-.86l.22-.37c.05-.08.1-.29.12-.48.03-.31.01-.35-.2-.46-.35-.18-.95-.13-1.68.15-.43.17-.77.24-1.12.24-.28 0-.94.03-1.46.07-2.02.11-3.3.13-3.37.03-.03-.04.48-1.87.71-2.57.09-.3.48-1.41.86-2.5a153.8 153.8 0 0 0 2.16-6.54c.31-1.02.7-2.2.83-2.64.15-.43.3-1 .32-1.28.05-.47.04-.5-.17-.65-.25-.17-.49-.22-.68-.12Zm11.59 2.85c-.14.04-.32.15-.37.25l-.4.67a3.65 3.65 0 0 1-1.72 1.4c-.44.17-1.23.13-1.76-.07-.27-.1-.95-.7-1.22-1.08a1.8 1.8 0 0 0-.4-.37c-.22-.15-.3-.17-.66-.13-.29.02-.45.09-.54.2-.13.16-.12.2.06.73.2.6.56 1.06 1.36 1.77.62.57 1.03.71 2.19.8.91.06.95.06 1.56-.17a4.83 4.83 0 0 0 2.73-2.7c.35-.73.37-1.01.1-1.2-.26-.16-.55-.19-.92-.1Zm-16.06-.1-.29.04c-.14.02-.33.17-.6.48-.38.44-1.05.9-1.64 1.13-.5.2-1.3.27-1.83.17a2.17 2.17 0 0 1-1.4-.89c-.36-.44-.76-.76-1.02-.78-.32-.04-.78.1-.87.26-.07.13-.06.27.06.63.28.8 1.34 1.94 2.16 2.33.85.39 2.58.34 3.67-.11 1.32-.55 2.58-1.84 2.67-2.74.03-.23 0-.3-.15-.39-.18-.1-.58-.17-.76-.13ZM28.9 28.65c-.2.05-.38.2-.68.57a12.61 12.61 0 0 1-9.37 3.74c-.8-.08-1.22 0-1.3.23-.1.24.15.95.42 1.24.18.21.25.24.83.3.88.08 3.13-.2 4.46-.55.7-.17 2.04-.74 2.87-1.17a13.37 13.37 0 0 0 3.12-2.41 3.87 3.87 0 0 0 .64-1c.04-.01.09-.2.11-.4.03-.34.02-.4-.15-.48a1.43 1.43 0 0 0-.95-.07Z"/>
  </g>
  <defs>
    <clipPath id="footer-avatar-clip">
      <path fill="#fff" d="M0 0h40v40H0z"/>
    </clipPath>
  </defs>
</svg>
				<span><span class="footer-author-by">by</span> kepano</span>
			</a>
		</footer>
	`;
}
