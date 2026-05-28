import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ── Image Editor Modal ──────────────────────────────────────────────────────
function ImageEditor({ file, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [size, setSize] = useState(200);          // square crop size in px (output)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const PREVIEW = 300; // fixed preview canvas size

  // Load image from file/blob
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImg(image);
      // center by default
      setOffset({ x: (image.width - size) / 2, y: (image.height - size) / 2 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]); // eslint-disable-line

  // Redraw preview whenever anything changes
  useEffect(() => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = PREVIEW;
    canvas.height = PREVIEW;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, PREVIEW, PREVIEW);

    // Draw the portion of the image inside the crop square, scaled to PREVIEW
    ctx.drawImage(img, offset.x, offset.y, size, size, 0, 0, PREVIEW, PREVIEW);

    // Overlay grid (rule of thirds)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    [1, 2].forEach(i => {
      ctx.beginPath(); ctx.moveTo((PREVIEW / 3) * i, 0); ctx.lineTo((PREVIEW / 3) * i, PREVIEW); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (PREVIEW / 3) * i); ctx.lineTo(PREVIEW, (PREVIEW / 3) * i); ctx.stroke();
    });
  }, [img, offset, size]);

  const clampOffset = (x, y, s, image) => ({
    x: Math.max(0, Math.min(image.width - s, x)),
    y: Math.max(0, Math.min(image.height - s, y)),
  });

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ mx: e.clientX, mx0: offset.x * (PREVIEW / size), my: e.clientY, my0: offset.y * (PREVIEW / size) });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !dragStart || !img) return;
    const scale = size / PREVIEW;
    const dx = (e.clientX - dragStart.mx) * scale;
    const dy = (e.clientY - dragStart.my) * scale;
    const newX = dragStart.mx0 * scale - dx + offset.x - (offset.x - (dragStart.mx0 * scale));
    // simpler recalc:
    const ox = dragStart.mx0 * scale + (dragStart.mx - e.clientX) * scale;
    const oy = dragStart.my0 * scale + (dragStart.my - e.clientY) * scale;
    setOffset(clampOffset(ox, oy, size, img));
  };

  const handleMouseUp = () => setDragging(false);

  const handleSizeChange = (newSize) => {
    if (!img) return;
    const s = Math.max(50, Math.min(Math.min(img.width, img.height), newSize));
    setSize(s);
    setOffset(prev => clampOffset(prev.x, prev.y, s, img));
  };

  const handleConfirm = () => {
    if (!img) return;
    // Render final square at 400×400
    const out = document.createElement('canvas');
    out.width = 400; out.height = 400;
    const ctx = out.getContext('2d');
    ctx.drawImage(img, offset.x, offset.y, size, size, 0, 0, 400, 400);
    out.toBlob(blob => {
      const croppedFile = new File([blob], 'meme.jpg', { type: 'image/jpeg' });
      onConfirm(croppedFile, URL.createObjectURL(blob));
    }, 'image/jpeg', 0.92);
  };

  const maxSize = img ? Math.min(img.width, img.height) : 800;

  return (
    <div style={styles.editorOverlay}>
      <div style={styles.editorBox}>
        <h3 style={styles.editorTitle}>✂️ Crop &amp; Position Image</h3>
        <p style={styles.editorHint}>Drag to reposition · Slider to resize crop window</p>

        {img ? (
          <>
            <canvas
              ref={canvasRef}
              style={{ ...styles.previewCanvas, cursor: dragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>Size</span>
              <input
                type="range" min={50} max={maxSize} value={size}
                onChange={e => handleSizeChange(Number(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{size}px</span>
            </div>
            <div style={styles.editorMeta}>
              Original: {img.width}×{img.height} · Crop: {size}×{size} · Output: 400×400
            </div>
          </>
        ) : (
          <div style={styles.editorLoading}>Loading image…</div>
        )}

        <div style={styles.editorActions}>
          <button style={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button style={styles.btnConfirm} onClick={handleConfirm} disabled={!img}>Use this crop</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Words Component ────────────────────────────────────────────────────
function Words() {
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    word: '', meaning: '', categoryId: '', examples: [], memeImage: null
  });

  // Image editor state
  const [rawImageFile, setRawImageFile] = useState(null);   // file going INTO editor
  const [croppedFile, setCroppedFile] = useState(null);     // file coming OUT of editor
  const [croppedPreview, setCroppedPreview] = useState(''); // object URL for display
  const [showEditor, setShowEditor] = useState(false);

  const dropZoneRef = useRef(null);

  // ── Fetch helpers ──
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      if (res.data.length > 0) setSelectedCategory(res.data[0].name);
    } catch (err) { console.error(err); }
  }, []);

  const fetchWords = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      const res = await api.get(`/words/category/${encodeURIComponent(selectedCategory)}?page=0&size=100`);
      setWords(res.data.words || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedCategory]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchWords(); }, [selectedCategory, fetchWords]);

  // ── Clipboard paste listener ──
  useEffect(() => {
    if (!showModal) return;
    const handlePaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find(i => i.type.startsWith('image/'));
      if (!imgItem) return;
      const file = imgItem.getAsFile();
      if (file) openEditor(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showModal]);

  // ── File input / drop ──
  const openEditor = (file) => {
    setRawImageFile(file);
    setShowEditor(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) openEditor(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) openEditor(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = () => dropZoneRef.current?.classList.remove('drag-over');

  const handleEditorConfirm = (file, previewUrl) => {
    setCroppedFile(file);
    setCroppedPreview(previewUrl);
    setFormData(prev => ({ ...prev, memeImage: file }));
    setShowEditor(false);
  };

  const handleEditorCancel = () => {
    setRawImageFile(null);
    setShowEditor(false);
  };

  const removeCroppedImage = () => {
    setCroppedFile(null);
    setCroppedPreview('');
    setFormData(prev => ({ ...prev, memeImage: null }));
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('word', formData.word);
    form.append('meaning', formData.meaning);
    form.append('categoryId', formData.categoryId);
    formData.examples.forEach(ex => ex.trim() && form.append('examples[]', ex));
    const imageToUpload = croppedFile || formData.memeImage;
    if (imageToUpload) form.append('memeImage', imageToUpload);

    try {
      if (editingWord) {
        await api.put(`/admin/words/${editingWord.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Word updated successfully');
      } else {
        await api.post('/admin/words', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Word created successfully');
      }
      closeModal();
      fetchWords();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWord(null);
    setFormData({ word: '', meaning: '', categoryId: '', examples: [], memeImage: null });
    setCroppedFile(null);
    setCroppedPreview('');
    setRawImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/admin/words/${id}`);
      alert('Word deleted successfully');
      fetchWords();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="loading">Loading words...</div>;

  return (
    <div>
      {/* ── Header ── */}
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

      {/* ── Table ── */}
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
                    {word.memeImageUrl && (
                      <img src={word.memeImageUrl} alt={word.word}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                    )}
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

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingWord ? 'Edit Word' : 'Add Word'}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Word" value={formData.word}
                onChange={e => setFormData({ ...formData, word: e.target.value })} required />
              <textarea placeholder="Meaning" value={formData.meaning}
                onChange={e => setFormData({ ...formData, meaning: e.target.value })} rows="3" required />
              <select value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>

              {/* ── Image Upload Zone ── */}
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={styles.dropZone}
              >
                {croppedPreview ? (
                  <div style={styles.previewWrapper}>
                    <img src={croppedPreview} alt="preview" style={styles.thumbPreview} />
                    <div style={styles.previewActions}>
                      <button type="button" style={styles.btnReEdit}
                        onClick={() => rawImageFile && openEditor(rawImageFile)}>
                        ✏️ Re-edit
                      </button>
                      <button type="button" style={styles.btnRemove} onClick={removeCroppedImage}>
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.dropPrompt}>
                    <span style={styles.dropIcon}>🖼️</span>
                    <span style={styles.dropText}>
                      Drop image here, <label style={styles.browseLink}>
                        browse
                        <input type="file" accept="image/*" onChange={handleFileChange}
                          style={{ display: 'none' }} />
                      </label>, or <strong>Ctrl+V</strong> to paste
                    </span>
                    <span style={styles.dropSub}>Output will be cropped to a square (400×400)</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Editor ── */}
      {showEditor && rawImageFile && (
        <ImageEditor
          file={rawImageFile}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  // Drop zone
  dropZone: {
    border: '2px dashed #ccc',
    borderRadius: 8,
    padding: '1rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: '#fafafa',
    minHeight: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dropPrompt: { display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' },
  dropIcon: { fontSize: 28 },
  dropText: { fontSize: 13, color: '#555' },
  dropSub: { fontSize: 11, color: '#999' },
  browseLink: { color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' },
  previewWrapper: { display: 'flex', alignItems: 'center', gap: 12 },
  thumbPreview: { width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '2px solid #4f46e5' },
  previewActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  btnReEdit: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 },
  btnRemove: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 },

  // Editor overlay
  editorOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  },
  editorBox: {
    background: '#fff', borderRadius: 12, padding: '1.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxWidth: 380, width: '100%',
  },
  editorTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  editorHint: { margin: 0, fontSize: 12, color: '#888' },
  previewCanvas: {
    width: 300, height: 300, borderRadius: 8,
    border: '2px solid #4f46e5', display: 'block',
    userSelect: 'none',
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 10, width: '100%' },
  sliderLabel: { fontSize: 13, fontWeight: 600, minWidth: 35 },
  slider: { flex: 1, accentColor: '#4f46e5' },
  sliderVal: { fontSize: 12, color: '#555', minWidth: 50, textAlign: 'right' },
  editorMeta: { fontSize: 11, color: '#aaa', textAlign: 'center' },
  editorLoading: { padding: '2rem', color: '#888' },
  editorActions: { display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' },
  btnCancel: { padding: '8px 18px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: 14 },
  btnConfirm: { padding: '8px 18px', borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};

export default Words;
