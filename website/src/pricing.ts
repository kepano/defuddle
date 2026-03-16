import { getFooterCSS, getFooterHTML } from './footer';

export function getPricingPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Pricing — Defuddle</title>
	<meta name="description" content="Buy API request blocks for the Defuddle API.">
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
			margin-bottom: 0.5rem;
			color: #F2F0E5;
		}
		.subtitle {
			color: #878580;
			margin-bottom: 2.5rem;
			font-size: 1.1rem;
			line-height: 1.5;
		}
		.blocks {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			margin-bottom: 2.5rem;
		}
		.block {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1.5rem;
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			text-decoration: none;
			color: inherit;
			cursor: pointer;
		}
		.block-info {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}
		.block-name {
			font-size: 1.1rem;
			font-weight: 600;
			color: #F2F0E5;
		}
		.block-per {
			font-size: 0.85rem;
			color: #878580;
		}
		.block-price {
			font-size: 1.25rem;
			font-weight: 700;
			color: #F2F0E5;
		}
		.block button {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			padding: 0.6rem 1.25rem;
			font-size: 0.9rem;
			border: none;
			border-radius: 6px;
			background: #F2F0E5;
			color: #1C1B1A;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.2s;
		}
		.block button:hover {
			background: #B7B5AC;
		}
		.block button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		h2 {
			font-size: 1.4rem;
			font-weight: 700;
			color: #F2F0E5;
			margin-top: 3rem;
			margin-bottom: 1rem;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid #343331;
		}
		.how-it-works {
			color: #878580;
			line-height: 1.5;
		}
		.how-it-works ol {
			margin-top: 0.75rem;
			padding-left: 1.25rem;
		}
		.how-it-works li {
			margin-top: 0.5rem;
		}
		.how-it-works pre {
			background: #1C1B1A;
			border: 1px solid #343331;
			border-radius: 8px;
			padding: 1rem;
			overflow-x: auto;
			margin-top: 0.75rem;
			font-size: 0.85rem;
			line-height: 1.5;
		}
		.how-it-works code {
			font-family: "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 0.85rem;
			color: #F2F0E5;
		}
		${getFooterCSS()}
		.error {
			margin-top: 1rem;
			padding: 1rem;
			background: #2a1a1a;
			border: 1px solid #5c2a2a;
			border-radius: 6px;
			color: #e5a0a0;
			font-size: 0.85rem;
			display: none;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1><a href="/" style="color: inherit; text-decoration: none;">Defuddle</a> <span style="color: #878580;">Pricing</span></h1>
		<p class="subtitle">1,000 free requests per month. Buy additional requests and use them at your own pace. No subscription required.</p>

		<div class="blocks">
			<a class="block" data-block="1000" href="#" onclick="buyBlock('1000');return false;">
				<div class="block-info">
					<div class="block-name">1,000 requests</div>
					<div class="block-per">$0.005 per request</div>
				</div>
				<div style="display: flex; align-items: center; gap: 1rem;">
					<div class="block-price">$5</div>
					<button type="button" onclick="buyBlock('1000');event.stopPropagation();">Buy</button>
				</div>
			</a>
			<a class="block" data-block="10000" href="#" onclick="buyBlock('10000');return false;">
				<div class="block-info">
					<div class="block-name">10,000 requests</div>
					<div class="block-per">$0.004 per request</div>
				</div>
				<div style="display: flex; align-items: center; gap: 1rem;">
					<div class="block-price">$40</div>
					<button type="button" onclick="buyBlock('10000');event.stopPropagation();">Buy</button>
				</div>
			</a>
			<a class="block" data-block="100000" href="#" onclick="buyBlock('100000');return false;">
				<div class="block-info">
					<div class="block-name">100,000 requests</div>
					<div class="block-per">$0.003 per request</div>
				</div>
				<div style="display: flex; align-items: center; gap: 1rem;">
					<div class="block-price">$300</div>
					<button type="button" onclick="buyBlock('100000');event.stopPropagation();">Buy</button>
				</div>
			</a>
		</div>

		<div class="how-it-works">
			<h2>How it works</h2>
			<ol>
				<li>Buy a block of requests above</li>
				<li>Complete payment to receive your API key</li>
				<li>Add your API key to requests:
<pre><code>curl defuddle.md/example.com?key=df_...

# or with a header
curl -H "Authorization: Bearer df_..." defuddle.md/example.com</code></pre></li>
				<li>Top up anytime — requests never expire</li>
			</ol>
		</div>

		<div class="how-it-works">
			<h2>Check usage</h2>
			<p>Check your remaining requests at any time:</p>
<pre><code>curl -H "Authorization: Bearer YOUR_KEY" defuddle.md/api/keys/usage</code></pre>
<br>
<p>To top up an existing key:</p>
<pre><code>curl -X POST defuddle.md/api/keys/topup \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"block":"10000"}'</code></pre>
		</div>

		<div id="error" class="error"></div>

		${getFooterHTML()}
	</div>
	<script>
		function showError(msg) {
			var el = document.getElementById('error');
			el.textContent = msg;
			el.style.display = 'block';
		}

		function hideError() {
			document.getElementById('error').style.display = 'none';
		}

		async function buyBlock(blockId) {
			hideError();
			var btn = document.querySelector('.block[data-block="' + blockId + '"] button');
			if (btn) { btn.disabled = true; btn.textContent = 'Loading...'; }

			try {
				var res = await fetch('/api/keys', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ block: blockId }),
				});

				var data = await res.json();

				if (!res.ok) {
					throw new Error(data.error || 'Something went wrong');
				}

				// Redirect to Stripe Checkout
				if (data.checkout_url) {
					window.location.href = data.checkout_url;
				}
			} catch (err) {
				showError(err.message);
				if (btn) { btn.disabled = false; btn.textContent = 'Buy'; }
			}
		}

	</script>
</body>
</html>`;
}
