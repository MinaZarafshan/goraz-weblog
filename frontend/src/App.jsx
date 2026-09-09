import { Routes, Route } from 'react-router-dom'

import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import HomePage from './pages/HomePage.jsx'
import PostDetailPage from './pages/PostDetailPage.jsx'

import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
        
      />
      <Route
        path="/weblog/:id"
        element={
          <ProtectedRoute>
            <PostDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App