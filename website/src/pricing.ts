import { getDocsLayout } from './docs-layout';
import { renderDocsContent } from './render-docs';

const page = renderDocsContent(String.raw`
<h2>Request blocks</h2>
<div class="blocks">
	<div class="block" data-block="1000">
		<div class="block-info">
			<div class="block-name">1,000 requests</div>
			<div class="block-per">$0.005 per request</div>
		</div>
		<div style="display: flex; align-items: center; gap: 1rem;">
			<div class="block-price">$5</div>
			<button class="button button-primary" type="button" onclick="buyBlock('1000');">Buy</button>
		</div>
	</div>
	<div class="block" data-block="10000">
		<div class="block-info">
			<div class="block-name">10,000 requests</div>
			<div class="block-per">$0.004 per request</div>
		</div>
		<div style="display: flex; align-items: center; gap: 1rem;">
			<div class="block-price">$40</div>
			<button class="button button-primary" type="button" onclick="buyBlock('10000');">Buy</button>
		</div>
	</div>
	<div class="block" data-block="100000">
		<div class="block-info">
			<div class="block-name">100,000 requests</div>
			<div class="block-per">$0.003 per request</div>
		</div>
		<div style="display: flex; align-items: center; gap: 1rem;">
			<div class="block-price">$300</div>
			<button class="button button-primary" type="button" onclick="buyBlock('100000');">Buy</button>
		</div>
	</div>
</div>

<div id="error" class="error" role="alert"></div>

	<h2>How it works</h2>
	<ol>
		<li>Buy a block of requests above.</li>
		<li>Complete payment to receive your API key.</li>
		<li>Add your API key to requests:
<pre><code class="language-bash">curl defuddle.md/example.com?key=df_...

# or with a header
curl -H "Authorization: Bearer df_..." defuddle.md/example.com</code></pre></li>
		<li>Top up anytime. Requests never expire.</li>
	</ol>

	<h2>Check usage</h2>
	<p>Check your remaining requests at any time:</p>
<pre><code class="language-bash">curl -H "Authorization: Bearer YOUR_KEY" defuddle.md/api/keys/usage</code></pre>
<p>To top up an existing key:</p>
<pre><code class="language-bash">curl -X POST defuddle.md/api/keys/topup \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"block":"10000"}'</code></pre>
`);

const styles = `
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
	padding: 18px;
	gap: 12px;
	flex-wrap: wrap;
	background: var(--panel);
	border: 0;
	border-radius: var(--radius-panel);
	text-decoration: none;
	color: inherit;
}
.block-info {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}
.block-name {
	font-size: var(--font-size-body);
	font-weight: 500;
	color: var(--paper);
}
.block-per {
	font-size: var(--font-size-small);
	color: var(--muted);
}
.block-price {
	font-size: var(--font-size-heading);
	font-weight: 500;
	color: var(--paper);
}
.error {
	margin-top: 1rem;
	padding: 1rem;
	background: var(--error-background);
	border: 0;
	border-radius: var(--radius-small);
	color: var(--syntax-red);
	font-size: var(--font-size-small);
	display: none;
}
`;

const script = `
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

		if (data.checkout_url) {
			window.location.href = data.checkout_url;
		}
	} catch (err) {
		showError(err.message);
		if (btn) { btn.disabled = false; btn.textContent = 'Buy'; }
	}
}

`;

export function getPricingPage(): string {
	return getDocsLayout({
		id: 'pricing',
		title: 'Pricing',
		description: 'Buy API request blocks for the Defuddle API.',
		intro: '1,000 free requests per month. Buy additional requests and use them at your own pace. No subscription required.',
		...page,
		styles,
		script,
	});
}
