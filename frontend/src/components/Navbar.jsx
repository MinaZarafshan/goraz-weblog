import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="site-header">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-mark">MW</span>
          <span className="brand-name">MiniWeblog</span>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="login-button">
            Log in
          </Link>

          <Link to="/signup" className="signup-button">
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Navbar