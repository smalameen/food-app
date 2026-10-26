import { useEffect, useRef, useState } from 'react';
import {
  Banknote,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  CreditCard,
  Info,
  LoaderCircle,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
} from 'lucide-react';
import { PAYMENT_METHODS, PROMOS, type PaymentMethodId } from '../data';
import { changeQty, latestAttempt, placeOrder, removeLine, startAttempt } from '../actions';
import { evaluatePromo, quote, restaurantById } from '../pricing';
import { getState, go, money, track, trackNow, update, useAppState, useT, type Handoff } from '../store';
import { CityMap } from '../components/CityMap';
import { HelpButton, PriceBreakdown, Sheet, Switch, TopBar } from '../components/ui';

const METHOD_ICON: Record<PaymentMethodId, typeof Banknote> = { cod: Banknote, bkash: Smartphone, nagad: Smartphone, card: CreditCard };

type Errors = Partial<Record<'address' | 'phone' | 'method' | 'minimum' | 'limit', string>>;

export function Checkout() {
  const s = useAppState();
  const t = useT();
  const q = quote(s);
  const r = q.restaurant;
  const c = s.checkout;
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [priceChange, setPriceChange] = useState<Extract<ReturnType<typeof placeOrder>, { kind: 'price_changed' }> | null>(null);
  const submittingRef = useRef(false);
  const m = (n: number) => money(n, s.lang);

  useEffect(() => {
    if (s.cart.lines.length) trackNow('checkout_started', { restaurant: s.cart.restaurantId ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingOrder = s.orderIds.map((id) => s.orders[id]).find((o) => o.stage === 'awaiting_payment' && ['pending', 'processing'].includes(latestAttempt(o)?.status ?? ''));

  if (!r || q.lines.length === 0) {
    return (
      <main className="screen">
        <TopBar title={t('Your cart', 'আপনার কার্ট')} fallback="" />
        <div className="empty">
          <ShoppingBag size={40} />
          <h2>{t('Your cart is empty', 'কার্ট খালি')}</h2>
          <p style={{ marginTop: 6 }}>{t('Pick a restaurant to start an order.', 'অর্ডার শুরু করতে একটি রেস্টুরেন্ট বেছে নিন।')}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => go('')}>{t('Browse restaurants', 'রেস্টুরেন্ট দেখুন')}</button>
        </div>
      </main>
    );
  }

  const set = (fn: (d: typeof s.checkout) => void) => update((d) => fn(d.checkout));
  const method = PAYMENT_METHODS.find((x) => x.id === c.method);

  const validate = (): Errors => {
    const e: Errors = {};
    if (!c.address || !c.address.confirmed) e.address = t('Choose a delivery address and confirm the pin.', 'ডেলিভারি ঠিকানা বেছে নিয়ে পিন নিশ্চিত করুন।');
    if (!/^01[3-9]\d{8}$/.test(c.phone.replace(/[\s-]/g, ''))) e.phone = t('Enter an 11-digit mobile number starting with 01.', '০১ দিয়ে শুরু ১১ সংখ্যার মোবাইল নম্বর দিন।');
    if (!c.method) e.method = t('Choose how you’ll pay.', 'কীভাবে পেমেন্ট করবেন বেছে নিন।');
    if (q.belowMinimum > 0) e.minimum = t(`Add ${m(q.belowMinimum)} more to reach ${r.name}’s ${m(r.minOrder)} minimum.`, `${r.name}-এর ন্যূনতম ${m(r.minOrder)} পূরণে আরও ${m(q.belowMinimum)} যোগ করুন।`);
    if (method?.maxTotal && q.pricing.total > method.maxTotal) e.limit = t(`Cash on delivery is available up to ${m(method.maxTotal)}. Choose another method.`, `ক্যাশ অন ডেলিভারি ${m(method.maxTotal)} পর্যন্ত। অন্য পদ্ধতি বেছে নিন।`);
    return e;
  };

  const submit = async (consented = false) => {
    if (submittingRef.current) return; // guard against double taps
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      update((d) => track(d, 'order_submit_failed', { reason: Object.keys(e).join(',') }));
      requestAnimationFrame(() => document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    trackNow('order_submit_started', { method: c.method ?? '' });
    await new Promise((res) => setTimeout(res, 700)); // network round trip
    const res = placeOrder(consented);
    submittingRef.current = false;
    setSubmitting(false);
    if (res.kind === 'price_changed') return setPriceChange(res);
    const o = getState().orders[res.id];
    if (res.kind === 'existing') return go(o.stage === 'awaiting_payment' ? 'pay/' + o.id : 'order/' + o.id);
    if (o.method === 'cod') return go('pay/' + o.id);
    startAttempt(o.id, o.method);
  };

  const ctaLabel = !method
    ? t('Place order', 'অর্ডার করুন')
    : method.id === 'cod'
      ? t('Place order · pay cash', 'অর্ডার করুন · ক্যাশে')
      : t(`Pay with ${method.en}`, `${method.bn} দিয়ে পেমেন্ট`);

  return (
    <main className="screen wide has-dock">
      <TopBar title={t('Checkout', 'চেকআউট')} fallback={'r/' + r.id} help />

      <div className="split">
      <div className="pad stack-lg" style={{ paddingTop: 16 }}>
        {pendingOrder && (
          <button className="callout callout-warn" style={{ border: 0, width: '100%', textAlign: 'left' }} onClick={() => go('pay/' + pendingOrder.id)}>
            <Clock size={18} />
            <span className="grow small">
              <strong>{t('A payment is still being confirmed', 'একটি পেমেন্ট এখনও যাচাই হচ্ছে')}</strong>
              <br />
              {t(`Order ${pendingOrder.id} (${m(pendingOrder.pricing.total)}). Check it before paying again so you aren’t charged twice.`, `অর্ডার ${pendingOrder.id} (${m(pendingOrder.pricing.total)})। দুবার চার্জ এড়াতে আবার পেমেন্টের আগে দেখে নিন।`)}
            </span>
            <ChevronRight size={18} />
          </button>
        )}

        {/* 1. Order summary */}
        <section className="card" aria-labelledby="sum-h">
          <div className="row-between">
            <h2 id="sum-h">{r.name}</h2>
            <button className="text-btn" onClick={() => go('r/' + r.id)}><Plus size={16} />{t('Add items', 'আরও যোগ')}</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {q.lines.map((l) => (
              <div key={l.key} className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--line)', alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="strong">{t(l.en, l.bn)}</div>
                  {l.optionsEn.length > 0 && <div className="small muted">{(s.lang === 'bn' ? l.optionsBn : l.optionsEn).join(', ')}</div>}
                  <div className="small tabular" style={{ marginTop: 2 }}>{m(l.unitPrice * l.qty)}{l.qty > 1 && <span className="faint"> · {m(l.unitPrice)} {t('each', 'প্রতিটি')}</span>}</div>
                </div>
                <div className="stepper" role="group" aria-label={t(`Quantity of ${l.en}`, `${l.bn} পরিমাণ`)}>
                  <button onClick={() => (l.qty === 1 ? removeLine(l.key) : changeQty(l.key, -1))} aria-label={l.qty === 1 ? t('Remove', 'সরান') : t('Decrease', 'কমান')}>
                    {l.qty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
                  </button>
                  <span>{l.qty}</span>
                  <button onClick={() => changeQty(l.key, 1)} aria-label={t('Increase', 'বাড়ান')}><Plus size={15} /></button>
                </div>
              </div>
            ))}
          </div>
          {errors.minimum && q.belowMinimum > 0 && <p className="field-error" data-error="true"><CircleAlert size={15} />{errors.minimum}</p>}
          {r.platformMarkupPct > 0 && <p className="tiny faint" style={{ marginTop: 6 }}>{t(`Includes the restaurant’s ${r.platformMarkupPct}% delivery-menu markup over in-store prices.`, `দোকানের দামের চেয়ে রেস্টুরেন্টের ${r.platformMarkupPct}% ডেলিভারি-মেনু মার্কআপ অন্তর্ভুক্ত।`)}</p>}
        </section>

        {/* 2. Address */}
        <section aria-labelledby="addr-h" data-error={!!errors.address && !c.address?.confirmed}>
          <h2 id="addr-h" style={{ marginBottom: 10 }}>{t('Delivery address', 'ডেলিভারি ঠিকানা')}</h2>
          {c.address ? (
            <button className="card" style={{ width: '100%', textAlign: 'left', display: 'block' }} onClick={() => go('address')}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <MapPin size={20} color="var(--accent)" style={{ marginTop: 2, flex: 'none' }} />
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <span className="strong">{c.address.label}</span>
                    {c.address.confirmed && <span className="badge badge-good"><Check size={12} />{t('Pin confirmed', 'পিন নিশ্চিত')}</span>}
                  </div>
                  <div className="small">{c.address.line}, {c.address.area}</div>
                  <div className="small muted">{[c.address.building, c.address.floor, c.address.landmark].filter(Boolean).join(' · ')}</div>
                </div>
                <span className="text-btn" style={{ padding: 0, minHeight: 0 }}>{t('Change', 'বদলান')}</span>
              </div>
              <div className="addr-preview" style={{ marginTop: 10, pointerEvents: 'none' }}>
                <CityMap destination={c.address.pos} label={t('Delivery pin', 'ডেলিভারি পিন')} />
              </div>
            </button>
          ) : (
            <button className="btn btn-secondary btn-block" onClick={() => { trackNow('address_selection_started'); go('address'); }} aria-invalid={!!errors.address}>
              <MapPin size={18} /> {t('Choose a delivery address', 'ডেলিভারি ঠিকানা বেছে নিন')}
            </button>
          )}
          {errors.address && !c.address?.confirmed && <p className="field-error"><CircleAlert size={15} />{errors.address}</p>}
        </section>

        {/* 3. Contact + instructions */}
        <section className="stack" aria-labelledby="contact-h">
          <h2 id="contact-h">{t('Contact & handoff', 'যোগাযোগ ও হস্তান্তর')}</h2>
          <label className="field" data-error={!!errors.phone}>
            <span className="field-label">{t('Mobile number', 'মোবাইল নম্বর')} <span className="faint">{t('Required', 'আবশ্যক')}</span></span>
            <input
              className="input"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={c.phone}
              aria-invalid={!!errors.phone}
              aria-describedby="phone-hint"
              onChange={(e) => set((d) => void (d.phone = e.target.value))}
              onBlur={() => errors.phone && setErrors((x) => ({ ...x, phone: /^01[3-9]\d{8}$/.test(c.phone.replace(/[\s-]/g, '')) ? undefined : x.phone }))}
            />
            {errors.phone ? (
              <span className="field-error"><CircleAlert size={15} />{errors.phone}</span>
            ) : (
              <span className="field-hint" id="phone-hint">{t('Only used if the rider can’t find you. They see a masked number, never yours.', 'রাইডার খুঁজে না পেলে ব্যবহার হয়। তারা মাস্ক করা নম্বর দেখেন, আপনারটা নয়।')}</span>
            )}
          </label>
          <label className="field">
            <span className="field-label">{t('Note for the rider', 'রাইডারের জন্য নোট')} <span className="faint">{t('Optional', 'ঐচ্ছিক')}</span></span>
            <textarea
              className="textarea"
              placeholder={t('e.g. Call when you reach the gate; lift is on the left', 'যেমন: গেটে এসে কল দিন; লিফট বাম দিকে')}
              value={c.instructions}
              maxLength={200}
              onChange={(e) => set((d) => void (d.instructions = e.target.value))}
              onBlur={() => c.instructions && trackNow('delivery_instructions_added')}
            />
          </label>
          <div>
            <div className="field-label">{t('Handoff', 'হস্তান্তর')}</div>
            <div className="chips" role="radiogroup" aria-label={t('Handoff', 'হস্তান্তর')}>
              {([
                ['hand', 'Hand it to me', 'আমার হাতে দিন'],
                ['door', 'Meet at the door', 'দরজায় দেখা'],
                ['leave', 'Leave at door + photo', 'দরজায় রেখে ছবি দিন'],
              ] as [Handoff, string, string][]).map(([id, en, bn]) => (
                <button key={id} className="chip" role="radio" aria-checked={c.handoff === id} onClick={() => set((d) => void (d.handoff = id))}>{t(en, bn)}</button>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Offers */}
        <PromoSection />

        {/* 5. Tip */}
        <section aria-labelledby="tip-h">
          <h2 id="tip-h">{t('Tip your rider', 'রাইডারকে টিপ')} <span className="small faint" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{t('optional · 100% goes to them', 'ঐচ্ছিক · পুরোটা রাইডারের')}</span></h2>
          <div className="chips" role="radiogroup" style={{ marginTop: 10 }}>
            {[0, 20, 40, 60].map((v) => (
              <button key={v} className="chip" role="radio" aria-checked={c.tip === v} onClick={() => set((d) => void (d.tip = v))}>{v ? m(v) : t('No tip', 'টিপ নয়')}</button>
            ))}
          </div>
        </section>

        {/* 6. Payment */}
        <section aria-labelledby="pay-h" data-error={!!errors.method || !!errors.limit}>
          <h2 id="pay-h" style={{ marginBottom: 10 }}>{t('Payment method', 'পেমেন্ট পদ্ধতি')}</h2>
          <div role="radiogroup" aria-labelledby="pay-h">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = METHOD_ICON[pm.id];
              const overLimit = pm.maxTotal !== undefined && q.pricing.total > pm.maxTotal;
              const disabled = !pm.enabled;
              return (
                <button
                  key={pm.id}
                  className="choice"
                  role="radio"
                  aria-checked={c.method === pm.id}
                  aria-disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    set((d) => void (d.method = pm.id));
                    setErrors((x) => ({ ...x, method: undefined, limit: undefined }));
                    trackNow('payment_method_selected', { method: pm.id });
                  }}
                >
                  <span className="radio-dot" />
                  <Icon size={20} style={{ flex: 'none', marginTop: 1 }} />
                  <span className="grow">
                    <span className="strong" style={{ display: 'block' }}>{t(pm.en, pm.bn)}</span>
                    <span className="small muted">{disabled ? t(pm.disabledEn!, pm.disabledBn!) : t(pm.noteEn, pm.noteBn)}</span>
                    {overLimit && !disabled && <span className="small" style={{ display: 'block', color: 'var(--bad)' }}>{t('Not available for this total.', 'এই মোটের জন্য প্রযোজ্য নয়।')}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          {(errors.method || errors.limit) && <p className="field-error"><CircleAlert size={15} />{errors.method ?? errors.limit}</p>}
        </section>

      </div>

      <aside className="pad stack-lg" style={{ paddingTop: 16 }}>
        {/* 7. Price */}
        <section className="card" aria-labelledby="price-h" onFocus={() => trackNow('price_breakdown_viewed')}>
          <h2 id="price-h" style={{ marginBottom: 8 }}>{t('What you’ll pay', 'আপনি যা দেবেন')}</h2>
          {s.credit > 0 && (
            <div className="row-between" style={{ marginBottom: 8 }}>
              <span className="small row" style={{ gap: 6 }}><Wallet size={16} />{t(`Use ${m(s.credit)} Khabar credit`, `${m(s.credit)} খাবার ক্রেডিট ব্যবহার`)}</span>
              <Switch checked={c.useCredit} onChange={(v) => set((d) => void (d.useCredit = v))} label={t('Use credit', 'ক্রেডিট ব্যবহার')} />
            </div>
          )}
          <PriceBreakdown p={q.pricing} />
          <p className="tiny faint" style={{ marginTop: 10 }}>
            {t('This total is locked when you place the order. No fee is added afterwards without asking you first.', 'অর্ডার দেওয়ার সময় এই মোট লক হয়। পরে আপনার অনুমতি ছাড়া কোনো ফি যোগ হয় না।')}
          </p>
        </section>

        <div className="callout small">
          <Info size={16} />
          <span>{t('Free cancellation until the restaurant starts cooking. Paid online? Refunds start automatically.', 'রান্না শুরুর আগ পর্যন্ত বিনামূল্যে বাতিল। অনলাইনে পেমেন্ট করলে রিফান্ড স্বয়ংক্রিয়ভাবে শুরু হয়।')}</span>
        </div>
        <div className="center mobile-only"><HelpButton /></div>

      <div className="dock">
        <div className="dock-total">
          <span className="muted small">{t('Total to pay', 'মোট পরিশোধ')}</span>
          <span className="amount" aria-live="polite">{m(q.pricing.total)}</span>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => submit()} disabled={submitting} aria-busy={submitting}>
          {submitting ? <><LoaderCircle size={18} className="spin" /> {t('Creating your order…', 'অর্ডার তৈরি হচ্ছে…')}</> : <>{ctaLabel} · {m(q.pricing.total)}</>}
        </button>
        <div className="center desk-only" style={{ marginTop: 8 }}><HelpButton /></div>
      </div>
      </aside>
      </div>

      {priceChange && (
        <Sheet title={t('A price changed', 'একটি দাম বদলেছে')} onClose={() => setPriceChange(null)}>
          <div className="stack">
            <p>{t(`${priceChange.itemEn} changed from ${m(priceChange.oldPrice)} to ${m(priceChange.newPrice)} since you added it. The restaurant updated its menu.`, `${priceChange.itemBn}-এর দাম ${m(priceChange.oldPrice)} থেকে ${m(priceChange.newPrice)} হয়েছে। রেস্টুরেন্ট মেনু হালনাগাদ করেছে।`)}</p>
            <dl className="kv card">
              <dt>{t('Previous total', 'আগের মোট')}</dt><dd className="faint" style={{ textDecoration: 'line-through' }}>{m(priceChange.oldTotal)}</dd>
              <dt>{t('New total', 'নতুন মোট')}</dt><dd>{m(priceChange.newTotal)}</dd>
              <dt>{t('Difference', 'পার্থক্য')}</dt><dd style={{ color: 'var(--bad)' }}>+{m(priceChange.newTotal - priceChange.oldTotal)}</dd>
            </dl>
            <p className="small muted">{t('Nothing has been charged. Confirm to continue with the new total, or go back and edit your cart.', 'কোনো টাকা কাটা হয়নি। নতুন মোটে চালিয়ে যেতে নিশ্চিত করুন, অথবা কার্ট বদলান।')}</p>
            <button className="btn btn-primary btn-block" onClick={() => { setPriceChange(null); submit(true); }}>{t(`Continue with ${m(priceChange.newTotal)}`, `${m(priceChange.newTotal)}-এ চালিয়ে যান`)}</button>
            <button className="btn btn-secondary btn-block" onClick={() => setPriceChange(null)}>{t('Review my cart', 'কার্ট দেখুন')}</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}


function PromoSection() {
  const s = useAppState();
  const t = useT();
  const q = quote(s);
  const r = q.restaurant!;
  const c = s.checkout;
  const m = (n: number) => money(n, s.lang);
  const subtotal = q.pricing.subtotal;

  const apply = (code: string) => {
    const res = evaluatePromo(code, subtotal, r, s);
    update((d) => {
      d.checkout.promoCode = code.trim().toUpperCase();
      d.checkout.promoInput = code.trim().toUpperCase();
      if (!res.ok) track(d, 'promo_apply_failed', { code: code.trim().toUpperCase() });
    });
  };

  return (
    <section className="stack" aria-labelledby="promo-h">
      <h2 id="promo-h">{t('Offers', 'অফার')}</h2>

      {q.plus.state !== 'not_member' && (
        <div className={'callout ' + (q.plus.state === 'applies' ? 'callout-good' : 'callout-warn')}>
          <Sparkles size={18} />
          <span className="small">
            <strong>Plus: </strong>
            {q.plus.state === 'applies'
              ? t(`Free delivery applies to this order (you save ${m(q.plus.saving)}). Service fee still applies.`, `এই অর্ডারে ফ্রি ডেলিভারি প্রযোজ্য (${m(q.plus.saving)} সাশ্রয়)। সার্ভিস ফি প্রযোজ্য।`)
              : t(q.plus.en, q.plus.bn)}
          </span>
        </div>
      )}

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (c.promoInput.trim()) apply(c.promoInput);
        }}
      >
        <label className="grow">
          <span className="sr-only">{t('Promo code', 'প্রোমো কোড')}</span>
          <input className="input" placeholder={t('Promo code', 'প্রোমো কোড')} value={c.promoInput} autoCapitalize="characters" onChange={(e) => update((d) => void (d.checkout.promoInput = e.target.value))} />
        </label>
        <button className="btn btn-secondary" type="submit"><Tag size={16} />{t('Apply', 'প্রয়োগ')}</button>
      </form>

      {q.promo && (q.promo.ok ? (
        <div className="callout callout-good">
          <Check size={18} />
          <span className="grow small"><strong>{q.promo.promo.code}</strong> {t('applied', 'প্রয়োগ হয়েছে')} — {t(`you save ${m(q.pricing.discount)}`, `${m(q.pricing.discount)} সাশ্রয়`)}</span>
          <button className="text-btn" style={{ minHeight: 0, padding: 0 }} onClick={() => update((d) => void (d.checkout.promoCode = null))}>{t('Remove', 'সরান')}</button>
        </div>
      ) : (
        <div className="callout callout-bad" role="alert">
          <CircleAlert size={18} />
          <div className="grow small">
            <div><strong>{q.promo.code}</strong> {t('wasn’t applied.', 'প্রয়োগ হয়নি।')} {t(q.promo.en, q.promo.bn)}</div>
            {q.promo.alternative && (
              <button className="btn btn-sm btn-secondary" style={{ marginTop: 8 }} onClick={() => apply(q.promo!.ok ? '' : q.promo!.alternative!.code)}>
                {t(`Use ${q.promo.alternative.code} instead`, `এর বদলে ${q.promo.alternative.code} ব্যবহার করুন`)}
              </button>
            )}
          </div>
        </div>
      ))}

      <details>
        <summary className="small strong" style={{ cursor: 'pointer', color: 'var(--brand)', padding: '6px 0' }}>{t('See available offers and conditions', 'অফার ও শর্তাবলি দেখুন')}</summary>
        <div className="card card-flush" style={{ marginTop: 8 }}>
          {PROMOS.map((p) => {
            const res = evaluatePromo(p.code, subtotal, r, s);
            return (
              <div key={p.code} className="list-row" style={{ alignItems: 'flex-start' }}>
                <Tag size={18} style={{ marginTop: 2 }} />
                <div className="grow">
                  <div className="strong">{p.code}</div>
                  <div className="small">{t(p.en, p.bn)}</div>
                  <div className="tiny faint">{t(`Min. ৳${p.minSubtotal} in items · expires ${p.expires}`, `ন্যূনতম ৳${p.minSubtotal} · মেয়াদ ${p.expires}`)}</div>
                  {!res.ok && <div className="tiny" style={{ color: 'var(--bad)' }}>{t(res.en, res.bn)}</div>}
                </div>
                <button className="btn btn-sm btn-secondary" disabled={!res.ok} onClick={() => apply(p.code)}>{t('Apply', 'প্রয়োগ')}</button>
              </div>
            );
          })}
        </div>
      </details>
    </section>
  );
}
