import { getFooterCSS, getFooterHTML } from './footer';

export function getTermsPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Terms of Service — Defuddle</title>
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
			line-height: 1.6;
		}
		.container {
			max-width: 600px;
			width: 100%;
			margin: 0 auto;
			padding: 4rem 2rem;
		}
		h1 {
			font-size: 2rem;
			font-weight: 700;
			margin-bottom: 0.5rem;
			color: #F2F0E5;
		}
		.updated {
			color: #575653;
			margin-bottom: 2rem;
			font-size: 0.9rem;
		}
		h2 {
			font-size: 1.1rem;
			font-weight: 600;
			margin-top: 2rem;
			margin-bottom: 0.5rem;
			color: #F2F0E5;
		}
		p {
			margin-bottom: 1rem;
		}
		ul {
			margin-bottom: 1rem;
			padding-left: 1.5rem;
		}
		li {
			margin-bottom: 0.25rem;
		}
		a {
			color: #B7B5AC;
			text-decoration: underline;
		}
		a:hover {
			color: #F2F0E5;
		}
		.back {
			display: inline-block;
			margin-bottom: 2rem;
			color: #878580;
			text-decoration: none;
			font-size: 0.9rem;
		}
		.back:hover {
			color: #F2F0E5;
		}
		${getFooterCSS()}
	</style>
</head>
<body>
	<div class="container">
		<h1><a href="/" style="color: inherit; text-decoration: none;">Defuddle</a> <span style="color: #878580;">Terms</span></h1>
		<p class="updated">Last updated: March 14, 2026</p>

		<h2>Service</h2>
		<p>Defuddle provides a web content extraction API that converts web pages to clean Markdown. The service is provided as-is, without warranties of any kind.</p>

		<h2>Acceptable use</h2>
		<p>You agree not to use the service to:</p>
		<ul>
			<li>Violate any applicable laws or regulations</li>
			<li>Scrape content in violation of the source website's terms of service</li>
			<li>Overload the service with excessive automated requests</li>
			<li>Attempt to circumvent rate limits or other restrictions</li>
			<li>Redistribute extracted content in ways that violate copyright</li>
		</ul>

		<h2>API keys and payments</h2>
		<p>Defuddle offers paid API keys for higher usage limits. API keys are purchased in request blocks (e.g. 1,000 or 10,000 requests) as one-time payments through Stripe. There are no subscriptions or recurring charges.</p>
		<ul>
			<li>API keys are delivered immediately after payment and are non-transferable</li>
			<li>Purchased request balances do not expire</li>
			<li>All sales are final. No refunds</li>
			<li>You are responsible for keeping your API key secure. We cannot replace keys that are lost or compromised</li>
		</ul>

		<h2>Free tier and rate limits</h2>
		<p>Unauthenticated API requests are rate-limited to 1,000 requests per month per IP address. Exceeding this limit will result in temporary access restrictions. Paid API keys are limited only by their purchased request balance.</p>

		<h2>Availability</h2>
		<p>We make no guarantees about service uptime or availability. The service may be modified, suspended, or discontinued at any time without notice.</p>

		<h2>Content</h2>
		<p>Defuddle processes publicly available web content on your behalf. We do not claim ownership of any content extracted through the service. You are responsible for ensuring your use of extracted content complies with applicable copyright and licensing terms.</p>

		<h2>Limitation of liability</h2>
		<p>To the maximum extent permitted by law, Defuddle and its maintainers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>

		<h2>Changes</h2>
		<p>We may update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>

		${getFooterHTML()}
	</div>
</body>
</html>`;
}
