import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  CircleAlert,
  Clock,
  MessageCircle,
  Pencil,
  Phone,
  Receipt,
  RotateCcw,
  ShieldCheck,
  SignalLow,
  Star,
  TriangleAlert,
  X,
} from 'lucide-react';
import { RESTAURANTS, RIDERS } from '../data';
import { STAGE_ORDER, alongPath, cancelOrder, isActive, openTicket, rateOrder, updateDeliveryNotes } from '../actions';
import { restaurantById } from '../pricing';
import { clock, go, money, trackNow, update, useAppState, useT, type Order, type OrderStage } from '../store';
import { CityMap } from '../components/CityMap';
import { ago, PriceBreakdown, Sheet, TopBar, useNow } from '../components/ui';
import { ReorderButton } from './Orders';

const STALE_MS = 10_000;

const STEP_LABEL: Record<string, [string, string]> = {
  placed: ['Order placed', 'অর্ডার দেওয়া হয়েছে'],
  confirmed: ['Restaurant confirmed', 'রেস্টুরেন্ট নিশ্চিত করেছে'],
  preparing: ['Preparing your food', 'খাবার তৈরি হচ্ছে'],
  rider_assigned: ['Rider assigned', 'রাইডার নিযুক্ত'],
  picked_up: ['Picked up', 'সংগ্রহ করা হয়েছে'],
  arriving: ['Arriving', 'পৌঁছাচ্ছে'],
  delivered: ['Delivered', 'ডেলিভারি সম্পন্ন'],
};

export function OrderTracking({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const now = useNow(1000);
  const o = s.orders[id];
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    if (o && isActive(o)) trackNow('tracking_screen_viewed', { order: id, stage: o.stage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (o?.stage === 'awaiting_payment') go('pay/' + o.id, true);
  }, [o?.stage, o?.id]);

  if (!o) return <main className="screen"><TopBar title={t('Order', 'অর্ডার')} fallback="orders" /><div className="empty">{t('Order not found on this device.', 'এই ডিভাইসে অর্ডার পাওয়া যায়নি।')}</div></main>;
  if (o.stage === 'awaiting_payment') return null;

  const r = restaurantById(o.restaurantId)!;
  const m = (n: number) => money(n, s.lang);
  const rider = RIDERS.find((x) => x.id === o.riderId);
  const stageIdx = STAGE_ORDER.indexOf(o.stage);
  const riderStage = o.stage === 'rider_assigned' || o.stage === 'picked_up' || o.stage === 'arriving';
  const fixAge = o.riderFixAt ? now - o.riderFixAt : Infinity;
  const fresh = fixAge < STALE_MS;
  const remaining = Math.max(1, Math.round(o.plan.delivered - o.simMin));
  const etaLo = remaining;
  const etaHi = remaining + (remaining > 10 ? 8 : 4);
  const canCancel = o.stage === 'placed' || o.stage === 'confirmed';
  const canEditNotes = ['placed', 'confirmed', 'preparing', 'rider_assigned'].includes(o.stage);
  const itemCount = o.lines.reduce((a, l) => a + l.qty, 0);
  const warnEvents = o.events.filter((e) => e.kind === 'warn' || e.kind === 'bad');

  const route = riderStage && o.riderPos
    ? o.stage === 'rider_assigned'
      ? [o.riderPos, alongPath(o.riderPos, r.pos, 1), r.pos, { x: o.address.pos.x, y: r.pos.y }, o.address.pos]
      : [o.riderPos, { x: o.address.pos.x, y: o.riderPos.y }, o.address.pos]
    : undefined;

  const stepTime = (st: OrderStage) => o.events.find((e) => e.stage === st)?.at;

  return (
    <main className="screen wide">
      <TopBar
        title={t(`Order ${o.id}`, `অর্ডার ${o.id}`)}
        fallback="orders"
        help
        orderId={o.id}
        right={
          isActive(o) ? (
            <button className="icon-btn" aria-label={t('Safety centre', 'নিরাপত্তা কেন্দ্র')} onClick={() => update((d) => void (d.ui.safety = { open: true, orderId: o.id }))}>
              <ShieldCheck size={22} color="var(--brand)" />
            </button>
          ) : undefined
        }
      />

      <div className="split">
      <div className="pad stack" style={{ paddingTop: 12 }}>
        {/* Cancelled */}
        {o.stage === 'cancelled' && (
          <div className="stack">
            <div className="callout callout-bad">
              <X size={18} />
              <div>
                <div className="strong">{o.cancel?.by === 'customer' ? t('You cancelled this order', 'আপনি অর্ডারটি বাতিল করেছেন') : t('This order was cancelled', 'অর্ডারটি বাতিল হয়েছে')}</div>
                <div className="small">{o.cancel ? t(o.cancel.en, o.cancel.bn) : ''}</div>
              </div>
            </div>
            {o.refundIds.map((rid) => {
              const rf = s.refunds[rid];
              return (
                <button key={rid} className="resume" onClick={() => go('refund/' + rid)}>
                  <span className="resume-icon" style={{ background: 'var(--good-soft)', color: 'var(--good)' }}><Receipt size={20} /></span>
                  <span className="grow">
                    <span className="strong" style={{ display: 'block' }}>{t(`Refund of ${m(rf.amount)} started automatically`, `${m(rf.amount)} রিফান্ড স্বয়ংক্রিয়ভাবে শুরু`)}</span>
                    <span className="small muted">{t(`To ${rf.destinationLabelEn} · status: ${rf.stage}`, `${rf.destinationLabelBn}-এ · অবস্থা: ${rf.stage}`)}</span>
                  </span>
                </button>
              );
            })}
            {o.refundIds.length === 0 && <p className="small muted">{t('You were not charged for this order.', 'এই অর্ডারের জন্য কোনো টাকা কাটা হয়নি।')}</p>}
            {o.cancel?.by === 'restaurant' && (
              <div className="card">
                <h3>{t('Open now nearby', 'কাছাকাছি এখন খোলা')}</h3>
                <div className="chips" style={{ marginTop: 8 }}>
                  {RESTAURANTS.filter((x) => x.status === 'open' && x.id !== r.id).slice(0, 4).map((x) => <button key={x.id} className="chip" onClick={() => go('r/' + x.id)}>{x.name}</button>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Proactive delay notice */}
        {o.delay && isActive(o) && (
          <div className="callout callout-warn" role="status">
            <Clock size={18} />
            <div className="small">
              <div className="strong">{t('Running about ' + o.delay.addedMin + ' min late', 'প্রায় ' + o.delay.addedMin + ' মিনিট দেরি')}</div>
              <div>{t(o.delay.en, o.delay.bn)}. {t(`We added ${m(o.delay.compensation)} credit to your account automatically — no need to ask.`, `${m(o.delay.compensation)} ক্রেডিট স্বয়ংক্রিয়ভাবে যোগ হয়েছে — চাইতে হবে না।`)}</div>
            </div>
          </div>
        )}

        {/* ETA + map */}
        {isActive(o) && (
          <>
            <div className="card">
              <div className="row-between">
                <span className="muted small">{STEP_LABEL[o.stage] ? t(...STEP_LABEL[o.stage]) : ''}</span>
                <span className="badge">{t('Estimate', 'আনুমানিক')}</span>
              </div>
              <div className="eta" aria-live="polite">{etaLo}–{etaHi} {t('min', 'মিনিট')}</div>
              {o.delay && <div className="small muted">{t(`Originally about ${o.originalEtaMin} min`, `মূলত প্রায় ${o.originalEtaMin} মিনিট`)}</div>}
            </div>

            <div style={{ position: 'relative' }}>
              <CityMap
                restaurant={r.pos}
                destination={o.address.pos}
                rider={riderStage && o.riderPos ? { pos: o.riderPos, live: fresh } : undefined}
                route={fresh ? route : undefined}
                label={t('Delivery map', 'ডেলিভারি ম্যাপ')}
              />
              <div className="map-overlay">
                {!riderStage && <span className="map-chip"><Clock size={14} /> {t('Finding a rider while the kitchen cooks', 'রান্নার সময় রাইডার খোঁজা হচ্ছে')}</span>}
                {riderStage && o.riderPos && fresh && <span className="map-chip live">{t('Live', 'লাইভ')} · {t('updated', 'আপডেট')} {ago(fixAge, t)}</span>}
                {riderStage && o.riderPos && !fresh && (
                  <span className="map-chip" style={{ color: 'var(--warn)' }}><SignalLow size={14} /> {t('Location update delayed', 'লোকেশন আপডেটে দেরি')} · {t('last seen', 'শেষ দেখা')} {ago(fixAge, t)}</span>
                )}
                {riderStage && !o.riderPos && <span className="map-chip"><SignalLow size={14} /> {t('Live location unavailable right now', 'এখন লাইভ লোকেশন পাওয়া যাচ্ছে না')}</span>}
              </div>
            </div>
            {riderStage && !fresh && (
              <p className="small muted">{t('Your order is still on its way. The grey dot is where we last saw your rider. We’ll show live movement again as soon as their phone reconnects.', 'অর্ডার এখনও আসছে। ধূসর বিন্দু হলো রাইডারের শেষ অবস্থান। ফোন সংযুক্ত হলে আবার লাইভ দেখাব।')}</p>
            )}

            {rider && riderStage && (
              <div className="card">
                <div className="row">
                  <div className="avatar" aria-hidden>{rider.initials}<span className="verified"><BadgeCheck size={16} /></span></div>
                  <div className="grow">
                    <div className="strong">{rider.name}</div>
                    <div className="small muted">{t(rider.vehicleEn, rider.vehicleBn)} · {rider.plate}</div>
                    <div className="tiny faint row" style={{ gap: 4 }}><Star size={12} fill="currentColor" /> {rider.rating} · {t('ID verified', 'আইডি যাচাইকৃত')}</div>
                  </div>
                  <a className="icon-btn" href="tel:+8809600000001" aria-label={t('Call rider (masked number)', 'রাইডারকে কল (মাস্ক নম্বর)')} style={{ background: 'var(--surface-2)' }}><Phone size={20} /></a>
                  <button className="icon-btn" aria-label={t('Message rider', 'রাইডারকে মেসেজ')} style={{ background: 'var(--surface-2)' }} onClick={() => openTicket('rider', 'chat', o.id)}><MessageCircle size={20} /></button>
                </div>
                <p className="tiny faint" style={{ marginTop: 8 }}>{t('Calls use a masked number. Neither of you sees the other’s real number.', 'কল মাস্ক নম্বরে হয়। কেউ কারো আসল নম্বর দেখেন না।')}</p>
              </div>
            )}

            {(o.stage === 'picked_up' || o.stage === 'arriving') && (
              <div className="card row-between">
                <div>
                  <div className="strong">{t('Handoff code', 'হস্তান্তর কোড')}</div>
                  <div className="small muted">{t('Share it only when you have your food.', 'খাবার হাতে পেলে তবেই কোডটি দিন।')}</div>
                </div>
                <span className="otp" aria-label={o.otp.split('').join(' ')}>{o.otp}</span>
              </div>
            )}
          </>
        )}

        {/* Delivered */}
        {o.stage === 'delivered' && (
          <div className="stack">
            <div className="callout callout-good">
              <Check size={18} />
              <div>
                <div className="strong">{t('Delivered', 'ডেলিভারি সম্পন্ন')}{o.deliveredAt ? ' · ' + clock(o.deliveredAt, s.lang) : ''}</div>
                <div className="small">{t('Live tracking has ended and the rider can no longer see your location.', 'লাইভ ট্র্যাকিং শেষ, রাইডার আর আপনার লোকেশন দেখতে পান না।')}</div>
              </div>
            </div>
            {!o.issueReported ? (
              <button className="btn btn-secondary btn-block" onClick={() => go('issue/' + o.id)}><TriangleAlert size={18} /> {t('Something wrong? Fix it in two taps', 'কোনো সমস্যা? দুই ট্যাপে সমাধান')}</button>
            ) : (
              <div className="callout small"><Check size={16} /><span>{t('Issue reported and resolved. ', 'সমস্যা জানানো ও সমাধান হয়েছে। ')}{o.refundIds.length > 0 && <a href={'#/refund/' + o.refundIds[o.refundIds.length - 1]}>{t('See refund', 'রিফান্ড দেখুন')}</a>}</span></div>
            )}
            <Csat order={o} />
            <ReorderButton order={o} />
          </div>
        )}

      </div>

      <aside className="pad stack" style={{ paddingTop: 12 }}>
        {/* Exception updates */}
        {warnEvents.length > 0 && o.stage !== 'cancelled' && (
          <div className="card stack">
            <h3>{t('Updates', 'আপডেট')}</h3>
            {warnEvents.map((e, i) => (
              <div key={i} className="row small" style={{ alignItems: 'flex-start' }}>
                <CircleAlert size={16} color="var(--warn)" style={{ flex: 'none', marginTop: 2 }} />
                <span className="grow">{t(e.en, e.bn)}</span>
                <span className="faint nowrap">{clock(e.at, s.lang)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {o.stage !== 'cancelled' && (
          <section className="card" aria-labelledby="tl-h">
            <h3 id="tl-h" style={{ marginBottom: 12 }}>{t('Order progress', 'অর্ডারের অগ্রগতি')}</h3>
            <ol className="timeline">
              {STAGE_ORDER.map((st, i) => {
                const done = i < stageIdx || o.stage === 'delivered';
                const current = i === stageIdx && o.stage !== 'delivered';
                const at = stepTime(st);
                return (
                  <li key={st} className={done ? 'done' : current ? 'current' : 'todo'} aria-current={current ? 'step' : undefined}>
                    <span className="t-dot">{done && <Check size={14} />}</span>
                    <div className="grow">
                      <div className={current ? 'strong' : undefined}>{t(...STEP_LABEL[st])}</div>
                      {st === 'rider_assigned' && rider && (done || current) && <div className="small muted">{rider.name}{o.reassignedCount ? ' · ' + t('reassigned automatically', 'স্বয়ংক্রিয়ভাবে পুনঃনিযুক্ত') : ''}</div>}
                      {st === 'picked_up' && (done || current) && <div className="small muted">{t(`Restaurant checked ${itemCount} item${itemCount === 1 ? '' : 's'} and sealed the bag`, `রেস্টুরেন্ট ${itemCount}টি আইটেম মিলিয়ে ব্যাগ সিল করেছে`)}</div>}
                    </div>
                    {at && (done || current) && <span className="small faint">{clock(at, s.lang)}</span>}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Delivery details */}
        <section className="card small">
          <div className="row-between">
            <h3>{t('Delivery details', 'ডেলিভারির তথ্য')}</h3>
            {canEditNotes && <button className="text-btn" onClick={() => setNotesOpen(true)}><Pencil size={15} />{t('Edit', 'সম্পাদনা')}</button>}
          </div>
          <div style={{ marginTop: 6 }}>{o.address.line}, {o.address.area}</div>
          <div className="muted">{[o.address.building, o.address.floor, o.address.landmark].filter(Boolean).join(' · ')}</div>
          {o.address.notes && <div className="muted">“{o.address.notes}”</div>}
          <div className="muted" style={{ marginTop: 4 }}>{t('Handoff', 'হস্তান্তর')}: {o.handoff === 'hand' ? t('Hand it to me', 'আমার হাতে দিন') : o.handoff === 'door' ? t('Meet at the door', 'দরজায় দেখা') : t('Leave at door + photo', 'দরজায় রেখে ছবি দিন')}</div>
          {!canEditNotes && isActive(o) && <p className="tiny faint" style={{ marginTop: 6 }}>{t('The rider has picked up, so details can’t be edited here. Use Help or call the rider.', 'রাইডার খাবার নিয়েছেন, তাই এখানে বদলানো যাবে না। সাহায্য নিন বা রাইডারকে কল দিন।')}</p>}
        </section>

        <details className="card">
          <summary className="strong" style={{ cursor: 'pointer' }}>{t('Receipt', 'রসিদ')} · {m(o.pricing.total)}</summary>
          <ul className="small" style={{ margin: '10px 0', paddingLeft: 18 }}>
            {o.lines.map((l) => <li key={l.key}>{l.qty} × {t(l.en, l.bn)} — {m(l.unitPrice * l.qty)}</li>)}
          </ul>
          <PriceBreakdown p={o.pricing} compact />
          <p className="tiny faint" style={{ marginTop: 8 }}>{t('Payment', 'পেমেন্ট')}: {o.payment.status === 'cod' ? t('Cash on delivery', 'ক্যাশ অন ডেলিভারি') : o.payment.status} · {t('ref', 'রেফ')} {o.payment.txnRef}</p>
        </details>

        {isActive(o) && (
          canCancel ? (
            <button className="btn btn-ghost btn-block" onClick={() => setCancelOpen(true)}>{t('Cancel order', 'অর্ডার বাতিল')}</button>
          ) : (
            <p className="tiny faint center">{t('The kitchen has started cooking, so this order can no longer be cancelled in the app. Need help? Tap Help.', 'রান্না শুরু হয়ে গেছে, তাই অ্যাপে আর বাতিল করা যাবে না। সাহায্যের জন্য Help চাপুন।')}</p>
          )
        )}
      </aside>
      </div>

      {cancelOpen && (
        <Sheet title={t('Cancel this order?', 'অর্ডার বাতিল করবেন?')} onClose={() => setCancelOpen(false)}>
          <div className="stack">
            <p>{o.payment.status === 'successful'
              ? t(`It’s free to cancel now. Your ${m(o.pricing.total)} refund starts automatically to ${o.method === 'card' ? 'your card' : 'bKash'}.`, `এখন বাতিল বিনামূল্যে। ${m(o.pricing.total)} রিফান্ড স্বয়ংক্রিয়ভাবে শুরু হবে।`)
              : t('It’s free to cancel now. You haven’t been charged.', 'এখন বাতিল বিনামূল্যে। কোনো টাকা কাটা হয়নি।')}</p>
            <button className="btn btn-danger btn-block" onClick={() => { cancelOrder(o.id, 'customer', 'Cancelled before the kitchen started.', 'রান্না শুরুর আগে বাতিল।'); setCancelOpen(false); }}>{t('Yes, cancel order', 'হ্যাঁ, বাতিল করুন')}</button>
            <button className="btn btn-secondary btn-block" onClick={() => setCancelOpen(false)}>{t('Keep my order', 'অর্ডার রাখুন')}</button>
          </div>
        </Sheet>
      )}
      {notesOpen && <NotesSheet order={o} onClose={() => setNotesOpen(false)} />}
    </main>
  );
}

function NotesSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useT();
  const [landmark, setLandmark] = useState(order.address.landmark);
  const [notes, setNotes] = useState(order.address.notes);
  return (
    <Sheet title={t('Update delivery details', 'ডেলিভারির তথ্য হালনাগাদ')} onClose={onClose}>
      <div className="stack">
        <label className="field"><span className="field-label">{t('Landmark', 'ল্যান্ডমার্ক')}</span><input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} /></label>
        <label className="field"><span className="field-label">{t('Notes for the rider', 'রাইডারের জন্য নোট')}</span><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <p className="tiny faint">{t('To move the pin itself, contact Help so we can check the fee and time don’t change.', 'পিন সরাতে সাহায্য নিন, যাতে ফি ও সময় যাচাই করা যায়।')}</p>
        <button className="btn btn-primary btn-block" onClick={() => { updateDeliveryNotes(order.id, landmark, notes); onClose(); }}>{t('Save for the rider', 'রাইডারের জন্য সংরক্ষণ')}</button>
      </div>
    </Sheet>
  );
}

function Csat({ order }: { order: Order }) {
  const t = useT();
  if (order.csat) {
    return order.csat <= 2 && !order.issueReported ? (
      <div className="callout callout-warn small">
        <RotateCcw size={16} />
        <span className="grow">{t('Sorry it wasn’t great. Tell us what went wrong and we’ll make it right.', 'দুঃখিত, অভিজ্ঞতা ভালো হয়নি। কী সমস্যা হয়েছে জানান, আমরা ঠিক করে দেব।')} <a href={'#/issue/' + order.id}>{t('Report a problem', 'সমস্যা জানান')}</a></span>
      </div>
    ) : (
      <p className="small muted center">{t('Thanks for rating this order.', 'রেটিং দেওয়ার জন্য ধন্যবাদ।')}</p>
    );
  }
  return (
    <div className="card center">
      <div className="strong">{t('How was this order?', 'অর্ডারটি কেমন ছিল?')}</div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 8 }} role="radiogroup" aria-label={t('Rate 1 to 5', '১ থেকে ৫ রেটিং')}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className="icon-btn" aria-label={`${n}`} onClick={() => rateOrder(order.id, n)}><Star size={26} color="var(--warn)" /></button>
        ))}
      </div>
    </div>
  );
}
