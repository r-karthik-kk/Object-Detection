import React, { useState } from 'react';

export default function AnalyticsPanel({ logs, clearLogs }) {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(item => 
    item.class.toLowerCase().includes(search.toLowerCase()) ||
    item.timestamp.toLowerCase().includes(search.toLowerCase()) ||
    item.score.toString().includes(search)
  );

  const uniqueClasses = new Set(logs.map(l => l.class)).size;

  const classCounts = {};
  logs.forEach(l => classCounts[l.class] = (classCounts[l.class] || 0) + 1);
  let topClass = 'N/A';
  let maxCount = 0;
  for (const c in classCounts) {
    if (classCounts[c] > maxCount) {
      maxCount = classCounts[c];
      topClass = c.toUpperCase();
    }
  }

  const exportCSV = () => {
    if (logs.length === 0) return alert('No records to export');
    let csv = 'ID,Timestamp,ObjectClass,ConfidenceScore,BBox,Source\n';
    logs.forEach(item => {
      csv += `"${item.id}","${item.timestamp}","${item.class}","${item.score}%","[${item.bbox}]","${item.source}"\n`;
    });
    downloadFile(csv, 'parallel_object_detection_logs.csv', 'text/csv');
  };

  const exportJSON = () => {
    if (logs.length === 0) return alert('No records to export');
    downloadFile(JSON.stringify(logs, null, 2), 'parallel_object_detection_logs.json', 'application/json');
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
    <div className="card logs-panel">
      <div className="card-header">
        <h3><i className="fa-solid fa-database"></i> Parallel Detection Logs & Analytics</h3>
        <div className="logs-actions">
          <button className="btn btn-sm btn-secondary" onClick={exportCSV}>
            <i className="fa-solid fa-file-csv"></i> Export CSV
          </button>
          <button className="btn btn-sm btn-secondary" onClick={exportJSON}>
            <i className="fa-solid fa-file-code"></i> Export JSON
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearLogs}>
            <i className="fa-solid fa-trash"></i> Clear Database
          </button>
        </div>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <i className="fa-solid fa-eye" style={{ color: 'var(--accent-cyan)' }}></i>
          <div className="metric-info">
            <span className="metric-value">{logs.length}</span>
            <span className="metric-label">Total Inferences Logged</span>
          </div>
        </div>
        <div className="metric-card">
          <i className="fa-solid fa-shapes" style={{ color: 'var(--accent-pink)' }}></i>
          <div className="metric-info">
            <span className="metric-value">{uniqueClasses}</span>
            <span className="metric-label">Unique Classes Recognized</span>
          </div>
        </div>
        <div className="metric-card">
          <i className="fa-solid fa-trophy" style={{ color: 'var(--accent-green)' }}></i>
          <div className="metric-info">
            <span className="metric-value">{topClass}</span>
            <span className="metric-label">Most Detected Object</span>
          </div>
        </div>
      </div>

      <div className="table-filter-bar">
        <div className="search-input-group">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            placeholder="Search logs by object class, timestamp, or score..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Timestamp</th>
              <th>Object Class</th>
              <th>Confidence Score</th>
              <th>Bounding Box (x, y, w, h)</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table">No recorded object detection events in session logs.</td>
              </tr>
            ) : (
              filteredLogs.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.timestamp}</td>
                  <td><strong style={{ textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>{item.class}</strong></td>
                  <td><span className="badge badge-cyan">{item.score}%</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>[{item.bbox}]</td>
                  <td>{item.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
