import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://klugbackend-cdfgbdepaebcdggv.centralindia-01.azurewebsites.net/api';

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        // SIMPLE LOGIN - Send username and password
        console.log('Logging in with username:', username);
        response = await axios.post(`${API_BASE}/auth/login`, {
          username: username,
          password: password
        });
        console.log('Login response:', response.data);
      } else {
        // Registration
        console.log('Registering with:', { regUsername, email, password, displayName });
        response = await axios.post(`${API_BASE}/auth/register`, {
          username: regUsername,
          email: email,
          password: password,
          displayName: displayName
        });
        console.log('Register response:', response.data);
      }
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        onLogin(response.data);
      } else {
        setError('No token received from server');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        <div className="auth-toggle">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Login</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Register</button>
        </div>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Username *"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
            placeholder="Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Display Name (Optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <div className="demo-info">
          <p>Demo Credentials:</p>
          <p>Username: test6<br/>Password: password123</p>
        </div>
      </div>
    </div>
  );
}

export default Login;