import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (ReactDOM && ReactDOM.createRoot) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (ReactDOM && ReactDOM.render) {
  ReactDOM.render(<App />, rootElement);
}
