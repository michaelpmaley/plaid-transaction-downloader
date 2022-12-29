import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';

// start react app
const container = document.getElementById('root');
const root = createRoot(container);
(async () => {
   const plaidConfig = await window.ipc.loadPlaidConfig();
   const mappings = await window.ipc.loadMappings();
   root.render(
      <App plaidConfig={plaidConfig} mappings={mappings} />
   );
})();
