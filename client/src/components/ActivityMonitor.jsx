import React, { useEffect, useRef } from 'react';

const ActivityMonitor = ({ activity }) => {
  const activityEndRef = useRef(null);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activity]);

  const getActivityClass = (item) => {
    if (item.toLowerCase().includes('error')) return 'text-danger';
    if (item.toLowerCase().includes('success')) return 'text-success';
    return 'text-info';
  };

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="card activity-monitor">
      <div className="card-body">
        <h5 className="card-title">Activity Monitor</h5>
        <ul className="list-group list-group-flush">
          {activity.slice(-10).map((item, index) => (
            <li key={index} className={`list-group-item ${getActivityClass(item)}`}>
              <small className="text-muted">{formatTimestamp(new Date())}</small> {item}
            </li>
          ))}
        </ul>
        <div ref={activityEndRef} />
      </div>
    </div>
  );
};

export default ActivityMonitor;
