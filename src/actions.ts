// "Server" behaviour simulated in the browser. Each action mutates state through update(),
// mirroring what an order/payment/dispatch backend would do. No network calls are made.

import { PAYMENT_METHODS, PLUS_PLAN, RIDERS, type IssueType, type PaymentMethodId, type Point, type SupportCategory } from './data';
import { quote, restaurantById } from './pricing';
import {
  getState,
  go,
  track,
  uid,
  update,
  type Notice,
  type Order,
  type OrderStage,
  type PaymentStatus,
  type ProviderOutcome,
  type Refund,
  type State,
  type Ticket,
} from './store';

const DAY = 86_400_000;

/* ---------------------------------------------------------------- helpers */

export function notify(d: State, n: Omit<Notice, 'id' | 'at'>) {
  d.notices.unshift({ ...n, id: uid('N-'), at: Date.now() });
  if (d.notices.length > 30) d.notices.length = 30;
}

function event(o: Order, kind: Order['events'][number]['kind'], en: string, bn: string, stage?: OrderStage) {
  o.events.push({ at: Date.now(), kind, en, bn, stage });
}

export const ACTIVE_STAGES: OrderStage[] = ['placed', 'confirmed', 'preparing', 'rider_assigned', 'picked_up', 'arriving'];
export const STAGE_ORDER: OrderStage[] = ['placed', 'confirmed', 'preparing', 'rider_assigned', 'picked_up', 'arriving', 'delivered'];

export function isActive(o: Order) {
  return ACTIVE_STAGES.includes(o.stage);
}

export function latestAttempt(o: Order) {
  return o.payment.attempts[o.payment.attempts.length - 1];
}

function dist(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Point along an L-shaped street path from a to b (horizontal first). */
export function alongPath(a: Point, b: Point, t: number): Point {
  const k = Math.max(0, Math.min(1, t));
  const h = Math.abs(b.x - a.x);
  const v = Math.abs(b.y - a.y);
  const total = h + v || 1;
  const travelled = total * k;
  if (travelled <= h) return { x: a.x + Math.sign(b.x - a.x) * travelled, y: a.y };
  return { x: b.x, y: a.y + Math.sign(b.y - a.y) * (travelled - h) };
}

/* ---------------------------------------------------------------- cart */

/** Called whenever the cart contents change: closes any unpaid attempt for the old cart. */
function rotateSession(d: State) {
  const old = Object.values(d.orders).find((o) => o.idempotencyKey === d.checkout.sessionKey);
  if (old && old.stage === 'awaiting_payment') {
    const st = latestAttempt(old)?.status ?? 'not_started';
    if (st !== 'pending' && st !== 'processing') {
      old.stage = 'cancelled';
      old.cancel = { en: 'You changed your cart, so this unpaid attempt was closed. You were not charged.', bn: 'কার্ট বদলানোয় এই অপরিশোধিত চেষ্টা বন্ধ হয়েছে। কোনো টাকা কাটা হয়নি।', at: Date.now(), by: 'system' };
    }
  }
  d.checkout.sessionKey = uid('CS-', 10);
}

export function addToCart(restaurantId: string, itemId: string, optionIds: string[], qty = 1) {
  update((d) => {
    if (d.cart.restaurantId !== restaurantId) d.cart = { restaurantId, lines: [] };
    const key = itemId + '|' + [...optionIds].sort().join(',');
    const existing = d.cart.lines.find((l) => l.key === key);
    if (existing) existing.qty += qty;
    else d.cart.lines.push({ key, itemId, qty, optionIds });
    rotateSession(d);
    track(d, 'cart_item_updated', { action: 'add', item: itemId });
  });
}

export function changeQty(key: string, delta: number) {
  update((d) => {
    const line = d.cart.lines.find((l) => l.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) d.cart.lines = d.cart.lines.filter((l) => l.key !== key);
    if (d.cart.lines.length === 0) d.cart.restaurantId = null;
    rotateSession(d);
    track(d, 'cart_item_updated', { action: delta > 0 ? 'increase' : 'decrease', item: line.itemId });
  });
}

export function removeLine(key: string) {
  update((d) => {
    d.cart.lines = d.cart.lines.filter((l) => l.key !== key);
    if (d.cart.lines.length === 0) d.cart.restaurantId = null;
    rotateSession(d);
    track(d, 'cart_item_updated', { action: 'remove' });
  });
}

/* ---------------------------------------------------------------- order creation */

export type PlaceResult =
  | { kind: 'existing'; id: string }
  | { kind: 'created'; id: string }
  | { kind: 'price_changed'; itemEn: string; itemBn: string; oldPrice: number; newPrice: number; oldTotal: number; newTotal: number };

/**
 * Idempotent order creation (PRD F-010). The checkout session key acts as the idempotency key,
 * so double taps and repeated submissions return the same order instead of creating a new one.
 */
export function placeOrder(priceConsented: boolean): PlaceResult {
  const s = getState();
  const existing = Object.values(s.orders).find((o) => o.idempotencyKey === s.checkout.sessionKey && o.stage !== 'cancelled');
  if (existing) return { kind: 'existing', id: existing.id };

  // Server-side price revalidation at submission (PRD F-002).
  if (s.demo.priceChangeOnSubmit && !priceConsented && s.cart.lines.length) {
    const before = quote(s);
    const line = before.lines[0];
    const r = restaurantById(s.cart.restaurantId)!;
    const item = r.menu.find((m) => m.id === line.itemId)!;
    const oldPrice = s.priceOverrides[item.id] ?? item.price;
    const newPrice = oldPrice + 20;
    update((d) => {
      d.priceOverrides[item.id] = newPrice;
      d.demo.priceChangeOnSubmit = false;
    });
    const after = quote(getState());
    return { kind: 'price_changed', itemEn: item.en, itemBn: item.bn, oldPrice, newPrice, oldTotal: before.pricing.total, newTotal: after.pricing.total };
  }

  const q = quote(s);
  const r = q.restaurant!;
  const c = s.checkout;
  const method = c.method!;
  const id = 'KB-' + uid('', 5);
  const travel = Math.max(6, Math.round(dist(r.pos, c.address!.pos) / 9));
  const plan = {
    confirmed: 1,
    preparing: 2,
    assigned: 2 + Math.round(r.prepMin * 0.5),
    pickedUp: 2 + r.prepMin,
    arriving: 2 + r.prepMin + Math.round(travel * 0.7),
    delivered: 2 + r.prepMin + travel,
  };
  const order: Order = {
    id,
    idempotencyKey: c.sessionKey,
    createdAt: Date.now(),
    restaurantId: r.id,
    lines: q.lines,
    address: c.address!,
    phone: c.phone,
    handoff: c.handoff,
    pricing: q.pricing,
    method,
    payment: { status: 'not_started', attempts: [], txnRef: uid('TXN-', 8) },
    stage: 'awaiting_payment',
    simMin: 0,
    plan,
    originalEtaMin: plan.delivered,
    events: [],
    gps: 'ok',
    reassignedCount: 0,
    otp: String(1000 + Math.floor(Math.random() * 9000)),
    refundIds: [],
  };
  if (c.instructions.trim()) order.address = { ...order.address, notes: [order.address.notes, c.instructions.trim()].filter(Boolean).join(' · ') };

  update((d) => {
    d.orders[id] = order;
    d.orderIds.unshift(id);
    track(d, 'order_submit_succeeded', { order: id, method, total: q.pricing.total });
    if (method === 'cod') {
      const o = d.orders[id];
      o.payment.status = 'cod';
      confirmPlaced(d, o);
    }
  });
  return { kind: 'created', id };
}

/** Order accepted into the kitchen flow: clears the cart and starts the stage clock. */
function confirmPlaced(d: State, o: Order) {
  o.stage = 'placed';
  o.createdAt = Date.now();
  event(o, 'good', 'Order placed', 'অর্ডার দেওয়া হয়েছে', 'placed');
  if (d.checkout.sessionKey === o.idempotencyKey) {
    d.cart = { restaurantId: null, lines: [] };
    if (o.pricing.credit) d.credit = Math.max(0, d.credit - o.pricing.credit);
    d.checkout = { ...d.checkout, sessionKey: uid('CS-', 10), instructions: '', promoInput: '', promoCode: null, tip: 0, useCredit: false };
  }
  track(d, 'order_confirmation_viewed', { order: o.id });
  notify(d, { channel: 'push', orderId: o.id, en: 'Order placed', bn: 'অর্ডার দেওয়া হয়েছে', bodyEn: `${restaurantById(o.restaurantId)?.name} has your order ${o.id}.`, bodyBn: `${restaurantById(o.restaurantId)?.name} আপনার অর্ডার ${o.id} পেয়েছে।`, link: 'order/' + o.id });
}

/* ---------------------------------------------------------------- payments */

export function startAttempt(orderId: string, method: PaymentMethodId) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o) return;
    const last = latestAttempt(o);
    // Never start a new charge while a previous attempt is unresolved or already succeeded.
    if (last && (last.status === 'pending' || last.status === 'processing' || last.status === 'successful')) return;
    o.method = method;
    const attempt = { id: uid('PA-', 6), method, startedAt: Date.now(), status: 'not_started' as const, checks: 0 };
    o.payment.attempts.push(attempt);
    o.payment.status = 'not_started';
    d.ui.providerSheet = { orderId, attemptId: attempt.id };
    track(d, o.payment.attempts.length > 1 ? 'payment_retry_started' : 'payment_attempt_started', { order: orderId, method });
  });
}

/** The simulated provider returns control to the app. This is NOT proof of payment. */
export function providerReturned(outcome: ProviderOutcome) {
  const sheet = getState().ui.providerSheet;
  if (!sheet) return;
  update((d) => {
    const o = d.orders[sheet.orderId];
    const a = o?.payment.attempts.find((x) => x.id === sheet.attemptId);
    if (a) {
      a.status = 'processing';
      a.outcome = outcome;
      o.payment.status = 'processing';
    }
    d.ui.providerSheet = null;
  });
  go('pay/' + sheet.orderId, true);
}

export function closeProvider() {
  const sheet = getState().ui.providerSheet;
  if (!sheet) return;
  providerReturned('cancel');
}

/** Ask the "server" for the verified transaction state (PRD F-009). */
export function verifyPayment(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    const a = o && latestAttempt(o);
    if (!o || !a || (a.status !== 'processing' && a.status !== 'pending')) return;
    a.checks++;
    let next: PaymentStatus = a.status;
    switch (a.outcome) {
      case 'approve': next = 'successful'; break;
      case 'decline': next = 'failed'; break;
      case 'cancel': next = 'cancelled'; break;
      case 'timeout': next = 'expired'; break;
      case 'network_drop':
        next = a.checks >= 3 ? d.demo.pendingResolvesTo : 'pending';
        break;
    }
    a.status = next;
    o.payment.status = next;
    const names: Record<string, string> = { successful: 'payment_succeeded', failed: 'payment_failed', cancelled: 'payment_failed', expired: 'payment_failed', pending: 'payment_status_pending' };
    if (names[next]) track(d, names[next], { order: orderId, method: a.method, state: next });
    if (next === 'successful') confirmPlaced(d, o);
  });
}

export function switchToCash(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    const last = o && latestAttempt(o);
    if (!o || o.stage !== 'awaiting_payment') return;
    if (last && (last.status === 'pending' || last.status === 'processing' || last.status === 'successful')) return;
    o.method = 'cod';
    o.payment.status = 'cod';
    track(d, 'payment_method_selected', { method: 'cod', context: 'recovery' });
    confirmPlaced(d, o);
  });
}

export function abandonUnpaid(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o || o.stage !== 'awaiting_payment') return;
    o.stage = 'cancelled';
    o.cancel = { en: 'You closed this checkout. No payment was taken.', bn: 'আপনি চেকআউট বন্ধ করেছেন। কোনো টাকা নেওয়া হয়নি।', at: Date.now(), by: 'customer' };
    track(d, 'checkout_abandoned', { order: orderId });
  });
}

/* ---------------------------------------------------------------- refunds */

export function methodLabel(m: PaymentMethodId) {
  const pm = PAYMENT_METHODS.find((x) => x.id === m)!;
  return { en: pm.en, bn: pm.bn };
}

function refundEta(m: PaymentMethodId, destination: Refund['destination']) {
  if (destination === 'credit') return Date.now();
  if (m === 'card') return Date.now() + 7 * DAY;
  return Date.now() + 2 * DAY;
}

export function createRefund(
  d: State,
  args: { orderId?: string; amount: number; destination: Refund['destination']; method: PaymentMethodId; reasonEn: string; reasonBn: string },
) {
  const id = 'RF-' + uid('', 6);
  const label = args.destination === 'credit' ? { en: 'Khabar credit (instant)', bn: 'খাবার ক্রেডিট (তাৎক্ষণিক)' } : args.method === 'cod' ? { en: 'Your bKash number', bn: 'আপনার বিকাশ নম্বর' } : methodLabel(args.method);
  const now = Date.now();
  const r: Refund = {
    id,
    orderId: args.orderId,
    amount: args.amount,
    destination: args.destination,
    destinationLabelEn: label.en,
    destinationLabelBn: label.bn,
    reasonEn: args.reasonEn,
    reasonBn: args.reasonBn,
    stage: args.destination === 'credit' ? 'credited' : 'requested',
    createdAt: now,
    expectedBy: refundEta(args.method, args.destination),
    history: args.destination === 'credit'
      ? [{ stage: 'requested', at: now }, { stage: 'approved', at: now }, { stage: 'processing', at: now }, { stage: 'credited', at: now }]
      : [{ stage: 'requested', at: now }],
    ticks: 0,
  };
  if (args.destination === 'credit') d.credit += args.amount;
  d.refunds[id] = r;
  d.refundIds.unshift(id);
  if (args.orderId && d.orders[args.orderId]) d.orders[args.orderId].refundIds.push(id);
  track(d, 'refund_requested', { refund: id, amount: args.amount, destination: args.destination });
  return id;
}

function wasCharged(o: Order) {
  return o.payment.status === 'successful';
}

/* ---------------------------------------------------------------- order lifecycle */

export function cancelOrder(orderId: string, by: 'customer' | 'restaurant', reasonEn: string, reasonBn: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o || !isActive(o)) return;
    o.stage = 'cancelled';
    o.cancel = { en: reasonEn, bn: reasonBn, at: Date.now(), by };
    o.riderPos = undefined;
    event(o, 'bad', by === 'customer' ? 'You cancelled the order' : 'Order cancelled by restaurant', by === 'customer' ? 'আপনি অর্ডার বাতিল করেছেন' : 'রেস্টুরেন্ট অর্ডার বাতিল করেছে', 'cancelled');
    if (wasCharged(o)) {
      createRefund(d, { orderId, amount: o.pricing.total, destination: 'original', method: o.method, reasonEn: 'Order cancelled — automatic full refund', reasonBn: 'অর্ডার বাতিল — স্বয়ংক্রিয় সম্পূর্ণ রিফান্ড' });
    }
    if (o.pricing.credit) d.credit += o.pricing.credit;
    track(d, 'order_cancelled', { order: orderId, by });
    notify(d, {
      channel: 'sms', orderId,
      en: 'Order cancelled', bn: 'অর্ডার বাতিল',
      bodyEn: wasCharged(o) ? `${o.id} was cancelled. A full refund of ৳${o.pricing.total} has started automatically.` : `${o.id} was cancelled. You were not charged.`,
      bodyBn: wasCharged(o) ? `${o.id} বাতিল হয়েছে। ৳${o.pricing.total} সম্পূর্ণ রিফান্ড স্বয়ংক্রিয়ভাবে শুরু হয়েছে।` : `${o.id} বাতিল হয়েছে। কোনো টাকা কাটা হয়নি।`,
      link: 'order/' + orderId,
    });
  });
}

export function updateDeliveryNotes(orderId: string, landmark: string, notes: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o || !['placed', 'confirmed', 'preparing', 'rider_assigned'].includes(o.stage)) return;
    o.address = { ...o.address, landmark, notes };
    event(o, 'info', 'Delivery instructions updated — your rider sees the new notes', 'ডেলিভারি নির্দেশনা হালনাগাদ — রাইডার নতুন নোট দেখবেন');
  });
}

export function rateOrder(orderId: string, score: number) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o) return;
    o.csat = score;
    track(d, 'csat_submitted', { order: orderId, score });
  });
}

/** Two-tap issue resolution (PRD F-026, F-030). Returns the refund id, if one was created. */
export function resolveIssue(orderId: string, issue: IssueType, resolution: 'refund' | 'credit' | 'redeliver', amount: number) {
  let refundId: string | undefined;
  update((d) => {
    const o = d.orders[orderId];
    if (!o) return;
    o.issueReported = true;
    track(d, 'order_accuracy_issue_reported', { order: orderId, issue });
    const reason = { missing: ['Missing item', 'আইটেম পাওয়া যায়নি'], wrong: ['Wrong item', 'ভুল আইটেম'], cold: ['Food arrived cold', 'খাবার ঠান্ডা ছিল'], damaged: ['Spilled or damaged', 'পড়ে গেছে বা নষ্ট'], late: ['Very late delivery', 'অনেক দেরিতে ডেলিভারি'] }[issue];
    if (resolution === 'redeliver') {
      event(o, 'good', 'Redelivery arranged — the restaurant is preparing the item again', 'পুনরায় ডেলিভারির ব্যবস্থা হয়েছে', undefined);
      notify(d, { channel: 'push', orderId, en: 'Redelivery on the way', bn: 'পুনরায় ডেলিভারি আসছে', bodyEn: 'We’ll deliver the replacement within about 35 minutes, at no charge.', bodyBn: 'প্রায় ৩৫ মিনিটের মধ্যে বিনামূল্যে পাঠানো হবে।' });
    } else {
      refundId = createRefund(d, {
        orderId,
        amount,
        destination: resolution === 'credit' ? 'credit' : 'original',
        method: o.method,
        reasonEn: reason[0],
        reasonBn: reason[1],
      });
    }
    track(d, 'order_accuracy_resolved', { order: orderId, resolution });
  });
  return refundId;
}

/* ---------------------------------------------------------------- demo / ops events */

export function simulateDelay(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o || !isActive(o) || o.stage === 'arriving') return;
    const add = 12;
    const shift = (k: keyof Order['plan']) => {
      if (o.plan[k] > o.simMin) o.plan[k] += add;
    };
    (['assigned', 'pickedUp', 'arriving', 'delivered'] as const).forEach(shift);
    const reason = o.stage === 'picked_up'
      ? { en: 'Heavy traffic on the rider’s route', bn: 'রাইডারের পথে ভারী যানজট' }
      : { en: 'The restaurant is busier than usual', bn: 'রেস্টুরেন্টে স্বাভাবিকের চেয়ে বেশি ভিড়' };
    const compensation = 50;
    o.delay = { ...reason, addedMin: add, compensation, at: Date.now() };
    d.credit += compensation;
    event(o, 'warn', `Running late: ${reason.en}. ৳${compensation} credit added automatically.`, `দেরি হচ্ছে: ${reason.bn}। ৳${compensation} ক্রেডিট স্বয়ংক্রিয়ভাবে যোগ হয়েছে।`);
    track(d, 'order_late', { order: orderId, added: add });
    track(d, 'delivery_eta_changed', { order: orderId });
    notify(d, { channel: 'push', orderId, en: 'Your order is running late', bn: 'আপনার অর্ডারে দেরি হচ্ছে', bodyEn: `${reason.en}. New estimate is about ${add} min later. We added ৳${compensation} credit — no need to contact us.`, bodyBn: `${reason.bn}। নতুন সময় প্রায় ${add} মিনিট পরে। ৳${compensation} ক্রেডিট যোগ হয়েছে।`, link: 'order/' + orderId });
  });
}

export function simulateRiderCancel(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o || o.stage !== 'rider_assigned' || !o.riderId) return;
    const prev = RIDERS.find((r) => r.id === o.riderId)!;
    const next = RIDERS.find((r) => r.id !== o.riderId && r.id !== prev.id)!;
    o.riderId = next.id;
    o.reassignedCount++;
    const r = restaurantById(o.restaurantId)!;
    o.riderStart = { x: Math.min(380, r.pos.x + 35), y: Math.max(20, r.pos.y + 30) };
    o.riderPos = o.gps === 'ok' ? o.riderStart : o.riderPos;
    o.riderFixAt = o.gps === 'ok' ? Date.now() : o.riderFixAt;
    o.plan.assigned = o.simMin;
    (['pickedUp', 'arriving', 'delivered'] as const).forEach((k) => (o.plan[k] += 4));
    event(o, 'warn', `${prev.name.split(' ')[0]} couldn’t continue. ${next.name} was assigned automatically — no need to reorder.`, `${prev.name.split(' ')[0]} যেতে পারছেন না। ${next.name} স্বয়ংক্রিয়ভাবে নিযুক্ত হয়েছেন — আবার অর্ডার করতে হবে না।`);
    track(d, 'rider_reassigned', { order: orderId });
    track(d, 'delivery_eta_changed', { order: orderId });
    notify(d, { channel: 'sms', orderId, en: 'New rider assigned', bn: 'নতুন রাইডার নিযুক্ত', bodyEn: `${next.name} is now delivering ${o.id}. Your order and payment are unchanged.`, bodyBn: `${next.name} এখন ${o.id} ডেলিভারি করছেন। অর্ডার ও পেমেন্ট অপরিবর্তিত।`, link: 'order/' + orderId });
  });
}

export function toggleGps(orderId: string) {
  update((d) => {
    const o = d.orders[orderId];
    if (!o) return;
    o.gps = o.gps === 'ok' ? 'lost' : 'ok';
    o.staleLogged = false;
  });
}

export function simulateRestaurantFailure(orderId: string) {
  const o = getState().orders[orderId];
  if (!o || !['placed', 'confirmed', 'preparing', 'rider_assigned'].includes(o.stage)) return;
  cancelOrder(orderId, 'restaurant', 'The restaurant ran out of a key ingredient and can’t make your order.', 'রেস্টুরেন্টে প্রয়োজনীয় উপকরণ শেষ, অর্ডারটি তৈরি করা সম্ভব নয়।');
}

/* ---------------------------------------------------------------- support */

export function openTicket(category: Ticket['category'], channel: Ticket['channel'], orderId?: string, firstMessage?: { en: string; bn: string }) {
  const id = 'SP-' + uid('', 5);
  update((d) => {
    const o = orderId ? d.orders[orderId] : undefined;
    const context: Ticket['context'] = [];
    if (o) {
      const r = restaurantById(o.restaurantId);
      context.push({ en: `Order ${o.id} · ${r?.name}`, bn: `অর্ডার ${o.id} · ${r?.name}` });
      context.push({ en: `Order status: ${o.stage.replace('_', ' ')}`, bn: `অর্ডারের অবস্থা: ${o.stage.replace('_', ' ')}` });
      context.push({ en: `Payment: ${o.payment.status} · ref ${o.payment.txnRef}`, bn: `পেমেন্ট: ${o.payment.status} · রেফ ${o.payment.txnRef}` });
      context.push({ en: `Total ৳${o.pricing.total}`, bn: `মোট ৳${o.pricing.total}` });
      if (o.refundIds.length) context.push({ en: `Refunds: ${o.refundIds.join(', ')}`, bn: `রিফান্ড: ${o.refundIds.join(', ')}` });
    }
    const now = Date.now();
    const t: Ticket = {
      id,
      orderId,
      category,
      channel,
      createdAt: now,
      status: 'waiting',
      context,
      ticks: 0,
      messages: [
        channel === 'callback'
          ? { from: 'system', at: now, en: 'Callback requested. A support agent will call you within 10 minutes.', bn: 'কলব্যাক অনুরোধ করা হয়েছে। ১০ মিনিটের মধ্যে কল করা হবে।' }
          : { from: 'system', at: now, en: 'Connecting you to a person. Typical wait right now: under 2 minutes.', bn: 'একজন প্রতিনিধির সাথে যুক্ত করা হচ্ছে। এখন অপেক্ষার সময়: ২ মিনিটের কম।' },
      ],
    };
    if (firstMessage) t.messages.push({ from: 'me', at: now, ...firstMessage });
    d.tickets[id] = t;
    d.ticketIds.unshift(id);
    d.ui.help = { open: false };
    d.ui.safety = { open: false };
    track(d, category === 'safety' ? 'trust_safety_report_opened' : 'support_chat_opened', { ticket: id, category });
    track(d, 'support_human_escalated', { ticket: id });
  });
  go('support/' + id);
}

export function sendMessage(ticketId: string, text: string) {
  update((d) => {
    const t = d.tickets[ticketId];
    if (!t) return;
    t.messages.push({ from: 'me', at: Date.now(), en: text, bn: text });
    t.pendingReply = t.ticks + 3;
    if (t.status === 'resolved') t.status = 'open';
  });
}

export function resolveTicket(ticketId: string, resolved: boolean) {
  update((d) => {
    const t = d.tickets[ticketId];
    if (!t) return;
    if (resolved) {
      t.status = 'resolved';
      t.messages.push({ from: 'system', at: Date.now(), en: 'Marked as resolved. Thanks for letting us know.', bn: 'সমাধান হয়েছে হিসেবে চিহ্নিত। জানানোর জন্য ধন্যবাদ।' });
      track(d, 'support_resolved', { ticket: ticketId });
    } else {
      t.status = 'escalated';
      t.messages.push({ from: 'system', at: Date.now(), en: 'Escalated to a senior specialist. You’ll hear back within 2 hours — no need to open a new ticket.', bn: 'সিনিয়র বিশেষজ্ঞের কাছে পাঠানো হয়েছে। ২ ঘণ্টার মধ্যে উত্তর পাবেন।' });
    }
  });
}

function agentGreeting(t: Ticket, d: State): { en: string; bn: string } {
  const o = t.orderId ? d.orders[t.orderId] : undefined;
  const ref = o ? ` I can see order ${o.id} and its payment details, so you don’t need to repeat them.` : '';
  const refBn = o ? ` আমি অর্ডার ${o.id} ও পেমেন্টের তথ্য দেখতে পাচ্ছি, আবার বলতে হবে না।` : '';
  const byCat: Record<string, [string, string]> = {
    deducted: ['Your bank or wallet reference shows the attempt is still being reconciled. If it was charged and no order is confirmed within 30 minutes, it is refunded automatically. I’ve flagged it as a priority.', 'লেনদেনটি এখনও যাচাই হচ্ছে। ৩০ মিনিটের মধ্যে অর্ডার নিশ্চিত না হলে টাকা স্বয়ংক্রিয়ভাবে ফেরত যাবে।'],
    duplicate: ['I’m checking every attempt on this order now. Only one charge can be captured per order; any extra authorisation is released automatically.', 'এই অর্ডারের সব চেষ্টা দেখছি। প্রতিটি অর্ডারে একটিই চার্জ নেওয়া যায়।'],
    delayed: ['I’ve pinged the restaurant and rider. If it goes past the new estimate, I can add credit or cancel with a full refund — your choice.', 'রেস্টুরেন্ট ও রাইডারকে জানিয়েছি। নতুন সময় পার হলে ক্রেডিট বা সম্পূর্ণ রিফান্ড দিতে পারি।'],
    safety: ['You’re talking to our 24/7 safety team. Are you safe right now? If you are in danger, call 999 first. I’ve paused this rider from new orders while we review.', 'আপনি আমাদের ২৪/৭ নিরাপত্তা দলের সাথে কথা বলছেন। বিপদে থাকলে আগে ৯৯৯-এ কল করুন।'],
  };
  const body = byCat[t.category] ?? ['How can I help?', 'কীভাবে সাহায্য করতে পারি?'];
  return { en: `Hi, I’m Nusrat from Khabar support.${ref} ${body[0]}`, bn: `আসসালামু আলাইকুম, আমি খাবার সাপোর্টের নুসরাত।${refBn} ${body[1]}` };
}

/* ---------------------------------------------------------------- subscription */

export function subscribePlus(method: PaymentMethodId) {
  update((d) => {
    const now = Date.now();
    d.subscription = {
      status: 'active',
      method,
      startedAt: now,
      periodEnd: now + 30 * DAY,
      billing: [{ id: 'BL-' + uid('', 5), at: now, amount: PLUS_PLAN.price, status: 'paid' }, ...d.subscription.billing],
    };
    track(d, 'subscription_viewed', { action: 'subscribed' });
    notify(d, { channel: 'in-app', en: 'Plus is on', bn: 'প্লাস চালু হয়েছে', bodyEn: `৳${PLUS_PLAN.price} charged. We’ll remind you 48 and 24 hours before the next charge.`, bodyBn: `৳${PLUS_PLAN.price} চার্জ হয়েছে। পরের চার্জের ৪৮ ও ২৪ ঘণ্টা আগে মনে করিয়ে দেব।` });
  });
}

export function cancelPlus() {
  update((d) => {
    if (d.subscription.status !== 'active') return;
    d.subscription.status = 'cancelled';
    d.subscription.cancelledAt = Date.now();
    track(d, 'subscription_cancelled');
  });
}

export function disputeCharge(billingId: string) {
  update((d) => {
    const b = d.subscription.billing.find((x) => x.id === billingId);
    if (!b || b.status !== 'paid') return;
    b.status = 'disputed';
    // Stop renewals immediately and end benefits; refund the disputed charge.
    d.subscription.status = 'cancelled';
    d.subscription.cancelledAt = Date.now();
    d.subscription.periodEnd = Date.now();
    createRefund(d, { amount: b.amount, destination: 'original', method: d.subscription.method ?? 'bkash', reasonEn: 'Disputed Plus charge', reasonBn: 'প্লাস চার্জ নিয়ে আপত্তি' });
    track(d, 'subscription_dispute_opened', { billing: billingId });
  });
}

export function simulateRenewalReminder() {
  update((d) => {
    const sub = d.subscription;
    if (sub.status !== 'active' || !sub.periodEnd) return;
    track(d, 'subscription_renewal_reminder_viewed');
    const date = new Date(sub.periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    notify(d, { channel: 'sms', en: 'Plus renews in 48 hours', bn: '৪৮ ঘণ্টায় প্লাস নবায়ন হবে', bodyEn: `৳${PLUS_PLAN.price} will be charged on ${date}. Not using it? Cancel in two taps.`, bodyBn: `${date} তারিখে ৳${PLUS_PLAN.price} চার্জ হবে। দরকার না হলে দুই ট্যাপে বাতিল করুন।`, link: 'plus' });
  });
}

/* ---------------------------------------------------------------- engine tick */

function stageFor(o: Order): OrderStage {
  const p = o.plan;
  const t = o.simMin;
  if (t >= p.delivered) return 'delivered';
  if (t >= p.arriving) return 'arriving';
  if (t >= p.pickedUp) return 'picked_up';
  if (t >= p.assigned) return 'rider_assigned';
  if (t >= p.preparing) return 'preparing';
  if (t >= p.confirmed) return 'confirmed';
  return 'placed';
}

const STAGE_TEXT: Record<string, [string, string]> = {
  confirmed: ['Restaurant confirmed your order', 'রেস্টুরেন্ট অর্ডার নিশ্চিত করেছে'],
  preparing: ['Kitchen started preparing', 'রান্না শুরু হয়েছে'],
  rider_assigned: ['Rider assigned and heading to the restaurant', 'রাইডার নিযুক্ত, রেস্টুরেন্টের পথে'],
  picked_up: ['Picked up — the restaurant checked every item and sealed the bag', 'সংগ্রহ করা হয়েছে — সব আইটেম মিলিয়ে ব্যাগ সিল করা হয়েছে'],
  arriving: ['Almost there — your rider is nearby', 'প্রায় পৌঁছে গেছে — রাইডার কাছাকাছি'],
  delivered: ['Delivered', 'ডেলিভারি সম্পন্ন'],
};

function advanceOrder(d: State, o: Order, now: number) {
  o.simMin += 0.5 * d.demo.speed;
  const target = stageFor(o);
  let idx = STAGE_ORDER.indexOf(o.stage);
  const targetIdx = STAGE_ORDER.indexOf(target);
  const r = restaurantById(o.restaurantId)!;
  while (idx < targetIdx) {
    idx++;
    const st = STAGE_ORDER[idx];
    o.stage = st;
    const [en, bn] = STAGE_TEXT[st];
    event(o, st === 'delivered' ? 'good' : 'info', en, bn, st);
    if (st === 'rider_assigned') {
      const rider = RIDERS[o.id.charCodeAt(3) % RIDERS.length];
      o.riderId = rider.id;
      o.riderStart = { x: Math.max(20, r.pos.x - 45), y: Math.max(20, r.pos.y - 35) };
      track(d, 'rider_assigned', { order: o.id });
    }
    if (st === 'arriving') {
      notify(d, { channel: 'push', orderId: o.id, en: 'Your rider is nearby', bn: 'রাইডার কাছাকাছি', bodyEn: `Have your code ${o.otp} ready for the handoff.`, bodyBn: `হস্তান্তরের জন্য কোড ${o.otp} প্রস্তুত রাখুন।`, link: 'order/' + o.id });
    }
    if (st === 'delivered') {
      o.deliveredAt = now;
      o.riderPos = undefined; // stop exposing rider location after completion
      if (o.method === 'cod') o.payment.status = 'successful';
      track(d, 'order_delivered', { order: o.id });
      notify(d, { channel: 'push', orderId: o.id, en: 'Delivered — enjoy!', bn: 'ডেলিভারি সম্পন্ন — উপভোগ করুন!', bodyEn: 'Anything wrong? Report it in two taps and get it fixed right away.', bodyBn: 'কোনো সমস্যা? দুই ট্যাপে জানান, সাথে সাথে সমাধান।', link: 'order/' + o.id });
    }
  }

  if (o.stage === 'rider_assigned' || o.stage === 'picked_up' || o.stage === 'arriving') {
    const p = o.plan;
    const pos = o.stage === 'rider_assigned'
      ? alongPath(o.riderStart ?? r.pos, r.pos, (o.simMin - p.assigned) / Math.max(1, p.pickedUp - p.assigned))
      : alongPath(r.pos, o.address.pos, (o.simMin - p.pickedUp) / Math.max(1, p.delivered - p.pickedUp));
    if (o.gps === 'ok') {
      o.riderPos = pos;
      o.riderFixAt = now;
    } else if (!o.staleLogged && o.riderFixAt && now - o.riderFixAt > 10_000) {
      o.staleLogged = true;
      track(d, 'rider_location_stale', { order: o.id });
    }
  }
}

export function tick() {
  const s = getState();
  const hasWork =
    s.orderIds.some((id) => isActive(s.orders[id]) || latestAttempt(s.orders[id])?.status === 'pending') ||
    s.refundIds.some((id) => s.refunds[id].stage !== 'credited' && s.refunds[id].stage !== 'failed') ||
    s.ticketIds.some((id) => s.tickets[id].status !== 'resolved');
  if (!hasWork) return;
  update((d) => {
    const now = Date.now();
    for (const id of d.orderIds) {
      const o = d.orders[id];
      if (!d.demo.paused && isActive(o)) advanceOrder(d, o, now);
    }
    // Server-side reconciliation keeps re-checking pending payments (every ~8s).
    for (const id of d.orderIds) {
      const o = d.orders[id];
      const a = latestAttempt(o);
      if (a?.status === 'pending' && now - a.startedAt > 8000 * (a.checks + 1)) {
        a.checks++;
        if (a.checks >= 3) {
          a.status = d.demo.pendingResolvesTo;
          o.payment.status = a.status;
          if (a.status === 'successful') confirmPlaced(d, o);
          track(d, a.status === 'successful' ? 'payment_succeeded' : 'payment_failed', { order: o.id, via: 'reconciliation' });
          notify(d, a.status === 'successful'
            ? { channel: 'push', orderId: o.id, en: 'Payment confirmed', bn: 'পেমেন্ট নিশ্চিত', bodyEn: `${o.id} is confirmed. No need to pay again.`, bodyBn: `${o.id} নিশ্চিত হয়েছে। আবার পেমেন্ট করতে হবে না।`, link: 'pay/' + o.id }
            : { channel: 'push', orderId: o.id, en: 'Payment didn’t go through', bn: 'পেমেন্ট সম্পন্ন হয়নি', bodyEn: `No money was taken for ${o.id}. You can try again or pay cash.`, bodyBn: `${o.id}-এর জন্য কোনো টাকা কাটা হয়নি। আবার চেষ্টা করুন বা ক্যাশে দিন।`, link: 'pay/' + o.id });
        }
      }
    }
    for (const id of d.refundIds) {
      const r = d.refunds[id];
      if (r.stage === 'credited' || r.stage === 'failed') continue;
      r.ticks += d.demo.speed;
      const steps: Refund['stage'][] = ['requested', 'approved', 'processing', 'credited'];
      const want = Math.min(3, Math.floor(r.ticks / 7));
      while (steps.indexOf(r.stage) < want) {
        r.stage = steps[steps.indexOf(r.stage) + 1];
        r.history.push({ stage: r.stage, at: now });
        if (r.stage === 'credited') {
          track(d, 'refund_completed', { refund: r.id });
          notify(d, { channel: 'sms', en: 'Refund credited', bn: 'রিফান্ড জমা হয়েছে', bodyEn: `৳${r.amount} was credited to ${r.destinationLabelEn}.`, bodyBn: `৳${r.amount} ${r.destinationLabelBn}-এ জমা হয়েছে।`, link: 'refund/' + r.id });
        }
      }
    }
    for (const id of d.ticketIds) {
      const t = d.tickets[id];
      if (t.status === 'resolved') continue;
      t.ticks++;
      if (t.status === 'waiting' && t.ticks >= 4) {
        t.status = 'open';
        t.messages.push({ from: 'agent', at: now, ...agentGreeting(t, d) });
        track(d, 'support_first_response', { ticket: t.id, seconds: t.ticks });
      }
      if (t.pendingReply !== undefined && t.ticks >= t.pendingReply) {
        t.pendingReply = undefined;
        t.messages.push({ from: 'agent', at: now, en: 'Thanks — I’ve noted that on your case. Is there anything else I can sort out for you right now?', bn: 'ধন্যবাদ — আপনার কেসে যোগ করেছি। এখন আর কিছু সাহায্য লাগবে?' });
      }
    }
  });
}

export function categoryForOrder(o: Order | undefined): SupportCategory | undefined {
  if (!o) return undefined;
  if (o.stage === 'awaiting_payment') return 'deducted';
  if (isActive(o)) return 'delayed';
  return undefined;
}
