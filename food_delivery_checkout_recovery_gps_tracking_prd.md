# PRD: Food Delivery Checkout Recovery and Live GPS Order Tracking

**Document type:** Product Requirements Document\
**Version:** 1.1\
**Status:** Draft for product, design, engineering, and analytics
review\
**Revision note:** Version 1.1 adds Bangladesh churn research and
retention requirements (26 October 2026).\
**Product:** Consumer food delivery mobile app\
**Primary focus:** Reduce checkout and payment abandonment, reduce
avoidable churn, improve order confidence, and provide reliable live GPS
tracking\
**Market context:** Bangladesh first, with configurable payment methods
and delivery operations

------------------------------------------------------------------------

## 1. Product objective

Deliver a low-friction food ordering journey that helps customers
complete an order confidently, recover from payment issues without
duplicate charges, and track an accepted order from preparation through
delivery.

### Product outcomes

-   Reduce checkout abandonment.
-   Improve payment attempt success and recovery.
-   Reduce uncertainty after placing an order.
-   Make delivery location selection and correction easier.
-   Increase successful order completion and repeat ordering.
-   Make failures explainable and recoverable rather than dead ends.
-   Reduce avoidable churn after service failures, fee surprises,
    subscription disputes, and unreliable delivery.
-   Turn a recovered failure into a reason to order again.

## 2. Scope

### In scope

-   Cart review and transparent price breakdown.
-   Address selection, map pin adjustment, and saved addresses.
-   Checkout validation and delivery instructions.
-   Configurable payment methods and payment status handling.
-   Payment retry and safe recovery from interrupted payment flows.
-   Order confirmation and live GPS delivery tracking.
-   Order status timeline and delivery partner details.
-   Push, SMS, and in-app order updates.
-   Cancellation and support entry points.
-   Event instrumentation, funnel analytics, and experiment flags.
-   Subscription, promotion, refund, and support transparency.
-   Service recovery, order-accuracy, and app-performance requirements.
-   Accessible, responsive, and resilient UI states.

### Out of scope for this release

-   Restaurant partner onboarding and restaurant-side menu management.
-   Rider recruitment, payroll, or fleet planning.
-   Loyalty program redesign.
-   Subscription membership redesign.
-   Full redesign of discovery, search, or restaurant ranking.
-   Predictive delivery-time machine learning unless a reliable baseline
    model already exists.

## 3. Target users

1.  **First-time customer:** Needs clarity about fees, payment, and what
    happens next.
2.  **Returning customer:** Wants a fast checkout using a saved address
    and preferred payment method.
3.  **Payment-interrupted customer:** Needs a clear status and a safe
    way to resume or retry.
4.  **Customer waiting for an order:** Needs accurate order progress,
    rider location when available, and an updated ETA.
5.  **Customer at a complex address:** Needs to place a map pin and add
    useful delivery instructions.
6.  **Churn-risk customer:** Has experienced a late, cold, missing, or
    mispriced order, a refund delay, or an unwanted subscription charge
    and is deciding whether to order again.

## 4. Core user journeys

### Journey A: Place an order

1.  Customer reviews cart.
2.  Customer selects or adds a delivery address.
3.  Customer confirms the map pin and delivery instructions.
4.  Customer reviews item subtotal, delivery fee, service fees,
    discount, and total.
5.  Customer chooses a supported payment method.
6.  Customer places the order.
7.  App shows payment and order status.
8.  On successful confirmation, the app shows the order timeline and
    tracking screen.

### Journey B: Recover from a payment interruption

1.  Payment flow returns a failed, pending, cancelled, or unknown
    result.
2.  App explains the current status in plain language.
3.  App checks the server's transaction status before offering another
    attempt.
4.  If payment is confirmed, the app opens the order confirmation
    screen.
5.  If payment is definitively failed, the customer can retry or choose
    another method.
6.  If status remains pending, the app shows a pending state and
    refreshes status without creating a duplicate order or charge.
7.  Customer can leave the screen and return later to the same order
    status.

### Journey C: Track delivery

1.  Restaurant accepts the order.
2.  App displays preparation status and an estimated delivery time when
    available.
3.  When a delivery partner is assigned, the app shows assignment
    status.
4.  When rider location sharing is active, the map displays the rider's
    latest valid location.
5.  The customer sees an ETA, last-updated indicator, and status
    timeline.
6.  If GPS updates stop, the app preserves the last known status and
    clearly indicates that location is temporarily unavailable.
7.  After delivery, the tracking screen changes to a completed state.

### Journey D: Recover from a bad order and return

1.  Customer experiences a late, cold, missing, wrong, or mispriced
    order, a refund delay, or an unexpected subscription charge.
2.  App acknowledges the specific issue and offers a resolution
    appropriate to it: redelivery, refund, credit, or cancellation.
3.  Customer sees the refund or compensation status, amount, destination,
    and expected date without contacting support.
4.  If support is needed, the customer reaches a human with the order and
    payment context already attached.
5.  App confirms what was resolved and what changed to prevent a repeat.
6.  Customer can reorder with current availability and price, without
    creating a duplicate order or charge.
7.  If the customer disengages, a measured win-back is offered only after
    the original issue is resolved.

------------------------------------------------------------------------

## 5. Feature requirements

Priority labels: **P0** means required for the initial release; **P1**
means high-value follow-up; **P2** means optional enhancement.

Section 8 adds churn-driven requirements F-024 to F-033 after the
core checkout, payment, address, and tracking requirements in this
section.

### 5.1 Cart and checkout

#### F-001: Persistent cart summary --- P0

-   Show selected items, quantities, customizations, and item prices.
-   Allow quantity changes and item removal without losing the rest of
    the cart.
-   Recalculate totals immediately after a cart change.
-   Show a clear path back to the restaurant or menu to edit items.
-   Preserve the cart through temporary navigation away from checkout.
-   If an item becomes unavailable or its price changes, explain the
    issue and require confirmation before proceeding.

#### F-002: Transparent total price --- P0

-   Display item subtotal, delivery fee, service fee, discount, taxes
    where applicable, and final total as separate rows.
-   Show the final payable amount before the primary order action.
-   Present the all-in payable amount as the primary number; do not lead
    with a low item price and reveal fees later.
-   Never present a discount against an inflated reference price. Show
    the effective price and the real saving.
-   Where a restaurant menu price differs from the platform price,
    explain the difference in plain language.
-   Explain eligibility conditions for discounts and minimum-order
    requirements.
-   Never add a fee after the customer has confirmed the order without
    presenting the updated total for confirmation.
-   Revalidate the server-calculated price at order submission.
-   If the price changes, show the difference and request customer
    confirmation.

#### F-003: Checkout progress and primary action --- P0

-   Keep the next action visually prominent and label it with the action
    it performs.
-   Use a persistent bottom action area on small screens where it does
    not obscure content.
-   Prevent repeated submissions while a request is processing.
-   Show a loading state with meaningful text during order creation.
-   Preserve entered information if validation fails.
-   Do not use decorative animation that delays the customer's action.

#### F-004: Checkout field validation --- P0

-   Validate fields inline and near the relevant field.
-   Identify required and optional fields.
-   Explain why a phone number or delivery detail is required when
    relevant.
-   Preserve valid field values after errors.
-   Use specific messages, such as "Choose a delivery address," instead
    of generic "Invalid input."
-   Support Bangla and English copy through localization.

### 5.2 Address selection and location

#### F-005: Address search and autocomplete --- P0

-   Allow customers to search for an address and select a suggested
    result.
-   Support saved addresses such as Home, Work, and Other.
-   Allow manual address entry if search suggestions are unavailable.
-   Display the selected address in a clear confirmation state.
-   Use a configurable maps and places provider.

#### F-006: Map pin confirmation --- P0

-   Display a map with a draggable location pin.
-   Let customers adjust the pin when the written address is imprecise.
-   Reverse-geocode the selected coordinates into a readable address
    when supported.
-   Show the selected delivery point before order placement.
-   Allow delivery notes such as building name, floor, gate, landmark,
    and entry instructions.
-   Warn when the selected location is outside the active delivery zone.
-   Show an address-confidence indicator and require confirmation when the
    pin, building, or street is ambiguous.
-   Keep the confirmed pin and delivery notes visible to the rider, and
    let the customer correct the pin while the order state permits it.
-   Do not silently move a pin based on GPS or geocoding results.

#### F-007: Permission-aware location access --- P0

-   Ask for device location permission only when the customer invokes a
    location-dependent action, such as "Use my current location."
-   Explain why location is requested before triggering the system
    permission prompt.
-   Provide manual address search and pin placement if permission is
    denied.
-   Allow the customer to continue without granting precise device
    location if a valid address can be selected manually.
-   Do not request continuous customer GPS access merely to place an
    order.
-   Keep customer location use limited to the stated product purpose.

### 5.3 Payment and transaction recovery

#### F-008: Payment method selection --- P0

-   Show currently supported payment methods and any relevant
    availability restrictions.
-   Support configuration for cash on delivery, cards, mobile financial
    services, or other locally supported methods as enabled by the
    business.
-   Display payment method fees or restrictions before order
    confirmation.
-   Preserve the selected method when navigating back from a payment
    interruption, unless it becomes unavailable.
-   Do not imply that a payment method is available if the provider has
    disabled it.

#### F-009: Server-verified payment status --- P0

-   Treat the backend's verified transaction state as authoritative.
-   Support distinct states: not started, processing, successful,
    failed, cancelled, pending verification, and expired.
-   Verify provider callbacks and reconcile transaction status
    server-side.
-   Show a clear status label and next action for each state.
-   Do not treat returning to the app from a payment provider as proof
    of success.
-   Ensure the order status and payment status are independently
    represented where needed.

#### F-010: Safe payment retry --- P0

-   Before retrying, query the existing transaction status.
-   Use idempotency keys or equivalent server-side safeguards for order
    creation and payment requests.
-   Prevent double taps from creating duplicate orders.
-   If the original payment is successful, take the customer to the
    existing order rather than starting a new charge.
-   If the result is pending, explain that confirmation is in progress
    and provide a status refresh path.
-   If the transaction definitively failed, offer retry or another
    available method.
-   Record provider error codes for diagnostics without exposing
    sensitive technical details to customers.

#### F-011: Interrupted checkout recovery --- P0

-   Restore the current order or checkout state when the customer
    returns to the app.
-   Display a resumable order status card for unresolved transactions.
-   Avoid creating a second order when the customer reopens the app or
    repeats the last action.
-   Provide a route to support when payment has been deducted but order
    confirmation is missing.
-   Show a reference number or transaction identifier suitable for
    customer support, excluding secrets or sensitive payment data.

#### F-012: Payment failure messaging --- P0

-   Map common provider and validation failures to clear customer-facing
    messages.
-   Distinguish user cancellation, network interruption, provider
    outage, rejected payment, and pending verification when known.
-   Give a specific next step for each recoverable failure.
-   Do not blame the customer for an unknown technical error.
-   Avoid claiming that money was or was not deducted until transaction
    status is verified.

### 5.4 Order confirmation and status

#### F-013: Confirmation screen --- P0

-   Show a unique order number, confirmed payment state, order summary,
    delivery address, and estimated delivery time when available.
-   Provide a direct action to track the order.
-   If the order is accepted but payment verification is pending, show
    the correct pending state rather than a false success message.
-   Make help and cancellation policies discoverable.

#### F-014: Order status timeline --- P0

-   Show relevant statuses such as order placed, restaurant confirmed,
    preparing, rider assigned, picked up, arriving, and delivered.
-   Use server-side order events as the source of truth.
-   Do not display stages that are not applicable to the order.
-   Include event timestamps where useful.
-   Explain delays when the system has a reliable reason and a
    customer-safe message.

------------------------------------------------------------------------

## 6. Live GPS delivery tracking

### 6.1 Feature overview

#### F-015: Live delivery map --- P0

-   Display a map for an active order after a delivery partner has been
    assigned and location sharing is available.
-   Show the customer's delivery point and the delivery partner's latest
    valid location.
-   Display a route or route approximation only when supported by the
    maps provider and operational data.
-   Show a clear delivery partner marker distinct from the destination
    marker.
-   Include a last-updated timestamp or freshness label.
-   Keep the order status timeline and delivery ETA accessible alongside
    the map.
-   Support map loading, unavailable map tiles, missing GPS, and offline
    states.
-   Never fabricate a live rider position or draw a moving marker when
    no fresh location is available.

#### F-016: Rider GPS update pipeline --- P0

-   Rider app sends location updates to the backend only while the rider
    is on an active delivery and the relevant operational policy permits
    it.
-   Backend validates the rider identity, active assignment, timestamp,
    and coordinate ranges.
-   Backend stores the latest valid location and, if required for
    operational troubleshooting, a limited location history under a
    documented retention policy.
-   Customer app retrieves location through an authenticated API or
    authorized real-time channel.
-   Apply rate limits, freshness checks, and stale-location handling.
-   Make update frequency configurable based on movement, network
    conditions, battery impact, and delivery stage.
-   Use secure transport and authenticated access.
-   Do not expose rider location to customers before assignment, after
    delivery completion, or to unrelated customers.
-   Do not show precise rider coordinates in public endpoints or logs
    accessible to unauthorized users.

#### F-017: GPS permission and rider controls --- P0

-   Explain to delivery partners when location sharing is required for
    an active delivery and why.
-   Request only the operating-system permissions needed for the
    supported rider workflow.
-   Handle denied, revoked, approximate, disabled, and unavailable
    location permissions.
-   Show a clear rider-side indication when tracking is active.
-   Provide a recovery path when location permission or GPS is disabled.
-   Follow applicable platform rules and local requirements for
    background location use.
-   Limit tracking to active work purposes and documented operational
    needs.

#### F-018: ETA and location freshness --- P0

-   Display ETA only when a valid estimate is available.
-   Identify the ETA as an estimate rather than a guarantee.
-   Recalculate ETA when new reliable routing or operational information
    becomes available.
-   Avoid rapid, confusing ETA changes by applying sensible update and
    display rules.
-   When GPS data becomes stale, show "Location update delayed" or
    equivalent and retain the last known status.
-   Fall back to order stage and support options if a live ETA cannot be
    calculated.

#### F-019: Tracking fallback states --- P0

-   **Rider not assigned:** Show preparation and assignment status
    without implying that a rider is already moving.
-   **GPS unavailable:** Show the latest order stage and explain that
    live location is temporarily unavailable.
-   **Weak network:** Keep the last known state and refresh when
    connectivity returns.
-   **App reopened:** Fetch the latest authoritative order and tracking
    state.
-   **Order completed:** Stop live tracking and show delivery completion
    details.
-   **Order cancelled:** Stop customer-facing live tracking and show
    cancellation information.
-   **Tracking service outage:** Keep the order status and support
    actions available.

#### F-020: Rider contact and delivery instructions --- P1

-   Provide approved call or masked-contact options where available.
-   Provide in-app chat as an alternative to a phone call where
    operationally supported.
-   Show delivery instructions to the rider through authorized channels.
-   Support proof of delivery, such as a photo, OTP, or customer
    confirmation, and a tamper-evident handoff where available.
-   Avoid exposing personal phone numbers unnecessarily.
-   Keep contact actions subject to operational policies and privacy
    rules.

### 6.2 GPS privacy and access controls

-   Request customer location permission only for a user-initiated
    location feature.
-   Use rider location only for an active assigned delivery and other
    explicitly documented operational purposes.
-   Enforce order-based authorization so a customer can access only
    their own order and the assigned rider's permitted tracking
    information.
-   Stop customer access to precise live rider location when the
    delivery is completed, cancelled, or reassigned.
-   Define and document location-history retention and deletion rules.
-   Encrypt location data in transit and protect it at rest.
-   Restrict internal access to location history by role and audit
    sensitive access.
-   Avoid collecting background customer location for marketing or
    unrelated analytics.
-   Explain location use in the privacy notice and relevant permission
    prompts.

------------------------------------------------------------------------

## 7. Support and recovery features

#### F-021: Order help entry point --- P0

-   Make help available from checkout, payment pending, confirmation,
    and active tracking screens.
-   Offer issue categories such as payment deducted but order missing,
    duplicate charge concern, order delayed, wrong address, rider
    contact problem, refund status, subscription or billing dispute, and
    promotion not applied.
-   Attach the order reference and relevant non-sensitive status data to
    a support request.
-   Offer a human escalation path with the order and payment context
    already attached; do not dead-end the customer in an automated
    chatbot.
-   Do not attach full card details, authentication secrets, or
    unnecessary precise location history.

#### F-022: Cancellation and address correction --- P1

-   Show cancellation eligibility and applicable consequences before
    confirmation.
-   Provide address correction only while the order's operational state
    permits it.
-   Explain when an address change is no longer available and provide
    the next support option.
-   When an order is cancelled, show the reason, refund or compensation
    status, and what happens next without requiring a support contact.
-   Recalculate fees or ETA where a permitted change affects them, and
    request confirmation where needed.

#### F-023: Reorder and recovery entry points --- P1

-   Allow customers to retry an interrupted order from the order history
    when business rules permit.
-   Reuse prior cart items only after checking current availability and
    price.
-   Clearly identify unavailable items and updated prices.
-   Revalidate availability and price before reorder, and never
    automatically resubmit a failed, pending, or completed payment
    transaction as a new order.

------------------------------------------------------------------------

## 8. Bangladesh churn research and retention requirements

### 8.1 Why churn needs its own requirements

The original scope optimises the path to a completed order and a tracked
delivery. Bangladesh evidence shows that customers often leave after the
order, not before it: a late or cold meal, a missing item, a rider
cancellation, a delayed refund, an unexpected subscription renewal, or a
fee that appears at payment can end the relationship. Discounts acquire
trials; reliability and recovery retain customers.

This section adds a Bangladesh-specific churn lens, a problem-to-solution
map, and the requirements that follow from it. The existing checkout,
payment, address, and tracking requirements remain the foundation.

### 8.2 Evidence base and limits

Desk research was conducted on 26 October 2026 using:

-   Bangladesh media reporting from 2023-2026, including The Business
    Standard, The Daily Star, New Age, Bangladesh Pratidin, and The Daily
    Observer.
-   Public complaint and review sources, including PissedConsumer,
    Trustpilot, JustUseApp, Reddit r/Dhaka, and LinkedIn customer posts.
-   Bangladesh-specific surveys and theses: a 2025 IUT super-app survey
    (300 respondents), a 2026 IJFMR Foodpanda user study in Dhaka, a 2023
    UTAUT2 continuance study, and a 2025 Pathao user survey (100+
    responses).
-   Company terms, help-centre pages, and market reporting.

Limits:

-   Public reviews are self-selected and over-represent severe failures.
    They show failure modes, not prevalence.
-   Student and convenience samples are not representative of the
    national customer base.
-   Market-share estimates vary by source and should be treated as
    directional.
-   A 2026 Dhaka Foodpanda survey reported 94.4% overall satisfaction and
    a strong delivery-speed correlation, while public complaint data
    shows severe outliers. Both can be true; measure the failure tail as
    well as the average.
-   Findings must be validated with first-party cohort, cancellation,
    refund, and support data before targets are set.

### 8.3 What the evidence shows

| Churn driver | What customers report in Bangladesh | Product response |
|---|---|---|
| Fee and price surprises | Foodpanda customers report platform food prices 25%-30% above restaurant menus; complaints cite platform fees, inflated discounts, and PandaPro benefits that do not apply (The Business Standard, 2026; Reddit and LinkedIn, 2025-2026). Pathao customers report free-delivery promises that fail at checkout or are cancelled by restaurants (JustUseApp reviews, 2026). | Show the all-in price before payment, use honest reference prices, disclose promo eligibility, and never add a fee after confirmation. F-002, F-024. |
| Subscription billing | PandaPro users report auto-renewal without reminders, hard-to-find cancellation, charges after opting out, and paid benefits that do not apply (PissedConsumer, 2026; LinkedIn, 2025-2026; Reddit, 2025). | Require explicit opt-in, send pre-renewal reminders, provide one-tap cancellation, verify benefit eligibility at checkout, and offer a dispute path. F-025. |
| Late, cold, wrong, or missing orders | Foodpanda customers report late deliveries, incorrect or incomplete orders, sudden cancellations, and delayed refunds (The Daily Observer, October 2026). Pathao customers report two-hour delays, cold food, wrong orders, and no refund response (Bangladesh Pratidin, November 2025). | Send proactive delay notices, verify order accuracy, offer two-tap issue reporting, and resolve automatically. F-028, F-030. |
| Rider cancellation and reassignment | Pathao riders accept without seeing the full location, then cancel because of distance, low fee, or restaurant delay; customers report reordering three or four times and receiving no cancellation notification (JustUseApp reviews, 2026). | Show zone, distance, earnings, and prep status before acceptance; reassign automatically without a customer reorder; notify and update the ETA. F-029. |
| Refund and support failure | Foodpanda complaints cite unanswered refunds, 14+ working days without credit, and support that is hard to reach (PissedConsumer, 2026). Pathao customers report no refund response and support unavailable at night (Bangladesh Pratidin, 2025; JustUseApp, 2026). | Provide a refund tracker with an expected date, self-serve resolution, human escalation, and service-hours coverage. F-026, F-027. |
| App instability and performance | Pathao suffered a multi-hour outage affecting rides and food on 4 October 2026 (New Age). Users report crashes, freezing, promo failures, payment glitches, and unreliable location detection (Pathao user survey, 2025; JustUseApp, 2026). | Set performance budgets, monitor crashes, make checkout offline-tolerant, retry with idempotency, and offer a low-data mode. F-031. |
| Address and map friction | Customers report inaccurate pins, poor search, riders unable to find locations, and forced location permission (JustUseApp, 2026). | Add address confidence, landmark and floor fields, rider-visible notes, pin correction, and a manual fallback. F-005, F-006, F-031. |
| Restaurant supply and availability | At least 120 Chattogram restaurants boycotted Foodpanda over commissions and fees of up to 35%, delayed payments, and penalties; around 700-800 riders were affected (The Business Standard, October 2026). Customers also report unavailable menu items and restaurant-side cancellations (JustUseApp, 2026). | Keep availability accurate, show coverage clearly, offer alternatives when supply is unavailable, and cancel with an automatic refund when fulfilment is impossible. F-024, F-028. |
| Discount-led acquisition without retention | Bangladeshi middle-class customers churned when launch discounts and free delivery ended; Pathao's relative restraint on discounts was cited as a retention advantage (The Business Standard, 2023). A 2025 IUT survey found reliability was the top loyalty motivator, ahead of faster service and cashback. | Build reliability-first retention, communicate honest value, and avoid dependence on permanent discounts. F-024, F-032. |
| Trust, safety, and privacy | Customers report rider misconduct, data-misuse concerns, and safety fears; a 2025 IUT survey found security concerns were the most common reason for abandoning a super app. | Verify riders, mask contact details, provide SOS and reporting, limit location use, and explain data sharing. F-033. |
| Low switching costs and rising competition | Foodpanda remains the leader at roughly 50%-60% share, but Foodi reached about 30% and second place by 2026, with 27 districts and roughly 9-10 lakh orders per month; Pathao Food is third (The Business Standard, March 2026). | Win the second order through reliability and recovery, not only acquisition discounts. F-032, F-033. |

Additional survey signals:

-   The 2025 IUT survey of 300 super-app users found that 40.08% cited
    long delivery or wait times, 18.75% cited app crashes or freezing, and
    76.54% had experienced at least one serious issue. Reliability was
    the top loyalty motivator (26.74%), followed by faster service
    (19.68%) and loyalty points or cashback (14.02%). About 79.77% would
    prefer one super app only if it works consistently.
-   The 2025 Pathao survey of 100+ users found an average trust score of
    2.9 out of 5. Common issues were delays, app crashes, promotion
    failures, payment glitches, and unreliable location detection. Users
    asked for an SOS button, transparent pricing, proactive delay alerts,
    parcel insurance, and a lighter, more stable app.
-   The 2026 IJFMR study of Foodpanda users in Dhaka found cash on
    delivery was the dominant payment choice (75%), followed by mobile
    financial services (33.3%). Respondents asked for better customer
    support and more consistent food quality. This was a small
    convenience sample; payment shares are directional.
-   PissedConsumer showed Foodpanda Bangladesh at 1.7 out of 5 from 218
    reviews when accessed in October 2026; Trustpilot showed 2.0 out of 5
    from 10 reviews. Refunds, billing disputes, support failures, rider
    misconduct, late or undelivered orders, high prices, and subscription
    charges dominated the complaints. Review-site bias applies.

### 8.4 Churn archetypes to design for

| Archetype | Primary trigger | What retains them |
|---|---|---|
| Price-sensitive switcher | Fees appear late, discounts shrink, or a promo fails | Honest all-in pricing, working promos, clear value, no subscription traps |
| Quality-sensitive repeat customer | One late, cold, wrong, or missing order | Accurate ETA, order-accuracy checks, fast recovery, a reason to trust the next order |
| Support-frustrated customer | A refund or billing issue takes too long | Refund tracker, human escalation, response-time commitments, closure |
| App-fatigued customer | Crashes, slow screens, payment or promo glitches | Performance budgets, low-data mode, offline tolerance, reliable retries |
| Address-anxious customer | Rider cannot find the address, or the pin is ambiguous | Address confidence, notes, pin correction, rider communication |
| Trust-sensitive customer | Harassment, rider conduct, privacy concerns | Verified riders, masked contact, SOS and reporting, location limits |
| Supply-constrained customer | Favourite restaurant is unavailable or boycotting | Accurate availability, coverage clarity, alternatives, proactive refunds |
| Subscription-trapped customer | Unwanted renewal or benefits that do not apply | Renewal reminders, one-tap cancel, benefit verification, dispute path |

### 8.5 Retention principles

-   Reliability beats discounts. Price gets the first order; reliability
    gets the second.
-   Every failure needs a visible next step and an owner.
-   Never surprise the customer with money. Show the all-in price,
    renewal charge, and refund status before the customer has to ask.
-   Recover in the same session. Do not make the customer re-order or
    chase support for a failure the platform can see.
-   Design for Bangladesh's constraints: low-end Android devices, weak
    networks, Bangla and English, cash on delivery and mobile financial
    services, and complex addresses.
-   Measure repeat orders and downstream retention, not clicks, promo
    redemptions, or first-order conversion alone.
-   Close the loop. Tell the customer what was resolved and what changed.

### 8.6 New and strengthened feature requirements

These requirements extend Section 5 and are numbered sequentially after
F-023. They address the churn drivers identified in Section 8.3 and should
be planned with the same design, engineering, and analytics rigor as the
core checkout and tracking requirements.

#### F-024: All-in price and honest discounts --- P0

-   Show item subtotal, delivery fee, platform or service fee,
    small-order fee, taxes, tip, discount, and final payable amount
    before payment.
-   Make the final payable amount the primary number; do not lead with an
    artificially low item price.
-   Never show a discount against an inflated reference price. Show the
    effective price and the real saving.
-   Where a restaurant menu price differs from the platform price,
    explain the difference in plain language.
-   Show minimum-order, discount eligibility, exclusions, and expiry
    before checkout.
-   If the price changes after the cart or at submission, show the old
    and new amounts and require explicit consent.
-   Lock the confirmed price; do not add a fee after confirmation without
    consent.
-   If a promotion fails, show a specific reason and the best eligible
    alternative; never silently drop the promotion.
-   Acceptance: the customer can explain the total; no fee appears after
    confirmation; a failed promotion has a specific reason.

#### F-025: Subscription transparency and control --- P0

-   Before opt-in, show the price, billing cycle, next charge date,
    payment method, benefits, exclusions, and cancellation path.
-   Use explicit opt-in with no pre-checked box; do not bundle a
    subscription with the order button.
-   Send renewal reminders at 48 hours and 24 hours before the charge via
    push, SMS, or email, including the amount and a cancellation link.
-   Provide one-tap cancellation in the app and on the web; confirm
    immediately with the effective date and do not create a retention
    maze.
-   Show whether the current cart actually receives free delivery or
    other benefits, and explain exclusions.
-   If a charge is disputed, open a case, stop future renewals
    immediately, and show the refund status.
-   Do not advertise "free delivery" if platform or service fees still
    apply; show the net saving.
-   Acceptance: no renewal without prior notice; cancellation takes two
    taps or fewer; benefit status is visible at checkout.

#### F-026: Refund status and self-serve resolution --- P0

-   Give every refund a reference and a timeline: requested, approved,
    processing, credited, or failed.
-   Show the amount, destination, expected date, and next step, and
    update the status proactively.
-   Auto-initiate refunds for cancelled, unfulfilled, duplicate, or
    overcharged orders.
-   Let customers choose the refund destination where policy permits, and
    explain speed and limitations.
-   For missing, wrong, cold, late, or damaged orders, offer a two-tap
    resolution: redelivery, partial or full refund, or credit.
-   If a refund is late, escalate automatically and notify the customer;
    do not require another support ticket.
-   Acceptance: refund status is visible without contacting support; an
    expected date is shown; there is no dead end.

#### F-027: Human support escalation and response commitments --- P0

-   Attach order, payment, delivery, and prior-contact context
    automatically to every support contact.
-   Show the current channel, wait time, and first-response target: two
    minutes or less in chat during service hours, and 24 hours or less
    for email.
-   Allow human escalation from any automated flow; do not trap the
    customer in an infinite chatbot loop.
-   Support Bangla and English, and offer a callback for urgent payment
    or refund issues.
-   Cover late-night active-delivery emergencies; at minimum, provide a
    safety and payment escalation path.
-   Give agents resolution authority for refunds, credits, redelivery,
    and reassignment, with clear limits.
-   Send a closure summary and a one-tap "issue resolved?" check.
-   Acceptance: a human is reachable in three steps or fewer; the
    response target is visible; unresolved cases escalate automatically.

#### F-028: Proactive delay and exception communication --- P0

-   Detect delay risk from assignment, restaurant preparation, rider
    movement, traffic, weather, and service incidents.
-   Notify the customer before the original ETA is missed, with a
    reliable reason where known, a revised ETA range, and the next action.
-   Use ETA ranges rather than false precision, and update only when the
    change is meaningful.
-   If a delay exceeds the policy threshold, offer compensation
    automatically; do not wait for a complaint.
-   If fulfilment is impossible, cancel proactively, refund
    automatically, and suggest alternatives.
-   Include "what happens next" and a support action in every exception
    state.
-   Acceptance: the customer hears about a delay before the ETA passes;
    the revised ETA is visible; compensation is automatic.

#### F-029: Rider assignment reliability and automatic reassignment --- P0

-   Show pickup and dropoff zone, distance, estimated earnings, and
    restaurant preparation status before a rider accepts.
-   If a rider cancels after accepting, automatically reassign the order
    without the customer reordering or paying again.
-   If no rider accepts within the service-level target, increase the
    incentive, widen the radius, or cancel with an automatic refund and
    alternatives.
-   Notify the customer of the reassignment and revised ETA, and preserve
    the order and payment state.
-   Track rider cancellation rate, act operationally, and prioritise
    reliable riders.
-   Do not show "rider assigned" until the assignment is confirmed and
    the rider is en route to pickup.
-   Acceptance: the customer never has to place the same order again
    because a rider cancelled; reassignment is automatic; the ETA updates.

#### F-030: Order accuracy and quality assurance --- P0

-   Use a merchant checklist and sealed-bag confirmation before
    dispatch, with photo evidence where feasible.
-   Show item count and customisations to the merchant and rider, and
    require confirmation for missing items.
-   Provide two-tap customer issue reporting with a photo and a category:
    missing, wrong, cold, damaged, or late.
-   Offer redelivery, partial or full refund, or credit; make low-value
    claims instant within policy.
-   Track accuracy by restaurant and rider, flag repeat issues, and feed
    the results into quality scores.
-   Provide handling and temperature guidance, and require insulated bags
    where appropriate.
-   Acceptance: an accuracy issue can be reported in three taps or
    fewer; a resolution is offered without support; accuracy is measured.

#### F-031: App performance and low-end device resilience --- P0

-   Set targets: crash-free sessions at 99.5% or higher; cold start at
    2.5 seconds or less on a defined mid-range Android device; key
    screens interactive within two seconds on 3G or 4G; a defined app-size
    and data budget.
-   Support low-RAM and low-storage devices; lazy-load images and avoid
    heavy animation.
-   Make cart and checkout offline-tolerant: preserve state, queue
    actions, retry with idempotency, and show saved or will-retry states.
-   Make payment and promotion validation resilient to network drops;
    never charge twice, and reconcile on reconnect.
-   Allow Bangla and English switching without a restart, with font
    fallback and layout resilience.
-   Monitor crashes, ANRs, API latency, promotion and payment failures by
    device, network, and OS, and alert on regressions.
-   Acceptance: the core flow works on the defined low-end profile; app
    kill does not lose checkout state; the crash-free target is met.

#### F-032: Retention and service-recovery loop --- P1

-   Run a post-order CSAT or NPS micro-survey and trigger recovery for
    detractors.
-   Identify churn-risk signals: repeated late, cold, or wrong orders;
    refund delays; support contacts; failed payments; subscription
    disputes; app crashes.
-   Use personalised service recovery, such as an apology plus credit or
    voucher, rather than a generic discount blast.
-   Reorder with a live availability and price check; warn about
    unavailable items; never automatically resubmit a pending payment.
-   Win back after resolution with a "what changed" message, and measure
    reactivation.
-   Segment experiments by churn archetype and guardrail refunds and
    duplicate charges.
-   Acceptance: churn-risk customers are identifiable; recovery is
    measured; reorder is safe.

#### F-033: Trust and safety center --- P0

-   Show verified rider identity and photo, mask calls, provide in-app
    chat, and allow the customer to share delivery status with a trusted
    contact.
-   Provide SOS and rider or harassment reporting from an active order,
    with 24/7 safety escalation.
-   Collect rider conduct ratings and reports, and block matching after
    credible reports.
-   Provide privacy controls: permission rationale, location use only
    while ordering, no background customer location, and access or
    deletion requests.
-   Offer handoff options such as meet at door, hand to me, or leave at
    door with a photo, and use tamper-evident packaging where available.
-   Explain data sharing in Bangla and English and show what the rider
    can see.
-   Acceptance: a safety report is reachable in two taps; masked contact
    works; customer location is not tracked after completion.

### 8.7 Churn measurement and experiments

-   Define churn as no order in 30, 60, or 90 days after a completed
    order. Separate voluntary churn from involuntary churn caused by
    payment failure, coverage gaps, restaurant unavailability, or app
    failure.
-   Track first-order-to-second-order conversion and cohort retention by
    city or zone, payment method, device tier, language, acquisition
    channel, and first-order outcome.
-   Use leading indicators: late, cold, or wrong orders; rider
    cancellation; refund resolution time; support contacts; promotion
    failure; subscription dispute; crash or ANR; ETA error.
-   Primary retention metrics: 30, 60, and 90-day repeat order rate;
    voluntary and involuntary churn rate; recovery rate after a service
    failure; refund resolution time; support CSAT; win-back reactivation.
-   Experiment with reliability versus discount, proactive delay alerts,
    automatic reassignment, refund tracking, subscription reminders, and
    accuracy checklists. Measure repeat orders and guardrails, not just
    conversion.
-   Guardrails: duplicate charges, refund rate, support backlog, rider
    supply, restaurant cancellations, and margin.
-   Do not declare success from promotion redemption, click-through, or
    first-order conversion alone.

### 8.8 What not to conclude

-   Public complaints are not prevalence data.
-   Market-share estimates vary and should not be treated as audited.
-   A high satisfaction average can coexist with a damaging failure tail.
-   Discounts can buy trials but not loyalty.
-   Validate every intervention with first-party data before setting
    targets or rolling out broadly.

------------------------------------------------------------------------

## 9. UI and interaction requirements

The design should feel modern, calm, fast, and trustworthy without
copying any reference brand.

### Design direction

-   Use a clear typographic hierarchy, generous but efficient spacing,
    strong contrast, and deliberate use of color.
-   Keep the checkout focused on completing the order rather than
    promotional content.
-   Make price, delivery address, payment state, and the next action
    easy to scan.
-   Use restrained motion only to communicate a state change or confirm
    an action.
-   Provide purposeful loading, empty, error, pending, and success
    states.
-   Use real product content and realistic order examples in prototypes.
-   Maintain consistent components and design tokens across checkout,
    payment, and tracking.
-   Support mobile-first layouts and larger screens where applicable.
-   Support keyboard navigation, visible focus, screen-reader labels,
    and reduced-motion preferences.
-   Avoid generic gradients, excessive glass effects, and decorative
    animation that competes with task completion.
-   Never use dark patterns for fees, subscriptions, cancellations, or
    refunds. The customer must be able to see the cost, the commitment,
    and the exit before acting.

### Reference-inspired principles

-   **Claude / Anthropic design guidance:** intentional visual
    direction, a reusable design system, iterative critique, and
    specific, helpful interface copy. Reference:
    https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
-   **MasterClass:** use the general lesson of strong visual hierarchy
    and high-quality editorial presentation where food discovery or
    restaurant storytelling needs richer imagery. Do not copy its
    layouts or assets. Reference: https://www.masterclass.com/
-   **Framer:** use the general lesson of responsive composition,
    polished interactions, and fast iteration from prototypes. Do not
    copy its templates or branding. Reference: https://www.framer.com/
-   **Checkout UX research:** prioritize transparent costs,
    understandable forms, and error messages that match the specific
    problem. Reference:
    https://baymard.com/research-articles/current-state-of-checkout-ux
-   **Address entry guidance:** use address autocomplete and visual
    location confirmation to reduce typing and address errors where
    supported. Reference:
    https://developers.google.com/maps/architecture/checkout

### Suggested screen structure

#### Checkout screen

1.  Compact order summary with edit controls.
2.  Delivery address row with map pin confirmation.
3.  Delivery instructions field.
4.  Item subtotal and itemized fees.
5.  Discount entry and applied discount state.
6.  Payment method selector.
7.  Final total and one prominent order action.
8.  Contextual validation and support links.

#### Payment pending or failure screen

1.  Clear status icon and plain-language headline.
2.  Amount and order reference where available.
3.  Explanation of the verified state.
4.  Primary next action appropriate to the state.
5.  Secondary action to check status or contact support.
6.  No ambiguous "Try again" action while the previous transaction
    remains unresolved.

#### Live tracking screen

1.  Map as the primary visual area.
2.  Rider marker and delivery destination when live location is
    available.
3.  ETA with estimate label and freshness indicator.
4.  Order status timeline.
5.  Restaurant and rider details appropriate to the current stage.
6.  Delivery instructions and contact action where available.
7.  Help entry point.
8.  Clear fallback state when location or map service is unavailable.

#### Refund and issue resolution screen

1.  Plain-language issue summary and the order reference.
2.  Resolution choices with amounts and expected timing.
3.  Refund or compensation timeline with the current step highlighted.
4.  Expected credit date and destination.
5.  Support escalation action with order context attached.
6.  No dead end: every state names the next step or the owner.

#### Subscription management screen

1.  Current plan, price, billing cycle, and next charge date.
2.  Benefits used and remaining, plus what is excluded.
3.  Whether the current cart actually receives the advertised benefit.
4.  One-tap cancel with an immediate confirmation and effective date.
5.  Billing history and a dispute action for unexpected charges.
6.  No pre-checked consent, hidden renewal, or cancellation maze.

#### Delay and reassignment screen

1.  Revised ETA range and the reason for the change where reliable.
2.  Current order stage and what happens next.
3.  Automatic compensation, if applicable, without a support request.
4.  New rider assignment state when the order is reassigned.
5.  Support and cancellation actions appropriate to the stage.
6.  No claim that a rider is moving when no fresh location is available.

------------------------------------------------------------------------

## 10. Analytics and event instrumentation

All events should include a timestamp, app version, platform, anonymous
or pseudonymous user identifier, session identifier, and relevant order
or checkout identifier. Minimize personal data and never include payment
secrets.

### Required events

-   `cart_viewed`
-   `cart_item_updated`
-   `checkout_started`
-   `address_selection_started`
-   `address_selected`
-   `map_pin_adjusted`
-   `delivery_instructions_added`
-   `price_breakdown_viewed`
-   `payment_method_selected`
-   `order_submit_started`
-   `order_submit_succeeded`
-   `order_submit_failed`
-   `payment_attempt_started`
-   `payment_status_pending`
-   `payment_succeeded`
-   `payment_failed`
-   `payment_retry_started`
-   `order_confirmation_viewed`
-   `rider_assigned`
-   `tracking_screen_viewed`
-   `rider_location_received`
-   `rider_location_stale`
-   `tracking_unavailable`
-   `support_entry_opened`
-   `order_cancelled`
-   `order_delivered`
-   `checkout_abandoned`
-   `promo_apply_failed`
-   `subscription_viewed`
-   `subscription_renewal_reminder_viewed`
-   `subscription_cancelled`
-   `subscription_dispute_opened`
-   `refund_requested`
-   `refund_status_viewed`
-   `refund_completed`
-   `support_chat_opened`
-   `support_human_escalated`
-   `support_first_response`
-   `support_resolved`
-   `rider_reassigned`
-   `order_late`
-   `order_accuracy_issue_reported`
-   `order_accuracy_resolved`
-   `delivery_eta_changed`
-   `reorder_started`
-   `reorder_blocked_unavailable`
-   `csat_submitted`
-   `winback_offer_viewed`
-   `winback_activated`
-   `trust_safety_report_opened`
-   `location_permission_denied`

App crash, ANR, and API latency are reliability telemetry rather than
general-purpose product analytics. Connect them to the order and session
identifiers where privacy-safe so churn analysis can link a failed session
to a failed order.

### Retention analytics

-   Build a churn-reason taxonomy: price or fees, late or cold food,
    wrong or missing items, refund or support, rider cancellation, app
    failure, address, coverage or supply, subscription, trust or safety,
    and other.
-   Cohort customers by first-order outcome, city or zone, payment method,
    device tier, language, and acquisition channel.
-   Link service failures to subsequent ordering behaviour without
    exposing payment secrets or precise location.
-   Measure recovery: customers who experienced a failure and ordered
    again after a resolution versus those who did not.
-   Keep support transcripts, subscription billing data, and precise
    location in access-controlled systems, not general analytics.

### Analytics safeguards

-   Do not send exact GPS coordinates to general-purpose product
    analytics unless explicitly justified and access-controlled.
-   Prefer coarse location or delivery-zone identifiers for funnel
    analysis.
-   Keep payment provider error codes in restricted operational
    telemetry.
-   Exclude authentication secrets and full payment instrument details.
-   Define one canonical event specification and validate event delivery
    before running experiments.

------------------------------------------------------------------------

## 11. Success metrics

### Primary metrics

-   Checkout completion rate: confirmed orders divided by eligible
    checkout starts.
-   Payment success rate: confirmed successful payment attempts divided
    by eligible payment attempts, segmented by payment method and
    provider.
-   Payment recovery rate: failed or interrupted eligible payment
    sessions that later reach a confirmed valid payment.
-   Duplicate-charge and duplicate-order incident rate.
-   Successful delivery rate for accepted orders.

### Retention metrics

-   30, 60, and 90-day repeat order rate.
-   Voluntary and involuntary churn rate, with the churn-reason
    taxonomy from Section 8.7.
-   First-order-to-second-order conversion rate.
-   Service-failure recovery rate: customers who experienced a failure
    and ordered again after a resolution.
-   Refund resolution time and the percentage of refunds completed within
    the promised window.
-   Support first-response time, resolution time, and CSAT.
-   Win-back reactivation rate after a resolved failure.

### Supporting metrics

-   Checkout step drop-off.
-   Time from checkout start to confirmed order.
-   Address correction rate.
-   Payment pending duration.
-   Percentage of active deliveries with fresh GPS data.
-   Tracking screen availability.
-   ETA error, where a reliable actual-delivery timestamp and ETA
    history are available.
-   Late delivery rate and average delay.
-   Order accuracy rate, including missing, wrong, cold, and damaged
    items.
-   Rider cancellation and reassignment rate.
-   Promotion application failure rate.
-   Subscription renewal notice delivery, cancellation, and dispute
    rates.
-   App crash-free session rate and ANR rate.
-   Customer support contact rate per 1,000 orders.
-   Customer effort score for refunds and support.
-   Cancellation rate and refund rate by reason.
-   Repeat purchase rate.

### Measurement requirements

-   Establish a baseline before making changes.
-   Segment results by platform, app version, payment method, new versus
    returning customers, relevant delivery zones, first-order outcome,
    device tier, language, and acquisition channel.
-   Use controlled experiments for UI changes when feasible.
-   Monitor guardrails such as duplicate charges, payment disputes,
    cancellations, refunds, crashes, support backlog, rider supply,
    restaurant cancellations, and margin.
-   Do not declare success from click-through rate, promotion redemption,
    or first-order conversion alone; confirm repeat order behaviour and
    the downstream order outcome.

------------------------------------------------------------------------

## 12. Functional acceptance criteria

### Checkout and payment

-   A customer can review the full payable amount before confirming an
    order.
-   Invalid or missing fields show a specific error without clearing
    valid fields.
-   Repeated taps do not create duplicate orders.
-   Returning from a payment provider does not by itself mark a
    transaction successful.
-   A successful existing transaction is recovered rather than charged
    again.
-   A pending transaction remains visibly pending until the backend
    confirms its outcome.
-   A failed transaction provides an appropriate retry, alternate
    method, or support action.
-   An interrupted app session can recover the correct order state.

### Address and GPS

-   A customer can select a saved address, search for an address, or
    adjust a map pin.
-   Denying device location permission does not block manual address
    entry.
-   A customer can verify the delivery location before order submission.
-   A customer cannot access another customer's order or unrelated rider
    location.
-   Live rider location appears only for the relevant active order and
    when valid location data is available.
-   Stale GPS data is clearly marked; the UI never presents it as live.
-   Live tracking stops when the order reaches a terminal state or the
    rider is no longer assigned.
-   The tracking experience remains useful when maps or GPS are
    unavailable.

### Churn and retention

-   The customer sees the all-in payable amount before payment, and no
    fee appears after confirmation without consent.
-   A promotion failure shows a specific reason and a recoverable next
    step.
-   A subscription shows its price, renewal date, and benefits before
    opt-in; a renewal reminder is sent before the charge; cancellation
    takes two taps or fewer.
-   A refund shows its status, amount, destination, and expected date
    without a support contact.
-   A customer can reach a human support agent in three steps or fewer,
    with order and payment context attached.
-   If a rider cancels after accepting, the order is automatically
    reassigned and the customer does not reorder or pay again.
-   A delay is communicated before the original ETA passes, with a
    revised ETA and any automatic compensation.
-   A missing, wrong, cold, or damaged order can be reported in three
    taps or fewer and receives a resolution without support.
-   The core checkout and tracking flow works on a defined low-end
    Android device and weak network without losing state.
-   A safety or privacy issue can be reported in two taps or fewer, and
    masked contact works.

### UI and accessibility

-   Primary actions have clear labels.
-   Loading, success, pending, empty, and error states are designed and
    tested.
-   Touch targets, contrast, keyboard focus, and screen-reader labels
    meet the product's accessibility standard.
-   Reduced-motion settings are respected.
-   Bangla and English text do not break the layout.

------------------------------------------------------------------------

## 13. Dependencies

-   Order management backend.
-   Payment provider integration and verified transaction-status API.
-   Idempotent order creation and transaction reconciliation.
-   Restaurant acceptance and preparation status events.
-   Rider assignment and delivery partner app.
-   Rider GPS permission and location update pipeline.
-   Maps, routing, geocoding, and address autocomplete provider.
-   Push notification and SMS service.
-   Customer support system with order context, response targets, and
    human escalation.
-   Subscription billing, renewal reminders, and cancellation service.
-   Refund reconciliation across cards, mobile financial services, and
    wallets, with an auditable status feed.
-   Rider dispatch and reassignment service with cancellation tracking.
-   Merchant availability, packaging, and order-accuracy tooling.
-   App performance, crash, ANR, and network telemetry.
-   Churn cohort analytics and experimentation capability.
-   Trust and safety operations, masked communications, and audit logging.
-   Bangla and English localization resources.
-   Analytics event pipeline and experimentation capability.
-   Privacy, security, and operational retention policies.

## 14. Risks and mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Payment provider reports a delayed  Use server-side reconciliation and
  outcome                             a clear pending state

  Duplicate charges during retry      Verify existing transaction status
                                      and use idempotency safeguards

  GPS drains rider battery            Configure update frequency based on
                                      delivery state and movement

  GPS or network becomes unavailable  Show last-update freshness and
                                      preserve order status

  Incorrect address pin               Require customer confirmation and
                                      allow manual adjustment

  ETA changes repeatedly              Use validated estimates and
                                      sensible UI update rules

  Location data is accessed           Enforce order-scoped authorization,
  improperly                          retention limits, and audit logs

  Redesign improves clicks but not    Measure confirmed purchases and
  orders                              downstream guardrails

  Provider or map outage              Provide a useful non-map status and
                                      support fallback
  -----------------------------------------------------------------------

### Additional churn-specific risks

-   **Discount-led growth without retention:** Customers may respond to
    promotions but leave when subsidies end. Test reliability and service
    recovery against discount depth, and measure repeat orders rather than
    redemption.
-   **Subscription backlash:** An unclear renewal or cancellation flow can
    turn a billing complaint into public advocacy and churn. Use explicit
    consent, reminders, one-tap cancellation, and a dispute path.
-   **Refund delays:** A slow refund converts a single order failure into
    a trust failure. Automate refunds, show the expected date, and escalate
    late cases.
-   **Support backlog:** A growing queue during peak hours makes every
    other failure worse. Staff to the measured contact rate, show wait
    times, and provide a human escalation path.
-   **Rider cancellations:** Repeated reassignment without customer
    communication feels like being abandoned. Auto-reassign, notify, and
    update the ETA.
-   **Restaurant supply shocks:** Boycotts, closures, or unavailable items
    can remove the customer's preferred choice. Keep availability
    accurate, show coverage, and offer alternatives with automatic
    refunds.
-   **App instability:** A crash during payment or tracking can lose the
    order and the customer. Set performance budgets, monitor regressions,
    and make the core flow recoverable.
-   **Address errors:** A wrong pin produces late or cancelled orders and
    rider-customer friction. Use address confidence, notes, pin
    correction, and rider contact.
-   **Privacy or safety incident:** One credible incident can damage brand
    trust beyond the affected order. Verify riders, mask contact, provide
    SOS, and audit location access.
-   **Over-reliance on public research:** Complaint sites and small
    surveys can overstate some failure modes. Validate with first-party
    cohorts before setting targets.

## 15. Release sequence

### Release 1: Checkout reliability and essential tracking

-   Transparent checkout total and all-in price display.
-   Address search and map pin confirmation.
-   Payment status state machine.
-   Safe retry and duplicate prevention.
-   Order confirmation and status timeline.
-   Live GPS map with stale and unavailable states.
-   Subscription transparency and cancellation controls.
-   Refund tracker and self-serve resolution for common failures.
-   Human support escalation with visible response targets.
-   Automatic rider reassignment.
-   Order-accuracy checks and two-tap issue reporting.
-   Trust and safety core: verified rider identity, masked contact,
    SOS and reporting, and location-use controls.
-   App-performance baseline, crash monitoring, and low-end device
    testing.
-   Essential event instrumentation, including churn and refund events.

### Release 2: Recovery and usability improvements

-   Improved contextual payment error messages.
-   Resumable interrupted checkout.
-   Better delivery instructions and support entry points.
-   Proactive delay and exception communication.
-   Address-confidence and handoff improvements.
-   Service-recovery automation and refund follow-up.
-   Experimentation for checkout layouts, pricing presentation, and copy.
-   Tracking freshness and ETA quality monitoring.
-   Retention cohorts and churn-reason dashboards.

### Release 3: Optimization

-   More refined ETA estimation.
-   Personalized but non-intrusive recovery messaging.
-   Churn-risk scoring and targeted service recovery.
-   Advanced funnel and retention segmentation with experiment
    automation.
-   Win-back and reorder optimization informed by observed customer
    behavior.

## 16. Open product decisions

-   Which payment providers and methods are supported at launch?
-   What is the authoritative definition of a successful order for each
    payment type?
-   Which order stages permit cancellation or address changes?
-   What location update frequency balances freshness, battery, and data
    costs?
-   What retention period is required for rider location history?
-   Which maps provider covers target delivery zones with sufficient
    address quality?
-   What are the baseline funnel and retention metrics and target
    improvements?
-   Which languages and accessibility standards are launch requirements?
-   What refund service-level target and compensation policy apply to
    late, cold, missing, or wrong orders?
-   What renewal notice, consent, and cancellation rules apply to
    subscriptions?
-   What rider cancellation penalties and reassignment service levels
    apply?
-   What support hours, channels, and first-response targets are
    required for active deliveries?
-   What app-performance targets and minimum device profile are launch
    requirements?
-   How is churn defined for this product, and what is the baseline by
    cohort?
-   Which churn archetypes and city or zone cohorts are prioritised?
-   What is the contingency when restaurant supply is disrupted by a
    boycott, outage, or closure?
-   What trust and safety reporting, escalation, and data-retention rules
    apply?

## 17. Source references

1.  Anthropic, Frontend Design Skill:
    https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md
2.  Claude Help Center, Claude Design:
    https://support.claude.com/en/articles/14604416-get-started-with-claude-design
3.  MasterClass: https://www.masterclass.com/
4.  Framer: https://www.framer.com/
5.  Baymard Institute, Checkout UX Best Practices:
    https://baymard.com/research-articles/current-state-of-checkout-ux
6.  Google Maps Platform, Checkout implementation guidance:
    https://developers.google.com/maps/architecture/checkout
7.  The Business Standard, "The interesting case of Foodi: Organised
    disruption," 12 March 2026:
    https://www.tbsnews.net/features/food/interesting-case-foodi-organised-disruption-1385916
8.  The Business Standard, "Ctg restaurants continue Foodpanda boycott
    over charges of up to 35%; riders in trouble," 16 October 2026:
    https://www.tbsnews.net/bangladesh/ctg-restaurants-continue-foodpanda-boycott-over-charges-35-riders-trouble-1574961
9.  The Business Standard, "foodpanda's business model: What restaurants
    earn and customers pay," 2026:
    https://www.tbsnews.net/economy/foodpandas-business-model-what-restaurants-earn-and-customers-payv-1576006
10. The Daily Observer, "Foodpanda in turmoil over low pay, high charges
    and service failures," 21 October 2026:
    https://observerbd.com/news/600883
11. The Daily Observer, "Foodpanda in crisis: Mounting complaints, low
    pay, harsh penalties," 19 October 2026:
    https://observerbd.com/news/600522
12. Bangladesh Pratidin, "সেবার মান নিয়ে ক্ষোভ গ্রাহকদের, অভিযোগের মুখে
    ‘পাঠাও’," 12 November 2025:
    https://www.bd-pratidin.com/city-news/2025/11/12/1178819
13. New Age, "Pathao faces major technical glitch," 4 October 2026:
    https://www.newagebd.net/post/business-miscellany/316528/pathao-faces-major-technical-glitch
14. PissedConsumer, "Foodpanda Bangladesh Reviews," accessed 26 October
    2026:
    https://foodpanda-bangladesh.pissedconsumer.com/review.html
15. Trustpilot, "foodpanda.com.bd Reviews," accessed 26 October 2026:
    https://www.trustpilot.com/review/foodpanda.com.bd
16. JustUseApp, "Pathao Reviews," accessed 26 October 2026:
    https://justuseapp.com/en/app/1201700952/pathao/reviews
17. Islamic University of Technology, BBA thesis survey of 300
    super-app users, 2025:
    https://repository.iutoic-dhaka.edu/server/api/core/bitstreams/bbf3f97a-d08f-4df4-ab9e-bdaf63739506/content
18. IJFMR, "Factors Affecting Online Food Delivery Services in
    Bangladesh: An Empirical Study on Foodpanda Users in Dhaka," 2026:
    https://www.ijfmr.com/papers/2026/4/85523.pdf
19. LinkedIn, Masrur Hasan Khan, Pathao user survey of 100+ responses,
    25 August 2025:
    https://www.linkedin.com/posts/masrurhasankhan_over-the-past-few-days-i-spoke-with-10-pathao-activity-7365792854515834882-wjts
20. The Daily Star, "Foodpanda fined Tk10 lakh for unfair market
    practices," 16 January 2024:
    https://www.thedailystar.net/tech-startup/news/foodpanda-fined-tk10-lakh-unfair-market-practices-3520626
21. The Business Standard, "Where is Bangladesh's online food delivery
    market headed?" 16 July 2023:
    https://www.tbsnews.net/features/panorama/where-bangladeshs-online-food-delivery-market-headed-666050
22. Rest of World, "Foodpanda monopoly looms; Shohoz, Pathao struggle,"
    21 November 2022:
    https://restofworld.org/2022/food-delivery-startups-struggle-in-bangladesh/
23. Foodpanda, "pandapro terms and conditions," 2024:
    https://www.foodpanda.com.bd/contents/subscription-terms
24. Foodpanda, "Terms and conditions":
    https://www.foodpanda.com.bd/contents/terms-and-conditions.htm
25. LinkedIn, Chowdhury Nuzhat Tahseen, PandaPro auto-renewal complaint,
    9 November 2025:
    https://www.linkedin.com/posts/chowdhury-nuzhat-tahseen-839a821b7_foodpanda-foodpandabangladesh-activity-7393381428576751616-mDDm
26. LinkedIn, Muhammad Imtiaz Hossain, "Poor experience with foodpanda,"
    23 September 2026:
    https://www.linkedin.com/posts/muhammad-imtiaz-hossain-8075a797_poor-experience-with-foodpanda-i-subscribed-activity-7508537408435650562-EUJM
27. Reddit r/Dhaka, "FoodPanda Pro Is Trash," 23 June 2025:
    https://www.reddit.com/r/Dhaka/comments/1ligsqq/foodpanda_pro_is_trash/
28. Pathao Help Center, "I got the wrong food. What should I do?":
    https://help.pathao.com/i-got-the-wrong-food-what-should-i-do/
29. Pathao Help Center, "I was overcharged, please refund!":
    https://help.pathao.com/i-was-overcharged-please-refund-for-gps-error-miscalculation/

All URLs above were accessed on 26 October 2026. Public review sites and
social posts are anecdotal and self-selected; they are used to identify
failure modes, not to estimate prevalence.

------------------------------------------------------------------------

**PRD note:** This document specifies product features and behavior. UI
designs, technical architecture, vendor selection, detailed API
contracts, delivery estimates, and final metric targets should be
confirmed with the relevant teams before implementation. The Bangladesh
churn findings in Section 8 are directional and must be validated with
first-party cohort, refund, support, and cancellation data before targets
or rollout decisions are set.
