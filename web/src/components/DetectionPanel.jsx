import React from 'react';

export default function DetectionPanel({ 
  detections, 
  speakObjects, 
  classColors 
}) {
  // Group detections by class name
  const classCounts = {};
  detections.forEach(d => {
    classCounts[d.class] = (classCounts[d.class] || 0) + 1;
  });

  const classesList = Object.keys(classCounts);

  return (
    <div className="card summary-card">
      <div className="card-header">
        <h3><i className="fa-solid fa-layer-group"></i> Parallel Detection Summary</h3>
        <span className="badge badge-cyan">{detections.length} Active Detections</span>
      </div>

      <div className="objects-summary-box">
        <h4><i className="fa-solid fa-cubes"></i> Active Recognized Classes ({classesList.length})</h4>
        <div className="classes-tags-list">
          {classesList.length === 0 ? (
            <span className="empty-tag">No objects detected in current frame.</span>
          ) : (
            classesList.map(cls => (
              <span className="class-tag" key={cls}>
                <i className="fa-solid fa-tag" style={{ color: classColors[cls] || '#00f2fe' }}></i>
                <span>{cls}</span>
                <span className="count-num">{classCounts[cls]}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="quick-actions-bar">
        <button className="btn btn-sm btn-gradient-pink btn-block" onClick={speakObjects}>
          <i className="fa-solid fa-volume-high"></i> Speak Detected Objects (TTS)
        </button>
      </div>

      <div className="recent-detections-drawer">
        <h4><i className="fa-solid fa-list-check"></i> Itemized Parallel Objects List</h4>
        <ul className="recent-list">
          {detections.length === 0 ? (
            <li className="empty-list">Waiting for camera inference stream...</li>
          ) : (
            detections.map((item, idx) => (
              <li className="recent-item" key={idx}>
                <span className="recent-name">
                  <i className="fa-solid fa-cube" style={{ color: classColors[item.class] || '#00f2fe' }}></i> #{idx + 1} {item.class}
                </span>
                <span className="recent-score">{Math.round(item.score * 100)}% Confidence</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
