import { ChevronRight, FlaskConical, Gauge, Languages, MapPin, Receipt, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { plusActive } from '../pricing';
import { go, money, update, useAppState, useT } from '../store';
import { Switch } from '../components/ui';

export function Account() {
  const s = useAppState();
  const t = useT();
  return (
    <main className="screen">
      <header className="topbar" style={{ paddingLeft: 16 }}><h1>{t('Account', 'অ্যাকাউন্ট')}</h1></header>
      <div className="pad stack-lg" style={{ paddingTop: 16 }}>
        <div className="card row">
          <Wallet size={22} color="var(--brand)" />
          <div className="grow">
            <div className="small muted">{t('Khabar credit', 'খাবার ক্রেডিট')}</div>
            <div className="strong" style={{ fontSize: 20 }}>{money(s.credit, s.lang)}</div>
          </div>
          <span className="small faint">{t('Applied at checkout', 'চেকআউটে ব্যবহারযোগ্য')}</span>
        </div>

        <div className="card card-flush">
          <button className="list-row" onClick={() => go('plus')}>
            <Sparkles size={20} />
            <span className="grow">Khabar Plus <span className="small muted">· {plusActive(s) ? (s.subscription.status === 'active' ? t('active', 'সক্রিয়') : t('cancelled, benefits until period end', 'বাতিল, মেয়াদ শেষ পর্যন্ত সুবিধা')) : t('not subscribed', 'সাবস্ক্রাইব করা নেই')}</span></span>
            <ChevronRight size={18} className="chev" />
          </button>
          <button className="list-row" onClick={() => go('refunds')}>
            <Receipt size={20} />
            <span className="grow">{t('Refunds', 'রিফান্ড')}</span>
            <ChevronRight size={18} className="chev" />
          </button>
          <button className="list-row" onClick={() => go('address')}>
            <MapPin size={20} />
            <span className="grow">{t('Saved addresses', 'সংরক্ষিত ঠিকানা')} <span className="small muted">· {s.addresses.length}</span></span>
            <ChevronRight size={18} className="chev" />
          </button>
          <button className="list-row" onClick={() => update((d) => void (d.ui.safety = { open: true }))}>
            <ShieldCheck size={20} />
            <span className="grow">{t('Safety & privacy', 'নিরাপত্তা ও গোপনীয়তা')}</span>
            <ChevronRight size={18} className="chev" />
          </button>
        </div>

        <div className="card card-flush">
          <div className="list-row">
            <Languages size={20} />
            <span className="grow">{t('Language', 'ভাষা')}</span>
            <div className="chips" role="radiogroup">
              <button className="chip" role="radio" aria-checked={s.lang === 'en'} onClick={() => update((d) => void (d.lang = 'en'))}>English</button>
              <button className="chip" role="radio" aria-checked={s.lang === 'bn'} onClick={() => update((d) => void (d.lang = 'bn'))}>বাংলা</button>
            </div>
          </div>
          <div className="list-row">
            <Gauge size={20} />
            <span className="grow">
              {t('Low-data mode', 'লো-ডেটা মোড')}
              <span className="small muted" style={{ display: 'block' }}>{t('Hides photos to save data on slow networks', 'ধীর নেটওয়ার্কে ডেটা বাঁচাতে ছবি লুকায়')}</span>
            </span>
            <Switch checked={s.lowData} onChange={(v) => update((d) => void (d.lowData = v))} label={t('Low-data mode', 'লো-ডেটা মোড')} />
          </div>
          <div className="list-row small">
            <MapPin size={20} />
            <span className="grow">
              {t('Location access', 'লোকেশন অ্যাক্সেস')}: <strong>{s.locationPermission === 'granted' ? t('used once for pins', 'পিনের জন্য একবার') : s.locationPermission === 'denied' ? t('off', 'বন্ধ') : t('not asked', 'চাওয়া হয়নি')}</strong>
              <span className="muted" style={{ display: 'block' }}>{t('We never track you in the background.', 'আমরা কখনো ব্যাকগ্রাউন্ডে ট্র্যাক করি না।')}</span>
            </span>
          </div>
        </div>

        <button className="btn btn-secondary btn-block" onClick={() => update((d) => void (d.ui.demoOpen = true))}>
          <FlaskConical size={18} /> {t('Demo controls & analytics log', 'ডেমো নিয়ন্ত্রণ ও অ্যানালিটিক্স লগ')}
        </button>
        <p className="tiny faint center">{t('Prototype. All data is stored only in this browser.', 'প্রোটোটাইপ। সব ডেটা শুধু এই ব্রাউজারে সংরক্ষিত।')}</p>
      </div>
    </main>
  );
}
