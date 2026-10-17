'use client';

import React from 'react';
import './AdminStatsCard.scss';

export default function AdminStatsCard({
  title,
  value,
  trend,
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  trendLabel,
  icon,
  colorScheme = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'purple'
  onClick
}) {
  return (
    <div
      className={`admin-stats-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="card-top">
        <h4 className="card-title">{title}</h4>
        {icon && <div className={`card-icon-wrapper ${colorScheme}`}>{icon}</div>}
      </div>

      <div className="card-middle">
        <span className="card-value">{value}</span>
      </div>

      {(trend || trendLabel) && (
        <div className="card-bottom">
          {trend && (
            <span className={`trend-badge ${trendDirection}`}>
              {trendDirection === 'up' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              )}
              {trendDirection === 'down' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
              <span>{trend}</span>
            </span>
          )}
          {trendLabel && <span className="trend-text">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
