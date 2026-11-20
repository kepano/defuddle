import { getSiteCSS } from './styles';
import { getFooterCSS, getFooterHTML } from './footer';
import { renderDocsContent } from './render-docs';

const apiExample = renderDocsContent('<pre><code class="language-bash">curl defuddle.md/stephango.com</code></pre>').content;
const cliExample = renderDocsContent('<pre><code class="language-bash">npx -y defuddle parse https://stephango.com --md</code></pre>').content;

export function getLandingPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Defuddle · Get the main content of any page as Markdown.</title>
	<meta name="description" content="Get the main content of any page as clean, readable Markdown.">
	<link rel="preconnect" href="https://rsms.me/" crossorigin>
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
	<style>
		${getSiteCSS()}
		.hero {
			min-height: 70vh;
			display: flex;
			align-items: flex-start;
			justify-content: center;
			padding-block: 22.5vh 7.5vh;
		}
		.hero-inner {
			width: min(var(--page-width), var(--reading));
			padding: 2rem 0;
		}
		.bottom {
			width: min(var(--page-width), var(--reading));
			margin: 0 auto;
			padding: 48px 0 72px;
		}
		h1 {
			font-weight: 700;
			margin-bottom: 0.5rem;
		}
		.subtitle {
			margin-bottom: 2rem;
			font-size: var(--font-size-heading);
		}
		form {
			display: flex;
			gap: 0.5rem;
		}
		.mode-toggle { margin-bottom: 16px; }
		.bookmarklet { cursor: grab; }
		.form-html > .button { align-self: flex-start; }
		.form-url {
			align-items: center;
		}
		.form-html {
			flex-direction: column;
		}
		input {
			flex: 1;
			min-width: 0;
			min-height: 42px;
			padding: 8px 14px;
			font-size: var(--font-size-body);
			border: 0;
			border-radius: var(--radius-panel);
			background: var(--panel);
			color: var(--paper);
		}
		input::placeholder {
			color: var(--muted);
		}
		textarea {
			width: 100%;
			padding: 0.75rem 1rem;
			font-size: var(--font-size-small);
			font-family: var(--font-mono);
			border: 0;
			border-radius: var(--radius-panel);
			background: var(--panel);
			color: var(--paper);
			resize: vertical;
			min-height: 150px;
			line-height: var(--code-line-height);
		}
		textarea::placeholder {
			color: var(--muted);
		}
		@media (max-width: 480px) {
			.button-full {
				display: none;
			}
			textarea {
				font-size: 16px;
			}
		}
		${getFooterCSS()}
	</style>
	<link rel="stylesheet" href="/build/home.css">
</head>
<body>
	<div class="hero">
		<div class="hero-inner">
			<h1>Defuddle</h1>
			<p class="subtitle">Get the main content of any page as Markdown.</p>
			<div class="mode-toggle segmented-control" role="group" aria-label="Input format">
				<button id="modeUrl" class="active" aria-pressed="true" aria-controls="formUrl">URL</button>
				<button id="modeHtml" aria-pressed="false" aria-controls="formHtml">HTML</button>
			</div>
			<form id="formUrl" class="form-url">
				<input
					type="text"
					id="urlInput"
					aria-label="Page URL"
					placeholder="Enter a URL"
					autocomplete="off"
					autofocus
				/>
				<button type="submit" class="button button-primary">Get<span class="button-full">Markdown</span></button>
			</form>
			<form id="formHtml" class="form-html" style="display:none">
				<textarea
					id="htmlInput"
					aria-label="HTML to convert"
					placeholder="Paste HTML here..."
				></textarea>
				<button type="submit" class="button button-primary">Get<span class="button-full">Markdown</span></button>
			</form>
		</div>
	</div>
	<div class="bottom">
		<section class="guide-section" aria-labelledby="explore-title">
			<header class="guide-heading"><h2 id="explore-title">Explore</h2></header>
			<nav class="guide-links" aria-label="Explore Defuddle">
				<a class="guide-link-card" href="/docs"><h3>Docs</h3><p>Learn how to use Defuddle in your own app, via API, CLI, and more.</p></a>
				<a class="guide-link-card" href="/playground"><h3>Playground</h3><p>Try Defuddle in an interactive editor for testing and debugging.</p></a>
			</nav>
		</section>

		<section id="api" class="home-section" aria-labelledby="api-title">
			<header class="home-section-heading"><h2 id="api-title">API</h2></header>
			<p class="home-section-copy">Return Markdown with YAML frontmatter. Append any URL path to convert it. See the <a href="/docs#api">API docs</a> for more options and <a href="/pricing">pricing</a> for additional requests.</p>
			${apiExample}
		</section>

		<section id="cli" class="home-section" aria-labelledby="cli-title">
			<header class="home-section-heading"><h2 id="cli-title">CLI</h2></header>
			<p class="home-section-copy">Extract clean Markdown from web pages. See the <a href="/docs#cli">CLI docs</a> for more options.</p>
			${cliExample}
		</section>

		<section class="used-by" aria-labelledby="more-tools">
			<header class="used-by-heading">
				<h2 id="more-tools">More tools</h2>
				<p>Defuddle is <a href="https://github.com/kepano/defuddle" target="_blank" rel="noopener noreferrer">open source</a>. It was created for <a href="https://obsidian.md/clipper" target="_blank" rel="noopener noreferrer">Obsidian Web Clipper</a> to extract the main content from web pages. Add Defuddle to your own app, or try it with the following tools.</p>
			</header>
			<div class="used-by-list">
				<a href="https://obsidian.md/clipper" class="used-by-card" target="_blank" rel="noopener noreferrer"><div><h3>Obsidian Web Clipper</h3><p>Save web pages to Markdown with customizable templates.</p></div><span aria-hidden="true">↗</span></a>
				<a href="https://community.obsidian.md/plugins/obsidian-importer" class="used-by-card" target="_blank" rel="noopener noreferrer"><div><h3>Obsidian Importer</h3><p>Convert data from many apps and file formats to portable Markdown files.</p></div><span aria-hidden="true">↗</span></a>
			</div>
		</section>

		<section class="home-section" aria-labelledby="bookmarklets-title">
			<header class="home-section-heading"><h2 id="bookmarklets-title">Bookmarklets</h2></header>
			<p class="home-section-copy">Drag these to your bookmarks bar, then click them on any page to convert it to Markdown.</p>
			<div class="bookmarklet-actions"><a href="javascript:void(location.href='https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,''))" class="button bookmarklet">Defuddle</a><a href="javascript:void(fetch('https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,'')).then(r=>r.text()).then(t=>{navigator.clipboard.writeText(t);document.title='\\u2705 '+document.title;setTimeout(()=>{document.title=document.title.slice(2)},2000)}).catch(()=>{window.open('https://defuddle.md/'+location.href.replace(/^https?:\\/\\//,''))}))" class="button bookmarklet">Copy as md</a></div>
		</section>
		${getFooterHTML()}
	</div>
	<script type="module" src="/build/home.js"></script>
	<script>
		var modeUrl = document.getElementById('modeUrl');
		var modeHtml = document.getElementById('modeHtml');
		var formUrl = document.getElementById('formUrl');
		var formHtml = document.getElementById('formHtml');

		function setMode(mode) {
			modeUrl.setAttribute('aria-pressed', String(mode === 'url'));
			modeHtml.setAttribute('aria-pressed', String(mode === 'html'));
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
