'use client'

import { formatDistanceToNow } from 'date-fns'

export default function VideoQueue({ videos }) {
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
        ⏳ Processing Queue ({videos.length})
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {videos.map((video) => (
          <div
            key={video.id}
            style={{
              padding: '1.5rem',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f7fafc'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>
                  {video.title}
                </h3>
                <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                  Started {formatDistanceToNow(new Date(video.createdAt))} ago
                </p>
              </div>
              <span className={`status-badge status-${video.status}`}>
                {video.status === 'pending' ? '⏱️ Pending' : '🔄 Processing'}
              </span>
            </div>

            {video.progress && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e2e8f0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${video.progress}%`,
                    height: '100%',
                    backgroundColor: '#667eea',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.5rem' }}>
                  {video.currentStep || 'Initializing...'}
                </p>
              </div>
            )}

            {video.errorMessage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                Error: {video.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}