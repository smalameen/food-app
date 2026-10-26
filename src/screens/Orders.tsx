import { useState } from 'react';
import { ChevronRight, CircleAlert, Receipt, RotateCcw, TriangleAlert } from 'lucide-react';
import { addToCart, isActive, latestAttempt } from '../actions';
import { itemById, itemPrice, restaurantById } from '../pricing';
import { day, go, money, track, update, useAppState, useT, type Order } from '../store';
import { Sheet } from '../components/ui';

const STAGE_BADGE: Record<string, { en: string; bn: string; cls: string }> = {
  awaiting_payment: { en: 'Payment needed', bn: 'পেমেন্ট বাকি', cls: 'badge-bad' },
  placed: { en: 'Placed', bn: 'দেওয়া হয়েছে', cls: 'badge-info' },
  confirmed: { en: 'Confirmed', bn: 'নিশ্চিত', cls: 'badge-info' },
  preparing: { en: 'Preparing', bn: 'তৈরি হচ্ছে', cls: 'badge-info' },
  rider_assigned: { en: 'Rider assigned', bn: 'রাইডার নিযুক্ত', cls: 'badge-info' },
  picked_up: { en: 'On the way', bn: 'পথে', cls: 'badge-info' },
  arriving: { en: 'Arriving', bn: 'পৌঁছাচ্ছে', cls: 'badge-info' },
  delivered: { en: 'Delivered', bn: 'ডেলিভারি সম্পন্ন', cls: 'badge-good' },
  cancelled: { en: 'Cancelled', bn: 'বাতিল', cls: '' },
};

export function Orders() {
  const s = useAppState();
  const t = useT();
  const orders = s.orderIds.map((id) => s.orders[id]);
  const current = orders.filter((o) => isActive(o) || o.stage === 'awaiting_payment');
  const past = orders.filter((o) => !current.includes(o));

  const row = (o: Order) => {
    const r = restaurantById(o.restaurantId);
    const b = STAGE_BADGE[o.stage];
    const pending = o.stage === 'awaiting_payment' && latestAttempt(o)?.status === 'pending';
    return (
      <button key={o.id} className="list-row" onClick={() => go((o.stage === 'awaiting_payment' ? 'pay/' : 'order/') + o.id)}>
        <div className="grow">
          <div className="row-between">
            <span className="strong">{r?.name}</span>
            <span className={'badge ' + (pending ? 'badge-warn' : b.cls)}>{pending ? t('Confirming payment', 'পেমেন্ট যাচাই') : t(b.en, b.bn)}</span>
          </div>
          <div className="small muted">
            {o.id} · {day(o.createdAt, s.lang)} · {money(o.pricing.total, s.lang)} · {o.lines.reduce((a, l) => a + l.qty, 0)} {t('items', 'আইটেম')}
          </div>
        </div>
        <ChevronRight size={18} className="chev" />
      </button>
    );
  };

  return (
    <main className="screen">
      <header className="topbar" style={{ paddingLeft: 16 }}><h1>{t('Orders', 'অর্ডার')}</h1></header>
      {orders.length === 0 && (
        <div className="empty">
          <Receipt size={40} />
          <h2>{t('No orders yet', 'এখনো কোনো অর্ডার নেই')}</h2>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => go('')}>{t('Find something to eat', 'খাবার খুঁজুন')}</button>
        </div>
      )}
      {current.length > 0 && (<><h2 className="section-title">{t('In progress', 'চলমান')}</h2><div className="pad"><div className="card card-flush">{current.map(row)}</div></div></>)}
      {past.length > 0 && (<><h2 className="section-title">{t('Past orders', 'আগের অর্ডার')}</h2><div className="pad"><div className="card card-flush">{past.map(row)}</div></div></>)}
      {s.refundIds.length > 0 && (
        <div className="pad" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary btn-block" onClick={() => go('refunds')}><Receipt size={18} />{t('Refunds', 'রিফান্ড')} ({s.refundIds.length})</button>
        </div>
      )}
    </main>
  );
}

/**
 * Reorder with a live availability and price check (PRD F-023, F-032).
 * Never resubmits a payment; it only rebuilds the cart for a fresh checkout.
 */
export function ReorderButton({ order }: { order: Order }) {
  const s = useAppState();
  const t = useT();
  const [open, setOpen] = useState(false);
  const r = restaurantById(order.restaurantId)!;
  const m = (n: number) => money(n, s.lang);

  const checks = order.lines.map((l) => {
    const item = itemById(r, l.itemId);
    const optionsPrice = (item?.options ?? []).filter((o) => l.optionIds.includes(o.id)).reduce((a, o) => a + o.price, 0);
    const nowPrice = item ? itemPrice(item, s.priceOverrides) + optionsPrice : 0;
    return { line: l, item, available: !!item?.available && r.status !== 'paused', nowPrice, changed: item ? nowPrice !== l.unitPrice : false };
  });
  const availableCount = checks.filter((c) => c.available).length;

  const confirm = () => {
    update((d) => {
      track(d, 'reorder_started', { order: order.id });
      if (availableCount < checks.length) track(d, 'reorder_blocked_unavailable', { order: order.id, missing: checks.length - availableCount });
    });
    const cartElsewhere = s.cart.lines.length > 0;
    checks.filter((c) => c.available).forEach((c, i) => {
      if (i === 0 && cartElsewhere) update((d) => void (d.cart = { restaurantId: null, lines: [] }));
      addToCart(r.id, c.line.itemId, c.line.optionIds, c.line.qty);
    });
    setOpen(false);
    go('checkout');
  };

  return (
    <>
      <button className="btn btn-primary btn-block" onClick={() => setOpen(true)}><RotateCcw size={18} />{t('Order this again', 'আবার অর্ডার করুন')}</button>
      {open && (
        <Sheet title={t('Order again', 'আবার অর্ডার')} onClose={() => setOpen(false)}>
          <div className="stack">
            <p className="small muted">{t('We checked today’s menu and prices. Nothing is charged until you review checkout.', 'আজকের মেনু ও দাম মিলিয়ে দেখেছি। চেকআউট দেখার আগে কিছুই চার্জ হবে না।')}</p>
            {r.status === 'paused' && <div className="callout callout-bad small"><TriangleAlert size={16} /><span>{t(r.pausedReasonEn!, r.pausedReasonBn!)}</span></div>}
            <div className="card card-flush">
              {checks.map((c) => (
                <div key={c.line.key} className="list-row">
                  <div className="grow">
                    <div className={c.available ? 'strong' : 'strong faint'}>{c.line.qty} × {t(c.line.en, c.line.bn)}</div>
                    {!c.available && <div className="small" style={{ color: 'var(--bad)' }}>{t('Not available today — we’ll leave it out', 'আজ পাওয়া যাচ্ছে না — বাদ দেওয়া হবে')}</div>}
                    {c.available && c.changed && <div className="small" style={{ color: 'var(--warn)' }}>{t('Price changed', 'দাম বদলেছে')}: <span className="strike">{m(c.line.unitPrice)}</span>{m(c.nowPrice)}</div>}
                  </div>
                  {c.available && !c.changed && <span className="small muted tabular">{m(c.nowPrice * c.line.qty)}</span>}
                </div>
              ))}
            </div>
            {s.cart.lines.length > 0 && <div className="callout callout-warn small"><CircleAlert size={16} /><span>{t('This replaces what’s in your cart now.', 'এটি বর্তমান কার্ট প্রতিস্থাপন করবে।')}</span></div>}
            <button className="btn btn-primary btn-block" disabled={availableCount === 0} onClick={confirm}>
              {availableCount === 0 ? t('Nothing available to reorder', 'কিছুই পাওয়া যাচ্ছে না') : t(`Add ${availableCount} available item${availableCount > 1 ? 's' : ''} to cart`, `${availableCount}টি আইটেম কার্টে যোগ করুন`)}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
