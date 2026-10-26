import { Bike, ChevronDown, ChevronRight, Clock, CreditCard, Languages, MapPin, Sparkles, Star, TriangleAlert } from 'lucide-react';
import { RESTAURANTS } from '../data';
import { isActive, latestAttempt } from '../actions';
import { cartCount, plusActive, quote, restaurantById } from '../pricing';
import { go, money, update, useAppState, useT } from '../store';
import { Img } from '../components/ui';

export function Home() {
  const s = useAppState();
  const t = useT();
  const addr = s.checkout.address;
  const unresolved = s.orderIds.map((id) => s.orders[id]).filter((o) => o.stage === 'awaiting_payment');
  const active = s.orderIds.map((id) => s.orders[id]).filter(isActive);
  const count = cartCount(s);

  return (
    <main className="screen wide">
      <div className="row-between pad mobile-only" style={{ paddingTop: 10 }}>
        <button className="address-pill grow" onClick={() => go('address')}>
          <MapPin size={20} color="var(--accent)" />
          <span className="grow" style={{ minWidth: 0 }}>
            <span className="tiny faint" style={{ display: 'block' }}>{t('Deliver to', 'ডেলিভারি ঠিকানা')}</span>
            <span className="strong" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {addr ? `${addr.label} · ${addr.line}` : t('Choose a delivery address', 'ডেলিভারি ঠিকানা বেছে নিন')}
            </span>
          </span>
          <ChevronDown size={18} />
        </button>
        <button className="chip" onClick={() => update((d) => void (d.lang = d.lang === 'en' ? 'bn' : 'en'))} aria-label={t('Switch to Bangla', 'Switch to English')}>
          <Languages size={16} /> {s.lang === 'en' ? 'বাংলা' : 'EN'}
        </button>
      </div>

      <div className="hero">
        <Img src="/images/hero-food.jpg" alt="" />
        <div className="hero-body">
          <h1>{t('Good food, no surprises.', 'ভালো খাবার, কোনো চমক ছাড়া।')}</h1>
          <p>{t('The price you see is the price you pay. Live tracking on every order.', 'যা দাম দেখছেন, তাই দেবেন। প্রতিটি অর্ডারে লাইভ ট্র্যাকিং।')}</p>
        </div>
      </div>

      {(unresolved.length > 0 || active.length > 0) && (
        <section className="pad resume-grid" style={{ marginTop: 16 }} aria-label={t('Your orders in progress', 'চলমান অর্ডার')}>
          {unresolved.map((o) => {
            const st = latestAttempt(o)?.status;
            const pending = st === 'pending' || st === 'processing';
            return (
              <button key={o.id} className="resume" onClick={() => go('pay/' + o.id)}>
                <span className="resume-icon" style={{ background: pending ? 'var(--warn-soft)' : 'var(--bad-soft)', color: pending ? 'var(--warn)' : 'var(--bad)' }}>
                  {pending ? <Clock size={20} /> : <CreditCard size={20} />}
                </span>
                <span className="grow">
                  <span className="strong" style={{ display: 'block' }}>
                    {pending ? t('Confirming your payment', 'পেমেন্ট নিশ্চিত করা হচ্ছে') : t('Finish your order', 'অর্ডার সম্পূর্ণ করুন')}
                  </span>
                  <span className="small muted">
                    {o.id} · {restaurantById(o.restaurantId)?.name} · {money(o.pricing.total, s.lang)}
                    {pending ? ' · ' + t('don’t pay again', 'আবার পেমেন্ট করবেন না') : ' · ' + t('payment not completed', 'পেমেন্ট হয়নি')}
                  </span>
                </span>
                <ChevronRight size={18} className="faint" />
              </button>
            );
          })}
          {active.map((o) => (
            <button key={o.id} className="resume" onClick={() => go('order/' + o.id)}>
              <span className="resume-icon" style={{ background: 'var(--good-soft)', color: 'var(--good)' }}><Bike size={20} /></span>
              <span className="grow">
                <span className="strong" style={{ display: 'block' }}>{t('Track your order', 'অর্ডার ট্র্যাক করুন')}</span>
                <span className="small muted">{o.id} · {restaurantById(o.restaurantId)?.name}{o.delay ? ' · ' + t('running late', 'দেরি হচ্ছে') : ''}</span>
              </span>
              <ChevronRight size={18} className="faint" />
            </button>
          ))}
        </section>
      )}

      {!plusActive(s) && s.subscription.status === 'none' && (
        <section className="pad resume-grid" style={{ marginTop: 16 }}>
          <button className="resume" onClick={() => go('plus')}>
            <span className="resume-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Sparkles size={20} /></span>
            <span className="grow">
              <span className="strong" style={{ display: 'block' }}>{t('Khabar Plus — ৳149 / 30 days', 'খাবার প্লাস — ৳১৪৯ / ৩০ দিন')}</span>
              <span className="small muted">{t('Free delivery at partner restaurants on ৳300+. Reminders before every renewal. Cancel in two taps.', 'পার্টনার রেস্টুরেন্টে ৳৩০০+ এ ফ্রি ডেলিভারি। প্রতিবার নবায়নের আগে রিমাইন্ডার। দুই ট্যাপে বাতিল।')}</span>
            </span>
            <ChevronRight size={18} className="faint" />
          </button>
        </section>
      )}

      <h2 className="section-title">{t('Restaurants near you', 'আপনার কাছের রেস্টুরেন্ট')}</h2>
      <section className="pad r-grid">
        {RESTAURANTS.map((r) => (
          <button key={r.id} className={'r-card' + (r.status === 'paused' ? ' paused' : '')} onClick={() => go('r/' + r.id)}>
            <div className="r-card-img">
              <Img src={r.image} alt="" />
              {r.status === 'paused' && <span className="badge badge-bad">{t('Not taking orders', 'অর্ডার বন্ধ')}</span>}
              {r.status === 'busy' && <span className="badge badge-warn">{t('Busy — longer prep', 'ব্যস্ত — সময় বেশি লাগবে')}</span>}
              {r.status === 'open' && r.plusPartner && <span className="badge badge-brand">Plus</span>}
            </div>
            <div className="r-card-body">
              <div className="row-between">
                <h3>{r.name}</h3>
                <span className="small strong row" style={{ gap: 4 }}><Star size={14} fill="currentColor" color="var(--warn)" /> {r.rating}</span>
              </div>
              <div className="meta">
                <span>{t(r.cuisineEn, r.cuisineBn)}</span>
                <span>{r.area}</span>
              </div>
              <div className="meta">
                <span><Clock size={13} /> {r.prepMin + 15}–{r.prepMin + 30} {t('min', 'মিনিট')}</span>
                <span><Bike size={13} /> {money(r.deliveryFee, s.lang)} {t('delivery', 'ডেলিভারি')}</span>
                <span>{t('Min.', 'ন্যূনতম')} {money(r.minOrder, s.lang)}</span>
              </div>
              {r.status === 'paused' && (
                <p className="small" style={{ color: 'var(--bad)', marginTop: 6 }}><TriangleAlert size={13} style={{ verticalAlign: '-2px' }} /> {t(r.pausedReasonEn!, r.pausedReasonBn!)}</p>
              )}
            </div>
          </button>
        ))}
      </section>

      {count > 0 && (
        <button className="cart-bar" onClick={() => go('checkout')}>
          <span className="badge" style={{ background: 'rgb(255 255 255 / 18%)', color: 'inherit' }}>{count}</span>
          <span className="grow strong">{t('View cart', 'কার্ট দেখুন')} · {restaurantById(s.cart.restaurantId)?.name}</span>
          <span className="strong tabular">{money(quote(s).pricing.total, s.lang)}</span>
        </button>
      )}
    </main>
  );
}
