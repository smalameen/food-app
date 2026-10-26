import { useSyncExternalStore } from 'react';
import {
  DEFAULT_ADDRESSES,
  type IssueType,
  type PaymentMethodId,
  type Point,
  type SavedAddress,
  type SupportCategory,
} from './data';

/* ------------------------------------------------------------------ types */

export type Lang = 'en' | 'bn';

export type CartLine = { key: string; itemId: string; qty: number; optionIds: string[] };

export type DeliveryAddress = {
  label: SavedAddress['label'];
  line: string;
  area: string;
  pos: Point;
  building: string;
  floor: string;
  landmark: string;
  notes: string;
  confirmed: boolean;
  savedId?: string;
};

export type PaymentStatus =
  | 'not_started'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'pending'
  | 'expired'
  | 'cod';

/** What the simulated payment provider did. Hidden from the UI until the "server" verifies it. */
export type ProviderOutcome = 'approve' | 'decline' | 'cancel' | 'network_drop' | 'timeout';

export type PaymentAttempt = {
  id: string;
  method: PaymentMethodId;
  startedAt: number;
  status: PaymentStatus;
  outcome?: ProviderOutcome;
  checks: number;
};

export type OrderStage =
  | 'awaiting_payment'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'rider_assigned'
  | 'picked_up'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

export type OrderEvent = {
  at: number;
  en: string;
  bn: string;
  kind: 'info' | 'good' | 'warn' | 'bad';
  stage?: OrderStage;
};

export type Pricing = {
  subtotal: number;
  deliveryFee: number;
  deliveryWaived: number;
  serviceFee: number;
  smallOrderFee: number;
  vat: number;
  tip: number;
  methodFee: number;
  discount: number;
  credit: number;
  total: number;
  promoCode?: string;
  plusApplied: boolean;
};

export type OrderLine = CartLine & {
  unitPrice: number;
  en: string;
  bn: string;
  optionsEn: string[];
  optionsBn: string[];
};

export type StagePlan = {
  confirmed: number;
  preparing: number;
  assigned: number;
  pickedUp: number;
  arriving: number;
  delivered: number;
};

export type Order = {
  id: string;
  idempotencyKey: string;
  createdAt: number;
  restaurantId: string;
  lines: OrderLine[];
  address: DeliveryAddress;
  phone: string;
  handoff: Handoff;
  pricing: Pricing;
  method: PaymentMethodId;
  payment: { status: PaymentStatus; attempts: PaymentAttempt[]; txnRef: string };
  stage: OrderStage;
  simMin: number;
  plan: StagePlan;
  originalEtaMin: number;
  events: OrderEvent[];
  riderId?: string;
  riderStart?: Point;
  riderPos?: Point;
  riderFixAt?: number;
  gps: 'ok' | 'lost';
  staleLogged?: boolean;
  delay?: { en: string; bn: string; addedMin: number; compensation: number; at: number };
  reassignedCount: number;
  otp: string;
  cancel?: { en: string; bn: string; at: number; by: 'customer' | 'restaurant' | 'system' };
  refundIds: string[];
  issueReported?: boolean;
  csat?: number;
  deliveredAt?: number;
};

export type Handoff = 'door' | 'hand' | 'leave';

export type RefundStage = 'requested' | 'approved' | 'processing' | 'credited' | 'failed';

export type Refund = {
  id: string;
  orderId?: string;
  amount: number;
  destination: 'original' | 'credit';
  destinationLabelEn: string;
  destinationLabelBn: string;
  reasonEn: string;
  reasonBn: string;
  stage: RefundStage;
  createdAt: number;
  expectedBy: number;
  history: { stage: RefundStage; at: number }[];
  ticks: number;
};

export type Subscription = {
  status: 'none' | 'active' | 'cancelled';
  method?: PaymentMethodId;
  startedAt?: number;
  periodEnd?: number;
  cancelledAt?: number;
  billing: { id: string; at: number; amount: number; status: 'paid' | 'disputed' | 'refunded' }[];
};

export type TicketMessage = { from: 'me' | 'agent' | 'system'; en: string; bn: string; at: number };

export type Ticket = {
  id: string;
  orderId?: string;
  category: SupportCategory | 'safety' | 'issue';
  channel: 'chat' | 'callback';
  createdAt: number;
  status: 'waiting' | 'open' | 'escalated' | 'resolved';
  context: { en: string; bn: string }[];
  messages: TicketMessage[];
  ticks: number;
  pendingReply?: number;
};

export type Notice = {
  id: string;
  at: number;
  channel: 'push' | 'sms' | 'in-app';
  en: string;
  bn: string;
  bodyEn: string;
  bodyBn: string;
  orderId?: string;
  link?: string;
};

export type AnalyticsEvent = { name: string; at: number; props?: Record<string, string | number | boolean> };

export type Demo = {
  pendingResolvesTo: 'successful' | 'failed';
  priceChangeOnSubmit: boolean;
  speed: 1 | 4;
  paused: boolean;
};

export type State = {
  version: 1;
  lang: Lang;
  lowData: boolean;
  addresses: SavedAddress[];
  cart: { restaurantId: string | null; lines: CartLine[] };
  priceOverrides: Record<string, number>;
  checkout: {
    sessionKey: string;
    address: DeliveryAddress | null;
    phone: string;
    instructions: string;
    handoff: Handoff;
    method: PaymentMethodId | null;
    promoInput: string;
    promoCode: string | null;
    tip: number;
    useCredit: boolean;
  };
  orders: Record<string, Order>;
  orderIds: string[];
  refunds: Record<string, Refund>;
  refundIds: string[];
  credit: number;
  subscription: Subscription;
  tickets: Record<string, Ticket>;
  ticketIds: string[];
  notices: Notice[];
  events: AnalyticsEvent[];
  demo: Demo;
  locationPermission: 'unknown' | 'granted' | 'denied';
  /** Transient UI state (not persisted). */
  ui: {
    providerSheet: { orderId: string; attemptId: string } | null;
    help: { open: boolean; orderId?: string; category?: SupportCategory };
    safety: { open: boolean; orderId?: string };
    demoOpen: boolean;
  };
};

/* ------------------------------------------------------------------ ids */

export function uid(prefix = '', len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return prefix + out;
}

/* ------------------------------------------------------------------ store */

const STORAGE_KEY = 'khabar-state-v1';

function initialState(): State {
  return {
    version: 1,
    lang: 'en',
    lowData: false,
    addresses: DEFAULT_ADDRESSES,
    cart: { restaurantId: null, lines: [] },
    priceOverrides: {},
    checkout: {
      sessionKey: uid('CS-', 10),
      address: null,
      phone: '',
      instructions: '',
      handoff: 'door',
      method: null,
      promoInput: '',
      promoCode: null,
      tip: 0,
      useCredit: false,
    },
    orders: {},
    orderIds: [],
    refunds: {},
    refundIds: [],
    credit: 0,
    subscription: { status: 'none', billing: [] },
    tickets: {},
    ticketIds: [],
    notices: [],
    events: [],
    demo: { pendingResolvesTo: 'successful', priceChangeOnSubmit: false, speed: 1, paused: false },
    locationPermission: 'unknown',
    ui: { providerSheet: null, help: { open: false }, safety: { open: false }, demoOpen: false },
  };
}

function load(): State {
  const base = initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<State>;
    if (saved.version !== 1) return base;
    return { ...base, ...saved, checkout: { ...base.checkout, ...saved.checkout }, demo: { ...base.demo, ...saved.demo }, ui: base.ui };
  } catch {
    return base;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    const { ui: _ui, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* storage unavailable: app keeps working in memory */
  }
}

export function getState() {
  return state;
}

/** Apply a mutation to a copy of the state, then publish it. */
export function update(fn: (draft: State) => void) {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  persist();
  listeners.forEach((l) => l());
}

export function resetAll() {
  state = initialState();
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getState);
}

/* ------------------------------------------------------------------ analytics */

const SESSION_ID = uid('S-', 8);

/** Log a product analytics event (PRD §10). Kept local; no personal data or coordinates. */
export function track(d: State, name: string, props?: AnalyticsEvent['props']) {
  d.events.unshift({ name, at: Date.now(), props: { session: SESSION_ID, ...props } });
  if (d.events.length > 150) d.events.length = 150;
}

export function trackNow(name: string, props?: AnalyticsEvent['props']) {
  update((d) => track(d, name, props));
}

/* ------------------------------------------------------------------ i18n */

export function useT() {
  const { lang } = useAppState();
  return (en: string, bn: string) => (lang === 'bn' ? bn : en);
}

export function money(n: number, lang: Lang) {
  const v = Math.round(n).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN');
  return (n < 0 ? '−৳' : '৳') + v.replace('-', '');
}

export function num(n: number, lang: Lang) {
  return n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-IN');
}

export function clock(ms: number, lang: Lang) {
  return new Date(ms).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function day(ms: number, lang: Lang) {
  return new Date(ms).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/* ------------------------------------------------------------------ routing */

export type Route =
  | { name: 'home' }
  | { name: 'restaurant'; id: string }
  | { name: 'checkout' }
  | { name: 'address' }
  | { name: 'payment'; id: string }
  | { name: 'order'; id: string }
  | { name: 'orders' }
  | { name: 'issue'; id: string }
  | { name: 'refund'; id: string }
  | { name: 'refunds' }
  | { name: 'support'; id: string }
  | { name: 'plus' }
  | { name: 'account' };

export function parseRoute(hash: string): Route {
  const [name, id] = hash.replace(/^#\/?/, '').split('/');
  switch (name) {
    case 'r': return id ? { name: 'restaurant', id } : { name: 'home' };
    case 'checkout': return { name: 'checkout' };
    case 'address': return { name: 'address' };
    case 'pay': return id ? { name: 'payment', id } : { name: 'home' };
    case 'order': return id ? { name: 'order', id } : { name: 'orders' };
    case 'orders': return { name: 'orders' };
    case 'issue': return id ? { name: 'issue', id } : { name: 'orders' };
    case 'refund': return id ? { name: 'refund', id } : { name: 'refunds' };
    case 'refunds': return { name: 'refunds' };
    case 'support': return id ? { name: 'support', id } : { name: 'home' };
    case 'plus': return { name: 'plus' };
    case 'account': return { name: 'account' };
    default: return { name: 'home' };
  }
}

const routeListeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    window.scrollTo(0, 0);
    routeListeners.forEach((l) => l());
  });
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    (cb) => {
      routeListeners.add(cb);
      return () => routeListeners.delete(cb);
    },
    () => window.location.hash,
  );
  return parseRoute(hash);
}

let navDepth = 0;

export function go(path: string, replace = false) {
  const hash = '#/' + path.replace(/^\//, '');
  if (hash === window.location.hash) return;
  if (replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    navDepth++;
    window.location.hash = hash;
  }
}

/** Go back within the app; if the app was opened directly on this screen, go to the fallback. */
export function back(fallback = '') {
  if (navDepth > 0) {
    navDepth--;
    history.back();
  } else go(fallback, true);
}

export type { IssueType };
