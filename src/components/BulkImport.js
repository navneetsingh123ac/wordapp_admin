import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://wordgame-backend-2sza.onrender.com/api';

function BulkImport({ token }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const words = JSON.parse(jsonData);
      const response = await axios.post(`${API_BASE}/admin/words/bulk/${selectedCategory}`, 
        { words }, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      setResult({ success: true, data: response.data });
    } catch (error) {
      setResult({ success: false, error: error.response?.data?.message || error.message });
    }
    setLoading(false);
  };

  const exampleJson = `[
  {
    "word": "no cap",
    "meaning": "For real, not lying",
    "examples": ["No cap, that was amazing!", "I'm serious, no cap."],
    "memeImageUrl": "https://example.com/no-cap.jpg"
  },
  {
    "word": "rent free",
    "meaning": "Living in your head without paying",
    "examples": ["That song lives rent free in my head"],
    "memeImageUrl": "https://example.com/rent-free.jpg"
  },
  {
    "word": "main character energy",
    "meaning": "Confident, center of attention",
    "examples": ["She has main character energy"],
    "memeImageUrl": "https://example.com/main-character.jpg"
  }
]`;

  return (
    <div>
      <div className="card-header">
        <h2>Bulk Import Words</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>JSON Data</label>
            <textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows={15}
              placeholder={exampleJson}
              required
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Importing...' : 'Import Words'}
          </button>
        </form>
      </div>

      {result && (
        <div className={`card ${result.success ? 'success' : 'error'}`}>
          <h3>{result.success ? 'Import Successful!' : 'Import Failed'}</h3>
          {result.success ? (
            <p>{result.data.message}</p>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}

      <div className="card">
        <h3>JSON Format Example</h3>
        <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '5px', overflow: 'auto' }}>
          {exampleJson}
        </pre>
      </div>
    </div>
  );
}

export default BulkImport;