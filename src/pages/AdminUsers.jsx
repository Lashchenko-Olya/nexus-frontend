import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Gamepad2, Users,
  MessageSquare, Settings, LogOut, Search, Ban, Unlock
} from 'lucide-react';
import './AdminUsers.css';

function AdminUsers() {
  const navigate = useNavigate();

  // Стейти для реальних даних з БД
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Перевірка на адміна
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/error-404');
      return;
    }

    // 2. Завантажуємо реальних юзерів з БД
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/all');
        const data = await response.json();
        setUsersList(data.reverse()); // 🔥 Додали .reverse(), щоб перевернути масив!
      } catch (err) {
        console.error("Помилка завантаження користувачів:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // 🔥 Функція блокування/розблокування
  const handleToggleBlock = async (userId, isBlocked) => {
    try {
      // Відправляємо запит на бекенд
      const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/users/${userId}/toggle-block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Оновлюємо список миттєво без перезавантаження сторінки
        setUsersList(prevUsers =>
          prevUsers.map(u => u._id === userId ? { ...u, isBlocked: !isBlocked } : u)
        );
      } else {
        alert("Помилка при зміні статусу!");
      }
    } catch (err) {
      console.error("Помилка з'єднання:", err);
    }
  };

  // Функція для пошуку
  const filteredUsers = usersList.filter(user =>
    user.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container">
      {/* --- САЙДБАР --- */}
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
          <div className="nav-item active">
            <Users size={20} />
            <span>Користувачі</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-reviews')}>
            <MessageSquare size={20} />
            <span>Рецензії</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-settings')} >
            <Settings size={20} />
            <span>Налаштування</span>
          </div>

          {/* 🔥 ПРАВИЛЬНА КНОПКА ВИХОДУ 🔥 */}
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

      {/* --- ОСНОВНИЙ КОНТЕНТ --- */}
      <main className="admin-main-content">
        <h2 className="admin-page-title">Користувачі</h2>

        <section className="users-list-panel">
          {/* РОБОЧИЙ ПОШУК */}
          <div className="users-search-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#121216', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(255,0,60,0.2)', marginBottom: '20px' }}>
            <Search size={18} color="#71717a" />
            <input
              type="text"
              placeholder="Пошук за нікнеймом..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
            />
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>Завантаження бази...</div>
          ) : (
            <table className="users-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#FF003C', borderBottom: '1px solid rgba(255,0,60,0.2)' }}>
                  <th style={{ padding: '15px' }}>Користувач</th>
                  <th style={{ padding: '15px' }}>Дата реєстрації</th>
                  <th style={{ padding: '15px' }}>Роль</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    // 🔥 РОЗУМНА АВАТАРКА ДЛЯ КОЖНОГО ЮЗЕРА
                    const avatarUrl = user.avatar?.startsWith('http') || user.avatar?.startsWith('data:') || user.avatar === '/avatar.jpg'
                      ? user.avatar
                      : `https://nexus-api-server-9g9o.onrender.com${user.avatar || '/avatar.jpg'}`;

                    return (
                      <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td className="user-info-cell" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
                          <div
                            className="user-avatar-placeholder"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#27272a',
                              backgroundImage: `url(${avatarUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          ></div>
                          <span>{user.nickname}</span>
                        </td>

                        <td style={{ padding: '15px', color: '#a1a1aa' }}>
                          {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                        </td>

                        <td style={{ padding: '15px' }}>
                          {/* 🔥 РОЗУМНИЙ СТАТУС */}
                          <span style={{
                            padding: '5px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            border: `1px solid ${user.isBlocked ? '#ef4444' : (user.role === 'admin' ? '#8b5cf6' : '#10b981')}`,
                            color: user.isBlocked ? '#ef4444' : (user.role === 'admin' ? '#8b5cf6' : '#10b981')
                          }}>
                            {user.isBlocked ? 'Заблокований' : (user.role === 'admin' ? 'Адмін' : 'Активний')}
                          </span>
                        </td>

                        <td className="actions-cell" style={{ padding: '15px', textAlign: 'center' }}>
                          {/* Адмінів блокувати не можна, тому показуємо кнопку тільки для звичайних юзерів */}
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleBlock(user._id, user.isBlocked)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: user.isBlocked ? '#10b981' : '#71717a',
                                cursor: 'pointer',
                                transition: '0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = user.isBlocked ? '#059669' : '#ef4444'}
                              onMouseOut={(e) => e.currentTarget.style.color = user.isBlocked ? '#10b981' : '#71717a'}
                              title={user.isBlocked ? "Розблокувати" : "Заблокувати"}
                            >
                              {user.isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>Користувачів не знайдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminUsers;