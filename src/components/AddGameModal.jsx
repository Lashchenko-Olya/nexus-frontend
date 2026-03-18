import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import "./AddGameModal.css";

const AVAILABLE_GENRES = [
  "Action", "RPG", "Adventure", "Shooter", "Strategy", "Simulation",
  "Sports", "Racing", "Puzzle", "Horror", "Survival", "Platformer",
  "Fighting", "Sandbox", "Stealth", "MMO", "MOBA", "Battle Royale",
  "Rhythm", "Visual Novel", "Roguelike", "Metroidvania", "Open World",
  "Cyberpunk", "Fantasy", "Sci-Fi", "Co-op", "Story Rich", "Indie",
  "Multiplayer", "Single-player", "Space", "Pixel Art", "Post-Apocalyptic", "Zombie",
  "Historical", "Superhero", "Gothic", "Mythology", "War"
];

function AddGameModal({ onClose, onGameAdded, gameToEdit }) {
  const [formData, setFormData] = useState({
    title: '', year: '', developer: '', shortDesc: '', longDesc: '',
    sysReq: '', tags: '', steamLink: '', epicLink: '', psLink: '', xboxLink: ''
  });

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [imgFile, setImgFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 Додаємо стани для відстеження перетягування
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [isDraggingBg, setIsDraggingBg] = useState(false);

  useEffect(() => {
    if (gameToEdit) {
      setFormData({
        title: gameToEdit.title || '',
        year: gameToEdit.year || '',
        developer: gameToEdit.developer || '',
        shortDesc: gameToEdit.shortDesc || '',
        longDesc: gameToEdit.longDesc || '',
        sysReq: gameToEdit.sysReq || '',
        tags: gameToEdit.tags || '',
        steamLink: gameToEdit.steamLink || '',
        epicLink: gameToEdit.epicLink || '',
        psLink: gameToEdit.psLink || '',
        xboxLink: gameToEdit.xboxLink || ''
      });
      if (gameToEdit.genre) {
        setSelectedGenres(gameToEdit.genre.split(',').map(g => g.trim()));
      }
    }
  }, [gameToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  // 🔥 Універсальні функції для Drag & Drop
  const handleDragOver = (e, setDragging) => {
    e.preventDefault(); // Обов'язково, щоб браузер не відкрив картинку в новій вкладці
    setDragging(true);
  };

  const handleDragLeave = (e, setDragging) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e, setDragging, setFile) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]); // Беремо перший перетягнутий файл
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
    submitData.append('genre', selectedGenres.join(', '));

    if (imgFile) submitData.append('img', imgFile);
    if (bgFile) submitData.append('background', bgFile);

    const url = gameToEdit
      ? `https://nexus-api-server-9g9o.onrender.com/api/games/${gameToEdit._id}`
      : 'https://nexus-api-server-9g9o.onrender.com/api/games/add';
    const method = gameToEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, body: submitData });
      if (response.ok) {
        onGameAdded();
      } else {
        alert("Помилка при збереженні гри");
      }
    } catch (error) {
      console.error("Помилка:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h2>{gameToEdit ? 'Редагувати гру' : 'Додати нову гру'}</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="add-game-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Назва гри *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Рік випуску *</label>
              <input type="text" name="year" required value={formData.year} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Студія *</label>
            <input type="text" name="developer" required value={formData.developer} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Жанри (можна обрати декілька) *</label>
            <div className="genre-pills-container">
              {AVAILABLE_GENRES.map(genre => (
                <div
                  key={genre}
                  className={`genre-pill ${selectedGenres.includes(genre) ? 'active' : ''}`}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Системні вимоги</label>
            <textarea name="sysReq" rows="3" value={formData.sysReq} onChange={handleChange}></textarea>
          </div>

          <div className="form-group">
            <label>Детальний опис</label>
            <textarea name="longDesc" rows="4" value={formData.longDesc} onChange={handleChange}></textarea>
          </div>

          <div className="form-group">
            <label>Steam Link</label>
            <input type="text" name="steamLink" value={formData.steamLink} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Epic Games Link</label>
            <input type="text" name="epicLink" value={formData.epicLink} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>PlayStation Store Link</label>
            <input type="text" name="psLink" value={formData.psLink} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Xbox Store Link</label>
            <input type="text" name="xboxLink" value={formData.xboxLink} onChange={handleChange} />
          </div>

          <div className="media-upload-section">
            <div className="media-grid">

              {/* 🔥 Зона для Постера (з Drag & Drop) */}
              <div className="upload-block">
                <label className="upload-label">Постер (Вертикальний) *</label>
                <div
                  className={`dropzone-box ${imgFile ? 'file-selected' : ''} ${isDraggingImg ? 'dragging' : ''}`}
                  onClick={() => document.getElementById('poster-input').click()}
                  onDragOver={(e) => handleDragOver(e, setIsDraggingImg)}
                  onDragLeave={(e) => handleDragLeave(e, setIsDraggingImg)}
                  onDrop={(e) => handleDrop(e, setIsDraggingImg, setImgFile)}
                >
                  <input type="file" id="poster-input" accept="image/*" style={{ display: 'none' }} onChange={(e) => setImgFile(e.target.files[0])} />
                  <Upload size={24} color={imgFile ? "#FF003C" : (isDraggingImg ? "#8b5cf6" : "#71717a")} />
                  <span className="placeholder-text">{imgFile ? imgFile.name : 'Перетягніть або виберіть постер'}</span>
                </div>
              </div>

              {/* 🔥 Зона для Фону (з Drag & Drop) */}
              <div className="upload-block">
                <label className="upload-label">Фон (Горизонтальний) *</label>
                <div
                  className={`dropzone-box ${bgFile ? 'file-selected' : ''} ${isDraggingBg ? 'dragging' : ''}`}
                  onClick={() => document.getElementById('background-input').click()}
                  onDragOver={(e) => handleDragOver(e, setIsDraggingBg)}
                  onDragLeave={(e) => handleDragLeave(e, setIsDraggingBg)}
                  onDrop={(e) => handleDrop(e, setIsDraggingBg, setBgFile)}
                >
                  <input type="file" id="background-input" accept="image/*" style={{ display: 'none' }} onChange={(e) => setBgFile(e.target.files[0])} />
                  <Upload size={24} color={bgFile ? "#FF003C" : (isDraggingBg ? "#8b5cf6" : "#71717a")} />
                  <span className="placeholder-text">{bgFile ? bgFile.name : 'Перетягніть або виберіть фон'}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Скасувати</button>
            <button type="submit" className="add-game-btn neon-btn" disabled={isLoading || selectedGenres.length === 0}>
              {isLoading ? 'Збереження...' : (gameToEdit ? 'Зберегти зміни' : 'Додати гру')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddGameModal;