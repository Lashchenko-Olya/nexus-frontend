import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Heart, Play, Check, Bookmark, ChevronLeft, ChevronRight, User, ChevronDown, Sparkles, Flame, Target, Star } from 'lucide-react';
import '../App.css';
import './Home.css';
import Footer from '../components/Footer';
import Header from '../components/Header';

// 1. КОМПОНЕНТ КРУЖЕЧКА
const MatchCircle = ({ percent, size = 130 }) => {
  const center = size / 2;
  const strokeWidth = size < 100 ? 3 : 5;
  const radius = (size / 2) - strokeWidth;
  const dashArray = 2 * Math.PI * radius;
  const dashOffset = dashArray - (dashArray * percent) / 100;

  return (
    <div className="match-circle-wrapper" style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="match-svg" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx={center} cy={center} r={radius} stroke="#27272a" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx={center} cy={center} r={radius} stroke="#8b5cf6" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} />
      </svg>
      <div className="match-info-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, margin: 0, padding: 0 }}>
        <span style={{ fontSize: size * 0.12, color: '#a1a1aa', fontWeight: 600, letterSpacing: '0.5px', lineHeight: 1, marginBottom: '2px' }}>MATCH</span>
        <span style={{ fontSize: size * 0.26, color: 'white', fontWeight: 800, lineHeight: 1 }}>{percent}%</span>
      </div>
    </div>
  );
};

const AVAILABLE_GENRES = [
  "Action", "RPG", "Adventure", "Shooter", "Strategy", "Simulation",
  "Sports", "Racing", "Puzzle", "Horror", "Survival", "Platformer",
  "Fighting", "Sandbox", "Stealth", "MMO", "MOBA", "Battle Royale",
  "Rhythm", "Visual Novel", "Roguelike", "Metroidvania", "Open World",
  "Cyberpunk", "Fantasy", "Sci-Fi", "Co-op", "Story Rich", "Indie",
  "Multiplayer", "Single-player", "Space", "Pixel Art", "Post-Apocalyptic", "Zombie",
  "Historical", "Superhero", "Gothic", "Mythology", "War"
];

// 🔥 ІДЕАЛЬНИЙ КАЛЬКУЛЯТОР (Ранги + Пам'ять)
const calculateMatchPercentage = (game, tasteProfile, twinBonuses, currentUser) => {
  // 1. ПАМ'ЯТЬ АЛГОРИТМУ (Якщо ти вже лайкнула чи оцінила САМЕ ЦЮ гру)
  if (currentUser && currentUser.games) {
    const userGame = currentUser.games.find(g => String(g.gameId) === String(game._id));
    if (userGame) {
      if (userGame.rating >= 4 || userGame.status === 'liked') return 99; // Ідеал!
      if (userGame.status === 'played') return 80; // Просто пройдено
      if (userGame.rating > 0 && userGame.rating <= 2) return 5; // Не сподобалась
    }
  }
  // Перевірка на чорний список
  if (currentUser && currentUser.dislikedGames && currentUser.dislikedGames.includes(String(game._id))) {
    return 1;
  }

  // 2. ДЕФОЛТ (Якщо взагалі немає історії смаків)
  if (!tasteProfile || !tasteProfile.genres || Object.keys(tasteProfile.genres).length === 0) return 65;

  // 3. РАНЖУВАННЯ (Перетворюємо сирі бали в місця: Топ-1, Топ-2...)
  const sortedGenres = Object.entries(tasteProfile.genres)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0].toLowerCase().trim()); // toLowerCase рятує від помилок регістру

  const sortedTags = Object.entries(tasteProfile.tags || {})
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0].toLowerCase().trim());

  let score = 25; // Базовий відсоток для будь-якої гри

  // 4. ОЦІНКА ЖАНРІВ
  const gameGenres = Array.isArray(game.genre) ? game.genre : (game.genre ? game.genre.split(',').map(t => t.trim().toLowerCase()) : []);
  gameGenres.forEach(genre => {
    const index = sortedGenres.indexOf(genre);
    if (index !== -1) {
      if (index === 0) score += 40;      // Найулюбленіший жанр (Топ-1)
      else if (index === 1) score += 25; // Топ-2
      else if (index === 2) score += 15; // Топ-3
      else if (index <= 5) score += 10;  // Топ 4-6
      else score += 5;                   // Інші улюблені
    }
  });

  // 5. ОЦІНКА ТЕГІВ
  const gameTags = Array.isArray(game.tags) ? game.tags : (game.tags ? game.tags.split(',').map(t => t.trim().toLowerCase()) : []);
  gameTags.forEach(tag => {
    const index = sortedTags.indexOf(tag);
    if (index !== -1) {
      if (index === 0) score += 15;      // Топ-1 тег
      else if (index <= 3) score += 8;   // Топ 2-4
      else score += 3;                   // Інші
    }
  });

  // 6. МАГІЯ БЛИЗНЮКІВ
  if (twinBonuses && twinBonuses[game._id]) {
    score += twinBonuses[game._id];
  }

  score = Math.round(score);
  if (score < 1) return 1;
  if (score > 99) return 99;
  return score;
};

// 2. ГОЛОВНИЙ КОМПОНЕНТ HOME
function Home() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [trendsGames, setTrendsGames] = useState([]);
  const [recommendedGames, setRecommendedGames] = useState([]);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // 🔥 СТЕЙТ ДЛЯ ТОП-ЖАНРІВ ЮЗЕРА (ДЛЯ MATCH)
  const [userTasteProfile, setUserTasteProfile] = useState({ genres: {}, developers: {}, tags: {} });
  const [twinBonuses, setTwinBonuses] = useState({});

  const [sortBy, setSortBy] = useState('За популярністю');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [genreSearchQuery, setGenreSearchQuery] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    sortBy: 'За popularністю',
    genres: [],
    platforms: []
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const handleDislikeGame = async (gameId, e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/dislike-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: currentUser.nickname, gameId: String(gameId) })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        nextHero();
      }
    } catch (error) { console.error("Помилка:", error); }
  };

  useEffect(() => { setCurrentPage(1); }, [appliedFilters, searchQuery]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      // 🔥 ЗАВАНТАЖУЄМО ПРОФІЛЬ СМАКУ ТА БОНУСИ БЛИЗНЮКІВ
      fetch(`https://nexus-api-server-9g9o.onrender.com/api/games/recommendations/${parsedUser.nickname}`)
        .then(res => res.json())
        .then(data => {
          if (data.tasteProfile) setUserTasteProfile(data.tasteProfile);
          if (data.twinBonuses) setTwinBonuses(data.twinBonuses);
        })
        .catch(err => console.error("Помилка завантаження рекомендацій:", err));
    }

    const fetchHomeGames = async () => {
      try {
        const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/games/home');
        if (response.ok) {
          const data = await response.json();
          setTrendsGames(data.trends);
          setRecommendedGames(data.recommended);
        }
      } catch (error) { console.error("Не вдалося завантажити ігри:", error); }
    };
    fetchHomeGames();
  }, []);

  const heroGames = React.useMemo(() => {
    if (trendsGames.length === 0) return [{ _id: "loading", title: "Завантаження...", year: "...", genre: "...", developer: "...", img: "/poster.jpg", rating: 0 }];
    let pool = [...trendsGames];
    if (currentUser && currentUser.dislikedGames) pool = pool.filter(game => !currentUser.dislikedGames.includes(String(game._id)));
    const sortedForHero = pool.sort((a, b) => ((b.rating || 0) + (b.likes || 0) + (b.views || 0)) - ((a.rating || 0) + (a.likes || 0) + (a.views || 0)));
    return sortedForHero.slice(0, 5);
  }, [trendsGames, currentUser]);

  const activeHeroGame = heroGames[currentHeroIndex] || heroGames[0];
  const nextHero = () => setCurrentHeroIndex((prev) => (prev + 1) % heroGames.length);
  const prevHero = () => setCurrentHeroIndex((prev) => (prev - 1 + heroGames.length) % heroGames.length);

  useEffect(() => {
    if (heroGames.length <= 1 || activeHeroGame._id === "loading") return;
    const interval = setInterval(nextHero, 15000);
    return () => clearInterval(interval);
  }, [heroGames.length, activeHeroGame._id]);

  const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);

  const getGameStatus = (gameId) => {
    if (!currentUser || !currentUser.games) return null;
    const game = currentUser.games.find(g => g.gameId === String(gameId));
    return game ? game.status : null;
  };

  const handleGameAction = async (game, targetStatus, e) => {
    e.preventDefault(); e.stopPropagation();
    if (!currentUser) return;
    const gameId = String(game._id || game.id);
    const currentStatus = getGameStatus(gameId);
    const finalStatus = currentStatus === targetStatus ? 'remove' : targetStatus;
    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/add-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: currentUser.nickname, gameId: gameId, title: game.title || "Невідома гра", year: game.year || "", genre: game.genre || "", img: game.img, status: finalStatus })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
    } catch (error) { console.error("Помилка:", error); }
  };

  const getImageUrl = (url) => url?.startsWith('/uploads') ? `https://nexus-api-server-9g9o.onrender.com${url}` : (url || "/poster.jpg");
  const toggleGenreFilter = (genre) => setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
  const togglePlatformFilter = (platform) => setSelectedPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);

  const applyFilters = () => { setAppliedFilters({ sortBy: sortBy, genres: selectedGenres, platforms: selectedPlatforms }); setActiveDropdown(null); };
  const clearAllFilters = () => { setSelectedGenres([]); setSelectedPlatforms([]); setSortBy('За популярністю'); setAppliedFilters({ sortBy: 'За популярністю', genres: [], platforms: [] }); setSearchParams({}); setActiveDropdown(null); };

  const filteredTrendsGames = React.useMemo(() => {
    let result = [...trendsGames];
    if (currentUser && currentUser.dislikedGames) result = result.filter(game => !currentUser.dislikedGames.includes(String(game._id)));
    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(game => game.title.toLowerCase().includes(lowerCaseQuery));
    }
    if (appliedFilters.genres.length > 0) {
      result = result.filter(game => {
        const gameGenres = (game.genre || game.tags || "").toLowerCase();
        return appliedFilters.genres.some(g => gameGenres.includes(g.toLowerCase()));
      });
    }
    if (appliedFilters.platforms.length > 0) {
      result = result.filter(game => {
        const gameInfo = (game.platform || game.tags || game.genre || "").toLowerCase();
        return appliedFilters.platforms.some(plat => {
          if (plat === 'Steam') return Boolean(game.steamLink) || gameInfo.includes('steam') || gameInfo.includes('pc') || gameInfo.includes('windows');
          if (plat === 'Epic Games') return Boolean(game.epicLink) || gameInfo.includes('epic');
          if (plat === 'PlayStation') return Boolean(game.psLink) || gameInfo.includes('playstation') || gameInfo.includes('ps');
          if (plat === 'Xbox') return Boolean(game.xboxLink) || gameInfo.includes('xbox');
          return false;
        });
      });
    }
    if (appliedFilters.sortBy === 'За оцінкою') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (appliedFilters.sortBy === 'За новинкою') result.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
    else if (appliedFilters.sortBy === 'За популярністю') result.sort((a, b) => ((b.likes || 0) + (b.views || 0)) - ((a.likes || 0) + (a.views || 0)));
    return result;
  }, [trendsGames, appliedFilters, currentUser, searchQuery]);

  const totalPages = Math.ceil(filteredTrendsGames.length / ITEMS_PER_PAGE);
  const paginatedGames = filteredTrendsGames.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, '...', totalPages);
      else if (currentPage >= totalPages - 3) pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  // 🔥 ГЕНЕРАТОР ІНДИВІДУАЛЬНИХ РЕКОМЕНДАЦІЙ 🔥
  const filteredRecommended = React.useMemo(() => {
    // Якщо юзер не залогінений, показуємо дефолтні ігри від сервера (МАКСИМУМ 8)
    if (!currentUser || trendsGames.length === 0) return recommendedGames.slice(0, 8);

    let pool = [...trendsGames]; // Беремо ВСІ доступні ігри

    // 1. Відкидаємо те, що юзер вже грав, лайкав або діслайкав
    const knownGames = [];
    if (currentUser.games) {
      currentUser.games.forEach(g => {
        // 🔥 Жорстко блокуємо потрапляння зіграних і улюблених ігор у рекомендації
        if (['played', 'liked'].includes(g.status)) {
          knownGames.push(String(g.gameId));
        }
      });
    }
    if (currentUser.dislikedGames) {
      knownGames.push(...currentUser.dislikedGames.map(String));
    }

    // Фільтруємо наш пул ігор
    pool = pool.filter(game => !knownGames.includes(String(game._id)));

    // 2. Рахуємо Match % для кожної гри
    const scoredGames = pool.map(game => ({
      ...game,
      matchScore: calculateMatchPercentage(game, userTasteProfile, twinBonuses, currentUser)
    }));

    // 3. Сортуємо: зверху ті, що мають найвищий Match %
    scoredGames.sort((a, b) => b.matchScore - a.matchScore);

    // 4. Беремо Топ-8 найкращих для цього юзера (замість 12)
    let finalRecs = scoredGames.slice(0, 8);

    // 5. Застосовуємо фільтр по платформах (якщо юзер вказав їх у профілі)
    const userSelectedPlatforms = currentUser?.platforms ? Object.keys(currentUser.platforms).filter(key => currentUser.platforms[key]) : [];
    if (userSelectedPlatforms.length > 0) {
      finalRecs = finalRecs.filter(game => {
        const gameInfo = (game.platform || game.tags || game.genre || "").toLowerCase();
        return userSelectedPlatforms.some(plat => {
          if (plat === 'steam') return Boolean(game.steamLink) || gameInfo.includes('steam') || gameInfo.includes('pc') || gameInfo.includes('windows');
          if (plat === 'epicGames') return Boolean(game.epicLink) || gameInfo.includes('epic');
          if (plat === 'ps') return Boolean(game.psLink) || gameInfo.includes('playstation') || gameInfo.includes('ps');
          if (plat === 'xbox') return Boolean(game.xboxLink) || gameInfo.includes('xbox');
          return false;
        });
      });
    }

    return finalRecs;
  }, [trendsGames, currentUser, userTasteProfile, twinBonuses, recommendedGames]);

  return (
    <div className="main-wrapper" onClick={() => setActiveDropdown(null)}>
      <Header />

      {/* БАНЕР */}
      <section className="hero-section-full">
        <div className="hero-bg-image" style={{ backgroundImage: `linear-gradient(to right, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.5) 60%, transparent 100%), linear-gradient(to top, rgba(9, 9, 11, 1) 0%, transparent 30%), url(${getImageUrl(activeHeroGame.background || activeHeroGame.img)})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}></div>
        <button className="hero-nav-arrow left" onClick={prevHero}><ChevronLeft size={32} /></button>
        <button className="hero-nav-arrow right" onClick={nextHero}><ChevronRight size={32} /></button>

        <div className="hero-content-centered">
          <div className="hero-poster">
            <img src={getImageUrl(activeHeroGame.img)} alt={activeHeroGame.title} className="main-poster-img" />
            <div className="poster-hover-overlay">
              {/* 🔥 MATCH % ДЛЯ БАНЕРА (З ВКАЗАНИМ РОЗМІРОМ) */}
              <div className="overlay-center-zone">
                <MatchCircle percent={calculateMatchPercentage(activeHeroGame, userTasteProfile, twinBonuses, currentUser)} size={130} />
              </div>
              <div className="overlay-bottom-zone">
                <div className="action-btn-wrapper" data-tooltip="Улюблені"><Heart size={22} className={`action-btn ${getGameStatus(activeHeroGame._id) === 'liked' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(activeHeroGame, 'liked', e)} /></div>
                <div className="action-btn-wrapper" data-tooltip="Граю"><Play size={22} className={`action-btn ${getGameStatus(activeHeroGame._id) === 'playing' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(activeHeroGame, 'playing', e)} /></div>
                <div className="action-btn-wrapper" data-tooltip="Зіграні"><Check size={22} className={`action-btn ${getGameStatus(activeHeroGame._id) === 'played' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(activeHeroGame, 'played', e)} /></div>
                <div className="action-btn-wrapper" data-tooltip="Бажане"><Bookmark size={22} className={`action-btn ${getGameStatus(activeHeroGame._id) === 'wishlist' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(activeHeroGame, 'wishlist', e)} /></div>
              </div>
            </div>
          </div>
          <div className="hero-text-info">
            <span className="hero-badge">Leaderboard</span>
            <h1 className="hero-title">{activeHeroGame.title}</h1>
            <p className="hero-studio">{activeHeroGame.developer || "Студія не вказана"}</p>
            <div className="hero-tags-row">
              <span className="rating-tag"><Star size={14} fill="#8b5cf6" color="#8b5cf6" style={{ marginRight: '4px' }} />{activeHeroGame.rating > 0 ? Number(activeHeroGame.rating).toFixed(1) : '0.0'}</span>
              <span className="hero-tag">{activeHeroGame.year}</span>
              <span className="hero-tag">{activeHeroGame.genre || activeHeroGame.tags}</span>
            </div>
            <div className="hero-buttons">
              <Link to={`/game/${activeHeroGame._id}`}><button className="btn-purple">Переглянути</button></Link>
              <button className="btn-outline" onClick={(e) => handleDislikeGame(activeHeroGame._id, e)}>Не рекомендувати</button>
            </div>
          </div>
        </div>

        <div className="hero-pagination">
          {heroGames.map((_, idx) => (<div key={idx} className={`page-dash ${idx === currentHeroIndex ? 'active' : ''}`} onClick={() => setCurrentHeroIndex(idx)} style={{ cursor: 'pointer' }}></div>))}
        </div>
      </section>

      {/* РЕКОМЕНДОВАНО */}
      <section className="recommended-section">
        <div className="section-header">
          <h2 className="section-title">Рекомендовано для Вас</h2>
        </div>
        <div className="games-grid-mini">
          {filteredRecommended.slice(0, 8).map((game, index) => (
            <div key={game._id} className="game-card-mini" onClick={() => navigate(`/game/${game._id}`)} style={{ cursor: 'pointer' }}>
              <img src={`https://nexus-api-server-9g9o.onrender.com${game.img}`} alt={game.title} />
              <div className="card-hover-overlay">
                {/* 🔥 MATCH % ДЛЯ РЕКОМЕНДОВАНИХ */}
                <div className="overlay-center-zone">
                  <MatchCircle percent={calculateMatchPercentage(game, userTasteProfile, twinBonuses, currentUser)} size={70} />
                </div>
                <div className="overlay-bottom-zone">
                  <div className="action-btn-wrapper" data-tooltip="Улюблені"><Heart size={16} className={`action-btn ${getGameStatus(game._id) === 'liked' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'liked', e)} /></div>
                  <div className="action-btn-wrapper" data-tooltip="Граю"><Play size={16} className={`action-btn ${getGameStatus(game._id) === 'playing' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'playing', e)} /></div>
                  <div className="action-btn-wrapper" data-tooltip="Зіграні"><Check size={16} className={`action-btn ${getGameStatus(game._id) === 'played' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'played', e)} /></div>
                  <div className="action-btn-wrapper" data-tooltip="Бажане"><Bookmark size={16} className={`action-btn ${getGameStatus(game._id) === 'wishlist' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'wishlist', e)} /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ТРЕНДИ З ФІЛЬТРАМИ */}
      <section className="trends-section">
        <div className="section-header">
          <h2 className="section-title">{searchQuery ? `Результати для "${searchQuery}"` : "Тренди"}</h2>
          <div className="trends-header-actions">
            {(selectedGenres.length > 0 || selectedPlatforms.length > 0 || sortBy !== 'За популярністю' || searchQuery !== '' || appliedFilters.genres.length > 0 || appliedFilters.platforms.length > 0) && (
              <button className="btn-text" onClick={clearAllFilters}>Скасувати</button>
            )}
            <button className="btn-purple-sm" onClick={applyFilters}>Застосувати</button>
          </div>
        </div>

        <div className="filters-bar">
          <div className="filter-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className={`filter-dropdown ${activeDropdown === 'sort' ? 'active' : ''}`} onClick={() => toggleDropdown('sort')}>{sortBy} <ChevronDown size={16} /></div>
            {activeDropdown === 'sort' && (
              <div className="dropdown-menu">
                {['За популярністю', 'За новинкою', 'За оцінкою'].map(sortOption => (
                  <div key={sortOption} className="dropdown-item" onClick={() => { setSortBy(sortOption); }} style={{ color: sortBy === sortOption ? '#8b5cf6' : 'inherit' }}>{sortOption}</div>
                ))}
              </div>
            )}
          </div>
          <div className="filter-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className={`filter-dropdown ${activeDropdown === 'genre' || selectedGenres.length > 0 ? 'active' : ''}`} onClick={() => toggleDropdown('genre')}>{selectedGenres.length > 0 ? `Жанри (${selectedGenres.length})` : 'Виберіть жанр'} <ChevronDown size={16} /></div>
            {activeDropdown === 'genre' && (
              <div className="dropdown-menu wide">
                <div className="dropdown-search"><Search size={14} /><input type="text" placeholder="Пошук жанру..." value={genreSearchQuery} onChange={(e) => setGenreSearchQuery(e.target.value)} /></div>
                <div className="dropdown-checkbox-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {AVAILABLE_GENRES.filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase())).map(genre => (
                    <label className="checkbox-item" key={genre}><input type="checkbox" checked={selectedGenres.includes(genre)} onChange={() => toggleGenreFilter(genre)} /> {genre}</label>
                  ))}
                  {AVAILABLE_GENRES.filter(genre => genre.toLowerCase().includes(genreSearchQuery.toLowerCase())).length === 0 && (<div style={{ padding: '10px', textAlign: 'center', color: '#71717a', fontSize: '14px' }}>Жанр не знайдено</div>)}
                </div>
              </div>
            )}
          </div>
          <div className="filter-wrapper" onClick={(e) => e.stopPropagation()}>
            <div className={`filter-dropdown ${activeDropdown === 'platform' || selectedPlatforms.length > 0 ? 'active' : ''}`} onClick={() => toggleDropdown('platform')}>{selectedPlatforms.length > 0 ? `Платформи (${selectedPlatforms.length})` : 'Виберіть платформу'} <ChevronDown size={16} /></div>
            {activeDropdown === 'platform' && (
              <div className="dropdown-menu wide">
                <div className="dropdown-checkbox-list">
                  {['Steam', 'Epic Games', 'PlayStation', 'Xbox'].map(plat => (
                    <label className="checkbox-item" key={plat}><input type="checkbox" checked={selectedPlatforms.includes(plat)} onChange={() => togglePlatformFilter(plat)} /> {plat}</label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ТРЕНДИ: СІТКА ІГОР */}
        <div className="trends-grid">
          {paginatedGames.length > 0 ? (
            paginatedGames.map(game => (
              <div key={game._id} className="trend-card" onClick={() => navigate(`/game/${game._id}`)} style={{ cursor: 'pointer' }}>
                <div className="trend-img-box">
                  <img src={`https://nexus-api-server-9g9o.onrender.com${game.img}`} alt={game.title} />
                  <div className="card-hover-overlay">
                    {/* 🔥 MATCH % ДЛЯ ТРЕНДІВ */}
                    <div className="overlay-center-zone">
                      <MatchCircle percent={calculateMatchPercentage(game, userTasteProfile, twinBonuses, currentUser)} size={85} />
                    </div>
                    <div className="overlay-bottom-zone">
                      <div className="action-btn-wrapper" data-tooltip="Улюблені"><Heart size={18} className={`action-btn ${getGameStatus(game._id) === 'liked' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'liked', e)} /></div>
                      <div className="action-btn-wrapper" data-tooltip="Граю"><Play size={18} className={`action-btn ${getGameStatus(game._id) === 'playing' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'playing', e)} /></div>
                      <div className="action-btn-wrapper" data-tooltip="Зіграні"><Check size={18} className={`action-btn ${getGameStatus(game._id) === 'played' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'played', e)} /></div>
                      <div className="action-btn-wrapper" data-tooltip="Бажане"><Bookmark size={18} className={`action-btn ${getGameStatus(game._id) === 'wishlist' ? 'active-icon' : ''}`} onClick={(e) => handleGameAction(game, 'wishlist', e)} /></div>
                    </div>
                  </div>
                </div>
                <div className="trend-info">
                  <h4 className="trend-game-title">{game.title}</h4>
                  <p className="trend-game-meta">{game.year}, {game.genre}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#71717a', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>За вашими фільтрами ігор не знайдено</div>
          )}
        </div>

        {/* ПАГІНАЦІЯ */}
        {totalPages > 1 && (
          <div className="pagination-footer">
            <div className="page-numbers">
              {generatePageNumbers().map((num, index) => (
                <span key={index} className={`page-num ${num === currentPage ? 'active' : ''} ${num === '...' ? 'dots' : ''}`} onClick={() => { if (num !== '...') { setCurrentPage(num); window.scrollTo({ top: document.querySelector('.trends-section').offsetTop - 20, behavior: 'smooth' }); } }} style={{ cursor: num === '...' ? 'default' : 'pointer' }}>{num}</span>
              ))}
            </div>
            <button className="page-next-btn" onClick={() => { if (currentPage < totalPages) { setCurrentPage(prev => prev + 1); window.scrollTo({ top: document.querySelector('.trends-section').offsetTop - 20, behavior: 'smooth' }); } }} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={20} /></button>
          </div>
        )}
      </section>

      <section className="about-nexus-section">
        <div className="about-header-text">
          <h2 className="about-title">Знаходьте ідеальні ігри миттєво на Ne<span>x</span>us</h2>
          <p className="about-description">Шукаєте, у що пограти? Nexus аналізує ваші вподобання, щоб запропонувати найкращі хіти від Ubisoft, Sony, Valve та інді-студій. Ми щодня синхронізуємо базу зі Steam, Epic Games та PS Store, враховуючи не тільки жанр, а й ваш ігровий досвід та час проходження.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon-wrapper"><Sparkles size={24} color="#8b5cf6" /></div><h3 className="feature-title">Розумні добірки</h3><p className="feature-text">У розділі Каталог на вас чекають списки, створені штучним інтелектом: від кооперативу для друзів до атмосферного постапокаліпсису. Рекомендації оновлюються автоматично.</p></div>
          <div className="feature-card"><div className="feature-icon-wrapper"><Flame size={24} color="#8b5cf6" /></div><h3 className="feature-title">Новинки 2025</h3><p className="feature-text">Ми стежимо за всіма анонсами та виставками (The Game Awards, E3). Найактуальніші релізи одразу з’являються у вашій стрічці — будьте в курсі трендів.</p></div>
          <div className="feature-card"><div className="feature-icon-wrapper"><Target size={24} color="#8b5cf6" /></div><h3 className="feature-title">Персоналізація</h3><p className="feature-text">Система навчається на ваших діях. Ставте оцінки та позначайте пройдені ігри — це допомагає алгоритму робити рекомендації зі 100% точністю.</p></div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default Home;