import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Gamepad2, Users,
  MessageSquare, Settings, LogOut, Trash2, Clock, CheckCircle, AlertCircle, ChevronDown, AlertTriangle
} from 'lucide-react';
import './AdminReviews.css';

const StatusDropdown = ({ currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['Опубліковано', 'На перевірці', 'Спам'];

  const statusColors = {
    'Опубліковано': '#10b981',
    'На перевірці': '#eab308',
    'Спам': '#ef4444'
  };

  const currentColor = statusColors[currentStatus] || '#71717a';

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = () => setIsOpen(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className="custom-status-dropdown"
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <div className="dropdown-selected" style={{ color: currentColor, borderColor: currentColor }}>
        {currentStatus}
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>

      {isOpen && (
        <div className="dropdown-options">
          {statuses.map(status => (
            <div
              key={status}
              className="dropdown-option"
              style={{ color: statusColors[status] }}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(status);
                setIsOpen(false);
              }}
            >
              {status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function AdminReviews() {
  const navigate = useNavigate();

  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Всі');
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/error-404');
      return;
    }

    const fetchReviews = async () => {
      try {
        const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/comments/all-admin');
        const data = await response.json();

        if (Array.isArray(data)) {
          // 🔥 СПРАВЖНЄ СОРТУВАННЯ ЗА ЧАСОМ СТВОРЕННЯ
          const sortedComments = data.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : new Date(parseInt(a._id.substring(0, 8), 16) * 1000).getTime();
            const dateB = b.date ? new Date(b.date).getTime() : new Date(parseInt(b._id.substring(0, 8), 16) * 1000).getTime();
            return dateB - dateA;
          });

          setReviewsList(sortedComments.slice(0, 50));
        } else {
          setReviewsList([]);
        }
      } catch (err) {
        console.error("Помилка завантаження рецензій:", err);
        setReviewsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [navigate]);

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/comments/${reviewId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setReviewsList(prev => prev.map(review =>
          review._id === reviewId ? { ...review, status: newStatus } : review
        ));
      }
    } catch (err) {
      console.error("Помилка:", err);
    }
  };

  const handleDeleteClick = (reviewId) => {
    setReviewToDelete(reviewId);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/comments/${reviewToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setReviewsList(prev => prev.filter(review => review._id !== reviewToDelete));
        setReviewToDelete(null);
      } else {
        alert("Помилка видалення");
      }
    } catch (err) {
      console.error("Помилка:", err);
    }
  };

  const filteredReviews = reviewsList.filter(review => {
    if (activeTab === 'Всі') return true;
    const status = review.status || 'Опубліковано';
    return status === activeTab;
  });

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar">
        <div className="admin-logo-section">
          <div className="auth-logo-text">Ne<span>x</span>us</div>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="nav-item" onClick={() => navigate('/admin-dashboard')}>
            <LayoutDashboard size={20} />
            <span>Дашборд</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-games')}>
            <Gamepad2 size={20} />
            <span>Ігри</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-users')}>
            <Users size={20} />
            <span>Користувачі</span>
          </div>
          <div className="nav-item active">
            <MessageSquare size={20} />
            <span>Рецензії</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-settings')} >
            <Settings size={20} />
            <span>Налаштування</span>
          </div>

          <div
            className="nav-item"
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              localStorage.removeItem('nexusSavedLogin');
              window.location.href = '/';
            }}
          >
            <LogOut size={20} />
            <span>Вихід</span>
          </div>
        </nav>
      </aside>

      <main className="admin-main-content">
        <h2 className="admin-page-title">Модерація рецензій</h2>

        <div className="reviews-filter-tabs">
          <button className={`filter-tab ${activeTab === 'Всі' ? 'active' : ''}`} onClick={() => setActiveTab('Всі')}>Всі</button>
          <button className={`filter-tab border-yellow ${activeTab === 'На перевірці' ? 'active' : ''}`} onClick={() => setActiveTab('На перевірці')}><Clock size={16} /> На перевірці</button>
          <button className={`filter-tab border-green ${activeTab === 'Опубліковано' ? 'active' : ''}`} onClick={() => setActiveTab('Опубліковано')}><CheckCircle size={16} /> Опубліковані</button>
          <button className={`filter-tab border-red ${activeTab === 'Спам' ? 'active' : ''}`} onClick={() => setActiveTab('Спам')}><AlertCircle size={16} /> Спам/Скарги</button>
        </div>

        <section className="reviews-list-panel">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>Завантаження відгуків...</div>
          ) : (
            <table className="reviews-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#FF003C', borderBottom: '1px solid rgba(255,0,60,0.2)' }}>
                  <th style={{ padding: '15px' }}>Автор</th>
                  <th style={{ padding: '15px' }}>Гра</th>
                  <th style={{ padding: '15px' }}>Текст</th>
                  <th style={{ padding: '15px' }}>Дата</th>
                  <th style={{ padding: '15px' }}>Статус</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(review => {
                    const status = review.status || 'Опубліковано';
                    const authorName = review.nickname || review.userId?.nickname || 'Гість';
                    const gameTitle = review.gameId?.title || 'Гра';
                    const rawDate = review.date || review.createdAt;

                    // 🔥 ЖОРСТКА ЗАЧИСТКА: відрізаємо старі локальні адреси
                    let rawAvatar = review.userId?.avatar || review.avatar || '/avatar.jpg';

                    if (rawAvatar.includes('127.0.0.1') || rawAvatar.includes('localhost')) {
                      const splitUrl = rawAvatar.split('/uploads/');
                      if (splitUrl.length > 1) {
                        rawAvatar = '/uploads/' + splitUrl[1];
                      }
                    } else if (rawAvatar.startsWith('http://uploads')) {
                      rawAvatar = rawAvatar.replace('http://uploads', '/uploads');
                    }

                    // 🔥 Розумна перевірка для Render
                    const avatarUrl = rawAvatar?.startsWith('http') || rawAvatar?.startsWith('data:') || rawAvatar === '/avatar.jpg'
                      ? rawAvatar
                      : `https://nexus-api-server-9g9o.onrender.com${rawAvatar}`;

                    const dateString = rawDate ? new Date(rawDate).toLocaleDateString('uk-UA') : 'Невідомо';

                    return (
                      <tr key={review._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="user-info-cell" style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div
                              className="user-avatar-placeholder"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            ></div>
                            <span>{authorName}</span>
                          </div>
                        </td>
                        <td className="game-name-cell" style={{ padding: '15px', color: '#a1a1aa' }}>
                          {gameTitle}
                        </td>
                        <td className="review-text-cell" style={{ padding: '15px', maxWidth: '300px' }}>
                          <p className="review-preview-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                            {review.text || review.comment}
                          </p>
                        </td>
                        <td style={{ padding: '15px', color: '#a1a1aa' }}>
                          {dateString}
                        </td>

                        <td style={{ padding: '15px' }}>
                          <StatusDropdown
                            currentStatus={status}
                            onStatusChange={(newStatus) => handleStatusChange(review._id, newStatus)}
                          />
                        </td>

                        <td className="actions-cell" style={{ padding: '15px', textAlign: 'center' }}>
                          <button
                            className="delete-btn neon-icon"
                            onClick={() => handleDeleteClick(review._id)}
                            style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', transition: '0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#FF003C'}
                            onMouseOut={(e) => e.currentTarget.style.color = '#71717a'}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>Відгуків немає</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {reviewToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3>Видалення відгуку</h3>
            <p>Ви впевнені, що хочете видалити цей відгук? Цю дію неможливо буде скасувати.</p>

            <div className="delete-modal-actions">
              <button className="delete-modal-btn btn-cancel" onClick={() => setReviewToDelete(null)}>
                Скасувати
              </button>
              <button className="delete-modal-btn btn-confirm-delete" onClick={confirmDelete}>
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminReviews;