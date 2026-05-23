import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <div className="card-header">
        <h2>Categories ({categories.length})</h2>
      </div>
      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            {category.imageUrl && (
              <img 
                src={category.imageUrl} 
                alt={category.name}
                onError={(e) => e.target.src = 'https://placehold.co/300x200?text=No+Image'}
              />
            )}
            <div className="category-info">
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="word-count">{category.wordCount} words</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;