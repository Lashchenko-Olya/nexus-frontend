import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Users, MessageSquare, Settings, LogOut, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import AddGameModal from '../components/AddGameModal';
import './AdminGames.css';

function AdminGames() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [games, setGames] = useState([]);

  // 🔥 НОВИЙ СТЕЙТ ДЛЯ ПОШУКУ
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGames = async () => {
    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/games/all');
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error("Помилка завантаження ігор:", error);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю гру назавжди?")) {
      return;
    }

    try {
      const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/games/${gameId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGames();
      } else {
        alert("Помилка при видаленні гри.");
      }
    } catch (error) {
      console.error("Помилка:", error);
      alert("Немає зв'язку з сервером.");
    }
  };

  useEffect(() => {
    // Перевірка на адміна
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/error-404');
      return;
    }
    fetchGames();
  }, [navigate]);

  // 🔥 ЛОГІКА ПОШУКУ (Фільтруємо ігри за назвою)
  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container">
      {/* САЙДБАР */}
      <aside className="admin-sidebar">
        <div className="admin-logo-section">
          <div className="auth-logo-text">Ne<span>x</span>us</div>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="nav-item" onClick={() => navigate('/admin-dashboard')}><LayoutDashboard size={20} /><span>Дашборд</span></div>
          <div className="nav-item active"><Gamepad2 size={20} /><span>Ігри</span></div>
          <div className="nav-item" onClick={() => navigate('/admin-users')}><Users size={20} /><span>Користувачі</span></div>
          <div className="nav-item" onClick={() => navigate('/admin-reviews')}><MessageSquare size={20} /><span>Рецензії</span></div>
          <div className="nav-item" onClick={() => navigate('/admin-settings')} ><Settings size={20} /><span>Налаштування</span></div>

          <div
            className="nav-item"
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
          >
            <LogOut size={20} /><span>Вихід</span>
          </div>
        </nav>
      </aside>

      <main className="admin-main-content" style={{ paddingTop: '30px' }}>

        {/* 🔥 ВЕРХНЯ ПАНЕЛЬ З РОБОЧИМ ПОШУКОМ */}
        <header className="admin-top-bar" style={{ marginBottom: '20px' }}>
          <div className="header-search-placeholder">
            <Search size={18} color="#71717a" />
            <input
              type="text"
              placeholder="Пошук гри за назвою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <section className="games-library-panel">
          <div className="library-header">
            {/* Динамічний лічильник показує кількість знайдених ігор */}
            <h3>Бібліотека ігор ({filteredGames.length})</h3>
            <button className="add-game-btn neon-btn" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /><span>Додати гру</span>
            </button>
          </div>

          <table className="games-table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Жанр</th>
                <th>Рік</th>
                <th>Рейтинг</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {/* 🔥 МАПИМО ВІДФІЛЬТРОВАНІ ІГРИ, А НЕ ВСІ */}
              {filteredGames.length > 0 ? (
                filteredGames.map(game => {
                  const imageUrl = game.img?.startsWith('/uploads') ? `https://nexus-api-server-9g9o.onrender.com${game.img}` : (game.img || '/poster.jpg');

                  return (
                    <tr key={game._id}>
                      <td className="game-info-cell">
                        <div className="game-img-placeholder" style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        <span>{game.title}</span>
                      </td>
                      <td className="genre-cell">{game.genre}</td>
                      <td>{game.year}</td>
                      <td>{game.rating > 0 ? Number(game.rating).toFixed(1) : '0.0'}</td>
                      <td className="actions-cell">
                        <button className="edit-btn" onClick={() => { setEditingGame(game); setIsModalOpen(true); }}>
                          <Pencil size={16} />
                        </button>
                        <button
                          className="delete-btn neon-icon"
                          onClick={() => handleDeleteGame(game._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>
                    За запитом "{searchQuery}" ігор не знайдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {isModalOpen && (
        <AddGameModal
          gameToEdit={editingGame}
          onClose={() => { setIsModalOpen(false); setEditingGame(null); }}
          onGameAdded={() => { fetchGames(); setIsModalOpen(false); setEditingGame(null); }}
        />
      )}

    </div>
  );
}

export default AdminGames;