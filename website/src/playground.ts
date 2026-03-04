export function getPlaygroundPage(prefillHtml: string = ''): string {
	const escapedHtml = prefillHtml
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/`/g, '\\`')
		.replace(/\$/g, '\\$');
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Defuddle Playground</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		html, body {
			height: 100%;
			overflow: hidden;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			line-height: 1.5;
			color: #B7B5AC;
			background: #100F0F;
		}

		.container {
			max-width: 1400px;
			margin: 0 auto;
			padding: 2rem;
			height: 100%;
			display: flex;
			flex-direction: column;
		}

		header {
			margin-bottom: 2rem;
			flex-shrink: 0;
			display: flex;
			align-items: baseline;
			gap: 0.5rem;
		}

		.logo {
			font-size: 2rem;
			font-weight: 700;
			color: #F2F0E5;
			text-decoration: none;
			transition: color 0.2s;
			border-bottom: none;
		}

		.logo:hover {
			color: #B7B5AC;
		}

		.page-title {
			font-size: 2rem;
			font-weight: 700;
			color: #878580;
		}

		h2 {
			color: #F2F0E5;
			font-size: 1rem;
			font-weight: 600;
		}

		.playground-container {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
			flex: 1;
			min-height: 0;
		}

		.input-section, .output-section {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			min-height: 0;
		}

		.url-input {
			display: none;
			gap: 0.5rem;
			align-items: center;
			margin-bottom: 0.5rem;
		}

		.url-input input {
			flex: 1;
			padding: 1rem;
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			font-size: 0.875rem;
			color: #F2F0E5;
		}

		.controls {
			display: flex;
			gap: 0.5rem;
			flex-shrink: 0;
		}

		.btn {
			padding: 0.5rem 1rem;
			border: 1px solid #343331;
			border-radius: 8px;
			background: #1C1B1A;
			color: #B7B5AC;
			cursor: pointer;
			font-size: 0.875rem;
			transition: all 0.2s;
		}

		.btn:hover {
			background: #343331;
			color: #F2F0E5;
		}

		.btn.primary {
			background: #F2F0E5;
			color: #1C1B1A;
			border-color: #F2F0E5;
			font-weight: 600;
		}

		.btn.primary:hover {
			background: #B7B5AC;
		}

		textarea {
			flex: 1;
			padding: 1rem;
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			font-family: monospace;
			font-size: 0.875rem;
			color: #F2F0E5;
			resize: none;
			min-height: 0;
			outline: none;
			transition: border-color 0.2s;
		}

		textarea:focus {
			border-color: #575653;
		}

		textarea::placeholder {
			color: #575653;
		}

		.output-container {
			flex: 1;
			display: flex;
			flex-direction: column;
			border: 1px solid #343331;
			border-radius: 8px;
			overflow: hidden;
			min-height: 0;
		}

		.output-tabs {
			display: flex;
			border-bottom: 1px solid #343331;
			background: #1C1B1A;
			flex-shrink: 0;
		}

		.tab {
			padding: 0.75rem 1.5rem;
			border: none;
			background: none;
			cursor: pointer;
			font-size: 0.875rem;
			color: #878580;
			border-bottom: 2px solid transparent;
			transition: color 0.2s;
		}

		.tab:hover {
			color: #B7B5AC;
		}

		.tab.active {
			color: #F2F0E5;
			border-bottom-color: #F2F0E5;
		}

		.tab-content {
			display: none;
			flex: 1;
			overflow: auto;
			background: #100F0F;
			min-height: 0;
		}

		.tab-content.active {
			display: block;
		}

		.output-content {
			font-family: monospace;
			font-size: 0.875rem;
			white-space: pre-wrap;
			word-break: break-word;
			padding: 1rem;
			height: 100%;
			overflow: auto;
			color: #B7B5AC;
		}

		.error-container {
			position: fixed;
			bottom: 1rem;
			right: 1rem;
			max-width: 400px;
			padding: 1rem;
			background: #AF3029;
			color: #F2F0E5;
			border-radius: 8px;
			display: none;
			z-index: 1000;
		}

		.error-container.show {
			display: block;
		}

		@media (max-width: 768px) {
			.playground-container {
				grid-template-columns: 1fr;
			}
			.container {
				height: auto;
				min-height: 100vh;
			}
			html, body {
				overflow: auto;
			}
			.input-section, .output-section {
				min-height: 400px;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<header>
			<a href="/" class="logo">Defuddle</a>
			<span class="page-title">Playground</span>
		</header>

		<div class="playground-container">
			<div class="input-section">
				<h2>Input HTML</h2>
				<div class="controls">
					<button id="clearInput" class="btn">Clear</button>
				</div>
				<div class="url-input">
					<input type="text" id="url" placeholder="URL...">
				</div>
				<textarea id="input" placeholder="Paste your HTML here...">${escapedHtml}</textarea>
			</div>

			<div class="output-section">
				<h2>Output</h2>
				<div class="controls">
					<button id="parse" class="btn primary">Parse HTML</button>
					<button id="clearOutput" class="btn">Clear</button>
				</div>
				<div class="output-container">
					<div class="output-tabs">
						<button class="tab active" data-tab="markdown">Markdown</button>
						<button class="tab" data-tab="html">HTML</button>
						<button class="tab" data-tab="metadata">Metadata</button>
					</div>
					<div class="tab-content active" id="markdown">
						<div id="markdownOutput" class="output-content"></div>
					</div>
					<div class="tab-content" id="html">
						<div id="htmlOutput" class="output-content"></div>
					</div>
					<div class="tab-content" id="metadata">
						<pre id="metadataOutput" class="output-content"></pre>
					</div>
				</div>
			</div>
		</div>

		<div class="error-container" id="errorContainer"></div>
	</div>

	<script>
		var input = document.getElementById('input');
		var urlInput = document.getElementById('url');
		var markdownOutput = document.getElementById('markdownOutput');
		var htmlOutput = document.getElementById('htmlOutput');
		var metadataOutput = document.getElementById('metadataOutput');
		var clearInputBtn = document.getElementById('clearInput');
		var parseBtn = document.getElementById('parse');
		var clearOutputBtn = document.getElementById('clearOutput');
		var errorContainer = document.getElementById('errorContainer');
		var tabs = document.querySelectorAll('.tab');
		var tabContents = document.querySelectorAll('.tab-content');

		clearInputBtn.addEventListener('click', function() {
			input.value = '';
		});

		clearOutputBtn.addEventListener('click', function() {
			markdownOutput.textContent = '';
			htmlOutput.textContent = '';
			metadataOutput.textContent = '';
			hideError();
		});

		parseBtn.addEventListener('click', async function() {
			try {
				parseBtn.disabled = true;
				parseBtn.textContent = 'Parsing...';

				var response = await fetch('/api/parse', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						html: input.value,
						url: urlInput.value || undefined
					})
				});

				if (!response.ok) {
					throw new Error(await response.text());
				}

				var result = await response.json();

				console.log('Defuddle Result:', result);

				markdownOutput.textContent = result.content;
				htmlOutput.textContent = result.contentHtml;

				var metadata = Object.assign({}, result);
				delete metadata.content;
				delete metadata.contentHtml;
				metadataOutput.textContent = JSON.stringify(metadata, null, 2);

				hideError();
			} catch (error) {
				console.error('Defuddle Error:', error);
				showError(error.message);
			} finally {
				parseBtn.disabled = false;
				parseBtn.textContent = 'Parse HTML';
			}
		});

		tabs.forEach(function(tab) {
			tab.addEventListener('click', function() {
				var targetTab = tab.dataset.tab;

				tabs.forEach(function(t) { t.classList.remove('active'); });
				tab.classList.add('active');

				tabContents.forEach(function(c) {
					c.classList.remove('active');
					if (c.id === targetTab) {
						c.classList.add('active');
					}
				});
			});
		});

		function showError(message) {
			errorContainer.textContent = message;
			errorContainer.classList.add('show');
		}

		function hideError() {
			errorContainer.classList.remove('show');
		}

		if (input.value.trim()) {
			parseBtn.click();
		}
	</script>
</body>
</html>`;
}
