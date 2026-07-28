import React from 'react';
import { createRoot } from 'react-dom/client';
import { TeamInvitation, IssueTriage } from './pilots.mjs';
import './shared.css';

const candidateLoaders = {
  'shadcn-ui': () => import('./adapters/shadcn-registry.tsx'),
  'radix-primitives': () => import('./adapters/radix.mjs'),
  'react-aria': () => import('./adapters/react-aria.mjs'),
  'material-ui': () => import('./adapters/material-ui.mjs'),
  carbon: () => import('./adapters/carbon.mjs'),
};

const params = new URLSearchParams(window.location.search);
const candidateId = params.get('candidate') ?? 'shadcn-ui';
const pilotId = params.get('pilot') ?? 'team-invitation';
const locale = params.get('locale') ?? 'ja';
const direction = params.get('direction') === 'rtl' ? 'rtl' : 'ltr';
const density = params.get('density') === 'compact' ? 'compact' : 'comfortable';

document.documentElement.lang = locale;
document.documentElement.dir = direction;
document.documentElement.dataset.forcedColorsFixture = params.get('forcedColors') === 'true' ? 'true' : 'false';

const loader = candidateLoaders[candidateId];
if (!loader) throw new Error(`Unknown candidate: ${candidateId}`);
const { adapter } = await loader();

window.__MERIDIAN_SPIKE__ = {
  candidateId,
  pilotId,
  adapterVersion: adapter.version,
  ready: false,
  runtimeErrors: [],
};
window.addEventListener('error', (event) => {
  window.__MERIDIAN_SPIKE__.runtimeErrors.push(String(event.error ?? event.message));
});
window.addEventListener('unhandledrejection', (event) => {
  window.__MERIDIAN_SPIKE__.runtimeErrors.push(String(event.reason));
});

function App() {
  const Pilot = pilotId === 'issue-triage' ? IssueTriage : TeamInvitation;
  React.useEffect(() => {
    window.__MERIDIAN_SPIKE__.ready = true;
    document.body.dataset.ready = 'true';
  }, []);
  return React.createElement(
    adapter.Provider ?? React.Fragment,
    null,
    React.createElement(
      'div',
      {
        className: `spike-shell adapter-${candidateId} density-${density}`,
        'data-candidate': candidateId,
        'data-pilot': pilotId,
        'data-adapter-version': adapter.version,
      },
      React.createElement(
        'header',
        { className: 'spike-banner' },
        React.createElement('div', null,
          React.createElement('span', { className: 'eyebrow' }, 'Meridian isolated adapter spike'),
          React.createElement('strong', null, adapter.name),
        ),
        React.createElement('span', { className: 'version-chip' }, adapter.version),
      ),
      React.createElement(Pilot, { ui: adapter.ui, candidateId }),
    ),
  );
}

createRoot(document.getElementById('root')).render(React.createElement(App));
