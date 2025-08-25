// File: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './main.jsx'; // or './App.jsx' if renamed
import './App.css';
import { Auth0Provider } from '@auth0/auth0-react';

const root = ReactDOM.createRoot(document.getElementById('root'));

// ✅ Redirect user to /events after login
const onRedirectCallback = (appState) => {
  window.history.replaceState({}, document.title, appState?.returnTo || '/events');
};

root.render(
  <Auth0Provider
    domain="dev-plspoi40w0d8iibs.us.auth0.com"
    clientId="Dgi9iK7TuWkrxVLI38P6ByEpSVqVgjC5"
    redirectUri={window.location.origin}
    onRedirectCallback={onRedirectCallback}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Auth0Provider>
);
