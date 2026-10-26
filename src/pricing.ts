import { FEES, PAYMENT_METHODS, PLUS_PLAN, PROMOS, RESTAURANTS, type MenuItem, type Promo, type Restaurant } from './data';
import type { CartLine, OrderLine, Pricing, State } from './store';

export function restaurantById(id: string | null | undefined): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}

export function itemById(r: Restaurant | undefined, itemId: string): MenuItem | undefined {
  return r?.menu.find((m) => m.id === itemId);
}

/** Current platform price of a menu item (respects simulated server-side price changes). */
export function itemPrice(item: MenuItem, overrides: Record<string, number>) {
  return overrides[item.id] ?? item.price;
}

export function lineToOrderLine(line: CartLine, r: Restaurant, overrides: Record<string, number>): OrderLine | null {
  const item = itemById(r, line.itemId);
  if (!item) return null;
  const opts = (item.options ?? []).filter((o) => line.optionIds.includes(o.id));
  return {
    ...line,
    unitPrice: itemPrice(item, overrides) + opts.reduce((s, o) => s + o.price, 0),
    en: item.en,
    bn: item.bn,
    optionsEn: opts.map((o) => o.en),
    optionsBn: opts.map((o) => o.bn),
  };
}

export type PromoResult =
  | { ok: true; promo: Promo; discount: number; freeDelivery: boolean }
  | { ok: false; code: string; en: string; bn: string; alternative?: Promo };

export type PlusResult =
  | { state: 'not_member' }
  | { state: 'applies'; saving: number }
  | { state: 'not_applicable'; en: string; bn: string };

export type Quote = {
  lines: OrderLine[];
  pricing: Pricing;
  promo: PromoResult | null;
  plus: PlusResult;
  belowMinimum: number;
  restaurant: Restaurant | undefined;
};

function completedOrders(s: State) {
  return s.orderIds.filter((id) => s.orders[id]?.stage === 'delivered').length;
}

export function evaluatePromo(code: string, subtotal: number, r: Restaurant, s: State): PromoResult {
  const upper = code.trim().toUpperCase();
  const promo = PROMOS.find((p) => p.code === upper);
  const alternative = () =>
    PROMOS.find((p) => p.code !== upper && promoProblem(p, subtotal, r, s) === null);
  if (!promo) {
    return { ok: false, code: upper, en: `We don’t recognise “${upper}”. Check the spelling.`, bn: `“${upper}” কোডটি পাওয়া যায়নি। বানান দেখে নিন।`, alternative: alternative() };
  }
  const problem = promoProblem(promo, subtotal, r, s);
  if (problem) return { ok: false, code: upper, ...problem, alternative: alternative() };
  let discount = 0;
  if (promo.kind === 'flat') discount = promo.value;
  if (promo.kind === 'percent') discount = Math.min(Math.round((subtotal * promo.value) / 100), promo.maxDiscount ?? Infinity);
  return { ok: true, promo, discount, freeDelivery: promo.kind === 'free_delivery' };
}

function promoProblem(p: Promo, subtotal: number, r: Restaurant, s: State): { en: string; bn: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (p.expires < today) {
    const d = new Date(p.expires).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return { en: `${p.code} expired on ${d}.`, bn: `${p.code} কোডের মেয়াদ ${d} তারিখে শেষ হয়েছে।` };
  }
  if (p.restaurantId && p.restaurantId !== r.id) {
    const name = restaurantById(p.restaurantId)?.name ?? '';
    return { en: `${p.code} only works at ${name}.`, bn: `${p.code} শুধু ${name}-এ প্রযোজ্য।` };
  }
  if (p.firstOrderOnly && completedOrders(s) > 0) {
    return { en: `${p.code} is for first orders only, and you’ve ordered before.`, bn: `${p.code} শুধু প্রথম অর্ডারের জন্য।` };
  }
  if (subtotal < p.minSubtotal) {
    const gap = p.minSubtotal - subtotal;
    return { en: `Add ৳${gap} more in items to use ${p.code} (minimum ৳${p.minSubtotal}).`, bn: `${p.code} ব্যবহারে আরও ৳${gap}-এর খাবার যোগ করুন (ন্যূনতম ৳${p.minSubtotal})।` };
  }
  return null;
}

export function plusActive(s: State) {
  const sub = s.subscription;
  return (sub.status === 'active' || sub.status === 'cancelled') && (sub.periodEnd ?? 0) > Date.now();
}

/** Single source of truth for the all-in price (PRD F-002, F-024). */
export function quote(s: State, opts?: { methodId?: string | null }): Quote {
  const r = restaurantById(s.cart.restaurantId);
  const lines = r
    ? s.cart.lines.map((l) => lineToOrderLine(l, r, s.priceOverrides)).filter((l): l is OrderLine => !!l)
    : [];
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const deliveryFee = r?.deliveryFee ?? 0;

  let plus: PlusResult = { state: 'not_member' };
  let deliveryWaived = 0;
  if (r && plusActive(s)) {
    if (!r.plusPartner) plus = { state: 'not_applicable', en: `${r.name} isn’t a Plus partner, so the delivery fee applies.`, bn: `${r.name} প্লাস পার্টনার নয়, তাই ডেলিভারি ফি প্রযোজ্য।` };
    else if (subtotal < PLUS_PLAN.minSubtotal) plus = { state: 'not_applicable', en: `Add ৳${PLUS_PLAN.minSubtotal - subtotal} more for Plus free delivery (minimum ৳${PLUS_PLAN.minSubtotal}).`, bn: `প্লাস ফ্রি ডেলিভারির জন্য আরও ৳${PLUS_PLAN.minSubtotal - subtotal} যোগ করুন।` };
    else {
      deliveryWaived = deliveryFee;
      plus = { state: 'applies', saving: deliveryFee };
    }
  }

  let promo: PromoResult | null = null;
  let discount = 0;
  if (r && s.checkout.promoCode) {
    promo = evaluatePromo(s.checkout.promoCode, subtotal, r, s);
    if (promo.ok) {
      if (promo.freeDelivery) {
        discount = deliveryFee - deliveryWaived;
        if (discount === 0) promo = { ok: false, code: promo.promo.code, en: 'Your delivery is already free with Plus, so this code adds no saving.', bn: 'প্লাসে ডেলিভারি আগেই ফ্রি, তাই এই কোডে বাড়তি সাশ্রয় নেই।' };
      } else discount = Math.min(promo.discount, subtotal);
    }
  }

  const smallOrderFee = subtotal > 0 && subtotal < FEES.smallOrderThreshold ? FEES.smallOrder : 0;
  const serviceFee = subtotal > 0 ? FEES.service : 0;
  const vat = Math.round((subtotal * FEES.vatPct) / 100);
  const method = PAYMENT_METHODS.find((m) => m.id === (opts?.methodId ?? s.checkout.method));
  const methodFee = method?.fee ?? 0;
  const tip = s.checkout.tip;
  const beforeCredit = subtotal + deliveryFee - deliveryWaived + serviceFee + smallOrderFee + vat + tip + methodFee - discount;
  const credit = s.checkout.useCredit ? Math.min(s.credit, Math.max(0, beforeCredit)) : 0;
  const total = Math.max(0, beforeCredit - credit);

  return {
    lines,
    restaurant: r,
    promo,
    plus,
    belowMinimum: r && subtotal < r.minOrder ? r.minOrder - subtotal : 0,
    pricing: {
      subtotal,
      deliveryFee,
      deliveryWaived,
      serviceFee,
      smallOrderFee,
      vat,
      tip,
      methodFee,
      discount,
      credit,
      total,
      promoCode: promo?.ok ? promo.promo.code : undefined,
      plusApplied: plus.state === 'applies',
    },
  };
}

export function cartCount(s: State) {
  return s.cart.lines.reduce((n, l) => n + l.qty, 0);
}
