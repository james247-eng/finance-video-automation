'use client'

import { useState } from 'react'

export default function VideoGenerator({ onVideoGenerated }) {
  const [script, setScript] = useState('')
  const [title, setTitle] = useState('')
  const [videoLength, setVideoLength] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!script.trim()) {
      setError('Please enter a script')
      return
    }

    if (!title.trim()) {
      setError('Please enter a video title')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script.trim(),
          title: title.trim(),
          videoLength: parseInt(videoLength),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video')
      }

      setSuccess(`Video "${title}" queued successfully! Processing will begin shortly.`)
      setScript('')
      setTitle('')
      
      if (onVideoGenerated) {
        onVideoGenerated()
      }

      setTimeout(() => {
        setSuccess('')
      }, 5000)

    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const exampleScript = `In the world of money, there are three enemies you must defeat to build true wealth.

Enemy #1: The Fear Monster. This creature whispers "you're not good enough" and "it's too risky." Atlas learned that fear only grows in darkness. When you face it with knowledge and action, it shrinks.

Enemy #2: The Debt Dragon. This beast feeds on impulse purchases and credit cards. Every dollar you owe makes it stronger. Atlas discovered the secret: pay yourself first, then slay the dragon with the debt snowball method.

Enemy #3: The Procrastination Shadow. "I'll start tomorrow," it says. "Next month will be better." But tomorrow never comes. Atlas realized that starting small today beats planning big for someday.

The choice is yours: let these enemies control your financial future, or become the hero of your own money story.`

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
        📝 Generate New Video
      </h2>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Video Title *
          </label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The 3 Enemies Keeping You Poor"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Video Script *
          </label>
          <textarea
            className="textarea"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script here..."
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setScript(exampleScript)}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#4a5568'
            }}
            disabled={loading}
          >
            Load Example Script
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Target Video Length
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="videoLength"
                value="60"
                checked={videoLength === '60'}
                onChange={(e) => setVideoLength(e.target.value)}
                disabled={loading}
                style={{ marginRight: '0.5rem' }}
              />
              60 seconds (Short)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="videoLength"
                value="180"
                checked={videoLength === '180'}
                onChange={(e) => setVideoLength(e.target.value)}
                disabled={loading}
                style={{ marginRight: '0.5rem' }}
              />
              3 minutes (Medium)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="videoLength"
                value="480"
                checked={videoLength === '480'}
                onChange={(e) => setVideoLength(e.target.value)}
                disabled={loading}
                style={{ marginRight: '0.5rem' }}
              />
              8 minutes (Long)
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <div className="spinner"></div>
              Processing...
            </span>
          ) : (
            '🚀 Generate Video'
          )}
        </button>
      </form>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        backgroundColor: '#f7fafc', 
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#718096'
      }}>
        <strong>💡 Tips for better videos:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Use storytelling with metaphors (like "enemies" or "battles")</li>
          <li>Keep sentences short and punchy for better visuals</li>
          <li>Include clear sections or "acts" in your story</li>
          <li>End with a call to action or reflection</li>
        </ul>
      </div>
    </div>
  )
}