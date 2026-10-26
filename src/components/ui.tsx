import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronLeft,
  CircleHelp,
  Home,
  ImageOff,
  Info,
  Languages,
  MapPin,
  Receipt,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { back, go, money, update, useAppState, useRoute, useT, type Notice, type Pricing } from '../store';
import { cartCount, quote } from '../pricing';

/* ---------------------------------------------------------------- top bar */

export function TopBar({ title, fallback = '', help, orderId, right }: { title: string; fallback?: string; help?: boolean; orderId?: string; right?: ReactNode }) {
  const t = useT();
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => back(fallback)} aria-label={t('Back', 'পিছনে')}>
        <ChevronLeft size={24} />
      </button>
      <h1>{title}</h1>
      {right}
      {help && <HelpButton orderId={orderId} />}
    </header>
  );
}

export function HelpButton({ orderId, label = true }: { orderId?: string; label?: boolean }) {
  const t = useT();
  return (
    <button className="text-btn" onClick={() => update((d) => void (d.ui.help = { open: true, orderId }))} aria-label={t('Get help', 'সাহায্য নিন')}>
      <CircleHelp size={20} />
      {label && t('Help', 'সাহায্য')}
    </button>
  );
}

/* ---------------------------------------------------------------- sheet */

export function Sheet({ title, onClose, children, labelledBy }: { title: string; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const id = labelledBy ?? 'sheet-title';
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Close', 'বন্ধ করুন')}>
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- image (low-data aware) */

export function Img({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const { lowData } = useAppState();
  const [failed, setFailed] = useState(false);
  if (!src || lowData || failed) {
    return (
      <div className={'no-img ' + (className ?? '')} style={{ width: '100%', height: '100%' }} aria-hidden={!alt}>
        <ImageOff size={20} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} onError={() => setFailed(true)} />;
}

/* ---------------------------------------------------------------- bottom nav */

export function BottomNav() {
  const s = useAppState();
  const route = useRoute();
  const t = useT();
  const count = cartCount(s);
  const active = s.orderIds.filter((id) => ['placed', 'confirmed', 'preparing', 'rider_assigned', 'picked_up', 'arriving', 'awaiting_payment'].includes(s.orders[id].stage)).length;
  const items = [
    { href: '#/', name: 'home', icon: Home, en: 'Home', bn: 'হোম' },
    { href: '#/checkout', name: 'checkout', icon: ShoppingBag, en: 'Cart', bn: 'কার্ট', count },
    { href: '#/orders', name: 'orders', icon: Receipt, en: 'Orders', bn: 'অর্ডার', count: active },
    { href: '#/account', name: 'account', icon: User, en: 'Account', bn: 'অ্যাকাউন্ট' },
  ];
  return (
    <nav className="bottom-nav" aria-label={t('Main', 'প্রধান')}>
      {items.map((it) => (
        <a key={it.name} href={it.href} aria-current={route.name === it.name ? 'page' : undefined}>
          <it.icon size={22} />
          {t(it.en, it.bn)}
          {!!it.count && <span className="nav-count" aria-label={`${it.count}`}>{it.count}</span>}
        </a>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- desktop header (≥1024px) */

export function DesktopHeader() {
  const s = useAppState();
  const route = useRoute();
  const t = useT();
  const count = cartCount(s);
  const addr = s.checkout.address;
  const links = [
    { href: '#/', name: 'home', icon: Home, en: 'Restaurants', bn: 'রেস্টুরেন্ট' },
    { href: '#/orders', name: 'orders', icon: Receipt, en: 'Orders', bn: 'অর্ডার' },
    { href: '#/account', name: 'account', icon: User, en: 'Account', bn: 'অ্যাকাউন্ট' },
  ];
  return (
    <header className="desk-header">
      <a href="#/" className="brand" aria-label="Khabar home">
        <span className="brand-mark"><ShoppingBag size={18} /></span>
        Khabar
      </a>
      <button className="address-pill" onClick={() => go('address')} style={{ maxWidth: 300 }}>
        <MapPin size={18} color="var(--accent)" />
        <span style={{ minWidth: 0 }}>
          <span className="tiny faint" style={{ display: 'block' }}>{t('Deliver to', 'ডেলিভারি ঠিকানা')}</span>
          <span className="small strong" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {addr ? `${addr.label} · ${addr.line}` : t('Choose address', 'ঠিকানা বেছে নিন')}
          </span>
        </span>
      </button>
      <nav className="desk-nav grow" aria-label={t('Main', 'প্রধান')}>
        {links.map((l) => (
          <a key={l.name} href={l.href} aria-current={route.name === l.name || (l.name === 'home' && route.name === 'restaurant') ? 'page' : undefined}>
            <l.icon size={18} />
            {t(l.en, l.bn)}
          </a>
        ))}
      </nav>
      <button className="chip" onClick={() => update((d) => void (d.lang = d.lang === 'en' ? 'bn' : 'en'))} aria-label={t('Switch to Bangla', 'Switch to English')}>
        <Languages size={16} /> {s.lang === 'en' ? 'বাংলা' : 'EN'}
      </button>
      <button className="desk-cart" onClick={() => go('checkout')} disabled={count === 0}>
        <ShoppingBag size={18} />
        {count > 0 ? <>{t(`Cart · ${count}`, `কার্ট · ${count}`)} <span className="tabular">{money(quote(s).pricing.total, s.lang)}</span></> : t('Cart empty', 'কার্ট খালি')}
      </button>
    </header>
  );
}

/* ---------------------------------------------------------------- notifications */

export function Toasts() {
  const s = useAppState();
  const t = useT();
  const seen = useRef<Set<string>>(new Set(s.notices.map((n) => n.id)));
  const [visible, setVisible] = useState<Notice[]>([]);

  // State is re-cloned every simulation tick, so dismiss timers must not depend on effect cleanup.
  useEffect(() => {
    const fresh = s.notices.filter((n) => !seen.current.has(n.id));
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current.add(n.id));
    setVisible((v) => [...fresh, ...v].slice(0, 2));
    const ids = fresh.map((n) => n.id);
    setTimeout(() => setVisible((v) => v.filter((n) => !ids.includes(n.id))), 6000);
  }, [s.notices]);

  const channel = (c: Notice['channel']) => (c === 'sms' ? t('SMS', 'এসএমএস') : c === 'push' ? t('Notification', 'নোটিফিকেশন') : t('Update', 'আপডেট'));
  return (
    <div className="toasts" role="status" aria-live="polite">
      {visible.map((n) => (
        <button
          key={n.id}
          className="toast"
          onClick={() => {
            setVisible((v) => v.filter((x) => x.id !== n.id));
            if (n.link) go(n.link);
          }}
        >
          <Info size={18} style={{ marginTop: 2, flex: 'none' }} />
          <span className="grow">
            <span className="channel">{channel(n.channel)}</span>
            <span className="strong" style={{ display: 'block' }}>{t(n.en, n.bn)}</span>
            <span className="small" style={{ opacity: 0.85 }}>{t(n.bodyEn, n.bodyBn)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- price breakdown */

export function PriceBreakdown({ p, compact }: { p: Pricing; compact?: boolean }) {
  const { lang } = useAppState();
  const t = useT();
  const m = (n: number) => money(n, lang);
  return (
    <div aria-label={t('Price breakdown', 'মূল্যের বিবরণ')}>
      <div className="price-row"><span className="lbl">{t('Items subtotal', 'খাবারের দাম')}</span><span>{m(p.subtotal)}</span></div>
      <div className="price-row">
        <span className="lbl">{t('Delivery fee', 'ডেলিভারি ফি')}</span>
        <span>{p.deliveryWaived ? <><span className="strike">{m(p.deliveryFee)}</span>{m(p.deliveryFee - p.deliveryWaived)}</> : m(p.deliveryFee)}</span>
      </div>
      <div className="price-row"><span className="lbl">{t('Service fee', 'সার্ভিস ফি')}</span><span>{m(p.serviceFee)}</span></div>
      {p.smallOrderFee > 0 && <div className="price-row"><span className="lbl">{t('Small-order fee (under ৳250)', 'ছোট অর্ডার ফি (৳২৫০-এর নিচে)')}</span><span>{m(p.smallOrderFee)}</span></div>}
      <div className="price-row"><span className="lbl">{t('VAT (5%)', 'ভ্যাট (৫%)')}</span><span>{m(p.vat)}</span></div>
      {p.methodFee > 0 && <div className="price-row"><span className="lbl">{t('Payment fee', 'পেমেন্ট ফি')}</span><span>{m(p.methodFee)}</span></div>}
      {p.tip > 0 && <div className="price-row"><span className="lbl">{t('Rider tip (100% to rider)', 'রাইডার টিপ (পুরোটা রাইডারের)')}</span><span>{m(p.tip)}</span></div>}
      {p.discount > 0 && <div className="price-row saving"><span className="lbl">{t('Promo', 'প্রোমো')} {p.promoCode}</span><span>−{m(p.discount)}</span></div>}
      {p.credit > 0 && <div className="price-row saving"><span className="lbl">{t('Khabar credit', 'খাবার ক্রেডিট')}</span><span>−{m(p.credit)}</span></div>}
      <div className="price-row total"><span className="lbl">{t('Total to pay', 'মোট পরিশোধ')}</span><span>{m(p.total)}</span></div>
      {!compact && (p.discount > 0 || p.deliveryWaived > 0) && (
        <p className="small" style={{ color: 'var(--good)', marginTop: 6 }}>
          <Check size={14} style={{ verticalAlign: '-2px' }} /> {t(`You save ${m(p.discount + p.deliveryWaived)} on this order.`, `এই অর্ডারে ${m(p.discount + p.deliveryWaived)} সাশ্রয়।`)}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- misc */

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span />
    </span>
  );
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(i);
  }, [intervalMs]);
  return now;
}

export function ago(ms: number, t: (en: string, bn: string) => string) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return t('just now', 'এইমাত্র');
  if (s < 60) return t(`${s}s ago`, `${s} সেকেন্ড আগে`);
  const m = Math.round(s / 60);
  return t(`${m} min ago`, `${m} মিনিট আগে`);
}
