'use client'

import { useState, useEffect } from 'react'
import VideoGenerator from '@/components/VideoGenerator'
import VideoQueue from '@/components/VideoQueue'
import CompletedVideos from '@/components/CompletedVideos'

export default function Home() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const processingVideos = videos.filter(v => 
    v.status === 'pending' || v.status === 'processing'
  )
  const completedVideos = videos.filter(v => 
    v.status === 'completed'
  )

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
        paddingBottom: '2rem'
      }}>
        <p>Built with AI • Powered by Automation</p>
      </footer>
    </div>
  )
}