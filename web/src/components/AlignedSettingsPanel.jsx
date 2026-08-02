import React, { useState } from 'react';

export default function AlignedSettingsPanel({
  minConfidence,
  setMinConfidence,
  maxDetections,
  setMaxDetections,
  boxLineWidth,
  setBoxLineWidth,
  esp32Ip
}) {
  const [ledVal, setLedVal] = useState(0);

  const sendEspControl = (varName, val) => {
    const endpoint = `http://${esp32Ip}/control?var=${varName}&val=${val}`;
    if (varName === 'led_intensity') setLedVal(val);

    fetch(endpoint, { mode: 'no-cors' })
      .then(() => console.log('ESP32 Command:', varName, val))
      .catch(err => console.error('ESP32 Error:', err));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fa-solid fa-sliders"></i> Settings & Hardware Controls</h3>
      </div>

      <div className="aligned-settings-grid">
        <div className="setting-box">
          <label>Confidence Threshold Sensitivity</label>
          <div className="slider-group">
            <input 
              type="range" 
              min="10" 
              max="90" 
              value={minConfidence * 100} 
              onChange={(e) => setMinConfidence(parseInt(e.target.value, 10) / 100)} 
            />
            <span className="slider-val">{Math.round(minConfidence * 100)}%</span>
          </div>
        </div>

        <div className="setting-box">
          <label>Max Objects Per Frame</label>
          <div className="slider-group">
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={maxDetections} 
              onChange={(e) => setMaxDetections(parseInt(e.target.value, 10))} 
            />
            <span className="slider-val">{maxDetections}</span>
          </div>
        </div>

        <div className="setting-box">
          <label>Bounding Box Line Width</label>
          <div className="slider-group">
            <input 
              type="range" 
              min="1" 
              max="8" 
              value={boxLineWidth} 
              onChange={(e) => setBoxLineWidth(parseInt(e.target.value, 10))} 
            />
            <span className="slider-val">{boxLineWidth}px</span>
          </div>
        </div>

        <div className="setting-box">
          <label>ESP32 LED Flash Intensity</label>
          <div className="slider-group">
            <input 
              type="range" 
              min="0" 
              max="255" 
              value={ledVal} 
              onChange={(e) => sendEspControl('led_intensity', e.target.value)} 
            />
            <span className="slider-val">{ledVal}/255</span>
          </div>
        </div>

        <div className="setting-box">
          <label>Camera Resolution</label>
          <select onChange={(e) => sendEspControl('framesize', e.target.value)} defaultValue="6">
            <option value="10">UXGA (1600x1200)</option>
            <option value="8">SVGA (800x600)</option>
            <option value="6">VGA (640x480 - Standard)</option>
            <option value="5">CIF (400x296)</option>
            <option value="3">QVGA (320x240 - Fast FPS)</option>
          </select>
        </div>

        <div className="setting-box">
          <label>Brightness / Contrast</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input 
              type="range" 
              min="-2" 
              max="2" 
              defaultValue="0" 
              title="Brightness" 
              onChange={(e) => sendEspControl('brightness', e.target.value)} 
            />
            <input 
              type="range" 
              min="-2" 
              max="2" 
              defaultValue="0" 
              title="Contrast" 
              onChange={(e) => sendEspControl('contrast', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
