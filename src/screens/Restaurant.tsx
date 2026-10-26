import { useState } from 'react';
import { Bike, ChevronLeft, Clock, Info, Minus, Plus, ShoppingBag, Star, Trash2, TriangleAlert } from 'lucide-react';
import { RESTAURANTS, type MenuItem } from '../data';
import { addToCart, changeQty, removeLine } from '../actions';
import { cartCount, itemPrice, quote, restaurantById } from '../pricing';
import { back, go, money, useAppState, useT } from '../store';
import { Img, PriceBreakdown, Sheet } from '../components/ui';

export function RestaurantScreen({ id }: { id: string }) {
  const s = useAppState();
  const t = useT();
  const r = restaurantById(id);
  const [picked, setPicked] = useState<MenuItem | null>(null);
  if (!r) return <main className="screen empty">{t('Restaurant not found.', 'রেস্টুরেন্ট পাওয়া যায়নি।')}</main>;

  const paused = r.status === 'paused';
  const alternatives = RESTAURANTS.filter((x) => x.id !== r.id && x.status === 'open').slice(0, 3);
  const count = cartCount(s);
  const cartHere = s.cart.restaurantId === r.id;

  return (
    <main className="screen wide">
      <div className="r-hero">
        <Img src={r.image} alt="" />
        <button className="icon-btn" onClick={() => back('')} aria-label={t('Back', 'পিছনে')}><ChevronLeft size={24} /></button>
      </div>
      <div className="split">
      <div>
      <div className="r-head">
        <h1>{r.name}</h1>
        <div className="meta" style={{ marginTop: 6 }}>
          <span><Star size={13} fill="currentColor" color="var(--warn)" /> {r.rating} ({r.ratings.toLocaleString()})</span>
          <span><Clock size={13} /> {r.prepMin + 15}–{r.prepMin + 30} {t('min', 'মিনিট')}</span>
          <span><Bike size={13} /> {money(r.deliveryFee, s.lang)}</span>
          <span>{t('Min. order', 'ন্যূনতম অর্ডার')} {money(r.minOrder, s.lang)}</span>
        </div>
        <div className="stack" style={{ marginTop: 12 }}>
          {r.platformMarkupPct > 0 ? (
            <div className="callout callout-info small">
              <Info size={16} />
              <span>{t(
                `Prices here are ${r.platformMarkupPct}% higher than ${r.name}’s in-store menu. The restaurant sets this to cover delivery packaging and platform commission.`,
                `এখানের দাম ${r.name}-এর দোকানের মেনুর চেয়ে ${r.platformMarkupPct}% বেশি। প্যাকেজিং ও কমিশনের জন্য রেস্টুরেন্ট এটি নির্ধারণ করে।`,
              )}</span>
            </div>
          ) : (
            <div className="callout callout-good small"><Info size={16} /><span>{t('Same prices as the in-store menu.', 'দোকানের মেনুর মতোই দাম।')}</span></div>
          )}
          {r.status === 'busy' && (
            <div className="callout callout-warn small"><Clock size={16} /><span>{t('This kitchen is busy right now. Expect about 10 extra minutes.', 'রান্নাঘর এখন ব্যস্ত। প্রায় ১০ মিনিট বেশি লাগতে পারে।')}</span></div>
          )}
        </div>
      </div>

      {paused && (
        <div className="pad" style={{ marginTop: 16 }}>
          <div className="callout callout-bad">
            <TriangleAlert size={18} />
            <div>
              <div className="strong">{t(r.pausedReasonEn!, r.pausedReasonBn!)}</div>
              <div className="small">{t('You can browse the menu. Open now nearby:', 'মেনু দেখতে পারেন। কাছাকাছি এখন খোলা:')}</div>
              <div className="chips" style={{ marginTop: 8 }}>
                {alternatives.map((a) => <button key={a.id} className="chip" onClick={() => go('r/' + a.id, true)}>{a.name}</button>)}
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="section-title">{t('Menu', 'মেনু')}</h2>
      <div className="menu-grid" style={{ borderTop: '1px solid var(--line)' }}>
        {r.menu.map((m) => {
          const disabled = !m.available || paused;
          return (
            <button key={m.id} className="menu-item" aria-disabled={disabled} onClick={() => !disabled && setPicked(m)}>
              <div className="grow">
                <div className="row" style={{ gap: 6 }}>
                  <h3>{t(m.en, m.bn)}</h3>
                  {m.popular && <span className="badge badge-warn">{t('Popular', 'জনপ্রিয়')}</span>}
                </div>
                <p className="menu-desc">{t(m.descEn, m.descBn)}</p>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className="strong tabular">{money(itemPrice(m, s.priceOverrides), s.lang)}</span>
                  {!m.available && <span className="badge badge-bad">{t('Sold out today', 'আজ শেষ')}</span>}
                </div>
              </div>
              {m.image && <div className="menu-thumb"><Img src={m.image} alt="" /></div>}
            </button>
          );
        })}
      </div>
      </div>
      <aside className="desk-only"><CartPanel restaurantId={r.id} /></aside>
      </div>

      {picked && <ItemSheet item={picked} restaurantId={r.id} onClose={() => setPicked(null)} />}

      {count > 0 && cartHere && (
        <button className="cart-bar bottom" onClick={() => go('checkout')}>
          <span className="badge" style={{ background: 'rgb(255 255 255 / 18%)', color: 'inherit' }}>{count}</span>
          <span className="grow strong">{t('Review order', 'অর্ডার দেখুন')}</span>
          <span className="strong tabular">{money(quote(s).pricing.total, s.lang)} <span className="tiny" style={{ opacity: 0.8 }}>{t('all-in', 'সব মিলিয়ে')}</span></span>
        </button>
      )}
    </main>
  );
}

function ItemSheet({ item, restaurantId, onClose }: { item: MenuItem; restaurantId: string; onClose: () => void }) {
  const s = useAppState();
  const t = useT();
  const [opts, setOpts] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  const unit = itemPrice(item, s.priceOverrides) + (item.options ?? []).filter((o) => opts.includes(o.id)).reduce((a, o) => a + o.price, 0);
  const otherCart = s.cart.restaurantId && s.cart.restaurantId !== restaurantId && s.cart.lines.length > 0;

  const add = () => {
    if (otherCart && !confirmSwitch) return setConfirmSwitch(true);
    addToCart(restaurantId, item.id, opts, qty);
    onClose();
  };

  return (
    <Sheet title={t(item.en, item.bn)} onClose={onClose}>
      <div className="stack">
        {item.image && <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}><Img src={item.image} alt="" /></div>}
        <p className="muted">{t(item.descEn, item.descBn)}</p>
        {item.options && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="field-label">{t('Customise (optional)', 'পছন্দমতো করুন (ঐচ্ছিক)')}</legend>
            {item.options.map((o) => (
              <label key={o.id} className="check" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <input type="checkbox" checked={opts.includes(o.id)} onChange={(e) => setOpts((x) => (e.target.checked ? [...x, o.id] : x.filter((i) => i !== o.id)))} />
                <span className="grow">{t(o.en, o.bn)}</span>
                <span className="muted tabular">{o.price ? '+' + money(o.price, s.lang) : t('Free', 'ফ্রি')}</span>
              </label>
            ))}
          </fieldset>
        )}
        {confirmSwitch && (
          <div className="callout callout-warn small">
            <TriangleAlert size={16} />
            <span>{t(`Your cart has items from ${restaurantById(s.cart.restaurantId)?.name}. Adding this starts a new cart and removes them.`, `আপনার কার্টে ${restaurantById(s.cart.restaurantId)?.name}-এর আইটেম আছে। এটি যোগ করলে আগের কার্ট মুছে যাবে।`)}</span>
          </div>
        )}
        <div className="row">
          <div className="stepper" role="group" aria-label={t('Quantity', 'পরিমাণ')}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t('Decrease', 'কমান')}><Minus size={16} /></button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label={t('Increase', 'বাড়ান')}><Plus size={16} /></button>
          </div>
          <button className="btn btn-primary grow" onClick={add}>
            {confirmSwitch ? t('Start new cart', 'নতুন কার্ট শুরু') : t('Add to cart', 'কার্টে যোগ করুন')} · {money(unit * qty, s.lang)}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

/** Desktop-only live cart next to the menu. */
function CartPanel({ restaurantId }: { restaurantId: string }) {
  const s = useAppState();
  const t = useT();
  const q = quote(s);
  const m = (n: number) => money(n, s.lang);
  const here = s.cart.restaurantId === restaurantId && q.lines.length > 0;

  if (!here) {
    return (
      <div className="card center" style={{ padding: 28 }}>
        <ShoppingBag size={32} className="faint" style={{ margin: '0 auto 10px' }} />
        <h3>{t('Your order', 'আপনার অর্ডার')}</h3>
        <p className="small muted" style={{ marginTop: 6 }}>
          {s.cart.lines.length > 0
            ? t(`Your cart has items from ${restaurantById(s.cart.restaurantId)?.name}. Adding from here starts a new cart.`, `আপনার কার্টে ${restaurantById(s.cart.restaurantId)?.name}-এর আইটেম আছে। এখান থেকে যোগ করলে নতুন কার্ট শুরু হবে।`)
            : t('Pick something from the menu. You’ll see the full price, fees included, right here.', 'মেনু থেকে বেছে নিন। ফি সহ পুরো দাম এখানেই দেখবেন।')}
        </p>
      </div>
    );
  }

  return (
    <div className="card stack">
      <h3>{t('Your order', 'আপনার অর্ডার')}</h3>
      <div>
        {q.lines.map((l) => (
          <div key={l.key} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
            <div className="grow">
              <div className="small strong">{t(l.en, l.bn)}</div>
              {l.optionsEn.length > 0 && <div className="tiny muted">{(s.lang === 'bn' ? l.optionsBn : l.optionsEn).join(', ')}</div>}
              <div className="tiny tabular">{m(l.unitPrice * l.qty)}</div>
            </div>
            <div className="stepper" role="group" aria-label={t(`Quantity of ${l.en}`, `${l.bn} পরিমাণ`)}>
              <button onClick={() => (l.qty === 1 ? removeLine(l.key) : changeQty(l.key, -1))} aria-label={l.qty === 1 ? t('Remove', 'সরান') : t('Decrease', 'কমান')}>
                {l.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
              </button>
              <span>{l.qty}</span>
              <button onClick={() => changeQty(l.key, 1)} aria-label={t('Increase', 'বাড়ান')}><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <PriceBreakdown p={q.pricing} compact />
      {q.belowMinimum > 0 && <p className="small" style={{ color: 'var(--warn)' }}>{t(`Add ${m(q.belowMinimum)} more to reach the minimum order.`, `ন্যূনতম অর্ডারে পৌঁছাতে আরও ${m(q.belowMinimum)} যোগ করুন।`)}</p>}
      <button className="btn btn-primary btn-block" onClick={() => go('checkout')}>{t('Go to checkout', 'চেকআউটে যান')} · {m(q.pricing.total)}</button>
    </div>
  );
}
