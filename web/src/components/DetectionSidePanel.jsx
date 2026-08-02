import React from 'react';

export default function DetectionSidePanel({ 
  detections, 
  speakObjects, 
  logs, 
  exportCSV, 
  exportJSON, 
  clearLogs 
}) {
  const classCounts = {};
  detections.forEach(d => {
    classCounts[d.class] = (classCounts[d.class] || 0) + 1;
  });

  const classesList = Object.keys(classCounts);

  return (
    <div className="card">
      <div className="card-header">
        <h3><i className="fa-solid fa-list-check"></i> Detected Objects ({detections.length})</h3>
        <button className="btn btn-sm btn-primary" onClick={speakObjects}>
          <i className="fa-solid fa-volume-high"></i> Voice Reader
        </button>
      </div>

      <div className="detected-objects-box">
        <h4>Active Classes Recognized</h4>
        <div className="classes-tags-list">
          {classesList.length === 0 ? (
            <span className="empty-tag">No objects detected in current frame.</span>
          ) : (
            classesList.map(cls => (
              <span className="class-tag" key={cls}>
                <span>{cls}</span>
                <span className="count-num">{classCounts[cls]}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <h4 style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        Itemized Objects Breakdown
      </h4>
      <div className="objects-list-wrapper">
        {detections.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-binoculars"></i>
            <p>Waiting for camera detection stream...</p>
          </div>
        ) : (
          detections.map((item, idx) => (
            <div className="object-row" key={idx}>
              <span className="object-name">#{idx + 1} {item.class}</span>
              <span className="object-score">{Math.round(item.score * 100)}%</span>
            </div>
          ))
        )}
      </div>

      {/* Detection History Logs Table directly underneath */}
      <div className="card-header" style={{ marginTop: '1.25rem' }}>
        <h3><i className="fa-solid fa-database"></i> Session Logs ({logs.length})</h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={exportCSV}>CSV</button>
          <button className="btn btn-sm btn-secondary" onClick={exportJSON}>JSON</button>
          <button className="btn btn-sm btn-danger" onClick={clearLogs}>Clear</button>
        </div>
      </div>

      <div className="logs-table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Object Class</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table">No recorded log events yet.</td>
              </tr>
            ) : (
              logs.slice(0, 50).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{item.timestamp.split(',')[1] || item.timestamp}</td>
                  <td><strong style={{ color: 'var(--green-primary)' }}>{item.class.toUpperCase()}</strong></td>
                  <td>{item.score}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
