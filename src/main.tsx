import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import './index.css';

// Hardcoded URL from your previous terminal screenshot
const convex = new ConvexReactClient(
  'https://qualified-malamute-752.convex.cloud'
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>
);
