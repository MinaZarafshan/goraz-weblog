import './App.css'
import heroForest from './assets/hero-forest.png'

function App() {
  return (
    <>
      <header className="site-header">
        <nav className="navbar">
          <div className="brand">
            <span className="brand-mark">MW</span>
            <span className="brand-name">MiniWeblog</span>
          </div>

          <div className="nav-actions">
            <button className="login-button">Log in</button>
            <button className="signup-button">Sign up</button>
          </div>
        </nav>
      </header>

      <main>
        <section
          className="hero-section"
          style={{ backgroundImage: `url(${heroForest})` }}
        >
          <div className="hero-content">
            <p className="hero-eyebrow">
              A quieter place to write
            </p>

            <h2>
              Write what matters.
              <br />
              Share it with the right people.
            </h2>

            <p className="hero-description">
              A simple space for thoughts, stories and conversations.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Start writing
              </button>

              <button className="secondary-button">
                Log in
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default App