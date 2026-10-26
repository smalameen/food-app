import { Check, ChevronRight, Receipt } from 'lucide-react';
import { day, go, money, update, useAppState, useT, type RefundStage } from '../store';
import { TopBar } from '../components/ui';

const STEPS: { id: RefundStage; en: string; bn: string }[] = [
  { id: 'requested', en: 'Requested', bn: 'অনুরোধ করা হয়েছে' },
  { id: 'approved', en: 'Approved', bn: 'অনুমোদিত' },
  { id: 'processing', en: 'Sent to your provider', bn: 'প্রোভাইডারে পাঠানো হয়েছে' },
  { id: 'credited', en: 'Credited', bn: 'জমা হয়েছে' },
];

export function RefundScreen({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const r = s.refunds[id];
  if (!r) return <main className="screen"><TopBar title={t('Refund', 'রিফান্ড')} fallback="refunds" /><div className="empty">{t('Refund not found.', 'রিফান্ড পাওয়া যায়নি।')}</div></main>;
  const idx = STEPS.findIndex((x) => x.id === r.stage);
  const done = r.stage === 'credited';
  const late = !done && Date.now() > r.expectedBy;

  return (
    <main className="screen">
      <TopBar title={t('Refund status', 'রিফান্ডের অবস্থা')} fallback="refunds" help orderId={r.orderId} />
      <div className="pad stack" style={{ paddingTop: 16 }}>
        <div className="card">
          <div className="row-between">
            <span className="muted small">{t(r.reasonEn, r.reasonBn)}</span>
            <span className={'badge ' + (done ? 'badge-good' : 'badge-info')}>{t(STEPS[idx].en, STEPS[idx].bn)}</span>
          </div>
          <div className="eta" style={{ marginTop: 4 }}>{money(r.amount, s.lang)}</div>
          <div className="steps" style={{ marginTop: 12 }} aria-hidden>{STEPS.map((x, i) => <div key={x.id} className={i <= idx ? 'on' : ''} />)}</div>
          <dl className="kv" style={{ marginTop: 14 }}>
            <dt>{t('Going to', 'যাবে')}</dt><dd>{t(r.destinationLabelEn, r.destinationLabelBn)}</dd>
            <dt>{done ? t('Credited', 'জমা হয়েছে') : t('Expected by', 'প্রত্যাশিত')}</dt><dd>{day(done ? r.history[r.history.length - 1].at : r.expectedBy, s.lang)}</dd>
            <dt>{t('Reference', 'রেফারেন্স')}</dt><dd>{r.id}</dd>
            {r.orderId && (<><dt>{t('Order', 'অর্ডার')}</dt><dd><a href={'#/order/' + r.orderId}>{r.orderId}</a></dd></>)}
          </dl>
        </div>

        <section className="card">
          <h3 style={{ marginBottom: 12 }}>{t('Timeline', 'সময়রেখা')}</h3>
          <ol className="timeline">
            {STEPS.map((x, i) => {
              const h = r.history.find((e) => e.stage === x.id);
              const isDone = i <= idx;
              return (
                <li key={x.id} className={isDone ? 'done' : i === idx + 1 ? 'current' : 'todo'}>
                  <span className="t-dot">{isDone && <Check size={14} />}</span>
                  <span className="grow">{t(x.en, x.bn)}</span>
                  {h && <span className="small faint">{new Date(h.at).toLocaleTimeString(s.lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
                </li>
              );
            })}
          </ol>
        </section>

        <div className={'callout small ' + (late ? 'callout-warn' : '')}>
          <Receipt size={16} />
          <span>
            {done
              ? t('This refund is complete. If you can’t see it, your provider’s statement may take a few hours to update.', 'রিফান্ড সম্পন্ন। দেখতে না পেলে প্রোভাইডারের স্টেটমেন্ট হালনাগাদ হতে কয়েক ঘণ্টা লাগতে পারে।')
              : late
                ? t('This is taking longer than promised. We’ve escalated it automatically and will update you — no need to contact us.', 'প্রতিশ্রুত সময়ের চেয়ে বেশি লাগছে। স্বয়ংক্রিয়ভাবে এস্কেলেট করা হয়েছে।')
                : t('We’ll update you at each step. If it isn’t credited by the expected date, we escalate automatically.', 'প্রতিটি ধাপে জানাব। নির্ধারিত তারিখে জমা না হলে স্বয়ংক্রিয়ভাবে এস্কেলেট হবে।')}
          </span>
        </div>
        <button className="btn btn-secondary btn-block" onClick={() => update((d) => void (d.ui.help = { open: true, orderId: r.orderId, category: 'refund' }))}>{t('Talk to a person about this refund', 'এই রিফান্ড নিয়ে কথা বলুন')}</button>
      </div>
    </main>
  );
}

export function RefundsList() {
  const s = useAppState();
  const t = useT();
  return (
    <main className="screen">
      <TopBar title={t('Refunds', 'রিফান্ড')} fallback="account" />
      {s.refundIds.length === 0 ? (
        <div className="empty"><Receipt size={40} /><p>{t('No refunds. When there is one, you’ll see its status and expected date here.', 'কোনো রিফান্ড নেই। থাকলে এখানে অবস্থা ও তারিখ দেখবেন।')}</p></div>
      ) : (
        <div className="pad" style={{ paddingTop: 16 }}>
          <div className="card card-flush">
            {s.refundIds.map((id) => {
              const r = s.refunds[id];
              return (
                <button key={id} className="list-row" onClick={() => go('refund/' + id)}>
                  <div className="grow">
                    <div className="row-between"><span className="strong">{money(r.amount, s.lang)}</span><span className={'badge ' + (r.stage === 'credited' ? 'badge-good' : 'badge-info')}>{r.stage}</span></div>
                    <div className="small muted">{t(r.reasonEn, r.reasonBn)} · {t(r.destinationLabelEn, r.destinationLabelBn)}</div>
                  </div>
                  <ChevronRight size={18} className="chev" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
