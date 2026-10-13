# USD-only pricing

All markets display the catalog in USD: Natal Dossier $14 one-time; Fair Season Pass $39 for 12 months with manual renewal. `lib/pricing.ts` is the source for prices, UI and checkout verification. `app/product-price.tsx` formats these prices without browser locale, country detection, exchange-rate calls or a currency selector.

The former INR regional catalog, India calculator, currency context/styles and country currency endpoint have been removed. The USD owner cost calculator remains. Old display preferences in browser storage are unused and cannot affect price or checkout. No stored charts, purchased entitlements or customer records were deleted.

Checkout rejects any explicitly supplied currency other than USD; legacy requests omitting currency remain compatible and use server USD prices. Merchant launch gates, signed payment/refund validation and account ownership still apply. Removal of INR does not activate real payments.
