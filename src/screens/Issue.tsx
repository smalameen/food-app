import { useState } from 'react';
import { Camera, Gift, RotateCcw, Truck, Wallet } from 'lucide-react';
import { ISSUE_TYPES, type IssueType } from '../data';
import { methodLabel, resolveIssue } from '../actions';
import { go, money, useAppState, useT } from '../store';
import { TopBar } from '../components/ui';

/** Report a problem with a delivered order and pick a resolution: two taps (PRD F-026, F-030). */
export function IssueScreen({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const o = s.orders[id];
  const [issue, setIssue] = useState<IssueType | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  if (!o) return <main className="screen"><TopBar title={t('Report a problem', 'সমস্যা জানান')} fallback="orders" /></main>;
  const m = (n: number) => money(n, s.lang);

  // Low-value claims are approved instantly within policy.
  const itemsValue = o.pricing.subtotal;
  const partial = Math.round(Math.min(itemsValue, Math.max(...o.lines.map((l) => l.unitPrice))));
  const full = o.pricing.total;
  const amountFor = (k: IssueType) => (k === 'missing' || k === 'wrong' || k === 'damaged' ? partial : k === 'cold' ? Math.round(full * 0.3) : Math.round(full * 0.25));
  const ml = methodLabel(o.method);
  const original = o.method === 'cod' ? t('your bKash number', 'আপনার বিকাশ নম্বর') : t(ml.en, ml.bn);

  const pick = (resolution: 'refund' | 'credit' | 'redeliver', amount: number) => {
    const refundId = resolveIssue(o.id, issue!, resolution, amount);
    go(refundId ? 'refund/' + refundId : 'order/' + o.id, true);
  };

  return (
    <main className="screen">
      <TopBar title={t('Report a problem', 'সমস্যা জানান')} fallback={'order/' + o.id} help orderId={o.id} />
      <div className="pad stack-lg" style={{ paddingTop: 16 }}>
        {!issue ? (
          <section className="stack">
            <h2>{t('What went wrong?', 'কী সমস্যা হয়েছে?')}</h2>
            <p className="small muted">{o.id} · {t('We’ll offer a fix straight away — no chat needed.', 'সাথে সাথে সমাধান দেব — চ্যাট লাগবে না।')}</p>
            <div className="card card-flush">
              {ISSUE_TYPES.map((it) => (
                <button key={it.id} className="list-row" onClick={() => setIssue(it.id)}>
                  <span className="grow strong">{t(it.en, it.bn)}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="stack">
            <h2>{t('Choose how we fix it', 'কীভাবে সমাধান চান')}</h2>
            <p className="small muted">{t(ISSUE_TYPES.find((x) => x.id === issue)!.en, ISSUE_TYPES.find((x) => x.id === issue)!.bn)} · <button className="text-btn" style={{ padding: 0, minHeight: 0 }} onClick={() => setIssue(null)}>{t('change', 'বদলান')}</button></p>

            <label className="card row" style={{ cursor: 'pointer' }}>
              <Camera size={20} />
              <span className="grow small">{photo ? t('Photo added — thanks', 'ছবি যোগ হয়েছে — ধন্যবাদ') : t('Add a photo (optional, helps us fix the restaurant’s process)', 'ছবি যোগ করুন (ঐচ্ছিক)')}</span>
              {photo && <img src={photo} alt={t('Your photo', 'আপনার ছবি')} className="photo-preview" style={{ width: 48, height: 48 }} />}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
            </label>

            {(issue === 'missing' || issue === 'wrong') && (
              <button className="choice" onClick={() => pick('redeliver', 0)}>
                <Truck size={22} />
                <span className="grow"><span className="strong" style={{ display: 'block' }}>{t('Send the right item', 'সঠিক আইটেম পাঠান')}</span><span className="small muted">{t('Free redelivery in about 35 minutes', 'প্রায় ৩৫ মিনিটে বিনামূল্যে')}</span></span>
              </button>
            )}
            <button className="choice" onClick={() => pick('refund', amountFor(issue))}>
              <RotateCcw size={22} />
              <span className="grow"><span className="strong" style={{ display: 'block' }}>{t(`Refund ${m(amountFor(issue))}`, `${m(amountFor(issue))} রিফান্ড`)}</span><span className="small muted">{t(`To ${original} · usually ${o.method === 'card' ? '5–7 working days' : '1–2 days'}`, `${original}-এ · সাধারণত ${o.method === 'card' ? '৫–৭ কর্মদিবস' : '১–২ দিন'}`)}</span></span>
            </button>
            <button className="choice" onClick={() => pick('credit', Math.round(amountFor(issue) * 1.1))}>
              <Wallet size={22} />
              <span className="grow"><span className="strong" style={{ display: 'block' }}>{t(`${m(Math.round(amountFor(issue) * 1.1))} Khabar credit`, `${m(Math.round(amountFor(issue) * 1.1))} খাবার ক্রেডিট`)}</span><span className="small muted">{t('Instant, includes a 10% extra', 'তাৎক্ষণিক, ১০% বেশি')}</span></span>
              <Gift size={18} color="var(--good)" />
            </button>
            <button className="choice" onClick={() => pick('refund', full)}>
              <RotateCcw size={22} />
              <span className="grow"><span className="strong" style={{ display: 'block' }}>{t(`Full refund · ${m(full)}`, `সম্পূর্ণ রিফান্ড · ${m(full)}`)}</span><span className="small muted">{t(`To ${original}`, `${original}-এ`)}</span></span>
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
