import React, { useRef } from 'react';

export default function CameraViewport({
  source,
  setSource,
  esp32Ip,
  setEsp32Ip,
  connectStream,
  captureSnapshot,
  fps,
  detectedCount,
  autoDetect,
  setAutoDetect,
  fpsBooster,
  setFpsBooster,
  showLabels,
  setShowLabels,
  manualDetect,
  modelReady
}) {
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.getElementById('stream');
      if (img) {
        img.src = event.target.result;
        img.style.display = 'block';
        setTimeout(() => manualDetect(), 300);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const video = document.getElementById('uploadedVideo');
    if (video) {
      video.src = url;
      video.style.display = 'block';
      video.play().catch(err => console.log('Autoplay prevented:', err));
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fa-solid fa-camera"></i> Camera & Media Viewport</h3>
        <div className="source-selector">
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="esp32-mjpeg">ESP32-CAM Stream</option>
            <option value="esp32-snapshot">ESP32 Snapshot</option>
            <option value="webcam">Device Webcam</option>
            <option value="upload">Upload Image File</option>
            <option value="video">Upload Video File</option>
          </select>
        </div>
      </div>

      {(source === 'esp32-mjpeg' || source === 'esp32-snapshot') && (
        <div className="ip-control-bar">
          <div className="input-group">
            <span className="prefix">http://</span>
            <input 
              type="text" 
              value={esp32Ip} 
              onChange={(e) => setEsp32Ip(e.target.value)} 
              placeholder="192.168.1.X" 
            />
            <span className="suffix">:81/stream</span>
          </div>
          <button className="btn btn-primary" onClick={connectStream}>
            Connect Stream
          </button>
          <button className="btn btn-secondary" onClick={captureSnapshot}>
            Snapshot
          </button>
        </div>
      )}

      {source === 'upload' && (
        <div className="upload-zone">
          <input 
            type="file" 
            ref={imageInputRef} 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <p>Drag & Drop image here or <span>Browse File</span></p>
        </div>
      )}

      {source === 'video' && (
        <div className="upload-zone">
          <input 
            type="file" 
            ref={videoInputRef} 
            accept="video/*" 
            onChange={handleVideoUpload} 
          />
          <i className="fa-solid fa-file-video"></i>
          <p>Drag & Drop video file here or <span>Browse Video</span></p>
        </div>
      )}

      <div className="viewport-wrapper" id="viewportWrapper">
        <img 
          id="stream" 
          crossOrigin="anonymous" 
          alt="Camera Feed" 
          style={{ display: (source === 'esp32-mjpeg' || source === 'esp32-snapshot' || source === 'upload') ? 'block' : 'none' }} 
        />
        <video 
          id="webcamVideo" 
          autoPlay 
          playsInline 
          style={{ display: source === 'webcam' ? 'block' : 'none' }} 
        />
        <video 
          id="uploadedVideo" 
          controls 
          loop 
          autoPlay 
          playsInline 
          style={{ display: source === 'video' ? 'block' : 'none' }} 
        />
        <canvas id="overlayCanvas" />

        {!modelReady && (
          <div className="model-loading-overlay">
            <i className="fa-solid fa-gear fa-spin"></i>
            <p>Initializing AI Neural Network...</p>
          </div>
        )}

        <div className="viewport-badge fps-badge">{fps} FPS</div>
        <div className="viewport-badge count-badge">{detectedCount} Detected</div>
        {fpsBooster && <div className="viewport-badge speed-badge">⚡ Sub-30ms Active</div>}
      </div>

      <div className="viewport-actions">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={autoDetect} 
            onChange={(e) => setAutoDetect(e.target.checked)} 
          />
          <span className="slider"></span>
          <span className="toggle-label">Auto Scanning</span>
        </label>

        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={fpsBooster} 
            onChange={(e) => setFpsBooster(e.target.checked)} 
          />
          <span className="slider"></span>
          <span className="toggle-label">Sub-30ms Booster</span>
        </label>

        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={showLabels} 
            onChange={(e) => setShowLabels(e.target.checked)} 
          />
          <span className="slider"></span>
          <span className="toggle-label">Labels</span>
        </label>

        <button className="btn btn-sm btn-secondary" onClick={manualDetect}>
          Detect Frame
        </button>
      </div>
    </div>
  );
}
