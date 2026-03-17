```json
{
  "title": "x402 payments",
  "author": "",
  "site": "Stripe Documentation",
  "published": ""
}
```

## Use x402 for machine-to-machine payments.

x402 is a protocol for internet payments. When a client requests a paid resource, your server returns a `402 Payment Required` response with payment details. The client completes the payment and retries the request with proof of payment.

## Before you begin

- A Stripe account.
- Crypto payins enabled for your account.
- Machine-to-machine payments for x402 enabled.

## Create your endpoint

Add payment middleware to your endpoint so it can accept x402 payments. The middleware handles payment verification and settlement with Stripe per request to `/paid`.

```
import { paymentMiddleware } from "@x402/hono";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";

app.use(
  paymentMiddleware(
    {
      "GET /paid": {
        price: "$0.001",
        network: "base-sepolia",
        config: { description: "Access to paid content" }
      }
    },
    facilitatorClient,
    resourceServer
  )
);
```

## Test your endpoint

Make a request to your server without an existing payment header, and you receive a `402` response with payment requirements.

```
curl http://localhost:3000/paid
```

## Run mainnet transactions

To run mainnet transactions, integrate with the mainnet facilitator and configure your environment for production use.