import { useState } from 'react';
import {
  ChevronRight,
  Eye,
  FlaskConical,
  Headphones,
  Lock,
  MessageCircle,
  Phone,
  Receipt,
  Share2,
  ShieldCheck,
  Siren,
  TriangleAlert,
} from 'lucide-react';
import { PAYMENT_METHODS, SUPPORT_CATEGORIES, type SupportCategory } from '../data';
import {
  closeProvider,
  isActive,
  openTicket,
  providerReturned,
  simulateDelay,
  simulateRenewalReminder,
  simulateRestaurantFailure,
  simulateRiderCancel,
  toggleGps,
} from '../actions';
import { restaurantById } from '../pricing';
import { clock, go, money, resetAll, update, useAppState, useT } from '../store';
import { Sheet, Switch } from './ui';

/* ---------------------------------------------------------------- help (PRD F-021, F-027) */

export function HelpSheet() {
  const { help } = useAppState().ui;
  return help.open ? <HelpBody /> : null;
}

function HelpBody() {
  const s = useAppState();
  const t = useT();
  const { help } = s.ui;
  const [category, setCategory] = useState<SupportCategory | null>(help.category ?? null);
  const recent = s.orderIds.slice(0, 3).map((id) => s.orders[id]);
  const [orderId, setOrderId] = useState<string | undefined>(help.orderId ?? recent[0]?.id);
  const close = () => update((d) => void (d.ui.help = { open: false }));
  const order = orderId ? s.orders[orderId] : undefined;
  const cat = SUPPORT_CATEGORIES.find((c) => c.id === category);
  const urgent = category === 'deducted' || category === 'duplicate' || category === 'refund';

  return (
    <Sheet title={cat ? t(cat.en, cat.bn) : t('How can we help?', 'কীভাবে সাহায্য করতে পারি?')} onClose={close}>
      {!cat ? (
        <div className="stack">
          {recent.length > 0 && (
            <div>
              <div className="field-label">{t('About this order', 'এই অর্ডার সম্পর্কে')}</div>
              <div className="chips" role="radiogroup">
                {recent.map((o) => (
                  <button key={o.id} className="chip" role="radio" aria-checked={orderId === o.id} onClick={() => setOrderId(o.id)}>
                    {o.id} · {restaurantById(o.restaurantId)?.name}
                  </button>
                ))}
                <button className="chip" role="radio" aria-checked={!orderId} onClick={() => setOrderId(undefined)}>
                  {t('Not about an order', 'অর্ডার নয়')}
                </button>
              </div>
            </div>
          )}
          <div className="card card-flush">
            {SUPPORT_CATEGORIES.map((c) => (
              <button key={c.id} className="list-row" onClick={() => setCategory(c.id)}>
                <span className="grow">{t(c.en, c.bn)}</span>
                <ChevronRight size={18} className="chev" />
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-block" onClick={() => openTicket('promo', 'chat', orderId)}>
            <Headphones size={18} /> {t('Something else — talk to a person', 'অন্য কিছু — একজন মানুষের সাথে কথা বলুন')}
          </button>
        </div>
      ) : (
        <div className="stack">
          {order && (
            <div className="callout callout-info">
              <Lock size={18} />
              <div>
                <div className="strong">{t('We’ll attach these details for you', 'এই তথ্যগুলো আমরা যুক্ত করে দেব')}</div>
                <div className="small muted">
                  {order.id} · {restaurantById(order.restaurantId)?.name} · {money(order.pricing.total, s.lang)} · {t('payment', 'পেমেন্ট')}: {order.payment.status} · {t('ref', 'রেফ')} {order.payment.txnRef}
                </div>
                <div className="tiny faint" style={{ marginTop: 4 }}>{t('Never shared: card numbers, PINs, or your location history.', 'কখনো শেয়ার হয় না: কার্ড নম্বর, পিন বা লোকেশন ইতিহাস।'
                )}</div>
              </div>
            </div>
          )}
          {category === 'refund' && s.refundIds.length > 0 && (
            <button className="btn btn-secondary btn-block" onClick={() => { close(); go('refunds'); }}>
              <Receipt size={18} /> {t('See refund status now', 'রিফান্ডের অবস্থা দেখুন')}
            </button>
          )}
          {category === 'subscription' && (
            <button className="btn btn-secondary btn-block" onClick={() => { close(); go('plus'); }}>
              {t('Manage or cancel Plus', 'প্লাস পরিচালনা বা বাতিল')}
            </button>
          )}
          {category === 'delayed' && order && isActive(order) && (
            <button className="btn btn-secondary btn-block" onClick={() => { close(); go('order/' + order.id); }}>
              {t('See live tracking', 'লাইভ ট্র্যাকিং দেখুন')}
            </button>
          )}
          <button className="btn btn-primary btn-block" onClick={() => openTicket(category!, 'chat', orderId)}>
            <MessageCircle size={18} /> {t('Chat with a person', 'একজন মানুষের সাথে চ্যাট')}
          </button>
          <p className="small muted center">{t('First reply in under 2 minutes, 9 AM – 2 AM. Email replies within 24 hours.', 'সকাল ৯টা – রাত ২টা, ২ মিনিটের মধ্যে প্রথম উত্তর। ইমেইলে ২৪ ঘণ্টার মধ্যে।')}</p>
          {urgent && (
            <button className="btn btn-secondary btn-block" onClick={() => openTicket(category!, 'callback', orderId)}>
              <Phone size={18} /> {t('Call me back (payment & refund issues)', 'আমাকে কল করুন (পেমেন্ট ও রিফান্ড)')}
            </button>
          )}
          <button className="text-btn" onClick={() => setCategory(null)}>{t('← Choose a different topic', '← অন্য বিষয় বেছে নিন')}</button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------------------------------------------------------------- safety (PRD F-033) */

export function SafetySheet() {
  const s = useAppState();
  const t = useT();
  const [shared, setShared] = useState(false);
  if (!s.ui.safety.open) return null;
  const close = () => update((d) => void (d.ui.safety = { open: false }));
  const orderId = s.ui.safety.orderId;
  const o = orderId ? s.orders[orderId] : undefined;

  const share = async () => {
    const text = t(`I'm tracking my Khabar order ${o?.id}. Expected soon at ${o?.address.area}.`, `আমার খাবার অর্ডার ${o?.id} ট্র্যাক করছি।`);
    try {
      if (navigator.share) await navigator.share({ title: 'Khabar', text });
      else await navigator.clipboard.writeText(text);
    } catch { /* user dismissed */ }
    setShared(true);
  };

  return (
    <Sheet title={t('Safety centre', 'নিরাপত্তা কেন্দ্র')} onClose={close}>
      <div className="stack">
        <a className="btn btn-danger btn-block" href="tel:999"><Siren size={18} /> {t('Emergency — call 999', 'জরুরি — ৯৯৯-এ কল করুন')}</a>
        <div className="card card-flush">
          <a className="list-row" href="tel:+8809600000000" style={{ color: 'inherit', textDecoration: 'none' }}>
            <ShieldCheck size={20} />
            <span className="grow">{t('Call Khabar safety team (24/7)', 'খাবার নিরাপত্তা দলে কল (২৪/৭)')}</span>
          </a>
          <button className="list-row" onClick={() => openTicket('safety', 'chat', orderId, { en: 'I want to report a problem with my rider.', bn: 'আমি রাইডার সম্পর্কে অভিযোগ করতে চাই।' })}>
            <TriangleAlert size={20} />
            <span className="grow">{t('Report rider behaviour or harassment', 'রাইডারের আচরণ বা হয়রানির অভিযোগ')}</span>
            <ChevronRight size={18} className="chev" />
          </button>
          {o && (
            <button className="list-row" onClick={share}>
              <Share2 size={20} />
              <span className="grow">{shared ? t('Shared ✓', 'শেয়ার হয়েছে ✓') : t('Share delivery status with someone you trust', 'বিশ্বস্ত কারো সাথে ডেলিভারির অবস্থা শেয়ার করুন')}</span>
            </button>
          )}
        </div>
        <div className="card">
          <h3 className="row"><Eye size={18} /> {t('What your rider can see', 'রাইডার যা দেখতে পান')}</h3>
          <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>{t('Your first name, delivery pin, building, floor, and notes', 'আপনার নামের প্রথম অংশ, পিন, বিল্ডিং, তলা ও নোট')}</li>
            <li>{t('A masked phone number — never your real number', 'মাস্ক করা নম্বর — আসল নম্বর কখনো নয়')}</li>
            <li>{t('Access ends when the order is delivered', 'ডেলিভারির পর অ্যাক্সেস বন্ধ হয়ে যায়')}</li>
          </ul>
          <p className="small muted" style={{ marginTop: 8 }}>{t('We never track your location in the background. Rider location is shared with you only during your active delivery.', 'আমরা ব্যাকগ্রাউন্ডে আপনার লোকেশন ট্র্যাক করি না। রাইডারের লোকেশন শুধু সক্রিয় ডেলিভারির সময় দেখানো হয়।')}</p>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- simulated payment provider */

export function ProviderSheet() {
  const s = useAppState();
  const t = useT();
  const sheet = s.ui.providerSheet;
  if (!sheet) return null;
  const o = s.orders[sheet.orderId];
  const a = o?.payment.attempts.find((x) => x.id === sheet.attemptId);
  if (!o || !a) return null;
  const pm = PAYMENT_METHODS.find((m) => m.id === a.method)!;
  const options = [
    { id: 'approve', en: 'Approve payment', bn: 'পেমেন্ট অনুমোদন', cls: 'btn-primary' },
    { id: 'decline', en: 'Payment rejected (e.g. low balance)', bn: 'পেমেন্ট প্রত্যাখ্যাত (যেমন কম ব্যালান্স)', cls: 'btn-secondary' },
    { id: 'cancel', en: 'Cancel on the payment page', bn: 'পেমেন্ট পেজে বাতিল', cls: 'btn-secondary' },
    { id: 'network_drop', en: 'Lose connection after paying', bn: 'পেমেন্টের পর সংযোগ বিচ্ছিন্ন', cls: 'btn-secondary' },
    { id: 'timeout', en: 'Let the session time out', bn: 'সেশনের মেয়াদ শেষ হতে দিন', cls: 'btn-secondary' },
  ] as const;
  return (
    <Sheet title={t(`${pm.en} checkout`, `${pm.bn} চেকআউট`)} onClose={closeProvider}>
      <div className="stack">
        <div className="callout callout-info">
          <FlaskConical size={18} />
          <span className="small">{t('Simulated payment page. No real money moves. Choose what the provider does.', 'সিমুলেটেড পেমেন্ট পেজ। কোনো আসল টাকা লেনদেন হয় না। প্রোভাইডার কী করবে তা বেছে নিন।')}</span>
        </div>
        <dl className="kv card">
          <dt>{t('Merchant', 'মার্চেন্ট')}</dt><dd>Khabar Ltd.</dd>
          <dt>{t('Order', 'অর্ডার')}</dt><dd>{o.id}</dd>
          <dt>{t('Amount', 'পরিমাণ')}</dt><dd>{money(o.pricing.total, s.lang)}</dd>
          <dt>{t('Attempt', 'চেষ্টা')}</dt><dd>#{o.payment.attempts.length}</dd>
        </dl>
        {options.map((op) => (
          <button key={op.id} className={'btn btn-block ' + op.cls} onClick={() => providerReturned(op.id)}>
            {t(op.en, op.bn)}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- demo controls */

export function DemoPanel() {
  const s = useAppState();
  const t = useT();
  if (!s.ui.demoOpen) return null;
  const close = () => update((d) => void (d.ui.demoOpen = false));
  const active = s.orderIds.map((id) => s.orders[id]).find((o) => isActive(o));
  const setDemo = (fn: (d: typeof s.demo) => void) => update((d) => fn(d.demo));

  return (
    <Sheet title={t('Demo controls', 'ডেমো নিয়ন্ত্রণ')} onClose={close}>
      <div className="stack">
        <p className="small muted">{t('There is no backend. Use these controls to trigger the server-side events the app must handle.', 'কোনো ব্যাকএন্ড নেই। সার্ভার-সাইড ঘটনা সিমুলেট করতে এগুলো ব্যবহার করুন।')}</p>

        <div className="card stack">
          <h3>{t('Checkout & payment', 'চেকআউট ও পেমেন্ট')}</h3>
          <div className="row-between">
            <span className="small">{t('Change an item price at next submit', 'পরের সাবমিটে দাম পরিবর্তন')}</span>
            <Switch checked={s.demo.priceChangeOnSubmit} onChange={(v) => setDemo((d) => void (d.priceChangeOnSubmit = v))} label="price change" />
          </div>
          <div className="row-between wrap">
            <span className="small">{t('Pending payments resolve to', 'পেন্ডিং পেমেন্টের ফলাফল')}</span>
            <div className="chips">
              {(['successful', 'failed'] as const).map((v) => (
                <button key={v} className="chip" aria-pressed={s.demo.pendingResolvesTo === v} onClick={() => setDemo((d) => void (d.pendingResolvesTo = v))}>
                  {v === 'successful' ? t('Success', 'সফল') : t('Failure', 'ব্যর্থ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card stack">
          <h3>{t('Delivery simulation', 'ডেলিভারি সিমুলেশন')}</h3>
          <div className="row-between">
            <span className="small">{t('Speed', 'গতি')}</span>
            <div className="chips">
              {([1, 4] as const).map((v) => (
                <button key={v} className="chip" aria-pressed={s.demo.speed === v} onClick={() => setDemo((d) => void (d.speed = v))}>{v}×</button>
              ))}
              <button className="chip" aria-pressed={s.demo.paused} onClick={() => setDemo((d) => void (d.paused = !d.paused))}>{s.demo.paused ? t('Paused', 'থামানো') : t('Pause', 'থামান')}</button>
            </div>
          </div>
          {active ? (
            <>
              <p className="small muted">{t('Active order', 'সক্রিয় অর্ডার')}: <strong>{active.id}</strong> · {active.stage.replace('_', ' ')}</p>
              <div className="chips">
                <button className="chip" onClick={() => toggleGps(active.id)}>{active.gps === 'ok' ? t('Cut rider GPS', 'রাইডার জিপিএস বন্ধ') : t('Restore rider GPS', 'জিপিএস চালু')}</button>
                <button className="chip" disabled={active.stage === 'arriving'} onClick={() => simulateDelay(active.id)}>{t('Cause a delay', 'দেরি ঘটান')}</button>
                <button className="chip" disabled={active.stage !== 'rider_assigned'} onClick={() => simulateRiderCancel(active.id)}>{t('Rider cancels', 'রাইডার বাতিল')}</button>
                <button className="chip" disabled={!['placed', 'confirmed', 'preparing', 'rider_assigned'].includes(active.stage)} onClick={() => simulateRestaurantFailure(active.id)}>{t('Restaurant can’t fulfil', 'রেস্টুরেন্ট অক্ষম')}</button>
              </div>
              <p className="tiny faint">{t('“Rider cancels” works while a rider is heading to the restaurant.', '“রাইডার বাতিল” রাইডার রেস্টুরেন্টে যাওয়ার সময় কাজ করে।')}</p>
            </>
          ) : (
            <p className="small faint">{t('Place an order to control live tracking.', 'লাইভ ট্র্যাকিং নিয়ন্ত্রণে একটি অর্ডার দিন।')}</p>
          )}
        </div>

        <div className="card stack">
          <h3>{t('Subscription', 'সাবস্ক্রিপশন')}</h3>
          <button className="chip" disabled={s.subscription.status !== 'active'} onClick={simulateRenewalReminder}>{t('Send 48-hour renewal reminder', '৪৮ ঘণ্টা আগের রিমাইন্ডার পাঠান')}</button>
        </div>

        <div className="card stack">
          <h3>{t('Analytics events', 'অ্যানালিটিক্স ইভেন্ট')} <span className="badge">{s.events.length}</span></h3>
          <div className="ev-log" aria-live="off">
            {s.events.length === 0 && <div className="faint">{t('No events yet.', 'এখনো কোনো ইভেন্ট নেই।')}</div>}
            {s.events.slice(0, 60).map((e, i) => (
              <div key={i}><span className="faint">{clock(e.at, 'en')}</span><span>{e.name}</span></div>
            ))}
          </div>
        </div>

        <button className="btn btn-danger btn-block" onClick={() => { if (confirm(t('Reset all demo data?', 'সব ডেমো ডেটা মুছবেন?'))) { resetAll(); go('', true); } }}>
          {t('Reset demo data', 'ডেমো ডেটা রিসেট')}
        </button>
      </div>
    </Sheet>
  );
}
