import { useEffect, useState } from 'react';
import { Banknote, Bike, CircleCheck, CircleX, Clock, CreditCard, LoaderCircle, RefreshCw, Smartphone, Undo2 } from 'lucide-react';
import { PAYMENT_METHODS, type PaymentMethodId } from '../data';
import { abandonUnpaid, latestAttempt, methodLabel, startAttempt, switchToCash, verifyPayment } from '../actions';
import { restaurantById } from '../pricing';
import { go, money, useAppState, useT } from '../store';
import { HelpButton, PriceBreakdown, Sheet, TopBar } from '../components/ui';

const METHOD_ICON: Record<PaymentMethodId, typeof Banknote> = { cod: Banknote, bkash: Smartphone, nagad: Smartphone, card: CreditCard };

export function PaymentScreen({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const o = s.orders[id];
  const [checking, setChecking] = useState(false);
  const [chooser, setChooser] = useState(false);
  const attempt = o ? latestAttempt(o) : undefined;
  const status = o?.payment.status;

  // Returning from the provider is not proof of payment: verify with the "server" first.
  useEffect(() => {
    if (status !== 'processing') return;
    const timer = setTimeout(() => verifyPayment(id), 1600);
    return () => clearTimeout(timer);
  }, [status, id]);

  if (!o) {
    return (
      <main className="screen">
        <TopBar title={t('Order', 'অর্ডার')} />
        <div className="empty">{t('We couldn’t find this order on this device.', 'এই ডিভাইসে অর্ডারটি পাওয়া যায়নি।')}</div>
      </main>
    );
  }

  const m = (n: number) => money(n, s.lang);
  const r = restaurantById(o.restaurantId)!;
  const ml = methodLabel(o.method);
  const methodName = t(ml.en, ml.bn);

  const checkStatus = async (then?: () => void) => {
    setChecking(true);
    await new Promise((res) => setTimeout(res, 1100));
    if (status === 'pending' || status === 'processing') verifyPayment(id);
    setChecking(false);
    then?.();
  };

  const retry = (method: PaymentMethodId) =>
    // Query the existing transaction before any new attempt (PRD F-010).
    checkStatus(() => {
      if (method === 'cod') switchToCash(id);
      else startAttempt(id, method);
    });

  const refBlock = (
    <dl className="kv card">
      <dt>{t('Order', 'অর্ডার')}</dt><dd>{o.id}</dd>
      <dt>{t('Amount', 'পরিমাণ')}</dt><dd>{m(o.pricing.total)}</dd>
      <dt>{t('Method', 'পদ্ধতি')}</dt><dd>{methodName}</dd>
      <dt>{t('Reference', 'রেফারেন্স')}</dt><dd>{o.payment.txnRef}</dd>
      {o.payment.attempts.length > 1 && (<><dt>{t('Attempts', 'চেষ্টা')}</dt><dd>{o.payment.attempts.length}</dd></>)}
    </dl>
  );

  /* ---------- confirmed (paid or cash) */
  if (o.stage !== 'awaiting_payment' && o.stage !== 'cancelled') {
    return (
      <main className="screen has-dock">
        <TopBar title={t('Order confirmed', 'অর্ডার নিশ্চিত')} fallback="" help orderId={o.id} />
        <div className="status-hero">
          <div className="status-icon good"><CircleCheck size={38} /></div>
          <h1>{o.method === 'cod' ? t('Order placed', 'অর্ডার দেওয়া হয়েছে') : t('Paid and confirmed', 'পেমেন্ট ও অর্ডার নিশ্চিত')}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {o.method === 'cod'
              ? t(`Pay ${m(o.pricing.total)} in cash when it arrives.`, `পৌঁছালে ${m(o.pricing.total)} নগদ দিন।`)
              : t(`${methodName} payment of ${m(o.pricing.total)} is confirmed.`, `${methodName}-এ ${m(o.pricing.total)} পেমেন্ট নিশ্চিত।`)}
          </p>
        </div>
        <div className="pad stack">
          <div className="card">
            <div className="row-between"><span className="muted small">{t('Estimated arrival', 'আনুমানিক পৌঁছানো')}</span><span className="badge">{t('Estimate', 'আনুমানিক')}</span></div>
            <div className="eta">{Math.max(1, Math.round(o.plan.delivered - o.simMin))}–{Math.round(o.plan.delivered - o.simMin) + 8} {t('min', 'মিনিট')}</div>
          </div>
          {refBlock}
          <div className="card">
            <h3>{r.name}</h3>
            <ul className="small" style={{ margin: '8px 0', paddingLeft: 18 }}>
              {o.lines.map((l) => <li key={l.key}>{l.qty} × {t(l.en, l.bn)}{l.optionsEn.length ? ` (${(s.lang === 'bn' ? l.optionsBn : l.optionsEn).join(', ')})` : ''}</li>)}
            </ul>
            <hr className="divider" />
            <PriceBreakdown p={o.pricing} compact />
          </div>
          <div className="card small">
            <div className="strong">{t('Delivering to', 'ডেলিভারি ঠিকানা')}</div>
            <div>{o.address.line}, {o.address.area}</div>
            <div className="muted">{[o.address.building, o.address.floor, o.address.landmark].filter(Boolean).join(' · ')}</div>
          </div>
          <p className="small muted center">{t('Free cancellation until the kitchen starts cooking.', 'রান্না শুরুর আগ পর্যন্ত বিনামূল্যে বাতিল।')}</p>
        </div>
        <div className="dock">
          <button className="btn btn-primary btn-block" onClick={() => go('order/' + o.id, true)}><Bike size={18} /> {t('Track your order', 'অর্ডার ট্র্যাক করুন')}</button>
        </div>
      </main>
    );
  }

  /* ---------- cancelled / closed */
  if (o.stage === 'cancelled') {
    return (
      <main className="screen">
        <TopBar title={t('Checkout closed', 'চেকআউট বন্ধ')} fallback="" help orderId={o.id} />
        <div className="status-hero">
          <div className="status-icon info"><Undo2 size={34} /></div>
          <h1>{t('This attempt is closed', 'এই চেষ্টাটি বন্ধ')}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{o.cancel ? t(o.cancel.en, o.cancel.bn) : ''}</p>
        </div>
        <div className="pad stack">
          {refBlock}
          <button className="btn btn-primary btn-block" onClick={() => go('checkout')}>{t('Go to my cart', 'কার্টে যান')}</button>
        </div>
      </main>
    );
  }

  /* ---------- awaiting payment: processing / pending / failed / not started */
  const failureCopy: Record<string, { h: [string, string]; p: [string, string] }> = {
    failed: {
      h: ['Payment didn’t go through', 'পেমেন্ট সম্পন্ন হয়নি'],
      p: [`${methodName} declined the payment. No money was taken. This is often a balance or daily-limit issue.`, `${methodName} পেমেন্ট গ্রহণ করেনি। কোনো টাকা কাটা হয়নি। সাধারণত ব্যালান্স বা দৈনিক সীমার কারণে হয়।`],
    },
    cancelled: {
      h: ['Payment was cancelled', 'পেমেন্ট বাতিল হয়েছে'],
      p: ['You left the payment page before finishing. No money was taken, and your order is saved.', 'শেষ করার আগে পেমেন্ট পেজ ছেড়েছেন। কোনো টাকা কাটা হয়নি, অর্ডার সংরক্ষিত আছে।'],
    },
    expired: {
      h: ['The payment session timed out', 'পেমেন্ট সেশনের মেয়াদ শেষ'],
      p: ['The payment page expired before it was completed. No money was taken.', 'সম্পন্ন হওয়ার আগে পেমেন্ট পেজের মেয়াদ শেষ হয়েছে। কোনো টাকা কাটা হয়নি।'],
    },
  };

  return (
    <main className="screen has-dock">
      <TopBar title={t('Payment', 'পেমেন্ট')} fallback="checkout" help orderId={o.id} />

      {status === 'processing' && (
        <div className="status-hero" role="status">
          <div className="status-icon info"><LoaderCircle size={36} className="spin" /></div>
          <h1>{t(`Checking with ${ml.en}…`, `${ml.bn}-এর সাথে যাচাই করা হচ্ছে…`)}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{t('This takes a few seconds. You won’t be charged twice.', 'কয়েক সেকেন্ড লাগবে। দুবার চার্জ হবে না।')}</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="status-hero" role="status">
          <div className="status-icon warn"><Clock size={36} /></div>
          <h1>{t('Confirming your payment', 'পেমেন্ট নিশ্চিত করা হচ্ছে')}</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            {t(`The connection dropped before ${ml.en} told us the result. We’re checking with them now. Please don’t pay again — if money was taken, this order goes ahead automatically.`, `${ml.bn} ফলাফল জানানোর আগে সংযোগ বিচ্ছিন্ন হয়েছে। আমরা যাচাই করছি। আবার পেমেন্ট করবেন না — টাকা কাটা হয়ে থাকলে অর্ডার স্বয়ংক্রিয়ভাবে এগোবে।`)}
          </p>
        </div>
      )}

      {(status === 'failed' || status === 'cancelled' || status === 'expired') && (
        <div className="status-hero" role="alert">
          <div className="status-icon bad"><CircleX size={36} /></div>
          <h1>{t(...failureCopy[status].h)}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{t(...failureCopy[status].p)}</p>
        </div>
      )}

      {(status === 'not_started' || !attempt) && (
        <div className="status-hero">
          <div className="status-icon info"><CreditCard size={34} /></div>
          <h1>{t('Finish paying for your order', 'অর্ডারের পেমেন্ট সম্পন্ন করুন')}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{t('Your order is saved. Nothing has been charged yet.', 'অর্ডার সংরক্ষিত আছে। এখনো কোনো টাকা কাটা হয়নি।')}</p>
        </div>
      )}

      <div className="pad stack">
        {refBlock}
        {status === 'pending' && (
          <p className="small muted center">{t('Leave this screen if you like — we’ll notify you, and the order stays on your home screen.', 'চাইলে এই স্ক্রিন ছাড়তে পারেন — আমরা জানাব, অর্ডারটি হোমে থাকবে।')}</p>
        )}
        <div className="center"><HelpButton orderId={o.id} /></div>
        {status !== 'pending' && status !== 'processing' && (
          <button className="text-btn" style={{ margin: '0 auto', display: 'flex' }} onClick={() => { abandonUnpaid(o.id); go('checkout', true); }}>
            {t('Cancel this checkout', 'এই চেকআউট বাতিল করুন')}
          </button>
        )}
      </div>

      <div className="dock">
        {status === 'pending' && (
          <button className="btn btn-primary btn-block" disabled={checking} onClick={() => checkStatus()}>
            {checking ? <LoaderCircle size={18} className="spin" /> : <RefreshCw size={18} />} {t('Check payment status', 'পেমেন্টের অবস্থা দেখুন')}
          </button>
        )}
        {status === 'processing' && (
          <button className="btn btn-primary btn-block" disabled><LoaderCircle size={18} className="spin" /> {t('Verifying…', 'যাচাই হচ্ছে…')}</button>
        )}
        {(status === 'failed' || status === 'cancelled' || status === 'expired' || status === 'not_started' || !attempt) && (
          <div className="stack">
            <button className="btn btn-primary btn-block" disabled={checking} onClick={() => retry(o.method)}>
              {checking ? <><LoaderCircle size={18} className="spin" /> {t('Checking your last payment…', 'শেষ পেমেন্ট যাচাই হচ্ছে…')}</> : t(`Try ${ml.en} again · ${m(o.pricing.total)}`, `আবার ${ml.bn} · ${m(o.pricing.total)}`)}
            </button>
            <button className="btn btn-secondary btn-block" disabled={checking} onClick={() => setChooser(true)}>{t('Use another method', 'অন্য পদ্ধতি ব্যবহার করুন')}</button>
          </div>
        )}
      </div>

      {chooser && (
        <Sheet title={t('Pay another way', 'অন্যভাবে পেমেন্ট')} onClose={() => setChooser(false)}>
          <div className="stack">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = METHOD_ICON[pm.id];
              const over = pm.maxTotal !== undefined && o.pricing.total > pm.maxTotal;
              const disabled = !pm.enabled || over;
              return (
                <button key={pm.id} className="choice" aria-disabled={disabled} onClick={() => { if (disabled) return; setChooser(false); retry(pm.id); }}>
                  <Icon size={20} />
                  <span className="grow">
                    <span className="strong" style={{ display: 'block' }}>{t(pm.en, pm.bn)}</span>
                    <span className="small muted">{!pm.enabled ? t(pm.disabledEn!, pm.disabledBn!) : over ? t('Not available for this total.', 'এই মোটের জন্য প্রযোজ্য নয়।') : t(pm.noteEn, pm.noteBn)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </main>
  );
}
