import { Link } from 'react-router-dom'
import '../App.css'
import heroForest from '../assets/hero-forest.png'
import Navbar from '../components/Navbar.jsx'
function LandingPage() {
  return (
    <>
        <Navbar />

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
              <Link to="/signup" className="primary-button">
                Start writing
              </Link>

              <Link to="/login" className="secondary-button">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default LandingPage