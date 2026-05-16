import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://wordgame-backend-2sza.onrender.com/api';

function Categories({ token }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to fetch categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', formData.name);
    form.append('description', formData.description);
    if (formData.image) form.append('image', formData.image);

    try {
      if (editingCategory) {
        await axios.put(`${API_BASE}/admin/categories/${editingCategory.id}`, form, axiosConfig);
        alert('Category updated successfully');
      } else {
        await axios.post(`${API_BASE}/admin/categories`, form, axiosConfig);
        alert('Category created successfully');
      }
      setShowModal(false);
      setFormData({ name: '', description: '', image: null });
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This will delete all words in this category.')) {
      try {
        await axios.delete(`${API_BASE}/admin/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Category deleted successfully');
        fetchCategories();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      await axios.patch(`${API_BASE}/admin/categories/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (error) {
      alert('Error toggling status');
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: null
    });
    setShowModal(true);
  };

  return (
    <div>
      <div className="card-header">
        <h2>Categories</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Description</th>
                <th>Words</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>
                    {cat.imageUrl && (
                      <img src={cat.imageUrl} alt={cat.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 5 }} />
                    )}
                  </td>
                  <td>{cat.name}</td>
                  <td>{cat.description}</td>
                  <td>{cat.wordCount}</td>
                  <td>
                    <span className={`badge ${cat.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => editCategory(cat)}>Edit</button>
                    <button className="btn btn-sm btn-warning" onClick={() => toggleStatus(cat.id)} style={{ marginLeft: 5 }}>
                      {cat.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)} style={{ marginLeft: 5 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                />
                {formData.image && (
                  <img src={URL.createObjectURL(formData.image)} alt="Preview" className="image-preview" />
                )}
              </div>
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ marginLeft: 10 }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;