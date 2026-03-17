import { getFooterCSS, getFooterHTML } from './footer';

export function getSuccessPage(sessionId: string): string {
	const escapedSessionId = sessionId.replace(/[&"'<>]/g, '');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>API Key — Defuddle</title>
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
		.container {
			max-width: 600px;
			width: 100%;
			margin: 0 auto;
			padding: 6rem 2rem 3rem;
		}
		h1 {
			font-size: 2rem;
			font-weight: 700;
			margin-bottom: 1.5rem;
			color: #F2F0E5;
		}
		label {
			display: block;
			font-size: 1.1rem;
			color: #878580;
			margin-bottom: 0.5rem;
		}
		.key-row {
			display: flex;
			gap: 0.5rem;
			align-items: stretch;
			margin-bottom: 0.75rem;
		}
		.key-row code {
			display: block;
			flex: 1;
			padding: 1rem;
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			font-size: 1.1rem;
			color: #F2F0E5;
			word-break: break-all;
			user-select: all;
			letter-spacing: 0.02em;
		}
		.copy-btn {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			padding: 0 1rem;
			border: 1px solid #343331;
			border-radius: 8px;
			background: #1C1B1A;
			color: #878580;
			font-size: 0.85rem;
			cursor: pointer;
			white-space: nowrap;
			transition: color 0.2s, border-color 0.2s;
		}
		.copy-btn:hover {
			color: #F2F0E5;
			border-color: #575653;
		}
		.success-msg {
			font-size: 1.25rem;
			color: #F2F0E5;
			margin-bottom: 1.5rem;
		}
		.note {
			font-size: 1rem;
			color: #878580;
			margin-bottom: 2rem;
		}
		.usage-label {
			font-size: 1.1rem;
			color: #878580;
			margin-bottom: 0.5rem;
		}
		pre.usage {
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			padding: 0.75rem 1rem;
			overflow-x: auto;
			font-size: 0.85rem;
			line-height: 1.5;
			margin-bottom: 1.5rem;
		}
		pre.usage code {
			font-family: "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
			color: #F2F0E5;
		}
		.loading {
			text-align: center;
			padding: 3rem 0;
			color: #878580;
		}
		.error {
			padding: 1.5rem;
			background: #2a1a1a;
			border: 1px solid #5c2a2a;
			border-radius: 8px;
			color: #e5a0a0;
			font-size: 0.9rem;
		}
		${getFooterCSS()}
	</style>
</head>
<body>
	<div class="container">
		<h1><a href="/" style="color: inherit; text-decoration: none;">Defuddle</a></h1>

		<div id="loading" class="loading">Confirming payment...</div>

		<div id="result" style="display:none">
			<p class="success-msg">Payment complete. Your API key is ready.</p>
			<label>Your API key</label>
			<div class="key-row">
				<code id="apiKeyCode"></code>
				<button class="copy-btn" onclick="copyKey()">Copy</button>
			</div>
			<p class="note">Save this key now. It won&rsquo;t be shown again.</p>
			<p class="usage-label">Use it like this:</p>
			<pre class="usage"><code id="usageCode"></code></pre>
		</div>

		<div id="error" class="error" style="display:none">
			<span id="errorMsg"></span>
			<a href="/pricing" style="color:#e5a0a0; margin-left: 0.25rem;">Return to pricing</a>
		</div>

		${getFooterHTML()}
	</div>
	<script>
		var sessionId = ${JSON.stringify(escapedSessionId)};
		var attempts = 0;
		var maxAttempts = 30;

		function copyKey() {
			var key = document.getElementById('apiKeyCode').textContent;
			navigator.clipboard.writeText(key).then(function() {
				var btn = document.querySelector('.copy-btn');
				btn.textContent = 'Copied';
				setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
			});
		}

		function showResult(apiKey) {
			document.getElementById('loading').style.display = 'none';
			document.getElementById('error').style.display = 'none';
			document.getElementById('apiKeyCode').textContent = apiKey;
			document.getElementById('usageCode').textContent = 'curl "defuddle.md/example.com?key=' + apiKey + '"\\n\\n# or with a header\\ncurl -H "Authorization: Bearer ' + apiKey + '" defuddle.md/example.com';
			document.getElementById('result').style.display = 'block';
		}

		function showError(msg) {
			document.getElementById('loading').style.display = 'none';
			document.getElementById('result').style.display = 'none';
			document.getElementById('errorMsg').textContent = msg;
			document.getElementById('error').style.display = 'block';
		}

		async function poll() {
			if (!sessionId) {
				showError('No session found.');
				return;
			}

			try {
				var res = await fetch('/api/keys/sessions/' + sessionId);
				var data = await res.json();

				if (data.status === 'completed' && data.api_key) {
					showResult(data.api_key);
				} else if (data.status === 'pending') {
					attempts++;
					if (attempts >= maxAttempts) {
						showError('Payment is still processing. Please refresh this page in a moment.');
						return;
					}
					setTimeout(poll, 2000);
				} else {
					showError('Session not found.');
				}
			} catch (err) {
				showError('Something went wrong. Please refresh the page.');
			}
		}

		poll();
	</script>
</body>
</html>`;
}
