import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

function Words() {
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      if (response.data.length > 0) {
        setSelectedCategory(response.data[0].name);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  const fetchWords = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const response = await api.get(`/words/category/${encodeURIComponent(selectedCategory)}?page=0&size=100`);
      setWords(response.data.words || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchWords();
  }, [selectedCategory, fetchWords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('word', formData.word);
    form.append('meaning', formData.meaning);
    form.append('categoryId', formData.categoryId);
    formData.examples.forEach(ex => ex.trim() && form.append('examples[]', ex));
    if (formData.memeImage) form.append('memeImage', formData.memeImage);

    try {
      if (editingWord) {
        await api.put(`/admin/words/${editingWord.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Word updated successfully');
      } else {
        await api.post('/admin/words', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
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
        await api.delete(`/admin/words/${id}`);
        alert('Word deleted successfully');
        fetchWords();
      } catch (error) {
        alert('Error: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) return <div className="loading">Loading words...</div>;

  return (
    <div>
      <div className="card-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2>Words</h2>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name} ({cat.wordCount} words)</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Word</button>
      </div>

      <div className="card">
        {words.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>No words found. Add some words!</p>
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Image</th><th>Word</th><th>Meaning</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {words.map(word => (
                <tr key={word.id}>
                  <td>{word.id}</td>
                  <td>
                    {word.memeImageUrl && <img src={word.memeImageUrl} alt={word.word} style={{ width: 40, height: 40, objectFit: 'cover' }} />}
                  </td>
                  <td>{word.word}</td>
                  <td>{word.meaning}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => {
                      setEditingWord(word);
                      setFormData({ word: word.word, meaning: word.meaning, categoryId: word.categoryId || '', examples: [], memeImage: null });
                      setShowModal(true);
                    }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(word.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingWord ? 'Edit Word' : 'Add Word'}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Word" value={formData.word} onChange={e => setFormData({ ...formData, word: e.target.value })} required />
              <textarea placeholder="Meaning" value={formData.meaning} onChange={e => setFormData({ ...formData, meaning: e.target.value })} rows="3" required />
              <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={e => setFormData({ ...formData, memeImage: e.target.files[0] })} />
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Words;