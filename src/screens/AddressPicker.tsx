import { useMemo, useState } from 'react';
import { Briefcase, Building2, Check, CircleAlert, Crosshair, Home, LocateFixed, MapPin, Search, TriangleAlert } from 'lucide-react';
import { PLACES, type Point, type SavedAddress } from '../data';
import { back, track, trackNow, uid, update, useAppState, useT, type DeliveryAddress } from '../store';
import { CityMap, inZone, nearestPlace } from '../components/CityMap';
import { Sheet, Switch, TopBar } from '../components/ui';

type Step = 'choose' | 'pin';

export function AddressPicker() {
  const s = useAppState();
  const t = useT();
  const [step, setStep] = useState<Step>('choose');
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState(false);
  const [askLocation, setAskLocation] = useState<null | 'explain' | 'system'>(null);
  const [draft, setDraft] = useState<DeliveryAddress | null>(null);
  const [reference, setReference] = useState<Point | null>(null);
  const [save, setSave] = useState(true);
  const [pinAck, setPinAck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return PLACES.filter((p) => p.en.toLowerCase().includes(q) || p.bn.includes(q) || p.area.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const startPin = (a: DeliveryAddress, ref: Point | null) => {
    setDraft(a);
    setReference(ref);
    setPinAck(false);
    setError(null);
    setStep('pin');
  };

  const fromSaved = (a: SavedAddress) => {
    update((d) => track(d, 'address_selected', { source: 'saved', label: a.label }));
    startPin({ ...a, savedId: a.id, confirmed: false }, a.pos);
  };

  const fromPlace = (p: (typeof PLACES)[number]) => {
    update((d) => track(d, 'address_selected', { source: 'search', area: p.area }));
    startPin({ label: 'Other', line: p.en, area: p.area, pos: p.pos, building: '', floor: '', landmark: '', notes: '', confirmed: false }, p.pos);
  };

  const useDeviceLocation = () => {
    if (s.locationPermission === 'granted') return grantLocation();
    setAskLocation('explain');
  };
  const grantLocation = () => {
    update((d) => void (d.locationPermission = 'granted'));
    setAskLocation(null);
    const pos = { x: 104 + Math.round(Math.random() * 10), y: 222 + Math.round(Math.random() * 8) }; // simulated GPS fix
    const near = nearestPlace(pos, PLACES).place;
    startPin({ label: 'Other', line: near.en, area: near.area, pos, building: '', floor: '', landmark: '', notes: '', confirmed: false }, pos);
  };
  const denyLocation = () => {
    update((d) => {
      d.locationPermission = 'denied';
      track(d, 'location_permission_denied');
    });
    setAskLocation(null);
  };

  if (step === 'pin' && draft) {
    const zoneOk = inZone(draft.pos);
    const near = nearestPlace(draft.pos, PLACES);
    const moved = reference ? Math.hypot(reference.x - draft.pos.x, reference.y - draft.pos.y) : 0;
    const filled = [draft.building, draft.floor].filter((x) => x.trim()).length;
    const confidence: 'high' | 'medium' | 'low' = moved > 45 || filled === 0 ? 'low' : filled === 1 || moved > 20 ? 'medium' : 'high';
    const setD = (patch: Partial<DeliveryAddress>) => setDraft({ ...draft, ...patch });

    const confirm = () => {
      if (!zoneOk) return setError(t('This pin is outside our delivery area. Move it inside the dashed line.', 'পিনটি ডেলিভারি এলাকার বাইরে। ড্যাশ লাইনের ভিতরে আনুন।'));
      if (!draft.line.trim()) return setError(t('Add a street or house address.', 'রাস্তা বা বাড়ির ঠিকানা দিন।'));
      if (confidence === 'low' && !pinAck) return setError(t('Please confirm the pin is at your building’s entrance.', 'পিনটি আপনার বিল্ডিংয়ের প্রবেশপথে আছে কিনা নিশ্চিত করুন।'));
      const final = { ...draft, confirmed: true };
      update((d) => {
        if (save && !draft.savedId) {
          const saved: SavedAddress = { id: uid('a-'), label: final.label, line: final.line, area: final.area, pos: final.pos, building: final.building, floor: final.floor, landmark: final.landmark, notes: final.notes };
          d.addresses.push(saved);
          final.savedId = saved.id;
        } else if (draft.savedId) {
          const sa = d.addresses.find((a) => a.id === draft.savedId);
          if (sa) Object.assign(sa, { pos: final.pos, building: final.building, floor: final.floor, landmark: final.landmark, notes: final.notes });
        }
        d.checkout.address = final;
      });
      back('checkout');
    };

    return (
      <main className="screen wide has-dock">
        <TopBar title={t('Confirm delivery point', 'ডেলিভারি পয়েন্ট নিশ্চিত করুন')} fallback="checkout" right={<button className="text-btn" onClick={() => setStep('choose')}>{t('Change', 'বদলান')}</button>} />
        <div className="pad split-even" style={{ paddingTop: 12 }}>
          <div className="stack">
          <p className="small muted">{t('Drag or tap the map to put the pin on your building’s entrance. Arrow keys also move it.', 'ম্যাপে টেনে বা ট্যাপ করে পিনটি বিল্ডিংয়ের প্রবেশপথে রাখুন। অ্যারো কী দিয়েও সরানো যায়।')}</p>
          <CityMap
            destination={draft.pos}
            showZone
            draggablePin
            onPinChange={(p) => {
              setD({ pos: p });
              setError(null);
            }}
            label={t('Map: move the delivery pin', 'ম্যাপ: ডেলিভারি পিন সরান')}
          />
          <div className="row-between small">
            <span className="muted"><Crosshair size={14} style={{ verticalAlign: '-2px' }} /> {t('Near', 'কাছে')} {t(near.place.en, near.place.bn)}</span>
            {zoneOk ? (
              <span className={'badge ' + (confidence === 'high' ? 'badge-good' : confidence === 'medium' ? 'badge-warn' : 'badge-bad')}>
                {confidence === 'high' ? t('Easy to find', 'সহজে খুঁজে পাবে') : confidence === 'medium' ? t('Add more detail', 'আরও তথ্য দিন') : t('Hard to find', 'খুঁজে পাওয়া কঠিন')}
              </span>
            ) : (
              <span className="badge badge-bad">{t('Outside delivery area', 'ডেলিভারি এলাকার বাইরে')}</span>
            )}
          </div>
          {!zoneOk && (
            <div className="callout callout-bad small"><TriangleAlert size={16} /><span>{t('We don’t deliver here yet. Move the pin inside the dashed area, or choose another address.', 'এখানে এখনো ডেলিভারি নেই। পিন ড্যাশ এলাকার ভিতরে আনুন বা অন্য ঠিকানা বেছে নিন।')}</span></div>
          )}
          {moved > 20 && zoneOk && (
            <div className="callout callout-warn small"><CircleAlert size={16} /><span>{t('The pin is some distance from the address you picked. That’s fine if it’s correct — the rider follows the pin.', 'পিনটি বেছে নেওয়া ঠিকানা থেকে কিছুটা দূরে। সঠিক হলে ঠিক আছে — রাইডার পিন অনুসরণ করবেন।')}</span></div>
          )}

          </div>
          <div className="stack">
          <label className="field">
            <span className="field-label">{t('Street / house', 'রাস্তা / বাড়ি')} <span className="faint">{t('Required', 'আবশ্যক')}</span></span>
            <input className="input" value={draft.line} onChange={(e) => setD({ line: e.target.value })} />
          </label>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <label className="field grow">
              <span className="field-label">{t('Building', 'বিল্ডিং')}</span>
              <input className="input" placeholder={t('e.g. Nirjhor Apartments', 'যেমন: নির্ঝর অ্যাপার্টমেন্ট')} value={draft.building} onChange={(e) => setD({ building: e.target.value })} />
            </label>
            <label className="field grow">
              <span className="field-label">{t('Floor / flat', 'তলা / ফ্ল্যাট')}</span>
              <input className="input" placeholder={t('e.g. 5B', 'যেমন: ৫বি')} value={draft.floor} onChange={(e) => setD({ floor: e.target.value })} />
            </label>
          </div>
          <label className="field">
            <span className="field-label">{t('Landmark', 'ল্যান্ডমার্ক')} <span className="faint">{t('Helps riders a lot', 'রাইডারদের অনেক সাহায্য করে')}</span></span>
            <input className="input" placeholder={t('e.g. Opposite Rapa Plaza, blue gate', 'যেমন: রাপা প্লাজার বিপরীতে, নীল গেট')} value={draft.landmark} onChange={(e) => setD({ landmark: e.target.value })} />
          </label>
          <label className="field">
            <span className="field-label">{t('Entry notes', 'প্রবেশের নোট')}</span>
            <input className="input" placeholder={t('e.g. Guard calls up; use side gate after 10 PM', 'যেমন: গার্ড কল দেবে; রাত ১০টার পর পাশের গেট')} value={draft.notes} onChange={(e) => setD({ notes: e.target.value })} />
          </label>
          <div>
            <div className="field-label">{t('Label', 'লেবেল')}</div>
            <div className="chips" role="radiogroup">
              {(['Home', 'Work', 'Other'] as const).map((l) => (
                <button key={l} className="chip" role="radio" aria-checked={draft.label === l} onClick={() => setD({ label: l })}>
                  {l === 'Home' ? t('Home', 'বাসা') : l === 'Work' ? t('Work', 'অফিস') : t('Other', 'অন্যান্য')}
                </button>
              ))}
            </div>
          </div>
          {!draft.savedId && (
            <div className="row-between">
              <span className="small">{t('Save this address', 'ঠিকানা সংরক্ষণ করুন')}</span>
              <Switch checked={save} onChange={setSave} label={t('Save this address', 'ঠিকানা সংরক্ষণ করুন')} />
            </div>
          )}
          {confidence === 'low' && zoneOk && (
            <label className="check card">
              <input type="checkbox" checked={pinAck} onChange={(e) => { setPinAck(e.target.checked); setError(null); }} />
              <span>{t('Yes, the pin is at my building’s entrance. (Adding building and floor makes it easier.)', 'হ্যাঁ, পিনটি আমার বিল্ডিংয়ের প্রবেশপথে। (বিল্ডিং ও তলা দিলে সহজ হয়।)')}</span>
            </label>
          )}
          <p className="tiny faint">{t('Your rider sees the pin, building, floor, landmark and notes. We never move your pin automatically.', 'রাইডার পিন, বিল্ডিং, তলা, ল্যান্ডমার্ক ও নোট দেখেন। আমরা কখনো স্বয়ংক্রিয়ভাবে পিন সরাই না।')}</p>
          </div>
        </div>
        <div className="dock">
          {error && <p className="field-error" role="alert" style={{ marginTop: 0, marginBottom: 8 }}><CircleAlert size={15} />{error}</p>}
          <button className="btn btn-primary btn-block" onClick={() => { trackNow('map_pin_adjusted', { moved: Math.round(moved) }); confirm(); }}>
            <Check size={18} /> {t('Confirm this delivery point', 'এই ডেলিভারি পয়েন্ট নিশ্চিত করুন')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <TopBar title={t('Delivery address', 'ডেলিভারি ঠিকানা')} fallback="checkout" />
      <div className="pad stack-lg" style={{ paddingTop: 12 }}>
        <label className="field">
          <span className="sr-only">{t('Search for an address', 'ঠিকানা খুঁজুন')}</span>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--ink-3)' }} />
            <input className="input" style={{ paddingLeft: 42 }} placeholder={t('Search area, road or landmark', 'এলাকা, রাস্তা বা ল্যান্ডমার্ক খুঁজুন')} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus role="combobox" aria-expanded={results.length > 0} aria-controls="addr-results" aria-autocomplete="list" />
          </div>
        </label>
        {query.trim().length >= 2 && (
          <div className="card card-flush" id="addr-results" role="listbox">
            {results.map((p) => (
              <button key={p.id} className="list-row" role="option" aria-selected={false} onClick={() => fromPlace(p)}>
                <MapPin size={18} className="faint" />
                <span className="grow"><span style={{ display: 'block' }}>{t(p.en, p.bn)}</span><span className="small faint">{p.area}, Dhaka</span></span>
              </button>
            ))}
            {results.length === 0 && <div className="list-row small muted">{t('No matches. Try a nearby landmark, or enter the address manually.', 'মিল পাওয়া যায়নি। কাছের ল্যান্ডমার্ক লিখুন বা হাতে ঠিকানা দিন।')}</div>}
          </div>
        )}

        <div className="card card-flush">
          <button className="list-row" onClick={useDeviceLocation}>
            <LocateFixed size={20} color="var(--brand)" />
            <span className="grow">
              <span className="strong" style={{ display: 'block' }}>{t('Use my current location', 'আমার বর্তমান লোকেশন ব্যবহার করুন')}</span>
              {s.locationPermission === 'denied' && <span className="small muted">{t('Location is off — that’s fine, search or enter your address instead.', 'লোকেশন বন্ধ — সমস্যা নেই, ঠিকানা খুঁজুন বা লিখুন।')}</span>}
            </span>
          </button>
          <button className="list-row" onClick={() => setManual((m) => !m)}>
            <Building2 size={20} color="var(--brand)" />
            <span className="grow strong">{t('Enter address manually', 'হাতে ঠিকানা লিখুন')}</span>
          </button>
        </div>

        {manual && <ManualEntry onDone={(a) => startPin(a, null)} />}

        {s.addresses.length > 0 && (
          <section>
            <h2 style={{ marginBottom: 10 }}>{t('Saved addresses', 'সংরক্ষিত ঠিকানা')}</h2>
            <div className="card card-flush">
              {s.addresses.map((a) => {
                const Icon = a.label === 'Home' ? Home : a.label === 'Work' ? Briefcase : MapPin;
                const selected = s.checkout.address?.savedId === a.id;
                return (
                  <button key={a.id} className="list-row" onClick={() => fromSaved(a)} aria-current={selected}>
                    <Icon size={20} />
                    <span className="grow">
                      <span className="strong" style={{ display: 'block' }}>{a.label === 'Home' ? t('Home', 'বাসা') : a.label === 'Work' ? t('Work', 'অফিস') : t('Other', 'অন্যান্য')}</span>
                      <span className="small muted">{a.line}, {a.area}{a.floor ? ' · ' + a.floor : ''}</span>
                    </span>
                    {selected && <Check size={18} color="var(--good)" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {askLocation === 'explain' && (
        <Sheet title={t('Find you faster?', 'দ্রুত খুঁজে পেতে?')} onClose={() => setAskLocation(null)}>
          <div className="stack">
            <p>{t('We’ll use your location once, to place the delivery pin. We don’t track you in the background, and you can still type your address instead.', 'ডেলিভারি পিন বসাতে একবার আপনার লোকেশন ব্যবহার করব। ব্যাকগ্রাউন্ডে ট্র্যাক করি না, চাইলে ঠিকানা লিখেও দিতে পারেন।')}</p>
            <button className="btn btn-primary btn-block" onClick={() => setAskLocation('system')}>{t('Continue', 'চালিয়ে যান')}</button>
            <button className="btn btn-secondary btn-block" onClick={() => setAskLocation(null)}>{t('Not now — I’ll search', 'এখন নয় — খুঁজে নেব')}</button>
          </div>
        </Sheet>
      )}
      {askLocation === 'system' && (
        <Sheet title={t('Allow “Khabar” to use your location?', '“খাবার”-কে লোকেশন ব্যবহারের অনুমতি দেবেন?')} onClose={denyLocation}>
          <div className="stack">
            <p className="small muted">{t('Simulated system permission prompt.', 'সিমুলেটেড সিস্টেম অনুমতি।')}</p>
            <button className="btn btn-primary btn-block" onClick={grantLocation}>{t('Allow once', 'একবার অনুমতি দিন')}</button>
            <button className="btn btn-secondary btn-block" onClick={denyLocation}>{t('Don’t allow', 'অনুমতি দেবেন না')}</button>
          </div>
        </Sheet>
      )}
    </main>
  );
}

function ManualEntry({ onDone }: { onDone: (a: DeliveryAddress) => void }) {
  const t = useT();
  const [line, setLine] = useState('');
  const [area, setArea] = useState('');
  const [err, setErr] = useState(false);
  const areas = [...new Set(PLACES.map((p) => p.area))];
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!line.trim() || !area) return setErr(true);
        const anchor = PLACES.find((p) => p.area === area)!;
        onDone({ label: 'Other', line: line.trim(), area, pos: anchor.pos, building: '', floor: '', landmark: '', notes: '', confirmed: false });
      }}
    >
      <label className="field">
        <span className="field-label">{t('House and road', 'বাড়ি ও রাস্তা')}</span>
        <input className="input" value={line} onChange={(e) => setLine(e.target.value)} aria-invalid={err && !line.trim()} placeholder={t('e.g. House 7, Road 4', 'যেমন: বাড়ি ৭, রোড ৪')} />
        {err && !line.trim() && <span className="field-error"><CircleAlert size={15} />{t('Enter your house and road.', 'বাড়ি ও রাস্তা লিখুন।')}</span>}
      </label>
      <label className="field">
        <span className="field-label">{t('Area', 'এলাকা')}</span>
        <select className="select input" value={area} onChange={(e) => setArea(e.target.value)} aria-invalid={err && !area}>
          <option value="">{t('Choose area', 'এলাকা বেছে নিন')}</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {err && !area && <span className="field-error"><CircleAlert size={15} />{t('Choose your area.', 'এলাকা বেছে নিন।')}</span>}
      </label>
      <button className="btn btn-primary" type="submit">{t('Next: place the pin', 'পরবর্তী: পিন বসান')}</button>
    </form>
  );
}
