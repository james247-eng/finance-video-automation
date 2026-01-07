'use client'

import { formatDistanceToNow } from 'date-fns'

export default function CompletedVideos({ videos }) {
  const handleDownload = async (videoUrl, title) => {
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download video. Please try again.')
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
        ✅ Completed Videos ({videos.length})
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {videos.map((video) => (
          <div
            key={video.id}
            style={{
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'white',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Video Preview */}
            <div style={{ 
              width: '100%', 
              height: '180px', 
              backgroundColor: '#1a202c',
              position: 'relative'
            }}>
              <video
                src={video.videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                controls
              />
            </div>

            {/* Video Info */}
            <div style={{ padding: '1rem' }}>
              <h3 style={{ 
                color: '#2d3748', 
                marginBottom: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                {video.title}
              </h3>
              
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '0.75rem',
                fontSize: '0.875rem',
                color: '#718096'
              }}>
                <span>⏱️ {video.duration}s</span>
                <span>•</span>
                <span>🎬 {video.sceneCount} scenes</span>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: '1rem' }}>
                Created {formatDistanceToNow(new Date(video.createdAt))} ago
              </p>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(video.videoUrl, video.title)}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1,
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  📥 Download
                </button>
                
                <button
                  onClick={() => window.open(video.videoUrl, '_blank')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#4a5568'
                  }}
                >
                  👁️ View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}