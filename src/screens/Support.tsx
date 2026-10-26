import { useEffect, useRef, useState } from 'react';
import { Lock, Send } from 'lucide-react';
import { resolveTicket, sendMessage } from '../actions';
import { clock, useAppState, useT } from '../store';
import { TopBar } from '../components/ui';

export function SupportChat({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const tk = s.tickets[id];
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [tk?.messages.length]);
  if (!tk) return <main className="screen"><TopBar title={t('Support', 'সাপোর্ট')} /></main>;
  const typing = tk.status === 'waiting' || tk.pendingReply !== undefined;

  return (
    <main className="screen has-dock">
      <TopBar
        title={tk.category === 'safety' ? t('Safety team', 'নিরাপত্তা দল') : t('Khabar support', 'খাবার সাপোর্ট')}
        fallback=""
        right={<span className={'badge ' + (tk.status === 'resolved' ? 'badge-good' : tk.status === 'escalated' ? 'badge-warn' : 'badge-info')} style={{ marginRight: 8 }}>{tk.status === 'waiting' ? t('Connecting', 'সংযুক্ত হচ্ছে') : tk.status === 'open' ? t('Live', 'লাইভ') : tk.status === 'escalated' ? t('Escalated', 'এস্কেলেটেড') : t('Resolved', 'সমাধান')}</span>}
      />
      {tk.context.length > 0 && (
        <div className="pad" style={{ paddingTop: 12 }}>
          <div className="callout callout-info small">
            <Lock size={16} />
            <div>
              <div className="strong">{t('Shared with your agent', 'প্রতিনিধির সাথে শেয়ার করা হয়েছে')}</div>
              {tk.context.map((c, i) => <div key={i}>{t(c.en, c.bn)}</div>)}
            </div>
          </div>
        </div>
      )}
      <div className="chat" aria-live="polite">
        {tk.messages.map((msg, i) => (
          <div key={i} className={'bubble ' + msg.from}>
            {t(msg.en, msg.bn)}
            {msg.from !== 'system' && <div className="tiny" style={{ opacity: 0.6, marginTop: 4 }}>{clock(msg.at, s.lang)}</div>}
          </div>
        ))}
        {typing && <div className="bubble agent" aria-label={t('Agent is typing', 'প্রতিনিধি লিখছেন')}><span className="typing"><i /><i /><i /></span></div>}
        {tk.status === 'open' && !typing && (
          <div className="card center small" style={{ alignSelf: 'stretch' }}>
            <div className="strong">{t('Is your issue resolved?', 'সমস্যার সমাধান হয়েছে?')}</div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
              <button className="btn btn-sm btn-primary" onClick={() => resolveTicket(id, true)}>{t('Yes, resolved', 'হ্যাঁ')}</button>
              <button className="btn btn-sm btn-secondary" onClick={() => resolveTicket(id, false)}>{t('No, escalate', 'না, এস্কেলেট করুন')}</button>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form
        className="dock row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          sendMessage(id, text.trim());
          setText('');
        }}
      >
        <label className="grow">
          <span className="sr-only">{t('Message', 'মেসেজ')}</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Type a message…', 'মেসেজ লিখুন…')} />
        </label>
        <button className="btn btn-primary" type="submit" aria-label={t('Send', 'পাঠান')}><Send size={18} /></button>
      </form>
    </main>
  );
}
