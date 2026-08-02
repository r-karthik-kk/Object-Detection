# Object Detection Platform — ESP32-CAM AI Vision System

> **A simple, high-performance, flat green AI Vision System for real-time ESP32-CAM video streaming, parallel multi-object detection (TensorFlow.js COCO-SSD), side-by-side detected item analysis, aligned hardware controls, and mobile responsive dashboard.**

---

## 🌟 Key Features

- 🎯 **Simple Title & Pure White Layout**: Clean, minimal title (**"Object Detection"**), pure white background (`#ffffff`), and sharp square edges (**zero curved corners** `border-radius: 0px`).
- 🟢 **Solid Emerald Green Design**: Solid `#10b981` emerald green accents, green bounding boxes, solid badges, and flat buttons. No gradient fills.
- 📦 **Side-by-Side Unified Dashboard**:
  - **Left Side**: Camera Stream Viewport (ESP32 / Webcam / Upload) + Perfectly Aligned Camera & ESP32 Controls.
  - **Right Side**: Live Detected Objects Breakdown (Active class tags, confidence %) + Session Detection History Table directly underneath.
- ⚡ **Sub-30ms High-Speed Inference (30+ FPS)**: WebGL GPU acceleration coupled with smart 320x240 frame downscaling inference booster that maps bounding boxes accurately to full display resolution.
- 📱 **Mobile Responsive**: Fully responsive grid that automatically collapses into a fluid 1-column stack on mobile devices (`@media (max-width: 768px)`).
- 🗣️ **Voice Reader (TTS)**: Reads active detected objects out loud using Web Speech Synthesis API.
- 🎛️ **ESP32 Hardware Remote Controller**: Send HTTP REST commands to adjust camera hardware settings without re-flashing code (LED flash intensity, resolution, brightness, contrast, flip, mirror).
- 📊 **Session Logs & Export**: Record detection events and batch export data to **CSV** or **JSON**.

---

## 🚀 How to Run

### Method 1: Using Custom Python Server (Fixes Windows MIME Errors)
```bash
cd web
python server.py
```
Open **`http://localhost:8000`** in your browser.

### Method 2: Using Vite Dev Server
```bash
cd web
cmd /c npm install
cmd /c npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🛠️ Hardware Requirements & Pin Wiring

### Components Required
1. **ESP32-CAM Module** (AI-Thinker model with OV2640 camera module).
2. **FTDI USB-to-Serial Adapter** (3.3V / 5V selectable).
3. **Female-to-Female Jumper Wires**.
4. **5V Power Supply / USB Cable** (Ensuring at least 1A current capacity).

### FTDI Programmer to ESP32-CAM Pinouts

| FTDI Adapter Pin | ESP32-CAM Pin | Note |
| :--- | :--- | :--- |
| **VCC** (5V) | **5V** | ESP32-CAM requires stable 5V power |
| **GND** | **GND** | Ground connection |
| **TX** | **U0R (GPIO 3)** | Serial RX |
| **RX** | **U0T (GPIO 1)** | Serial TX |
| **GND** | **GPIO 0** | **Connect GPIO 0 to GND ONLY during firmware flashing** |

> ⚠️ **Important**: Disconnect **GPIO 0 from GND** after uploading firmware and press the **RESET (RST)** button to boot the ESP32 into standard operational mode.

---

## 📡 ESP32 HTTP API Reference

| Method | Endpoint | Description | Example Query |
| :--- | :--- | :--- | :--- |
| `GET` | `http://<IP>:81/stream` | Continuous MJPEG Video Stream | `http://192.168.1.10:81/stream` |
| `GET` | `http://<IP>/capture` | Single JPEG Frame Snapshot | `http://192.168.1.10/capture` |
| `GET` | `http://<IP>/control` | Adjust hardware camera parameter | `http://192.168.1.10/control?var=led_intensity&val=200` |

---

## 📄 License
This project is open-source under the MIT License.
