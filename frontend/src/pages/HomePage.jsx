import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      const response = await fetch('http://localhost:8080/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Logout failed')
        return
      }

      navigate('/login')
    } catch (error) {
      console.error('Could not connect to server:', error)
    }
  }

  return (
    <main>
      <h1>Home</h1>
      <p>You are logged in.</p>

      <button onClick={handleLogout}>
        Log out
      </button>
    </main>
  )
}

export default HomePage