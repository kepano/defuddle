import { getSiteCSS } from './styles';
import { getFooterCSS, getFooterHTML } from './footer';

export function getSuccessPage(sessionId: string): string {
	const escapedSessionId = sessionId.replace(/[&"'<>]/g, '');

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>API Key · Defuddle</title>
	<link rel="preconnect" href="https://rsms.me/" crossorigin>
	<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
	<style>
		${getSiteCSS()}
		.container {
			width: min(var(--page-width), var(--reading));
			margin: 0 auto;
			padding: 64px 0 72px;
		}
		h1 {
			margin-bottom: 1.5rem;
		}
		label {
			display: block;
			font-size: var(--font-size-body);
			color: var(--muted);
			margin-bottom: 0.5rem;
		}
		.key-row {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			margin-bottom: 0.75rem;
		}
		.key-row code {
			display: block;
			flex: 1;
			padding: 1rem;
			background: var(--panel);
			border: 0;
			border-radius: var(--radius-panel);
			font-size: var(--font-size-body);
			color: var(--paper);
			word-break: break-all;
			user-select: all;
			letter-spacing: 0.02em;
		}
		.success-msg {
			font-size: var(--font-size-heading);
			color: var(--paper);
			margin-bottom: 1.5rem;
		}
		.note {
			font-size: var(--font-size-body);
			color: var(--muted);
			margin-bottom: 2rem;
		}
		.usage-label {
			font-size: var(--font-size-body);
			color: var(--muted);
			margin-bottom: 0.5rem;
		}
		pre.usage {
			background: var(--panel);
			border-radius: var(--radius-panel);
			padding: 0.75rem 1rem;
			overflow-x: auto;
			font-size: var(--font-size-small);
			line-height: var(--code-line-height);
			margin-bottom: 1.5rem;
		}
		pre.usage code {
			font-family: var(--font-mono);
			color: var(--paper);
		}
		.loading {
			text-align: center;
			padding: 3rem 0;
			color: var(--muted);
		}
		.error {
			padding: 1.5rem;
			background: var(--error-background);
			border: 0;
			border-radius: var(--radius-panel);
			color: var(--syntax-red);
			font-size: var(--font-size-small);
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
				<button class="copy-btn button" onclick="copyKey()">Copy</button>
			</div>
			<p class="note">Save this key now. It won&rsquo;t be shown again.</p>
			<p class="usage-label">Use it like this:</p>
			<pre class="usage"><code id="usageCode"></code></pre>
		</div>

		<div id="error" class="error" style="display:none">
			<span id="errorMsg"></span>
			<a href="/pricing" style="color:var(--syntax-red); margin-left: 0.25rem;">Return to pricing</a>
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
