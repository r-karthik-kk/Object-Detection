import React from 'react';

export default function ZoneAlarmPanel({ 
  zoneEnabled, 
  setZoneEnabled, 
  targetClass, 
  setTargetClass,
  zoneSnapshots,
  clearZoneSnapshots 
}) {
  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fa-solid fa-shield-halved"></i> AI Spatial Zone & Intrusion Alarm</h3>
        <button className="btn btn-sm btn-outline" onClick={clearZoneSnapshots}>
          <i className="fa-solid fa-rotate-left"></i> Clear Gallery
        </button>
      </div>

      <p className="section-desc">
        Define a spatial intrusion zone on your camera feed. When target objects cross into the designated area, an audio alarm sounds and an auto-snapshot is saved automatically.
      </p>

      <div className="zone-grid">
        <div className="tuning-box">
          <label>Enable AI Zone Intrusion Alarm</label>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={zoneEnabled} 
              onChange={(e) => setZoneEnabled(e.target.checked)} 
            />
            <span className="slider"></span>
            <span className="toggle-label">{zoneEnabled ? 'Intrusion Alarm ACTIVE' : 'Intrusion Alarm Disabled'}</span>
          </label>
        </div>

        <div className="tuning-box">
          <label>Target Object Class to Trigger Alarm:</label>
          <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)}>
            <option value="all">Any Object (All 80 Classes)</option>
            <option value="person">Human / Person Only</option>
            <option value="car">Vehicle (Car/Bus/Truck)</option>
            <option value="laptop">Electronics (Laptop/Phone)</option>
            <option value="cat">Pets (Cat/Dog)</option>
          </select>
        </div>
      </div>

      <h4 style={{ marginTop: '1.5rem', marginBottom: '0.8rem' }}>
        <i className="fa-solid fa-camera-retro"></i> Auto-Captured Intrusion Snapshots ({zoneSnapshots.length})
      </h4>

      <div className="gallery-grid">
        {zoneSnapshots.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-shield-cat"></i>
            <h4>No Intrusion Alerts Recorded</h4>
            <p>Zone snapshots will appear here automatically when target objects cross the zone boundary.</p>
          </div>
        ) : (
          zoneSnapshots.map((snap, idx) => (
            <div className="gallery-item" key={idx}>
              <img src={snap.dataUrl} alt="Zone Alert Snapshot" />
              <div className="gallery-info">
                <div><strong>{snap.class}</strong></div>
                <div>{snap.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
