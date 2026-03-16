export function getFooterCSS(): string {
	return `
		.footer {
			padding-top: 4rem;
			padding-bottom: 4rem;
			font-size: 0.85rem;
			color: #575653;
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 1rem;
		}
		.footer a {
			color: #878580;
			text-decoration: none;
			border-bottom: none;
		}
		.footer a:hover {
			color: #F2F0E5;
		}
		.footer-col {
			display: flex;
			flex-direction: column;
			gap: 0.4rem;
		}
		@media (max-width: 480px) {
			.footer {
				grid-template-columns: repeat(2, 1fr);
			}
		}
	`;
}

export function getFooterHTML(): string {
	return `
		<div class="footer">
			<div class="footer-col">
				<a href="/docs">Docs</a>
				<a href="/playground">Playground</a>
				<a href="https://www.npmjs.com/package/defuddle" target="_blank">NPM</a>
			</div>
			<div class="footer-col">
				<a href="/pricing">Pricing</a>
				<a href="/terms">Terms</a>
				<a href="/privacy">Privacy</a>
			</div>
			<div class="footer-col">
				<a href="https://github.com/kepano/defuddle" target="_blank">GitHub</a>
				<a href="https://github.com/kepano/defuddle/blob/main/LICENSE" target="_blank">MIT&nbsp;License</a>
				<span>by <a href="https://stephango.com">@kepano</a></span>
			</div>
		</div>
	`;
}
