import React, { useState } from 'react';

export default function EspController({ esp32Ip }) {
  const [ledVal, setLedVal] = useState(0);
  const [lastApiLog, setLastApiLog] = useState(`GET http://${esp32Ip}/control?var=led_intensity&val=0`);

  const sendEspControl = (varName, val) => {
    const endpoint = `http://${esp32Ip}/control?var=${varName}&val=${val}`;
    setLastApiLog(`GET ${endpoint}`);
    if (varName === 'led_intensity') setLedVal(val);

    fetch(endpoint, { mode: 'no-cors' })
      .then(() => console.log('ESP32 REST command dispatched:', varName, val))
      .catch(err => console.error('ESP32 REST command error:', err));
  };

  return (
    <div className="card esp32-panel">
      <div className="card-header">
        <h3><i className="fa-solid fa-microchip"></i> ESP32-CAM Hardware Sensor Remote Control</h3>
        <span className="badge badge-cyan">HTTP REST API</span>
      </div>

      <p className="section-desc">
        Dynamically adjust ESP32 hardware camera sensor parameters over HTTP GET requests without needing to flash new firmware code.
      </p>

      <div className="esp32-controls-grid">
        <div className="control-box">
          <label><i className="fa-solid fa-lightbulb"></i> LED Flash Intensity</label>
          <div className="slider-group">
            <input 
              type="range" 
              min="0" 
              max="255" 
              value={ledVal} 
              onChange={(e) => sendEspControl('led_intensity', e.target.value)} 
            />
            <span className="slider-val">{ledVal} / 255</span>
          </div>
        </div>

        <div className="control-box">
          <label><i className="fa-solid fa-expand"></i> Camera Resolution</label>
          <select onChange={(e) => sendEspControl('framesize', e.target.value)} defaultValue="6">
            <option value="10">UXGA (1600x1200 - High Detail)</option>
            <option value="8">SVGA (800x600 - High Quality)</option>
            <option value="6">VGA (640x480 - Standard Scanning)</option>
            <option value="5">CIF (400x296 - Fast Processing)</option>
            <option value="3">QVGA (320x240 - High Frame Rate)</option>
          </select>
        </div>

        <div className="control-box">
          <label><i className="fa-solid fa-sun"></i> Brightness</label>
          <input 
            type="range" 
            min="-2" 
            max="2" 
            defaultValue="0" 
            onChange={(e) => sendEspControl('brightness', e.target.value)} 
          />
        </div>

        <div className="control-box">
          <label><i className="fa-solid fa-circle-half-stroke"></i> Contrast</label>
          <input 
            type="range" 
            min="-2" 
            max="2" 
            defaultValue="0" 
            onChange={(e) => sendEspControl('contrast', e.target.value)} 
          />
        </div>

        <div className="control-box">
          <label><i className="fa-solid fa-arrows-up-down"></i> Vertical Flip (V-Flip)</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              onChange={(e) => sendEspControl('vflip', e.target.checked ? 1 : 0)} 
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="control-box">
          <label><i className="fa-solid fa-arrows-left-right"></i> Horizontal Mirror (H-Mirror)</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              onChange={(e) => sendEspControl('hmirror', e.target.checked ? 1 : 0)} 
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="api-log-box">
        <h4><i className="fa-solid fa-terminal"></i> Last REST API Endpoint Dispatched:</h4>
        <code>{lastApiLog}</code>
      </div>
    </div>
  );
}
