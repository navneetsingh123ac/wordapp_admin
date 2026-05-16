import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://wordgame-backend-2sza.onrender.com/api';

function Words({ token }) {
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    word: '',
    meaning: '',
    categoryId: '',
    examples: [],
    memeImage: null
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
      if (response.data.length > 0) {
        setSelectedCategory(response.data[0].name);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWords = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/words/category/${selectedCategory}?page=0&size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWords(response.data.words || []);
    } catch (error) {
      console.error('Error fetching words:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchWords();
    }
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('word', formData.word);
    form.append('meaning', formData.meaning);
    form.append('categoryId', formData.categoryId);
    formData.examples.forEach(ex => form.append('examples[]', ex));
    if (formData.memeImage) form.append('memeImage', formData.memeImage);

    try {
      if (editingWord) {
        await axios.put(`${API_BASE}/admin/words/${editingWord.id}`, form, {
          headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' }
        });
        alert('Word updated successfully');
      } else {
        await axios.post(`${API_BASE}/admin/words`, form, {
          headers: { ...axiosConfig.headers, 'Content-Type': 'multipart/form-data' }
        });
        alert('Word created successfully');
      }
      setShowModal(false);
      setFormData({ word: '', meaning: '', categoryId: '', examples: [], memeImage: null });
      setEditingWord(null);
      fetchWords();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await axios.delete(`${API_BASE}/admin/words/${id}`, axiosConfig);
        alert('Word deleted successfully');
        fetchWords();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const editWord = (word) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      meaning: word.meaning,
      categoryId: word.categoryId || '',
      examples: [],
      memeImage: null
    });
    setShowModal(true);
  };

  const addExample = () => {
    setFormData({ ...formData, examples: [...formData.examples, ''] });
  };

  const updateExample = (index, value) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({ ...formData, examples: newExamples });
  };

  const removeExample = (index) => {
    const newExamples = formData.examples.filter((_, i) => i !== index);
    setFormData({ ...formData, examples: newExamples });
  };

  return (
    <div>
      <div className="card-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2>Words</h2>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Word
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
                <th>Word</th>
                <th>Meaning</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {words.map(word => (
                <tr key={word.id}>
                  <td>{word.id}</td>
                  <td>
                    {word.memeImageUrl && (
                      <img src={word.memeImageUrl} alt={word.word} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 5 }} />
                    )}
                  </td>
                  <td>{word.word}</td>
                  <td>{word.meaning}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => editWord(word)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(word.id)} style={{ marginLeft: 5 }}>Delete</button>
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
            <h3>{editingWord ? 'Edit Word' : 'Add Word'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Word</label>
                <input
                  type="text"
                  value={formData.word}
                  onChange={e => setFormData({ ...formData, word: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Meaning</label>
                <textarea
                  value={formData.meaning}
                  onChange={e => setFormData({ ...formData, meaning: e.target.value })}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Examples</label>
                {formData.examples.map((ex, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="text"
                      value={ex}
                      onChange={e => updateExample(idx, e.target.value)}
                      placeholder={`Example ${idx + 1}`}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeExample(idx)}>X</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-primary" onClick={addExample}>+ Add Example</button>
              </div>
              <div className="form-group">
                <label>Meme Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFormData({ ...formData, memeImage: e.target.files[0] })}
                />
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

export default Words;