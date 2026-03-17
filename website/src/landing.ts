import { getFooterCSS, getFooterHTML } from './footer';

export function getLandingPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Defuddle — Get the main content of any page as Markdown.</title>
	<meta name="description" content="Get the main content of any page as clean, readable Markdown.">
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			background: #100F0F;
			color: #B7B5AC;
		}
		.hero {
			min-height: 70vh;
			display: flex;
			align-items: flex-start;
			justify-content: center;
			padding-top: 22.5vh;
    		padding-bottom: 7.5vh;
		}
		.hero-inner {
			max-width: 600px;
			width: 100%;
			padding: 2rem;
		}
		.divider {
			border: none;
			border-top: 1px solid #343331;
		}
		.bottom {
			max-width: 600px;
			width: 100%;
			margin: 0 auto;
			padding: 3rem 2rem;
		}
		h1 {
			font-size: 2rem;
			font-weight: 700;
			margin-bottom: 0.5rem;
			color: #F2F0E5;
		}
		.subtitle {
			color: #878580;
			margin-bottom: 2rem;
			font-size: 1.1rem;
		}
		.mode-toggle {
			display: inline-flex;
			justify-content: center;
			margin-bottom: 1rem;
			border: 1px solid #343331;
			border-radius: 6px;
			overflow: hidden;
		}
		.mode-toggle button {
			padding: 0.4rem 1rem;
			font-size: 0.85rem;
			border: none;
			background: none;
			color: #878580;
			cursor: pointer;
			font-weight: 500;
			transition: all 0.2s;
		}
		.mode-toggle button:hover {
			color: #B7B5AC;
		}
		.mode-toggle button.active {
			background: #1C1B1A;
			color: #F2F0E5;
		}
		form {
			display: flex;
			gap: 0.5rem;
		}
		.form-url {
			align-items: center;
		}
		.form-html {
			flex-direction: column;
		}
		input {
			flex: 1;
			padding: 0.75rem 1rem;
			font-size: 1rem;
			border: 1px solid #343331;
			border-radius: 8px;
			background: #1C1B1A;
			color: #F2F0E5;
			outline: none;
			transition: border-color 0.2s;
		}
		input:focus {
			border-color: #575653;
		}
		input::placeholder {
			color: #575653;
		}
		textarea {
			width: 100%;
			padding: 0.75rem 1rem;
			font-size: 0.85rem;
			font-family: "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
			border: 1px solid #343331;
			border-radius: 8px;
			background: #1C1B1A;
			color: #F2F0E5;
			outline: none;
			transition: border-color 0.2s;
			resize: vertical;
			min-height: 150px;
			line-height: 1.5;
		}
		textarea:focus {
			border-color: #575653;
		}
		textarea::placeholder {
			color: #575653;
		}
		button[type="submit"] {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			padding: 0.75rem 1.5rem;
			font-size: 1rem;
			border: none;
			border-radius: 8px;
			background: #F2F0E5;
			color: #1C1B1A;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.2s;
		}
		button[type="submit"]:hover {
			background: #B7B5AC;
		}
		@media (max-width: 480px) {
			.button-full {
				display: none;
			}
			textarea {
				font-size: 16px;
			}
		}
		.api-note {
			padding: 1.5rem;
			background: #1C1B1A;
			border-radius: 8px;
			text-align: left;
			font-size: 0.9rem;
			color: #878580;
			line-height: 1.5;
		}
		.api-note p + p {
			margin-top: 0.75rem;
		}
		.api-note code {
			background: #343331;
			padding: 0.15rem 0.4rem;
			border-radius: 4px;
			font-size: 0.85rem;
			color: #B7B5AC;
		}
		${getFooterCSS()}
	</style>
</head>
<body>
	<div class="hero">
		<div class="hero-inner">
			<h1>Defuddle</h1>
			<p class="subtitle">Get the main content of any page as Markdown.</p>
			<div class="mode-toggle">
				<button id="modeUrl" class="active">URL</button>
				<button id="modeHtml">HTML</button>
			</div>
			<form id="formUrl" class="form-url">
				<input
					type="text"
					id="urlInput"
					placeholder="Enter a URL"
					autocomplete="off"
					autofocus
				/>
				<button type="submit">Get<span class="button-full"> Markdown</span></button>
			</form>
			<form id="formHtml" class="form-html" style="display:none">
				<textarea
					id="htmlInput"
					placeholder="Paste HTML here..."
				></textarea>
				<button type="submit">Get<span class="button-full"> Markdown</span></button>
			</form>
		</div>
	</div>
	<hr class="divider">
	<div class="bottom">
		<div class="api-note">
			<p><strong>API</strong></p>
			<p><code>curl defuddle.md/stephango.com</code></p>
			<p>Returns Markdown with YAML frontmatter. Append any URL path to convert it.</p>
		</div>
		<div class="api-note" style="margin-top: 1rem;">
			<p><strong>Browser extension</strong></p>
			<p>Defuddle was created for <a href="https://obsidian.md/clipper" style="color: #B7B5AC; text-decoration: underline;">Obsidian Web Clipper</a>. It runs locally and works with any site you have access to, like private content or JavaScript-rendered pages.</p>
		</div>
		<div class="api-note" style="margin-top: 1rem;">
			<p><strong>Bookmarklets</strong></p>
			<p>Drag these to your bookmarks bar, then click them on any page to convert it to Markdown.</p>
			<p style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;"><a href="javascript:void(location.href='https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,''))" style="display: inline-block; padding: 0.4rem 0.8rem; background: #343331; color: #F2F0E5; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.85rem; cursor: grab;">Defuddle</a><a href="javascript:void(fetch('https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,'')).then(r=>r.text()).then(t=>{navigator.clipboard.writeText(t);document.title='\\u2705 '+document.title;setTimeout(()=>{document.title=document.title.slice(2)},2000)}).catch(()=>{window.open('https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,''))}))" style="display: inline-block; padding: 0.4rem 0.8rem; background: #343331; color: #F2F0E5; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.85rem; cursor: grab;">Copy as md</a></p>
		</div>
		${getFooterHTML()}
	</div>
	<script>
		var modeUrl = document.getElementById('modeUrl');
		var modeHtml = document.getElementById('modeHtml');
		var formUrl = document.getElementById('formUrl');
		var formHtml = document.getElementById('formHtml');

		function setMode(mode) {
			if (mode === 'url') {
				modeUrl.classList.add('active');
				modeHtml.classList.remove('active');
				formUrl.style.display = '';
				formHtml.style.display = 'none';
				document.getElementById('urlInput').focus();
			} else {
				modeHtml.classList.add('active');
				modeUrl.classList.remove('active');
				formUrl.style.display = 'none';
				formHtml.style.display = '';
				document.getElementById('htmlInput').focus();
			}
		}

		modeUrl.addEventListener('click', function() { setMode('url'); });
		modeHtml.addEventListener('click', function() { setMode('html'); });

		formUrl.addEventListener('submit', function(e) {
			e.preventDefault();
			var url = document.getElementById('urlInput').value.trim();
			if (url) {
				url = url.replace(/^https?:\\/\\//, '');
				window.location.href = '/' + url;
			}
		});

		formHtml.addEventListener('submit', function(e) {
			e.preventDefault();
			var html = document.getElementById('htmlInput').value.trim();
			if (html) {
				var form = document.createElement('form');
				form.method = 'POST';
				form.action = '/playground';
				var field = document.createElement('input');
				field.type = 'hidden';
				field.name = 'html';
				field.value = html;
				form.appendChild(field);
				document.body.appendChild(form);
				form.submit();
			}
		});
	</script>
</body>
</html>`;
}
