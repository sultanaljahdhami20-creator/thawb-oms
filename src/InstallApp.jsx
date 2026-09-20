import {useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {installController, installationPlatform} from './pwaInstall';

export default function InstallApp({rtl = false}) {
  const {installed, canPrompt} = useSyncExternalStore(installController.subscribe, installController.getSnapshot);
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const platform = installationPlatform(window.navigator);
  const steps = platform === 'ios' ? (rtl ? [
    'افتح هذا الموقع في Safari.',
    'اضغط «مشاركة» ثم «إضافة إلى الشاشة الرئيسية». قد تحتاج لفتح قائمة المتصفح أولًا.',
    'فعّل «فتح كتطبيق ويب» إذا ظهر، ثم اضغط «إضافة».',
  ] : [
    'Open this website in Safari.',
    'Choose Share, then Add to Home Screen. You may need to open the browser menu first.',
    'Enable Open as Web App if shown, then tap Add.',
  ]) : platform === 'android' ? (rtl ? [
    'افتح هذا الموقع في Chrome.',
    'من قائمة ⋮ اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق».',
    'اضغط «تثبيت» أو «إضافة»، ثم افتح ثوب من الأيقونة الجديدة.',
  ] : [
    'Open this website in Chrome.',
    'In the ⋮ menu, choose Add to Home screen or Install app.',
    'Tap Install or Add, then open THAWB from its new icon.',
  ]) : (rtl ? [
    'في Chrome أو Edge، استخدم أيقونة التثبيت بجوار عنوان الموقع أو خيار التثبيت من قائمة المتصفح.',
    'في Safari على Mac، اختر «ملف» ثم «إضافة إلى Dock».',
    'إذا لم يظهر خيار التثبيت، تقدر تستمر باستخدام الموقع من المتصفح.',
  ] : [
    'In Chrome or Edge, use the install icon beside the address bar or the install option in the browser menu.',
    'In Safari on Mac, choose File, then Add to Dock.',
    'If installation is unavailable, you can keep using the website in your browser.',
  ]);

  async function install() {
    setBusy(true);
    setFailed(false);
    try {
      const result = await installController.prompt();
      if (result?.outcome === 'accepted') dialog.current?.close();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  if (installed) return null;
  return <>
    <button type="button" className="install-app-link" onClick={() => {setFailed(false); dialog.current.showModal();}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>
      {rtl ? 'إضافة للشاشة الرئيسية' : 'Add to Home Screen'}
    </button>
    {createPortal(<dialog ref={dialog} className="install-app-dialog" dir={rtl ? 'rtl' : 'ltr'} aria-labelledby="install-app-title" onClick={event => {if (event.target === dialog.current) dialog.current.close();}}>
      <div className="install-app-heading">
        <img src="/pwa/icon-192.png" width="56" height="56" alt=""/>
        <div><span className="install-app-brand">THAWB / ثوب</span><h2 id="install-app-title">{rtl ? 'ثوب، بلمسة واحدة' : 'THAWB, one tap away'}</h2></div>
        <button type="button" className="install-app-close" onClick={() => dialog.current.close()} aria-label={rtl ? 'إغلاق' : 'Close'}>×</button>
      </div>
      <p>{rtl ? 'أضف أيقونة ثوب لشاشتك الرئيسية للوصول إلى طلباتك بسهولة.' : 'Add THAWB to your home screen for easy access to your orders.'}</p>
      {failed && <p role="alert">{rtl ? 'تعذر فتح نافذة التثبيت. اتبع الخطوات أدناه.' : 'The install prompt could not open. Follow the steps below.'}</p>}
      {canPrompt && <button type="button" className="install-app-confirm" disabled={busy} onClick={install}>{rtl ? 'إضافة ثوب' : 'Install THAWB'}</button>}
      <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p className="install-app-note">{rtl ? 'نفس الموقع ونفس بياناتك. يتطلب اتصالًا بالإنترنت.' : 'The same website and your same data. An internet connection is required.'}</p>
      <button type="button" className="install-app-done" onClick={() => dialog.current.close()}>{rtl ? 'تم' : 'Done'}</button>
    </dialog>, document.body)}
  </>;
}
