import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar.jsx'
import heroForest from '../assets/hero-forest.png'
import '../App.css'

function LoginPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (username.trim() === '') {
      setError('Username is required')
      return
    }

    if (password === '') {
      setError('Password is required')
      return
    }

    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      navigate('/home')
    } catch (error) {
      console.error('Login request failed:', error)
      setError('Could not connect to the server')
    }
  }

  return (
    <>
      <Navbar />

      <main>
        <section
          className="auth-section"
          style={{ backgroundImage: `url(${heroForest})` }}
        >
          <div className="auth-card">
            <p className="auth-eyebrow">
              WELCOME BACK
            </p>

            <h1>Log in to MiniWeblog</h1>

            <p className="auth-description">
              Continue writing, reading and sharing.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                />
              </div>

              {error && (
                <p className="form-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-submit-button"
              >
                Log in
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}

export default LoginPage