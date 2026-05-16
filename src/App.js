import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Categories from './components/Categories';
import Words from './components/Words';
import Quiz from './components/Quiz';
import BulkImport from './components/BulkImport';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  const handleLogin = async (username, password) => {
    try {
      // Send username as email field (backend expects email but we send username)
      const response = await fetch('https://wordgame-backend-2sza.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data);
        alert('Login successful!');
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const handleRegister = async (username, email, password, displayName) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayName })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      const data = await response.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data);
        alert('Registration successful!');
      }
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (!token) {
    return <AuthPage onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">WordGame Admin Panel</div>
          <div className="nav-links">
            <Link to="/">Categories</Link>
            <Link to="/words">Words</Link>
            <Link to="/quiz">Quiz</Link>
            <Link to="/bulk-import">Bulk Import</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
          <div className="user-info">
            Welcome, {user?.displayName || user?.username}
          </div>
        </nav>
        
        <div className="container">
          <Routes>
            <Route path="/" element={<Categories token={token} />} />
            <Route path="/words" element={<Words token={token} />} />
            <Route path="/quiz" element={<Quiz token={token} />} />
            <Route path="/bulk-import" element={<BulkImport token={token} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function AuthPage({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(username, password);
    } else {
      onRegister(username, email, password, displayName);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? 'Admin Login' : 'Admin Register'}</h2>
        
        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Username *"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Display Name (Optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </>
          )}
          {isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        
        <p className="demo-cred">
          {isLogin ? 'Demo: testuser / password123' : 'Create a new account'}
        </p>
      </div>
    </div>
  );
}

export default App;