'use client'

import { useState, useEffect } from 'react'
import VideoGenerator from '@/components/VideoGenerator'
import VideoQueue from '@/components/VideoQueue'
import CompletedVideos from '@/components/CompletedVideos'

export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')

  useEffect(() => {
    // Load API key from localStorage
    const savedKey = localStorage.getItem('apiKey')
    if (savedKey) {
      setApiKey(savedKey)
    } else {
      setShowSettings(true)
    }

    fetchVideos()
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchVideos, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/check-status')
      const data = await response.json()
      setVideos(data.videos || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching videos:', error)
      setLoading(false)
    }
  }

  const handleVideoGenerated = () => {
    fetchVideos()
  }

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('apiKey', tempApiKey.trim())
      setApiKey(tempApiKey.trim())
      setTempApiKey('')
      setShowSettings(false)
    }
  }

  const processingVideos = videos.filter(v => 
    v.status === 'pending' || v.status === 'processing'
  )
  const completedVideos = videos.filter(v => 
    v.status === 'completed'
  )

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            padding: '0.5rem 1rem',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          ⚙️ {apiKey ? 'Settings' : 'Configure'}
        </button>

        <h1 style={{ 
          color: 'white', 
          fontSize: '3rem', 
          marginBottom: '0.5rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          💼 Atlas Economy
        </h1>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: '1.25rem' 
        }}>
          AI-Powered Financial Education Video Generator
        </p>
      </header>

      {showSettings && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f0f4ff', border: '2px solid #667eea' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>🔑 API Configuration</h3>
          <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Enter your API secret key to enable video generation:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              className="input"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Enter your API secret key"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSaveApiKey()
              }}
            />
            <button
              onClick={handleSaveApiKey}
              className="btn btn-primary"
              disabled={!tempApiKey.trim()}
              style={{ whiteSpace: 'nowrap' }}
            >
              Save
            </button>
          </div>
          {apiKey && (
            <p style={{ color: '#22863a', marginTop: '0.5rem', fontSize: '0.875rem' }}>
              ✅ API key is configured
            </p>
          )}
        </div>
      )}

      {!apiKey && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
          <p style={{ color: '#92400e', margin: 0 }}>
            ⚠️ <strong>API key not configured.</strong> Please click the "Configure" button above to add your API secret key.
          </p>
        </div>
      )}

      <VideoGenerator onVideoGenerated={handleVideoGenerated} />

      {loading ? (
        <div style={{ textAlign: 'center', color: 'white', marginTop: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading videos...</p>
        </div>
      ) : (
        <>
          {processingVideos.length > 0 && (
            <VideoQueue videos={processingVideos} />
          )}
          
          {completedVideos.length > 0 && (
            <CompletedVideos videos={completedVideos} />
          )}

          {videos.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <h3 style={{ color: '#718096', marginBottom: '0.5rem' }}>
                No videos yet
              </h3>
              <p style={{ color: '#a0aec0' }}>
                Generate your first video above to get started!
              </p>
            </div>
          )}
        </>
      )}

      <footer style={{ 
        textAlign: 'center', 
        color: 'rgba(255,255,255,0.7)', 
        marginTop: '4rem',
        paddingBottom: '2rem',
        fontSize: '0.875rem'
      }}>
        <p>Built with AI • Powered by Automation • Version 1.0.0</p>
        <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
          📚 <a href="https://github.com" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>Documentation</a> • 
          🐛 <a href="https://github.com" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}>Report Issues</a>
        </p>
      </footer>
    </div>
  )
}