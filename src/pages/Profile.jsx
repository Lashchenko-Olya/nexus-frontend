import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Bookmark, Settings,
  LogOut, Gamepad2, Star, Calendar,
  User, EyeOff, Camera, Ghost, Activity,
  AlertCircle, Heart, Play, Check
} from 'lucide-react';
import { FaPlaystation, FaXbox, FaSteam } from 'react-icons/fa';
import { SiEpicgames } from 'react-icons/si';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('nexus_activeTab') || 'stats';
  });

  const [activeList, setActiveList] = useState(() => {
    return localStorage.getItem('nexus_activeList') || 'played';
  });

  useEffect(() => {
    localStorage.setItem('nexus_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('nexus_activeList', activeList);
  }, [activeList]);

  const [user, setUser] = useState(null);
  const [editPersonal, setEditPersonal] = useState(false);
  const [editSecurity, setEditSecurity] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [securityInfo, setSecurityInfo] = useState({ newPassword: '' });
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');

  // 🔥 СТЕЙТИ ДЛЯ ПРИХОВАНИХ ІГОР
  const [dislikedGamesDetails, setDislikedGamesDetails] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);

  const [activePlatforms, setActivePlatforms] = useState({ epicGames: true, ps: true, xbox: true, steam: true });

  const [personalInfo, setPersonalInfo] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    gender: '',
    country: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setPersonalInfo({
        nickname: parsedUser.nickname || '',
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        gender: parsedUser.gender || '',
        country: parsedUser.country || ''
      });
      setAvatarPreview(parsedUser.avatar || '/avatar.jpg');
      setBannerPreview(parsedUser.banner || '/banner.jpg');

      if (parsedUser.platforms) {
        setActivePlatforms(parsedUser.platforms);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInfoChange = (e) => {
    setErrorMessage('');
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityError('');
    setSecuritySuccess('');
    setSecurityInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBannerChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBannerFile(e.target.files[0]);
      setBannerPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const cancelPersonalEdit = () => {
    setEditPersonal(false);
    setErrorMessage('');
    setPersonalInfo({
      nickname: user.nickname || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      gender: user.gender || '',
      country: user.country || ''
    });
    setAvatarPreview(user.avatar || '/avatar.jpg');
    setBannerPreview(user.banner || '/banner.jpg');
    setAvatarFile(null);
    setBannerFile(null);
  };

  const cancelSecurityEdit = () => {
    setEditSecurity(false);
    setSecurityError('');
    setSecuritySuccess('');
    setSecurityInfo({ newPassword: '' });
  };

  const saveProfile = async () => {
    if (!editPersonal) {
      setEditPersonal(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('oldNickname', user.nickname);
      formData.append('newNickname', personalInfo.nickname);
      formData.append('firstName', personalInfo.firstName);
      formData.append('lastName', personalInfo.lastName);
      formData.append('gender', personalInfo.gender);
      formData.append('country', personalInfo.country);

      if (avatarFile) formData.append('avatar', avatarFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/update-images', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        setPersonalInfo({
          nickname: data.user.nickname || '',
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          gender: data.user.gender || '',
          country: data.user.country || ''
        });

        setErrorMessage('');
        setEditPersonal(false);
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Помилка збереження:", error);
      setErrorMessage("Не вдалося підключитися до сервера!");
    }
  };

  const saveSecurity = async () => {
    if (!editSecurity) {
      setEditSecurity(true);
      return;
    }

    if (!securityInfo.newPassword) {
      setSecurityError("Введіть новий пароль!");
      return;
    }

    if (securityInfo.newPassword.length < 6) {
      setSecurityError("Новий пароль має бути не менше 6 символів!");
      return;
    }

    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: user.nickname,
          newPassword: securityInfo.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSecuritySuccess(data.message);
        setSecurityInfo({ newPassword: '' });
        setEditSecurity(false);
        setTimeout(() => setSecuritySuccess(''), 4000);
      } else {
        setSecurityError(data.message);
      }
    } catch (error) {
      setSecurityError("Не вдалося підключитися до сервера!");
    }
  };

  // 🔥 ЛОГІКА ДЛЯ ЧОРНОГО СПИСКУ (ВИТЯГНУТО НА ПРАВИЛЬНИЙ РІВЕНЬ) 🔥
  const fetchDislikedGames = async () => {
    setLoadingBlacklist(true);
    try {
      const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/users/${user.nickname}/disliked-details`);
      if (response.ok) {
        const data = await response.json();
        setDislikedGamesDetails(data);
      }
    } catch (error) {
      console.error("Помилка завантаження чорного списку:", error);
    } finally {
      setLoadingBlacklist(false);
    }
  };

  useEffect(() => {
    if (user?.nickname) fetchDislikedGames();
  }, [user?.nickname]);

  const handleRestoreGame = async (gameId) => {
    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/undislike-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: user.nickname, gameId })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setDislikedGamesDetails(prev => prev.filter(g => g._id !== gameId));
      }
    } catch (error) {
      console.error("Не вдалося відновити гру:", error);
    }
  };

  const togglePlatform = async (p) => {
    const newPlatforms = { ...activePlatforms, [p]: !activePlatforms[p] };
    setActivePlatforms(newPlatforms);

    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/update-platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: user.nickname,
          platforms: newPlatforms
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (error) {
      console.error("Помилка збереження платформи:", error);
    }
  };

  const handleChangeGameStatus = async (game, newStatus) => {
    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/add-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: user.nickname,
          gameId: game.gameId || game._id || game.id,
          title: game.title,
          year: game.year,
          genre: game.genre,
          img: game.img,
          status: game.status === newStatus ? 'remove' : newStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (error) {
      console.error("Помилка зміни категорії гри:", error);
    }
  };

  const gamesList = user?.games || [];

  const statsData = useMemo(() => {
    const total = gamesList.length;
    if (total === 0) return { favorite: 'Немає', total: 0, avgRating: '0' };

    const genreCounts = gamesList.reduce((acc, game) => {
      if (game.genre) {
        const individualGenres = game.genre.split(',').map(g => g.trim());
        individualGenres.forEach(genre => {
          if (genre) {
            acc[genre] = (acc[genre] || 0) + 1;
          }
        });
      }
      return acc;
    }, {});

    let favorite = 'Немає';
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        favorite = genre;
        maxCount = count;
      }
    }

    const ratedGames = gamesList.filter(g => g.rating > 0);
    const avgRating = ratedGames.length > 0
      ? (ratedGames.reduce((acc, g) => acc + g.rating, 0) / ratedGames.length).toFixed(1)
      : '0';

    return { favorite, total, avgRating };
  }, [gamesList]);

  const currentGames = useMemo(() => gamesList.filter(g => g.status === activeList), [activeList, gamesList]);

  if (!user) return null;

  return (
    <div className="nx-profile-main">
      <div className="nx-hero-image-banner" style={{ backgroundImage: `url(${bannerPreview?.startsWith('http') || bannerPreview?.startsWith('/') && !bannerPreview?.startsWith('/uploads') ? bannerPreview : 'https://nexus-api-server-9g9o.onrender.com' + bannerPreview})` }}></div>
      <div className="nx-header-wrapper"><Header /></div>
      <div className="nx-container">

        <aside className="nx-sticky-sidebar">
          <div className="nx-sidebar-card">
            <div className="nx-user-header">
              <div className="nx-avatar-wrapper" style={{ position: 'relative' }}>
                <img src={avatarPreview?.startsWith('http') || avatarPreview?.startsWith('/') && !avatarPreview?.startsWith('/uploads') ? avatarPreview : `https://nexus-api-server-9g9o.onrender.com${avatarPreview}`} alt={user.nickname} />
                <label className={`nx-av-overlay ${editPersonal ? 'active' : ''}`}>
                  <Camera size={20} />
                  <input type="file" hidden accept="image/*" disabled={!editPersonal} onChange={handleAvatarChange} />
                </label>
              </div>
              <h2 className="nx-user-name">{user.nickname}</h2>
            </div>

            <div className="nx-mini-stats">
              <div className="nx-m-stat"><span>Граю</span><strong>{gamesList.filter(g => g.status === 'playing').length}</strong></div>
              <div className="nx-m-stat"><span>Зіграні</span><strong>{gamesList.filter(g => g.status === 'played').length}</strong></div>
              <div className="nx-m-stat"><span>Вподобано</span><strong>{gamesList.filter(g => g.status === 'liked').length}</strong></div>
              <div className="nx-m-stat"><span>Бажане</span><strong>{gamesList.filter(g => g.status === 'wishlist').length}</strong></div>
            </div>

            <nav className="nx-nav">
              <button className={`nx-nav-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><PieChart size={18} /> Статистика</button>
              <button className={`nx-nav-btn ${activeTab === 'lists' ? 'active' : ''}`} onClick={() => setActiveTab('lists')}><Bookmark size={18} /> Списки</button>
              <button className={`nx-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={18} /> Налаштування</button>
              <div className="nx-nav-spacer"></div>
              <button onClick={handleLogout} className="nx-nav-btn nx-logout" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}><LogOut size={18} /> Вихід</button>
            </nav>
          </div>
        </aside>

        <main className="nx-content">
          {activeTab === 'stats' && (
            <div className="nx-tab-view">
              <div className="nx-card">
                <h3 className="nx-card-title">Статистика</h3>
                <div className="nx-stats-4-col">
                  <div className="nx-stat-block">
                    <div className="nx-stat-label-wrap"><Gamepad2 size={16} color="#8b5cf6" /> <span>Улюблений жанр</span></div>
                    <div className="nx-stat-value">{statsData.favorite}</div>
                  </div>
                  <div className="nx-stat-block">
                    <div className="nx-stat-label-wrap"><Star size={16} color="#eab308" /> <span>Всього ігор</span></div>
                    <div className="nx-stat-value">{statsData.total}</div>
                  </div>
                  <div className="nx-stat-block">
                    <div className="nx-stat-label-wrap"><Activity size={16} color="#10b981" /> <span>Середня оцінка</span></div>
                    <div className="nx-stat-value">{statsData.avgRating}</div>
                  </div>
                  <div className="nx-stat-block">
                    <div className="nx-stat-label-wrap"><Calendar size={16} color="#8b5cf6" /> <span>На сайті з</span></div>
                    <div className="nx-stat-value">2026</div>
                  </div>
                </div>
              </div>

              <div className="nx-card nx-mt-24">
                <h3 className="nx-card-title">Мої платформи</h3>
                <div className="nx-platforms-row">
                  <div className={`nx-plat-item ${activePlatforms.epicGames ? 'active' : ''}`} onClick={() => togglePlatform('epicGames')}>
                    <SiEpicgames size={65} color={activePlatforms.epicGames ? "#8b5cf6" : "#71717a"} />
                    <span>Epic Games</span>
                  </div>
                  <div className={`nx-plat-item ${activePlatforms.ps ? 'active' : ''}`} onClick={() => togglePlatform('ps')}><FaPlaystation size={65} color={activePlatforms.ps ? "#8b5cf6" : "#71717a"} /><span>Play Station</span></div>
                  <div className={`nx-plat-item ${activePlatforms.xbox ? 'active' : ''}`} onClick={() => togglePlatform('xbox')}><FaXbox size={65} color={activePlatforms.xbox ? "#8b5cf6" : "#71717a"} /><span>Xbox</span></div>
                  <div className={`nx-plat-item ${activePlatforms.steam ? 'active' : ''}`} onClick={() => togglePlatform('steam')}><FaSteam size={65} color={activePlatforms.steam ? "#8b5cf6" : "#71717a"} /><span>Steam</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lists' && (
            <div className="nx-lists-layout">
              <div className="nx-lists-nav-sticky">
                <button className={`list-nav-btn ${activeList === 'playing' ? 'active-purple' : ''}`} onClick={() => setActiveList('playing')}>Граю ({gamesList.filter(g => g.status === 'playing').length})</button>
                <button className={`list-nav-btn ${activeList === 'played' ? 'active-purple' : ''}`} onClick={() => setActiveList('played')}>Зіграні ({gamesList.filter(g => g.status === 'played').length})</button>
                <button className={`list-nav-btn ${activeList === 'wishlist' ? 'active-purple' : ''}`} onClick={() => setActiveList('wishlist')}>Бажане ({gamesList.filter(g => g.status === 'wishlist').length})</button>
                <button className={`list-nav-btn ${activeList === 'liked' ? 'active-purple' : ''}`} onClick={() => setActiveList('liked')}>Улюблені ({gamesList.filter(g => g.status === 'liked').length})</button>
              </div>

              <div className="nx-games-grid">
                {currentGames.length > 0 ? currentGames.map((game, index) => (
                  <div key={`${game.gameId}-${index}`} className="nx-game-card">
                    <div
                      onClick={() => navigate(`/game/${game.gameId || game._id || game.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="nx-game-img" style={{ position: 'relative', overflow: 'hidden' }}>
                        <img src={game.img?.startsWith('http') ? game.img : `https://nexus-api-server-9g9o.onrender.com${game.img}`} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div className="nx-game-info">
                        <p className="nx-g-title">{game.title}</p>
                        <p className="nx-g-meta">{game.year} • {game.genre}</p>
                      </div>
                    </div>

                    <div className="nx-card-actions-bar">
                      <button className={`nx-action-btn ${game.status === 'liked' ? 'active-btn' : ''}`} onClick={() => handleChangeGameStatus(game, 'liked')}><Heart size={18} /></button>
                      <button className={`nx-action-btn ${game.status === 'playing' ? 'active-btn' : ''}`} onClick={() => handleChangeGameStatus(game, 'playing')}><Play size={18} /></button>
                      <button className={`nx-action-btn ${game.status === 'played' ? 'active-btn' : ''}`} onClick={() => handleChangeGameStatus(game, 'played')}><Check size={18} /></button>
                      <button className={`nx-action-btn ${game.status === 'wishlist' ? 'active-btn' : ''}`} onClick={() => handleChangeGameStatus(game, 'wishlist')}><Bookmark size={18} /></button>
                    </div>
                  </div>
                )) : <div className="nx-empty"><Ghost size={40} color="#3f3f46" /><p>Тут поки порожньо</p></div>}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="nx-tab-view">
              {/* --- ОСОБИСТІ ДАНІ --- */}
              <div className="nx-card">
                <div className="nx-s-header">
                  <div className="nx-s-title"><User size={20} /> <span>Особисті дані</span></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {editPersonal && (
                      <button onClick={cancelPersonalEdit} className="nx-cancel-btn">Скасувати</button>
                    )}
                    <button className={`nx-save-btn ${editPersonal ? 'active' : ''}`} onClick={saveProfile}>
                      {editPersonal ? 'Зберегти' : 'Редагувати'}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="nx-error-banner" style={{ marginBottom: '20px' }}>
                    <AlertCircle size={18} /><span>{errorMessage}</span>
                  </div>
                )}

                <div className="nx-s-fields">
                  <div className="nx-f-row">
                    <div className="nx-f-item"><span>Ім'я</span>{editPersonal ? <input name="firstName" className="nx-input" value={personalInfo.firstName} onChange={handleInfoChange} /> : <span className="nx-val">{personalInfo.firstName || "—"}</span>}</div>
                    <div className="nx-f-item"><span>Прізвище</span>{editPersonal ? <input name="lastName" className="nx-input" value={personalInfo.lastName} onChange={handleInfoChange} /> : <span className="nx-val">{personalInfo.lastName || "—"}</span>}</div>
                    <div className="nx-f-item">
                      <span>Нікнейм</span>
                      {editPersonal ? <input name="nickname" className="nx-input" value={personalInfo.nickname} onChange={handleInfoChange} /> : <span className="nx-val nx-bold">{user.nickname}</span>}
                    </div>
                  </div>
                  <div className="nx-f-row nx-mt-24">
                    <div className="nx-f-item"><span>Стать</span>{editPersonal ? <select name="gender" className="nx-input" value={personalInfo.gender} onChange={handleInfoChange}><option value="">Оберіть</option><option value="Чоловіча">Чоловіча</option><option value="Жіноча">Жіноча</option></select> : <span className="nx-val">{personalInfo.gender || "—"}</span>}</div>
                    <div className="nx-f-item"><span>Країна</span>{editPersonal ? <input name="country" className="nx-input" value={personalInfo.country} onChange={handleInfoChange} /> : <span className="nx-val">{personalInfo.country || "—"}</span>}</div>
                    <div className="nx-f-item"><span>Обкладинка</span>{editPersonal ? <label className="nx-banner-upload-btn"><Camera size={16} /> Обрати<input type="file" hidden accept="image/*" onChange={handleBannerChange} /></label> : <span className="nx-val">Встановлена</span>}</div>
                  </div>
                </div>
              </div>

              {/* --- БЕЗПЕКА --- */}
              <div className="nx-card nx-mt-24">
                <div className="nx-s-header">
                  <div className="nx-s-title"><Settings size={20} /> <span>Безпека</span></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {editSecurity && (
                      <button onClick={cancelSecurityEdit} className="nx-cancel-btn">Скасувати</button>
                    )}
                    <button className={`nx-save-btn ${editSecurity ? 'active' : ''}`} onClick={saveSecurity}>
                      {editSecurity ? 'Зберегти' : 'Редагувати'}
                    </button>
                  </div>
                </div>

                {securityError && (
                  <div className="nx-error-banner" style={{ marginBottom: '20px' }}>
                    <AlertCircle size={18} /><span>{securityError}</span>
                  </div>
                )}
                {securitySuccess && (
                  <div className="nx-error-banner" style={{ marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <Activity size={18} /><span>{securitySuccess}</span>
                  </div>
                )}

                <div className="nx-f-row">
                  <div className="nx-f-item">
                    <span>Пошта</span>
                    <span className="nx-val">{user.email}</span>
                  </div>
                  <div className="nx-f-item">
                    <span>Пароль</span>
                    {editSecurity ? (
                      <input name="newPassword" type="password" className="nx-input" placeholder="Введіть новий пароль" value={securityInfo.newPassword} onChange={handleSecurityChange} autoComplete="new-password" />
                    ) : (
                      <span className="nx-val">••••••••</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 🔥 ПРИХОВАНІ ІГРИ (ЧОРНИЙ СПИСОК) 🔥 */}
              <div className="nx-card nx-mt-24 blacklist-section">
                <div className="nx-s-header">
                  <div className="nx-s-title"><EyeOff size={20} /> <span>Приховані ігри</span></div>
                </div>
                <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '20px' }}>
                  Ці ігри більше не з'являються у ваших рекомендаціях та трендах.
                </p>

                {loadingBlacklist ? (
                  <p style={{ color: '#a1a1aa' }}>Завантаження...</p>
                ) : dislikedGamesDetails.length > 0 ? (
                  <div className="blacklist-grid">
                    {dislikedGamesDetails.map(game => (
                      <div key={game._id} className="blacklist-card">
                        <img src={game.img?.startsWith('http') ? game.img : `https://nexus-api-server-9g9o.onrender.com${game.img}`} alt={game.title} className="blacklist-img" />
                        <div className="blacklist-info">
                          <span className="blacklist-name">{game.title}</span>
                          <button className="btn-restore" onClick={() => handleRestoreGame(game._id)}>Повернути</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="blacklist-empty">
                    <p style={{ color: '#71717a' }}>Ваш чорний список порожній. Всі ігри доступні для перегляду!</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;