# food-app

**Khabar** is a food delivery prototype for Bangladesh, built from
[`food_delivery_checkout_recovery_gps_tracking_prd.md`](food_delivery_checkout_recovery_gps_tracking_prd.md).
It covers transparent checkout, safe payment recovery, live GPS tracking, refunds, support, subscriptions,
and safety.

There is no backend, database, or API. All data is plain text in `src/data.ts`, and app state is stored in
the browser's localStorage. Server behaviour (payment verification, order progress, rider GPS, refunds,
support replies) is simulated in `src/actions.ts`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run typecheck
```

## Demo controls

Use the **Demo** button (bottom right) to trigger server-side events: speed up time, cut rider GPS, make
a rider cancel, cause a delay, make the restaurant fail, change a price at submit, send a renewal
reminder, and view the analytics event log. The simulated payment page lets you choose the provider's
outcome (approve, decline, cancel, connection lost, timeout).

## Highlights

- All-in price breakdown, honest promo failure reasons, price-change consent, double-tap protection
- Address search, manual entry, draggable map pin, delivery-zone and address-confidence checks
- Payment state machine with pending/failed/expired recovery and no duplicate charges
- Live tracking with ETA ranges, stale-GPS handling, automatic rider reassignment, proactive delays
- Two-tap issue reporting, refund tracker, human support with context attached
- Plus subscription with explicit consent, reminders, two-tap cancel, and disputes
- Safety centre, Bangla/English, low-data mode, dark mode, keyboard and screen-reader support
- Responsive: phone, tablet, and desktop layouts

## Structure

```
src/
  data.ts        restaurants, menus, places, promos, payment methods, riders
  store.ts       state, persistence, routing, i18n helpers, analytics
  pricing.ts     price quote, promo and Plus evaluation
  actions.ts     simulated backend: orders, payments, tracking, refunds, support
  components/    UI primitives, city map, sheets (help, safety, payment, demo)
  screens/       Home, Restaurant, Checkout, Address, Payment, Tracking, Orders,
                 Issue, Refunds, Support, Plus, Account
```
