# Order Guard

Independent AI-assisted sample by Mitchell Graham, demonstrating two separate deduplication boundaries: repeated checkout submission and repeated Purchase emission. Not client work or a production WordPress/Meta integration.

Open `index.html` through a local HTTP server. Run `node --test order-guard/model.test.mjs` from the repository root.

State is synthetic and stored in this tab's session storage. No API calls, credentials, personal data, payments, Meta tags or third-party dependencies. The simulated ledger is not a substitute for server-side atomic idempotency, order authorization or reliable event delivery. No cross-device/concurrent-request guarantee.

Production discovery: identify the form and checkout plugin, confirmed order source and conversion definition; inspect all current Pixel/GTM sources; enforce one order per checkout token on the server; route confirmations correctly; gate purchase emission by verified order ID; test genuine second orders as well as repeats. Audit browser/server deduplication separately if CAPI is present.

Reference: [WooCommerce checkout processing](https://developer.woocommerce.com/2022/10/06/how-the-checkout-block-processes-an-order/) — the applicable hooks depend on the checkout implementation.
