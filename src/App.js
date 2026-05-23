import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Categories from './components/Categories';
import AdminCategories from './components/AdminCategories';
import Words from './components/Words';
import Quiz from './components/Quiz';
import BulkImport from './components/BulkImport';
import ProfileTest from './components/ProfileTest';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setToken(userData.token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">WordGame Admin</div>
          <div className="nav-links">
            <Link to="/">Categories</Link>
            <Link to="/admin/categories">Manage Categories</Link>
            <Link to="/words">Words</Link>
            <Link to="/quiz">Quiz</Link>
            <Link to="/bulk-import">Bulk Import</Link>
            <Link to="/profile-test">Profile</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
          <div className="user-info">Welcome, {user?.displayName || user?.username}</div>
        </nav>
        <div className="container">
          <Routes>
            <Route path="/" element={<Categories />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/words" element={<Words />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/bulk-import" element={<BulkImport />} />
            <Route path="/profile-test" element={<ProfileTest />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;