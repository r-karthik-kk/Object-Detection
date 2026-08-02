import React from 'react';

export default function Header({ 
  modelReady, 
  connectionStatus, 
  soundEnabled, 
  setSoundEnabled 
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="logo-box">
          <i className="fa-solid fa-cube"></i>
        </div>
        <div className="brand-text">
          <h1>Object Detection</h1>
        </div>
      </div>

      <div className="header-status">
        <div className="status-badge">
          <span className={`status-dot ${modelReady ? 'green' : 'red'}`}></span>
          <span>{modelReady ? 'AI Engine Ready' : 'Loading Model...'}</span>
        </div>
        <div className="status-badge">
          <span className={`status-dot ${connectionStatus.connected ? 'green' : 'yellow'}`}></span>
          <span>{connectionStatus.text}</span>
        </div>
        <button 
          className="icon-btn" 
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Toggle Audio Alert"
          style={{ color: soundEnabled ? 'var(--green-primary)' : 'var(--red-alert)' }}
        >
          <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
        </button>
      </div>
    </header>
  );
}
