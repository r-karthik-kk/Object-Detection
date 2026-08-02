/**
 * OmniVision AI Engine — Core JavaScript Application
 * ESP32-CAM Deep Learning Object Detection (TensorFlow.js + COCO-SSD)
 */

(function () {
  'use strict';

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    activeTab: 'tab-vision',
    source: 'esp32-mjpeg', // esp32-mjpeg, esp32-snapshot, webcam, upload
    esp32Ip: '192.168.1.10',
    soundEnabled: true,
    autoDetect: true,
    showLabels: true,
    webcamStream: null,
    
    // Model State
    model: null,
    isModelLoading: true,
    isDetecting: false,
    detectIntervalId: null,

    // Tuning Parameters
    minConfidence: 0.45,
    maxDetections: 20,
    boxLineWidth: 3,

    // Current Detection Predictions
    currentDetections: [],
    lastDetectTimestamp: 0,
    
    // Performance Counter
    fpsCount: 0,
    fpsLastTime: performance.now(),
    fps: 0,

    // Session Detection Logs
    logs: []
  };

  // Class Color Map (Pure Primary Colors)
  const classColors = {
    person: '#ff0000',       // Pure Red
    car: '#0000ff',          // Pure Blue
    bus: '#0000ff',
    truck: '#0000ff',
    motorcycle: '#0000ff',
    bicycle: '#0000ff',
    cat: '#008000',          // Pure Green
    dog: '#008000',
    bird: '#008000',
    cup: '#ff6600',          // Pure Orange
    bottle: '#ff6600',
    laptop: '#800080',       // Pure Purple
    'cell phone': '#800080',
    tv: '#800080',
    chair: '#ffd700',        // Pure Yellow
    couch: '#ffd700',
    book: '#008000',
    backpack: '#ff0000'
  };

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const DOM = {
    // Navigation
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    tabObjCount: document.getElementById('tabObjCount'),
    modelStatusBadge: document.getElementById('modelStatusBadge'),
    modelStatusText: document.getElementById('modelStatusText'),
    connectionBadge: document.getElementById('connectionBadge'),
    connectionText: document.getElementById('connectionText'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),

    // Viewport
    sourceSelect: document.getElementById('sourceSelect'),
    esp32ControlBar: document.getElementById('esp32ControlBar'),
    esp32IpInput: document.getElementById('esp32IpInput'),
    connectStreamBtn: document.getElementById('connectStreamBtn'),
    captureSnapBtn: document.getElementById('captureSnapBtn'),
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    viewportWrapper: document.getElementById('viewportWrapper'),
    streamImg: document.getElementById('stream'),
    webcamVideo: document.getElementById('webcamVideo'),
    overlayCanvas: document.getElementById('overlayCanvas'),
    modelLoadingOverlay: document.getElementById('modelLoadingOverlay'),
    fpsDisplay: document.getElementById('fpsDisplay'),
    detectedCountDisplay: document.getElementById('detectedCountDisplay'),
    autoDetectToggle: document.getElementById('autoDetectToggle'),
    showLabelsToggle: document.getElementById('showLabelsToggle'),
    manualDetectBtn: document.getElementById('manualDetectBtn'),

    // Detection Summary
    lastDetectTime: document.getElementById('lastDetectTime'),
    liveClassesContainer: document.getElementById('liveClassesContainer'),
    speakObjectsBtn: document.getElementById('speakObjectsBtn'),
    recentList: document.getElementById('recentList'),

    // Objects Hub
    objectsSearch: document.getElementById('objectsSearch'),
    clearObjectsBtn: document.getElementById('clearObjectsBtn'),
    objectsGridContainer: document.getElementById('objectsGridContainer'),

    // AI Tuning
    minConfidenceSlider: document.getElementById('minConfidenceSlider'),
    minConfidenceVal: document.getElementById('minConfidenceVal'),
    maxDetectionsSlider: document.getElementById('maxDetectionsSlider'),
    maxDetectionsVal: document.getElementById('maxDetectionsVal'),
    boxLineWidthSlider: document.getElementById('boxLineWidthSlider'),
    boxLineWidthVal: document.getElementById('boxLineWidthVal'),
    tfBackendDisplay: document.getElementById('tfBackendDisplay'),
    resetTuningBtn: document.getElementById('resetTuningBtn'),

    // ESP32 Controls
    espLedSlider: document.getElementById('espLedSlider'),
    espLedVal: document.getElementById('espLedVal'),
    espApiEndpointLog: document.getElementById('espApiEndpointLog'),

    // Logs & Analytics
    logsTableBody: document.getElementById('logsTableBody'),
    logsSearch: document.getElementById('logsSearch'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    metricTotalDetections: document.getElementById('metricTotalDetections'),
    metricUniqueClasses: document.getElementById('metricUniqueClasses'),
    metricTopClass: document.getElementById('metricTopClass')
  };

  // Offscreen Canvas for Frame Extraction
  const hiddenCanvas = document.createElement('canvas');
  const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

  // ==========================================================================
  // App Startup & Model Initialization
  // ==========================================================================
  function init() {
    setupEventListeners();
    updateSourceUI();
    loadTensorFlowModel();
  }

  function loadTensorFlowModel() {
    if (!window.cocoSsd) {
      updateModelStatus(false, 'TensorFlow.js Not Loaded');
      return;
    }

    window.cocoSsd.load({ base: 'lite_mobilenet_v2' })
      .then(loadedModel => {
        state.model = loadedModel;
        state.isModelLoading = false;
        DOM.modelLoadingOverlay.style.display = 'none';
        updateModelStatus(true, 'COCO-SSD Model Ready');
        
        if (window.tf) {
          DOM.tfBackendDisplay.textContent = `${window.tf.getBackend().toUpperCase()} Accelerated`;
        }

        startDetectionLoop();
      })
      .catch(err => {
        console.error('Failed to load COCO-SSD model:', err);
        updateModelStatus(false, 'Model Load Error');
        DOM.modelLoadingOverlay.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--pure-red);"></i>
          <p style="color:var(--pure-red);">Failed to load neural network model: ${err.message}</p>
        `;
      });
  }

  function updateModelStatus(isReady, text) {
    DOM.modelStatusBadge.querySelector('.status-dot').className = `status-dot ${isReady ? 'green' : 'red'}`;
    DOM.modelStatusText.textContent = text;
  }

  // ==========================================================================
  // Event Listeners & Navigation
  // ==========================================================================
  function setupEventListeners() {
    // Navigation Tabs
    DOM.tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.getAttribute('data-tab'));
      });
    });

    // Sound Toggle
    DOM.soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      DOM.soundToggleBtn.innerHTML = state.soundEnabled ? 
        '<i class="fa-solid fa-volume-high"></i>' : 
        '<i class="fa-solid fa-volume-xmark"></i>';
      DOM.soundToggleBtn.style.color = state.soundEnabled ? '' : 'var(--pure-red)';
    });

    // Camera Source Selector
    DOM.sourceSelect.addEventListener('change', (e) => {
      state.source = e.target.value;
      updateSourceUI();
    });

    DOM.connectStreamBtn.addEventListener('click', connectEsp32Stream);
    DOM.captureSnapBtn.addEventListener('click', captureEsp32Snapshot);

    // File Upload
    DOM.fileInput.addEventListener('change', handleFileUpload);
    DOM.uploadZone.addEventListener('dragover', (e) => e.preventDefault());
    DOM.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        DOM.fileInput.files = e.dataTransfer.files;
        handleFileUpload();
      }
    });

    // Viewport Toggles & Manual Detection
    DOM.autoDetectToggle.addEventListener('change', (e) => state.autoDetect = e.target.checked);
    DOM.showLabelsToggle.addEventListener('change', (e) => state.showLabels = e.target.checked);
    DOM.manualDetectBtn.addEventListener('click', () => runObjectDetection(true));

    // Speech Action
    DOM.speakObjectsBtn.addEventListener('click', speakDetectedObjects);

    // AI Tuning Sliders
    DOM.minConfidenceSlider.addEventListener('input', (e) => {
      state.minConfidence = parseInt(e.target.value, 10) / 100;
      DOM.minConfidenceVal.textContent = e.target.value;
    });

    DOM.maxDetectionsSlider.addEventListener('input', (e) => {
      state.maxDetections = parseInt(e.target.value, 10);
      DOM.maxDetectionsVal.textContent = state.maxDetections;
    });

    DOM.boxLineWidthSlider.addEventListener('input', (e) => {
      state.boxLineWidth = parseInt(e.target.value, 10);
      DOM.boxLineWidthVal.textContent = state.boxLineWidth;
    });

    DOM.resetTuningBtn.addEventListener('click', () => {
      state.minConfidence = 0.45;
      state.maxDetections = 20;
      state.boxLineWidth = 3;
      DOM.minConfidenceSlider.value = 45;
      DOM.minConfidenceVal.textContent = '45';
      DOM.maxDetectionsSlider.value = 20;
      DOM.maxDetectionsVal.textContent = '20';
      DOM.boxLineWidthSlider.value = 3;
      DOM.boxLineWidthVal.textContent = '3';
    });

    // Objects Hub Search & Filter
    DOM.objectsSearch.addEventListener('input', filterObjectsHub);
    DOM.clearObjectsBtn.addEventListener('click', renderObjectsHub);

    // Logs & Analytics
    DOM.logsSearch.addEventListener('input', filterLogsTable);
    DOM.exportCsvBtn.addEventListener('click', exportLogsCSV);
    DOM.exportJsonBtn.addEventListener('click', exportLogsJSON);
    DOM.clearLogsBtn.addEventListener('click', clearLogsDatabase);
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    DOM.tabs.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
    DOM.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));

    if (tabId === 'tab-objects') {
      renderObjectsHub();
    }
  }

  // ==========================================================================
  // Camera Source Management
  // ==========================================================================
  function updateSourceUI() {
    stopWebcamStream();
    DOM.esp32ControlBar.style.display = 'none';
    DOM.uploadZone.style.display = 'none';
    DOM.streamImg.style.display = 'none';
    DOM.webcamVideo.style.display = 'none';

    if (state.source === 'esp32-mjpeg' || state.source === 'esp32-snapshot') {
      DOM.esp32ControlBar.style.display = 'flex';
      DOM.streamImg.style.display = 'block';
      state.esp32Ip = DOM.esp32IpInput.value.trim();
      connectEsp32Stream();
    } else if (state.source === 'webcam') {
      DOM.webcamVideo.style.display = 'block';
      startWebcamStream();
      setConnectionStatus(true, 'Webcam Active');
    } else if (state.source === 'upload') {
      DOM.uploadZone.style.display = 'block';
      DOM.streamImg.style.display = 'block';
      setConnectionStatus(true, 'File Mode');
    }
  }

  function connectEsp32Stream() {
    state.esp32Ip = DOM.esp32IpInput.value.trim();
    if (!state.esp32Ip) return;

    if (state.source === 'esp32-mjpeg') {
      const streamUrl = `http://${state.esp32Ip}:81/stream`;
      DOM.streamImg.src = streamUrl;
      setConnectionStatus(true, `Connected to ${state.esp32Ip}`);
    } else if (state.source === 'esp32-snapshot') {
      captureEsp32Snapshot();
    }
  }

  function captureEsp32Snapshot() {
    state.esp32Ip = DOM.esp32IpInput.value.trim();
    if (!state.esp32Ip) return;
    const snapUrl = `http://${state.esp32Ip}/capture?t=${Date.now()}`;
    DOM.streamImg.src = snapUrl;
    setConnectionStatus(true, 'Snapshot Loaded');
  }

  function startWebcamStream() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then(stream => {
          state.webcamStream = stream;
          DOM.webcamVideo.srcObject = stream;
        })
        .catch(err => {
          console.error('Webcam access error:', err);
          alert('Could not access device camera: ' + err.message);
          setConnectionStatus(false, 'Webcam Access Denied');
        });
    }
  }

  function stopWebcamStream() {
    if (state.webcamStream) {
      state.webcamStream.getTracks().forEach(track => track.stop());
      state.webcamStream = null;
    }
  }

  function handleFileUpload() {
    const file = DOM.fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      DOM.streamImg.src = e.target.result;
      DOM.streamImg.style.display = 'block';
      DOM.uploadZone.style.display = 'none';
      setTimeout(() => runObjectDetection(true), 300);
    };
    reader.readAsDataURL(file);
  }

  function setConnectionStatus(isConnected, labelText) {
    DOM.connectionBadge.querySelector('.status-dot').className = `status-dot ${isConnected ? 'green' : 'yellow'}`;
    DOM.connectionText.textContent = labelText;
  }

  // ==========================================================================
  // Inference Loop & Object Detection Core
  // ==========================================================================
  function startDetectionLoop() {
    if (state.detectIntervalId) clearInterval(state.detectIntervalId);
    state.detectIntervalId = setInterval(() => {
      if (state.autoDetect && !state.isModelLoading && state.model && (state.activeTab === 'tab-vision' || state.activeTab === 'tab-objects')) {
        runObjectDetection(false);
      }
      updateFpsCounter();
    }, 150); // ~6-8 FPS inference rate for balanced CPU/GPU performance
  }

  function updateFpsCounter() {
    state.fpsCount++;
    const now = performance.now();
    if (now - state.fpsLastTime >= 1000) {
      state.fps = Math.round((state.fpsCount * 1000) / (now - state.fpsLastTime));
      DOM.fpsDisplay.textContent = `${state.fps} FPS`;
      state.fpsCount = 0;
      state.fpsLastTime = now;
    }
  }

  function getCurrentSourceElement() {
    if (state.source === 'webcam') {
      return (DOM.webcamVideo.readyState === 4) ? DOM.webcamVideo : null;
    } else {
      return (DOM.streamImg.complete && DOM.streamImg.naturalWidth > 0) ? DOM.streamImg : null;
    }
  }

  async function runObjectDetection(isManual) {
    if (state.isDetecting || !state.model) return;
    const sourceEl = getCurrentSourceElement();
    if (!sourceEl) return;

    state.isDetecting = true;

    try {
      // Run COCO-SSD neural network inference
      const predictions = await state.model.detect(sourceEl, state.maxDetections, state.minConfidence);
      
      const width = sourceEl.videoWidth || sourceEl.naturalWidth || 640;
      const height = sourceEl.videoHeight || sourceEl.naturalHeight || 480;

      state.currentDetections = predictions;
      state.lastDetectTimestamp = Date.now();

      // Render overlay bounding boxes
      renderBoundingBoxes(predictions, width, height);

      // Update UI panels & logs
      updateDetectionSummaryUI(predictions);

      if (predictions.length > 0) {
        logDetectionEvents(predictions);
      }
    } catch (err) {
      console.error('Detection inference error:', err);
    } finally {
      state.isDetecting = false;
    }
  }

  // ==========================================================================
  // Bounding Box Renderer (Pure Form High-Contrast Colors)
  // ==========================================================================
  function renderBoundingBoxes(predictions, srcWidth, srcHeight) {
    const canvas = DOM.overlayCanvas;
    const ctx = canvas.getContext('2d');

    const dispWidth = DOM.viewportWrapper.clientWidth;
    const dispHeight = DOM.viewportWrapper.clientHeight;

    if (canvas.width !== dispWidth || canvas.height !== dispHeight) {
      canvas.width = dispWidth;
      canvas.height = dispHeight;
    }

    ctx.clearRect(0, 0, dispWidth, dispHeight);

    const scaleX = dispWidth / srcWidth;
    const scaleY = dispHeight / srcHeight;

    predictions.forEach(prediction => {
      const [x, y, w, h] = prediction.bbox;
      const label = prediction.class;
      const score = Math.round(prediction.score * 100);

      const rectX = x * scaleX;
      const rectY = y * scaleY;
      const rectW = w * scaleX;
      const rectH = h * scaleY;

      // Color selection based on class
      const strokeColor = classColors[label] || '#ff0000';

      // Draw sharp solid Bounding Box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = state.boxLineWidth;
      ctx.strokeRect(rectX, rectY, rectW, rectH);

      // Draw Label Badge if enabled
      if (state.showLabels) {
        const text = `${label.toUpperCase()} ${score}%`;
        ctx.font = 'bold 12px "Space Mono", monospace';
        const textWidth = ctx.measureText(text).width;
        const textHeight = 18;

        // Label background box (Pure Black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(rectX, Math.max(0, rectY - textHeight), textWidth + 12, textHeight);

        // Label border
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rectX, Math.max(0, rectY - textHeight), textWidth + 12, textHeight);

        // Text content (Pure White)
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, rectX + 6, Math.max(12, rectY - 4));
      }
    });
  }

  // ==========================================================================
  // Detection Summary & UI Update
  // ==========================================================================
  function updateDetectionSummaryUI(predictions) {
    DOM.detectedCountDisplay.textContent = `${predictions.length} Objects Detected`;
    DOM.tabObjCount.textContent = predictions.length;
    DOM.lastDetectTime.textContent = new Date().toLocaleTimeString();

    // Group predictions by class count
    const classCounts = {};
    predictions.forEach(p => {
      classCounts[p.class] = (classCounts[p.class] || 0) + 1;
    });

    const container = DOM.liveClassesContainer;
    container.innerHTML = '';

    const classesList = Object.keys(classCounts);
    if (classesList.length === 0) {
      container.innerHTML = '<span class="empty-tag">No objects detected in current frame.</span>';
    } else {
      classesList.forEach(cls => {
        const tag = document.createElement('span');
        tag.className = 'class-tag';
        tag.innerHTML = `
          <i class="fa-solid fa-tag" style="color:${classColors[cls] || '#000'}"></i>
          <span>${cls}</span>
          <span class="count-num">${classCounts[cls]}</span>
        `;
        container.appendChild(tag);
      });
    }

    updateRecentDrawer(predictions);
    if (state.activeTab === 'tab-objects') {
      renderObjectsHub();
    }
  }

  function updateRecentDrawer(predictions) {
    const list = DOM.recentList;
    if (predictions.length === 0) return;

    list.innerHTML = '';
    predictions.forEach(p => {
      const li = document.createElement('li');
      li.className = 'recent-item';
      li.innerHTML = `
        <span class="recent-name"><i class="fa-solid fa-cube"></i> ${p.class}</span>
        <span class="recent-score" style="color:var(--pure-blue);">${Math.round(p.score * 100)}% Confidence</span>
      `;
      list.appendChild(li);
    });
  }

  // Speech Synthesizer for Object Detection
  function speakDetectedObjects() {
    if (state.currentDetections.length === 0 || !('speechSynthesis' in window)) return;
    
    const uniqueClasses = [...new Set(state.currentDetections.map(d => d.class))];
    const text = `Detected ${state.currentDetections.length} objects: ${uniqueClasses.join(', ')}`;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // ==========================================================================
  // Detected Objects Hub (Tab 2)
  // ==========================================================================
  function renderObjectsHub() {
    const container = DOM.objectsGridContainer;
    container.innerHTML = '';

    if (state.currentDetections.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-binoculars"></i>
          <h4>No Objects Currently Detected</h4>
          <p>Point ESP32 camera or webcam towards objects to inspect neural network inferences.</p>
        </div>
      `;
      return;
    }

    state.currentDetections.forEach((item, index) => {
      const scorePct = Math.round(item.score * 100);
      const bboxStr = item.bbox.map(n => Math.round(n)).join(', ');

      const card = document.createElement('div');
      card.className = 'object-item-card';
      card.innerHTML = `
        <div class="object-item-header">
          <span class="object-title"><i class="fa-solid fa-cube"></i> ${item.class}</span>
          <span class="badge badge-black">#${index + 1}</span>
        </div>
        <div class="confidence-bar-wrapper">
          <div class="confidence-bar-fill" style="width:${scorePct}%; background:${classColors[item.class] || '#008000'};"></div>
        </div>
        <div class="object-details-list">
          <div>Confidence: <strong>${scorePct}%</strong></div>
          <div>BBox [x,y,w,h]: <strong>[${bboxStr}]</strong></div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function filterObjectsHub() {
    const q = DOM.objectsSearch.value.toLowerCase();
    const cards = DOM.objectsGridContainer.querySelectorAll('.object-item-card');
    cards.forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  }

  // ==========================================================================
  // ESP32 Remote Controller
  // ==========================================================================
  window.sendEspControl = function (varName, val) {
    state.esp32Ip = DOM.esp32IpInput.value.trim();
    const endpoint = `http://${state.esp32Ip}/control?var=${varName}&val=${val}`;
    DOM.espApiEndpointLog.textContent = `GET ${endpoint}`;

    if (varName === 'led_intensity') {
      DOM.espLedVal.textContent = `${val} / 255`;
    }

    fetch(endpoint, { mode: 'no-cors' })
      .then(() => console.log('ESP32 Control sent:', varName, val))
      .catch(err => console.error('ESP32 Control error:', err));
  };

  // ==========================================================================
  // Detection Logs & Analytics Engine
  // ==========================================================================
  function logDetectionEvents(predictions) {
    // Throttled log recording (max once every 2 seconds)
    const now = Date.now();
    if (now - (state.lastLogTime || 0) < 2000) return;
    state.lastLogTime = now;

    predictions.forEach(p => {
      const logEntry = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toLocaleString(),
        class: p.class,
        score: Math.round(p.score * 100),
        bbox: p.bbox.map(n => Math.round(n)).join(', '),
        source: state.source
      };
      state.logs.unshift(logEntry);
    });

    // Cap logs array to 500 records
    if (state.logs.length > 500) state.logs = state.logs.slice(0, 500);

    renderLogsTable();
    updateMetricsDashboard();
  }

  function renderLogsTable() {
    const tbody = DOM.logsTableBody;
    tbody.innerHTML = '';

    if (state.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-table">No recorded object detection events in session logs.</td></tr>';
      return;
    }

    state.logs.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.timestamp}</td>
        <td><strong style="text-transform:uppercase;">${item.class}</strong></td>
        <td><span class="badge badge-black">${item.score}%</span></td>
        <td style="font-family:var(--font-mono)">[${item.bbox}]</td>
        <td>${item.source}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function updateMetricsDashboard() {
    DOM.metricTotalDetections.textContent = state.logs.length;

    const uniqueClasses = new Set(state.logs.map(l => l.class));
    DOM.metricUniqueClasses.textContent = uniqueClasses.size;

    // Find top class
    const counts = {};
    state.logs.forEach(l => counts[l.class] = (counts[l.class] || 0) + 1);
    let topCls = 'N/A';
    let max = 0;
    for (const c in counts) {
      if (counts[c] > max) {
        max = counts[c];
        topCls = c.toUpperCase();
      }
    }
    DOM.metricTopClass.textContent = topCls;
  }

  function filterLogsTable() {
    const q = DOM.logsSearch.value.toLowerCase();
    const rows = DOM.logsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  }

  function exportLogsCSV() {
    if (state.logs.length === 0) return alert('No records to export');
    let csv = 'ID,Timestamp,ObjectClass,ConfidenceScore,BBox,Source\n';
    state.logs.forEach(item => {
      csv += `"${item.id}","${item.timestamp}","${item.class}","${item.score}%","[${item.bbox}]","${item.source}"\n`;
    });
    downloadFile(csv, 'object_detection_logs.csv', 'text/csv');
  }

  function exportLogsJSON() {
    if (state.logs.length === 0) return alert('No records to export');
    const json = JSON.stringify(state.logs, null, 2);
    downloadFile(json, 'object_detection_logs.json', 'application/json');
  }

  function clearLogsDatabase() {
    if (confirm('Clear all recorded detection logs?')) {
      state.logs = [];
      renderLogsTable();
      updateMetricsDashboard();
    }
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // App Startup
  document.addEventListener('DOMContentLoaded', init);

})();