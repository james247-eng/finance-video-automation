'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
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
    const savedKey = localStorage.getItem('apiKey')
    if (savedKey) {
      setApiKey(savedKey)
      setTempApiKey(savedKey)
    } else {
      setShowSettings(true)
    }

    fetchVideos()
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

  const saveSettings = () => {
    localStorage.setItem('apiKey', tempApiKey)
    setApiKey(tempApiKey)
    setShowSettings(false)
    window.location.reload() // Refresh to apply key to all components
  }

  return (
    <main className="container">
      {/* IonIcons CDN Initialization */}
      <Script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js" />
      <Script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js" />

      <header>
        <div>
          <h1>Finance Automation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI Video Engine v1.0</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
          <ion-icon name="settings-outline"></ion-icon>
          Settings
        </button>
      </header>

      {/* Settings Sidebar */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>System Settings</h2>
              <button className="btn" onClick={() => setShowSettings(false)}>
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>Master API Key</label>
              <input 
                type="password" 
                className="input" 
                placeholder="Enter your secret key..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                This key is required to authenticate video generation requests.
              </p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '2rem' }}
              onClick={saveSettings}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        <VideoGenerator onVideoGenerated={fetchVideos} />

        {loading ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Syncing with server...</p>
          </div>
        ) : (
          <>
            <VideoQueue videos={videos.filter(v => v.status !== 'completed' && v.status !== 'failed')} />
            <CompletedVideos videos={videos.filter(v => v.status === 'completed')} />
          </>
        )}
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          &copy; 2026 Atlas Economy Automation. All rights reserved.
        </p>
      </footer>
    </main>
  )
}