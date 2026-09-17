import { getDocsLayout } from './docs-layout';
import { renderDocsContent } from './render-docs';

const page = renderDocsContent(`
<h2>Overview</h2>
<p>Defuddle is designed to be privacy-friendly. We collect minimal data and do not track you across the web.</p>

<h2>What we collect</h2>
<p><strong>API requests:</strong> When you use the API, we temporarily process the URL you submit in order to fetch and convert the page. IP addresses are used for rate limiting and stored in monthly rate-limit records that expire at the end of each calendar month.</p>
<p><strong>Server logs:</strong> Standard server logs may include IP addresses, timestamps, and requested URLs. These are used for debugging and abuse prevention and are not shared with third parties.</p>

<h2>What we don't collect</h2>
<ul>
	<li>No cookies or tracking scripts</li>
	<li>No analytics or third-party trackers</li>
	<li>No user accounts or personal information</li>
	<li>No persistent storage of converted content</li>
</ul>

<h2>Data retention</h2>
<p>Converted content is cached temporarily (24 hours or less) to improve performance and is not stored permanently.</p>

<h2>Payments</h2>
<p>If you purchase API keys, payments are processed by <a href="https://stripe.com/privacy">Stripe</a>. We do not store your payment details (credit card number, billing address, etc.) — these are handled entirely by Stripe. The only payment-related data we store is your API key and its remaining request balance.</p>

<h2>Third-party services</h2>
<p>The service is hosted on Cloudflare Workers. Cloudflare may collect standard connection metadata as part of its infrastructure. See <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a> for details.</p>
<p>Payments are processed by Stripe. See <a href="https://stripe.com/privacy">Stripe's privacy policy</a> for details on how they handle payment data.</p>

<h2>Open source</h2>
<p>Defuddle is open source. You can review exactly what the service does by reading the <a href="https://github.com/kepano/defuddle">source code</a>. The npm package and browser extension run entirely locally and make no network requests.</p>

<h2>Changes</h2>
<p>We may update this policy as the service evolves. Changes will be reflected in the "last updated" date below.</p>
`);

export function getPrivacyPage(): string {
	return getDocsLayout({
		id: 'privacy',
		title: 'Privacy Policy',
		updated: 'March 14, 2026',
		...page,
	});
}
