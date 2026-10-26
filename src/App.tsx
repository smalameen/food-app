import { useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import { tick } from './actions';
import { update, useAppState, useRoute, useT } from './store';
import { BottomNav, DesktopHeader, Toasts } from './components/ui';
import { DemoPanel, HelpSheet, ProviderSheet, SafetySheet } from './components/sheets';
import { Home } from './screens/Home';
import { RestaurantScreen } from './screens/Restaurant';
import { Checkout } from './screens/Checkout';
import { AddressPicker } from './screens/AddressPicker';
import { PaymentScreen } from './screens/Payment';
import { OrderTracking } from './screens/OrderTracking';
import { Orders } from './screens/Orders';
import { IssueScreen } from './screens/Issue';
import { RefundScreen, RefundsList } from './screens/Refunds';
import { SupportChat } from './screens/Support';
import { PlusScreen } from './screens/Plus';
import { Account } from './screens/Account';

export function App() {
  const route = useRoute();
  const s = useAppState();
  const t = useT();

  // The simulated backend clock: advances orders, reconciles payments, progresses refunds and support.
  useEffect(() => {
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    document.documentElement.lang = s.lang;
  }, [s.lang]);

  const withNav = ['home', 'orders', 'account'].includes(route.name);
  const hasDock = ['checkout', 'payment', 'address', 'support'].includes(route.name);

  let screen;
  switch (route.name) {
    case 'restaurant': screen = <RestaurantScreen key={route.id} id={route.id} />; break;
    case 'checkout': screen = <Checkout />; break;
    case 'address': screen = <AddressPicker />; break;
    case 'payment': screen = <PaymentScreen key={route.id} id={route.id} />; break;
    case 'order': screen = <OrderTracking key={route.id} id={route.id} />; break;
    case 'orders': screen = <Orders />; break;
    case 'issue': screen = <IssueScreen key={route.id} id={route.id} />; break;
    case 'refund': screen = <RefundScreen key={route.id} id={route.id} />; break;
    case 'refunds': screen = <RefundsList />; break;
    case 'support': screen = <SupportChat key={route.id} id={route.id} />; break;
    case 'plus': screen = <PlusScreen />; break;
    case 'account': screen = <Account />; break;
    default: screen = <Home />;
  }

  return (
    <div className={'app' + (s.lang === 'bn' ? ' lang-bn' : '')}>
      <a href="#main" className="sr-only">{t('Skip to content', 'মূল অংশে যান')}</a>
      <DesktopHeader />
      <div id="main" style={{ display: 'contents' }}>{screen}</div>
      {withNav && <BottomNav />}
      <button className={'demo-fab' + (hasDock ? ' raised' : '')} onClick={() => update((d) => void (d.ui.demoOpen = true))} aria-label={t('Open demo controls', 'ডেমো নিয়ন্ত্রণ খুলুন')}>
        <FlaskConical size={16} /> {t('Demo', 'ডেমো')}
      </button>
      <Toasts />
      <ProviderSheet />
      <HelpSheet />
      <SafetySheet />
      <DemoPanel />
    </div>
  );
}
