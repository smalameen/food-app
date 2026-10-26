import { useEffect, useState } from 'react';
import { Bell, Check, CircleAlert, Sparkles, X } from 'lucide-react';
import { PAYMENT_METHODS, PLUS_PLAN, type PaymentMethodId } from '../data';
import { cancelPlus, disputeCharge, subscribePlus } from '../actions';
import { plusActive } from '../pricing';
import { day, money, trackNow, useAppState, useT } from '../store';
import { Sheet, TopBar } from '../components/ui';

/** Subscription transparency and control (PRD F-025). */
export function PlusScreen() {
  const s = useAppState();
  const t = useT();
  const sub = s.subscription;
  const m = (n: number) => money(n, s.lang);
  const [agree, setAgree] = useState(false);
  const [method, setMethod] = useState<PaymentMethodId>('bkash');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [dispute, setDispute] = useState<string | null>(null);
  useEffect(() => { trackNow('subscription_viewed'); }, []);

  const savings = s.orderIds.map((id) => s.orders[id]).filter((o) => o.pricing.plusApplied && o.stage !== 'cancelled' && o.stage !== 'awaiting_payment');
  const saved = savings.reduce((a, o) => a + o.pricing.deliveryWaived, 0);
  const DAY = 86_400_000;

  return (
    <main className="screen">
      <TopBar title="Khabar Plus" fallback="account" />
      <div className="pad stack-lg" style={{ paddingTop: 16 }}>
        {sub.status === 'none' || (!plusActive(s) && sub.status === 'cancelled') ? (
          <>
            <section className="card stack">
              <div className="row"><Sparkles color="var(--accent)" /><h2>{t(`${m(PLUS_PLAN.price)} ${PLUS_PLAN.cycleEn}`, `${m(PLUS_PLAN.price)} ${PLUS_PLAN.cycleBn}`)}</h2></div>
              <div>
                <div className="field-label">{t('What you get', 'যা পাবেন')}</div>
                {PLUS_PLAN.benefitsEn.map((b, i) => <div key={i} className="row small" style={{ padding: '3px 0' }}><Check size={16} color="var(--good)" />{t(b, PLUS_PLAN.benefitsBn[i])}</div>)}
              </div>
              <div>
                <div className="field-label">{t('What’s not included', 'যা অন্তর্ভুক্ত নয়')}</div>
                {PLUS_PLAN.exclusionsEn.map((b, i) => <div key={i} className="row small" style={{ padding: '3px 0' }}><X size={16} color="var(--bad)" />{t(b, PLUS_PLAN.exclusionsBn[i])}</div>)}
              </div>
              <dl className="kv">
                <dt>{t('First charge', 'প্রথম চার্জ')}</dt><dd>{t('Today', 'আজ')} · {m(PLUS_PLAN.price)}</dd>
                <dt>{t('Next charge', 'পরবর্তী চার্জ')}</dt><dd>{day(Date.now() + 30 * DAY, s.lang)}</dd>
                <dt>{t('Reminders', 'রিমাইন্ডার')}</dt><dd>{t('48h and 24h before, by SMS', '৪৮ ও ২৪ ঘণ্টা আগে, এসএমএসে')}</dd>
                <dt>{t('Cancel', 'বাতিল')}</dt><dd>{t('Any time, two taps, here', 'যেকোনো সময়, দুই ট্যাপে, এখানে')}</dd>
              </dl>
            </section>
            <section className="stack">
              <div className="field-label">{t('Pay with', 'পেমেন্ট মাধ্যম')}</div>
              <div className="chips" role="radiogroup">
                {PAYMENT_METHODS.filter((p) => p.online && p.enabled).map((p) => (
                  <button key={p.id} className="chip" role="radio" aria-checked={method === p.id} onClick={() => setMethod(p.id)}>{t(p.en, p.bn)}</button>
                ))}
              </div>
              <label className="check card">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>{t(`I agree to be charged ${m(PLUS_PLAN.price)} every 30 days until I cancel. I’ll get a reminder before each charge.`, `বাতিল না করা পর্যন্ত প্রতি ৩০ দিনে ${m(PLUS_PLAN.price)} চার্জে আমি সম্মত। প্রতিটি চার্জের আগে রিমাইন্ডার পাব।`)}</span>
              </label>
              <button className="btn btn-primary btn-block" disabled={!agree} onClick={() => subscribePlus(method)}>{t(`Start Plus · ${m(PLUS_PLAN.price)} today`, `প্লাস শুরু · আজ ${m(PLUS_PLAN.price)}`)}</button>
            </section>
          </>
        ) : (
          <>
            <section className="card stack">
              <div className="row-between">
                <h2>{t('Your plan', 'আপনার প্ল্যান')}</h2>
                <span className={'badge ' + (sub.status === 'active' ? 'badge-good' : 'badge-warn')}>{sub.status === 'active' ? t('Active', 'সক্রিয়') : t('Cancelled', 'বাতিল')}</span>
              </div>
              <dl className="kv">
                <dt>{t('Price', 'মূল্য')}</dt><dd>{m(PLUS_PLAN.price)} / {t('30 days', '৩০ দিন')}</dd>
                {sub.status === 'active' ? (
                  <><dt>{t('Next charge', 'পরবর্তী চার্জ')}</dt><dd>{day(sub.periodEnd!, s.lang)} · {m(PLUS_PLAN.price)}</dd></>
                ) : (
                  <><dt>{t('Benefits end', 'সুবিধা শেষ')}</dt><dd>{day(sub.periodEnd!, s.lang)}</dd><dt>{t('Future charges', 'ভবিষ্যৎ চার্জ')}</dt><dd>{t('None', 'নেই')}</dd></>
                )}
                <dt>{t('Saved so far', 'এ পর্যন্ত সাশ্রয়')}</dt><dd>{m(saved)} · {savings.length} {t('orders', 'অর্ডার')}</dd>
              </dl>
              {sub.status === 'active' && (
                <div className="callout callout-info small"><Bell size={16} /><span>{t(`Reminders on ${day(sub.periodEnd! - 2 * DAY, s.lang)} and ${day(sub.periodEnd! - DAY, s.lang)}.`, `${day(sub.periodEnd! - 2 * DAY, s.lang)} ও ${day(sub.periodEnd! - DAY, s.lang)} তারিখে রিমাইন্ডার।`)}</span></div>
              )}
              {sub.status === 'cancelled' && (
                <div className="callout callout-good small"><Check size={16} /><span>{t(`Cancelled. You won’t be charged again. Free delivery continues until ${day(sub.periodEnd!, s.lang)}.`, `বাতিল হয়েছে। আর চার্জ হবে না। ${day(sub.periodEnd!, s.lang)} পর্যন্ত ফ্রি ডেলিভারি চলবে।`)}</span></div>
              )}
              {sub.status === 'active' && <button className="btn btn-danger btn-block" onClick={() => setConfirmCancel(true)}>{t('Cancel Plus', 'প্লাস বাতিল')}</button>}
            </section>
          </>
        )}

        {sub.billing.length > 0 && (
          <section>
            <h2 style={{ marginBottom: 10 }}>{t('Billing history', 'বিলিং ইতিহাস')}</h2>
            <div className="card card-flush">
              {sub.billing.map((b) => (
                <div key={b.id} className="list-row">
                  <div className="grow">
                    <div className="strong">{m(b.amount)}</div>
                    <div className="small muted">{day(b.at, s.lang)} · {b.id}</div>
                  </div>
                  {b.status === 'paid' ? (
                    <button className="btn btn-sm btn-secondary" onClick={() => setDispute(b.id)}>{t('Dispute', 'আপত্তি')}</button>
                  ) : (
                    <span className="badge badge-warn">{t('Disputed · refund started', 'আপত্তি · রিফান্ড শুরু')}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmCancel && (
        <Sheet title={t('Cancel Plus?', 'প্লাস বাতিল করবেন?')} onClose={() => setConfirmCancel(false)}>
          <div className="stack">
            <p>{t(`You won’t be charged again. Free delivery stays on until ${day(sub.periodEnd!, s.lang)}.`, `আর চার্জ হবে না। ${day(sub.periodEnd!, s.lang)} পর্যন্ত ফ্রি ডেলিভারি থাকবে।`)}</p>
            <button className="btn btn-danger btn-block" onClick={() => { cancelPlus(); setConfirmCancel(false); }}>{t('Cancel Plus', 'প্লাস বাতিল')}</button>
            <button className="btn btn-secondary btn-block" onClick={() => setConfirmCancel(false)}>{t('Keep Plus', 'প্লাস রাখুন')}</button>
          </div>
        </Sheet>
      )}
      {dispute && (
        <Sheet title={t('Dispute this charge?', 'এই চার্জে আপত্তি?')} onClose={() => setDispute(null)}>
          <div className="stack">
            <div className="callout callout-warn small"><CircleAlert size={16} /><span>{t('We’ll refund this charge, stop all future renewals immediately, and end Plus benefits now.', 'এই চার্জ ফেরত দেব, ভবিষ্যৎ নবায়ন এখনই বন্ধ করব এবং প্লাস সুবিধা শেষ হবে।')}</span></div>
            <button className="btn btn-primary btn-block" onClick={() => { disputeCharge(dispute); setDispute(null); }}>{t('Open dispute and refund', 'আপত্তি ও রিফান্ড')}</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
