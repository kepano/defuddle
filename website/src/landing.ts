export function getLandingPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Defuddle — Convert any web page to clean markdown</title>
	<meta name="description" content="Convert any web page to clean, readable markdown. Just add the URL.">
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			background: #1C1B1A;
			color: #B7B5AC;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.container {
			max-width: 600px;
			width: 100%;
			padding: 2rem;
			text-align: center;
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
		form {
			display: flex;
			gap: 0.5rem;
		}
		input {
			flex: 1;
			padding: 0.75rem 1rem;
			font-size: 1rem;
			border: 1px solid #343331;
			border-radius: 8px;
			background: #282726;
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
		button {
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
		button:hover {
			background: #B7B5AC;
		}
		.examples {
			margin-top: 2rem;
			color: #878580;
			font-size: 0.9rem;
		}
		.examples a {
			color: #B7B5AC;
			text-decoration: none;
			border-bottom: 1px solid #343331;
			transition: color 0.2s, border-color 0.2s;
		}
		.examples a:hover {
			color: #F2F0E5;
			border-color: #575653;
		}
		.api-note {
			margin-top: 3rem;
			padding: 1.5rem;
			background: #282726;
			border-radius: 8px;
			text-align: left;
			font-size: 0.9rem;
			color: #878580;
		}
		.api-note code {
			background: #343331;
			padding: 0.15rem 0.4rem;
			border-radius: 4px;
			font-size: 0.85rem;
			color: #B7B5AC;
		}
		.footer {
			margin-top: 3rem;
			font-size: 0.85rem;
			color: #575653;
		}
		.footer a {
			color: #878580;
			text-decoration: none;
		}
		.footer a:hover {
			color: #F2F0E5;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Defuddle</h1>
		<p class="subtitle">Convert any web page to markdown.</p>
		<form id="form">
			<input
				type="text"
				id="url"
				name="url"
				placeholder="Enter a URL, e.g. stephango.com"
				autocomplete="off"
				autofocus
			/>
			<button type="submit">Convert</button>
		</form>
		<div class="examples">
			Try: <a href="/stephango.com/file-over-app">stephango.com</a>
			&middot; <a href="/en.wikipedia.org/wiki/Markdown">Wikipedia</a>
		</div>
		<div class="api-note">
			<strong>API usage</strong><br><br>
			<code>curl defuddle.dev/stephango.com</code><br><br>
			Returns markdown with YAML frontmatter. Append any URL path to convert it.
		</div>
		<div class="footer">
			Powered by <a href="https://github.com/kepano/defuddle">defuddle</a>
		</div>
	</div>
	<script>
		document.getElementById('form').addEventListener('submit', function(e) {
			e.preventDefault();
			var url = document.getElementById('url').value.trim();
			if (url) {
				url = url.replace(/^https?:\\/\\//, '');
				window.location.href = '/' + url;
			}
		});
	</script>
</body>
</html>`;
}
