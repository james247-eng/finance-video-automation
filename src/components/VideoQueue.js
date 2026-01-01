'use client'

import { formatDistanceToNow } from 'date-fns'

export default function VideoQueue({ videos }) {
  if (!videos || videos.length === 0) {
    return null
  }

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
              backgroundColor: video.status === 'processing' ? '#f0f9ff' : '#f7fafc',
              borderLeftWidth: '4px',
              borderLeftColor: video.status === 'processing' ? '#3b82f6' : '#fbbf24'
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
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor: video.status === 'pending' ? '#fef3c7' : '#bfdbfe',
                color: video.status === 'pending' ? '#92400e' : '#1e40af'
              }}>
                {video.status === 'pending' ? '⏱️ Pending' : '🔄 Processing'}
              </span>
            </div>

            {(video.progress !== undefined && video.progress !== null) && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e2e8f0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, video.progress)}%`,
                    height: '100%',
                    backgroundColor: video.status === 'processing' ? '#3b82f6' : '#fbbf24',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '0.5rem'
                }}>
                  <p style={{ fontSize: '0.75rem', color: '#718096', margin: 0 }}>
                    {video.currentStep || 'Initializing...'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#718096', margin: 0, fontWeight: '600' }}>
                    {video.progress || 0}%
                  </p>
                </div>
              </div>
            )}

            {video.errorMessage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '0.875rem',
                border: '1px solid #fca5a5'
              }}>
                <strong>❌ Error:</strong> {video.errorMessage}
              </div>
            )}

            {video.sceneCount && (
              <div style={{
                marginTop: '1rem',
                fontSize: '0.875rem',
                color: '#718096'
              }}>
                📊 {video.sceneCount} scenes • ⏱️ {video.videoLength || '?'} seconds
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ 
        marginTop: '1rem', 
        fontSize: '0.875rem', 
        color: '#a0aec0',
        fontStyle: 'italic'
      }}>
        💬 Tip: Videos are processed one at a time. Please be patient!
      </p>
    </div>
  )
}