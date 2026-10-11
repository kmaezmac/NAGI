import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppModel } from './model';
import { WakeCoordinator } from './wake';
import cssUrl from './styles.css?url';
import { initAnalytics } from './analytics';
const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = cssUrl; document.head.append(css);
initAnalytics();
const wake = new WakeCoordinator();
let storage: Storage | undefined;
try { storage = window.localStorage; } catch { /* Model reports unavailable storage when used. */ }
const model = new AppModel(wake, storage, navigator.language);
wake.attach('main', window);
createRoot(document.getElementById('root')!).render(<App model={model} />);
