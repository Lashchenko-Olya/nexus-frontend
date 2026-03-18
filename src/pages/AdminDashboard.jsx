import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Gamepad2, Users,
  MessageSquare, Settings, LogOut
} from 'lucide-react';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  // 🔥 СТЕЙТИ ДЛЯ ДАНИХ З БД
  const [stats, setStats] = useState({ games: 0, users: 0, comments: 0 });
  const [recentGames, setRecentGames] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Перевірка на адміна
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/error-404');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const gamesRes = await fetch('https://nexus-api-server-9g9o.onrender.com/api/games/all');
        const gamesData = await gamesRes.json();

        const usersRes = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/all');
        const usersData = await usersRes.json();

        const commentsRes = await fetch('https://nexus-api-server-9g9o.onrender.com/api/comments/all-count');
        const commentsData = await commentsRes.json();

        setStats({
          games: gamesData.length,
          users: usersData.length,
          comments: commentsData.count || 0
        });

        // Сортуємо останні додані (беремо 5 останніх)
        setRecentGames(gamesData.reverse().slice(0, 5));
        setRecentUsers(usersData.reverse().slice(0, 5));

      } catch (err) {
        console.error("Помилка завантаження статистики:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading) return <div className="admin-loading">Завантаження панелі...</div>;

  return (
    <div className="admin-dashboard-container">
      {/* --- БОКОВА ПАНЕЛЬ --- */}
      <aside className="admin-sidebar">
        <div className="admin-logo-section">
          <div className="auth-logo-text">Ne<span>x</span>us</div>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          <div className="nav-item active">
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
          <div className="nav-item" onClick={() => navigate('/admin-reviews')}>
            <MessageSquare size={20} />
            <span>Рецензії</span>
          </div>
          <div className="nav-item" onClick={() => navigate('/admin-settings')} >
            <Settings size={20} />
            <span>Налаштування</span>
          </div>

          {/* 🔥 Кнопка виходу на своєму місці, відразу під налаштуваннями */}
          <div
            className="nav-item"
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              window.location.href = '/';
            }}
          >
            <LogOut size={20} />
            <span>Вихід</span>
          </div>
        </nav>
      </aside>

      {/* --- ОСНОВНИЙ КОНТЕНТ --- */}
      {/* Пошук прибрано, додано paddingTop щоб контент не прилипав до стелі */}
      <main className="admin-main-content" style={{ paddingTop: '0' }}>

        <section className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-info">
              <p>Всього ігор</p>
              <h3>{stats.games}</h3>
            </div>
            <Gamepad2 size={32} className="stat-icon-red" />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <p>Користувачів</p>
              <h3>{stats.users}</h3>
            </div>
            <Users size={32} className="stat-icon-red" />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <p>Всього відгуків</p>
              <h3 className="stat-positive">{stats.comments}</h3>
            </div>
            <MessageSquare size={32} className="stat-icon-red" />
          </div>
        </section>

        <div className="dashboard-lists-grid">
          {/* Нещодавно додані ігри */}
          <div className="dashboard-list-panel">
            <h4>Нещодавно додані ігри</h4>
            <div className="list-items">
              {recentGames.map(game => (
                <GameItem key={game._id} title={game.title} img={game.img} />
              ))}
            </div>
          </div>

          {/* Нові користувачі */}
          <div className="dashboard-list-panel">
            <h4>Нові користувачі</h4>
            <div className="list-items">
              {recentUsers.map(user => (
                <UserItem key={user._id} name={user.nickname} avatar={user.avatar} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div >
  );
}

// Компоненти з підтримкою реальних картинок
const GameItem = ({ title, img }) => {
  const imageUrl = img?.startsWith('http') || img?.startsWith('data:')
    ? img
    : `https://nexus-api-server-9g9o.onrender.com${img}`;

  return (
    <div className="list-entry">
      <div className="entry-img-placeholder" style={{ backgroundImage: `url(${imageUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
      <div className="entry-details">
        <p className="entry-name">{title}</p>
        <p className="entry-time">щойно додано</p>
      </div>
    </div>
  );
};

// 🔥 Оновлений UserItem з правильною перевіркою аватарки
const UserItem = ({ name, avatar }) => {
  const avatarUrl = avatar?.startsWith('http') || avatar?.startsWith('data:') || avatar === '/avatar.jpg'
    ? avatar
    : `https://nexus-api-server-9g9o.onrender.com${avatar || '/avatar.jpg'}`;

  return (
    <div className="list-entry">
      <div className="entry-avatar-placeholder" style={{ backgroundImage: `url(${avatarUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}></div>
      <div className="entry-details">
        <p className="entry-name">{name}</p>
        <p className="entry-time">новий гравець</p>
      </div>
    </div>
  );
};

export default AdminDashboard;