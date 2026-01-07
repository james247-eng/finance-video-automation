'use client'

import { useState } from 'react'

export default function VideoGenerator({ onVideoGenerated }) {
  const [script, setScript] = useState('')
  const [title, setTitle] = useState('')
  const [videoLength, setVideoLength] = useState('60')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateForm = () => {
    if (!script.trim()) {
      setError('Please enter a script')
      return false
    }

    if (script.trim().length < 10) {
      setError('Script must be at least 10 characters long')
      return false
    }

    if (script.trim().length > 10000) {
      setError('Script cannot exceed 10000 characters')
      return false
    }

    if (!title.trim()) {
      setError('Please enter a video title')
      return false
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters long')
      return false
    }

    if (title.trim().length > 200) {
      setError('Title cannot exceed 200 characters')
      return false
    }

    const length = parseInt(videoLength)
    if (length < 30 || length > 900) {
      setError('Video length must be between 30 and 900 seconds')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const apiKey = localStorage.getItem('apiKey')
      if (!apiKey) {
        setError('API key not configured. Please set it in settings.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          script: script.trim(),
          title: title.trim(),
          videoLength: parseInt(videoLength),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details?.[0] || 'Failed to generate video')
      }

      setSuccess(`Video "${title}" queued successfully! Processing will begin shortly. ${data.sceneCount} scenes will be generated.`)
      setScript('')
      setTitle('')
      
      if (onVideoGenerated) {
        onVideoGenerated()
      }

      setTimeout(() => {
        setSuccess('')
      }, 6000)

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      console.error('Error generating video:', err)
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
          marginBottom: '1rem',
          border: '1px solid #fca5a5'
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #6ee7b7'
        }}>
          <strong>✅ Success:</strong> {success}
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
            Video Title * ({title.length}/200)
          </label>
          <input
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value.substring(0, 200))}
            placeholder="e.g., The 3 Enemies Keeping You Poor"
            disabled={loading}
            maxLength="200"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600',
            color: '#4a5568'
          }}>
            Video Script * ({script.length}/10000)
          </label>
          <textarea
            className="textarea"
            value={script}
            onChange={(e) => setScript(e.target.value.substring(0, 10000))}
            placeholder="Paste your script here..."
            disabled={loading}
            maxLength="10000"
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
              color: '#4a5568',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#edf2f7'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
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
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
          disabled={loading || !script.trim() || !title.trim()}
          style={{ 
            width: '100%',
            opacity: (!script.trim() || !title.trim()) ? 0.5 : 1
          }}
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
        color: '#718096',
        border: '1px solid #e2e8f0'
      }}>
        <strong>💡 Tips for better videos:</strong>
        <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
          <li>Use storytelling with metaphors (like "enemies" or "battles")</li>
          <li>Keep sentences short and punchy for better visuals</li>
          <li>Include clear sections or "acts" in your story</li>
          <li>End with a call to action or reflection</li>
          <li>Between 200-500 words typically works best</li>
        </ul>
      </div>
    </div>
  )
}