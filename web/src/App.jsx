import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CameraViewport from './components/CameraViewport';
import DetectionSidePanel from './components/DetectionSidePanel';
import AlignedSettingsPanel from './components/AlignedSettingsPanel';

export default function App() {
  const [source, setSource] = useState('esp32-mjpeg'); // esp32-mjpeg, esp32-snapshot, webcam, upload, video
  const [esp32Ip, setEsp32Ip] = useState('192.168.1.10');
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, text: 'ESP32 Offline' });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Model & Detection State
  const [model, setModel] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [fpsBooster, setFpsBooster] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.25);
  const [maxDetections, setMaxDetections] = useState(50);
  const [boxLineWidth, setBoxLineWidth] = useState(3);

  const [detections, setDetections] = useState([]);
  const [fps, setFps] = useState(0);
  const [webcamStream, setWebcamStream] = useState(null);

  // Session Logs
  const [logs, setLogs] = useState([]);

  const isDetectingRef = useRef(false);
  const fpsCountRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());
  const lastLogTimeRef = useRef(0);
  const scaleCanvasRef = useRef(document.createElement('canvas'));

  // Load TensorFlow.js COCO-SSD Model
  useEffect(() => {
    if (window.cocoSsd) {
      window.cocoSsd.load({ base: 'lite_mobilenet_v2' })
        .then(m => {
          setModel(m);
          setModelReady(true);
        })
        .catch(err => console.error('Failed to load COCO-SSD model:', err));
    }
  }, []);

  // Camera & Media Source Lifecycle
  useEffect(() => {
    const streamImg = document.getElementById('stream');
    const webcamVideo = document.getElementById('webcamVideo');

    if (source === 'esp32-mjpeg' || source === 'esp32-snapshot') {
      if (streamImg) {
        const streamUrl = `http://${esp32Ip}:81/stream`;
        if (streamImg.src !== streamUrl) {
          streamImg.src = streamUrl;
        }
        setConnectionStatus({ connected: true, text: `Connected to ${esp32Ip}` });
      }
    } else if (source === 'webcam') {
      if (!webcamStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
          .then(stream => {
            setWebcamStream(stream);
            if (webcamVideo) webcamVideo.srcObject = stream;
            setConnectionStatus({ connected: true, text: 'Webcam Active' });
          })
          .catch(err => setConnectionStatus({ connected: false, text: 'Webcam Denied' }));
      } else if (webcamStream && webcamVideo && webcamVideo.srcObject !== webcamStream) {
        webcamVideo.srcObject = webcamStream;
      }
    } else if (source === 'upload') {
      setConnectionStatus({ connected: true, text: 'Image Mode' });
    } else if (source === 'video') {
      setConnectionStatus({ connected: true, text: 'Video File Mode' });
    }
  }, [source, esp32Ip]);

  // Real-Time Detection Loop (~30+ FPS)
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoDetect && modelReady && model && !isDetectingRef.current) {
        runDetection();
      }
      updateFpsCounter();
    }, fpsBooster ? 40 : 100);

    return () => clearInterval(interval);
  }, [autoDetect, modelReady, model, fpsBooster, minConfidence, maxDetections, source]);

  const updateFpsCounter = () => {
    fpsCountRef.current++;
    const now = performance.now();
    if (now - fpsLastTimeRef.current >= 1000) {
      setFps(Math.round((fpsCountRef.current * 1000) / (now - fpsLastTimeRef.current)));
      fpsCountRef.current = 0;
      fpsLastTimeRef.current = now;
    }
  };

  const getSourceElement = () => {
    if (source === 'webcam') {
      const v = document.getElementById('webcamVideo');
      return (v && v.readyState >= 2) ? v : null;
    } else if (source === 'video') {
      const v = document.getElementById('uploadedVideo');
      return (v && v.readyState >= 2 && v.videoWidth > 0) ? v : null;
    } else {
      const img = document.getElementById('stream');
      return (img && img.complete && img.naturalWidth > 0) ? img : null;
    }
  };

  const runDetection = async () => {
    const media = getSourceElement();
    if (!media) return;

    isDetectingRef.current = true;

    try {
      let inputElement = media;
      const srcWidth = media.videoWidth || media.naturalWidth || 640;
      const srcHeight = media.videoHeight || media.naturalHeight || 480;

      if (fpsBooster) {
        const scCanvas = scaleCanvasRef.current;
        if (scCanvas.width !== 320 || scCanvas.height !== 240) {
          scCanvas.width = 320;
          scCanvas.height = 240;
        }
        const scCtx = scCanvas.getContext('2d');
        scCtx.drawImage(media, 0, 0, 320, 240);
        inputElement = scCanvas;
      }

      const predictions = await model.detect(inputElement, maxDetections, minConfidence);

      if (fpsBooster && predictions.length > 0) {
        const scaleX = srcWidth / 320;
        const scaleY = srcHeight / 240;
        predictions.forEach(p => {
          p.bbox[0] *= scaleX;
          p.bbox[1] *= scaleY;
          p.bbox[2] *= scaleX;
          p.bbox[3] *= scaleY;
        });
      }

      setDetections(predictions);
      renderOverlay(predictions, srcWidth, srcHeight);

      if (predictions.length > 0) {
        logDetectionEvents(predictions);
      }
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      isDetectingRef.current = false;
    }
  };

  const renderOverlay = (predictions, srcWidth, srcHeight) => {
    const canvas = document.getElementById('overlayCanvas');
    const wrapper = document.getElementById('viewportWrapper');
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    const dispW = wrapper.clientWidth;
    const dispH = wrapper.clientHeight;

    if (canvas.width !== dispW || canvas.height !== dispH) {
      canvas.width = dispW;
      canvas.height = dispH;
    }

    ctx.clearRect(0, 0, dispW, dispH);

    const scaleX = dispW / srcWidth;
    const scaleY = dispH / srcHeight;

    predictions.forEach(p => {
      const [x, y, w, h] = p.bbox;
      const rX = x * scaleX;
      const rY = y * scaleY;
      const rW = w * scaleX;
      const rH = h * scaleY;

      const color = '#10b981';

      ctx.strokeStyle = color;
      ctx.lineWidth = boxLineWidth;
      ctx.strokeRect(rX, rY, rW, rH);

      ctx.fillStyle = `${color}20`;
      ctx.fillRect(rX, rY, rW, rH);

      if (showLabels) {
        const score = Math.round(p.score * 100);
        const text = `${p.class.toUpperCase()} ${score}%`;
        ctx.font = 'bold 12px "Fira Code", monospace';
        const txtW = ctx.measureText(text).width;

        ctx.fillStyle = '#10b981';
        ctx.fillRect(rX, Math.max(0, rY - 20), txtW + 10, 20);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, rX + 5, Math.max(14, rY - 5));
      }
    });
  };

  const speakObjects = () => {
    if (detections.length === 0 || !('speechSynthesis' in window)) return;
    const uniqueClasses = [...new Set(detections.map(d => d.class))];
    const text = `Detected ${detections.length} objects: ${uniqueClasses.join(', ')}`;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const logDetectionEvents = (preds) => {
    const now = Date.now();
    if (now - lastLogTimeRef.current < 2500) return;
    lastLogTimeRef.current = now;

    const newLogs = preds.map(p => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleString(),
      class: p.class,
      score: Math.round(p.score * 100),
      bbox: p.bbox.map(n => Math.round(n)).join(', '),
      source: source
    }));

    setLogs(prev => [...newLogs, ...prev].slice(0, 500));
  };

  const exportCSV = () => {
    if (logs.length === 0) return alert('No records to export');
    let csv = 'ID,Timestamp,ObjectClass,ConfidenceScore,BBox,Source\n';
    logs.forEach(item => {
      csv += `"${item.id}","${item.timestamp}","${item.class}","${item.score}%","[${item.bbox}]","${item.source}"\n`;
    });
    downloadFile(csv, 'object_detection_logs.csv', 'text/csv');
  };

  const exportJSON = () => {
    if (logs.length === 0) return alert('No records to export');
    downloadFile(JSON.stringify(logs, null, 2), 'object_detection_logs.json', 'application/json');
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-layout">
      <Header 
        modelReady={modelReady}
        connectionStatus={connectionStatus}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      <main className="app-container">
        <div className="dashboard-grid">
          <div>
            <CameraViewport 
              source={source}
              setSource={setSource}
              esp32Ip={esp32Ip}
              setEsp32Ip={setEsp32Ip}
              connectStream={() => {
                const streamImg = document.getElementById('stream');
                if (streamImg) streamImg.src = `http://${esp32Ip}:81/stream?t=${Date.now()}`;
              }}
              captureSnapshot={() => {
                const streamImg = document.getElementById('stream');
                if (streamImg) streamImg.src = `http://${esp32Ip}/capture?t=${Date.now()}`;
              }}
              fps={fps}
              detectedCount={detections.length}
              autoDetect={autoDetect}
              setAutoDetect={setAutoDetect}
              fpsBooster={fpsBooster}
              setFpsBooster={setFpsBooster}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              manualDetect={() => runDetection()}
              modelReady={modelReady}
            />

            <AlignedSettingsPanel 
              minConfidence={minConfidence}
              setMinConfidence={setMinConfidence}
              maxDetections={maxDetections}
              setMaxDetections={setMaxDetections}
              boxLineWidth={boxLineWidth}
              setBoxLineWidth={setBoxLineWidth}
              esp32Ip={esp32Ip}
            />
          </div>

          <div>
            <DetectionSidePanel 
              detections={detections}
              speakObjects={speakObjects}
              logs={logs}
              exportCSV={exportCSV}
              exportJSON={exportJSON}
              clearLogs={() => setLogs([])}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Object Detection Platform &copy; 2026 — ESP32-CAM AI Vision System</p>
      </footer>
    </div>
  );
}
