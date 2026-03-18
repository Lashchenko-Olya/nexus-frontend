import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import './Header.css';

function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔥 СТЕЙТИ ДЛЯ ЖИВОГО ПОШУКУ 🔥
  const [searchQuery, setSearchQuery] = useState('');
  const [allGames, setAllGames] = useState([]); // Тут тримаємо всі ігри для пошуку
  const [searchResults, setSearchResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false); // Чи клікнули ми в поле пошуку

  useEffect(() => {
    // 1. Завантажуємо юзера
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 2. Тихо завантажуємо всі ігри у фоні, щоб пошук працював миттєво
    fetch('https://nexus-api-server-9g9o.onrender.com/api/games/all')
      .then(res => res.json())
      .then(data => setAllGames(data))
      .catch(err => console.error("Помилка завантаження ігор для пошуку:", err));
  }, []);

  // Функція, яка спрацьовує при кожній введеній літері
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const lowerCaseValue = value.toLowerCase();
      // Шукаємо співпадіння і беремо тільки перші 5 штук, щоб не розтягувати список
      const filtered = allGames.filter(game =>
        game.title.toLowerCase().includes(lowerCaseValue)
      ).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  // Перехід на гру при кліку
  const handleGameClick = (gameId) => {
    setSearchQuery(''); // Очищаємо поле
    setSearchResults([]);
    setIsFocused(false); // Ховаємо список
    navigate(`/game/${gameId}`); // Летимо на сторінку гри
  };

  return (
    <header className="header-outer">
      <div className="header-inner">
        {/* Логотип */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="logo">Ne<span>x</span>us</div>
        </Link>

        {/* Пошук */}
        <div className="header-center">
          <div className="search-bar" style={{ position: 'relative' }}>
            <Search size={18} color="#71717a" />
            <input
              type="text"
              placeholder="Пошук ігор..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Затримка, щоб встиг спрацювати клік по грі
            />

            {/* 🔥 ВИПАДАЮЧИЙ СПИСОК (ДРОПДАУН) 🔥 */}
            {isFocused && searchQuery.length > 0 && (
              <div className="search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map(game => (
                    <div
                      key={game._id}
                      className="search-dropdown-item"
                      onClick={() => handleGameClick(game._id)}
                    >
                      <img
                        src={game.img?.startsWith('http') ? game.img : `https://nexus-api-server-9g9o.onrender.com${game.img}`}
                        alt={game.title}
                        className="search-dropdown-img"
                      />
                      <div className="search-dropdown-info">
                        <span className="search-dropdown-title">{game.title}</span>
                        <span className="search-dropdown-year">{game.year} • {game.genre?.split(',')[0]}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-dropdown-empty">
                    За запитом "{searchQuery}" нічого не знайдено 😢
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Профіль користувача АБО кнопки входу */}
        <div className="header-right">
          {user ? (
            <Link to="/profile" style={{ textDecoration: 'none', color: 'white' }}>
              <div className="user-profile">
                <div className="user-info">
                  <div className="user-avatar-small">
                    <img
                      src={
                        user.avatar?.startsWith('http') || user.avatar?.startsWith('data:') || user.avatar === '/avatar.jpg'
                          ? user.avatar
                          : `https://nexus-api-server-9g9o.onrender.com${user.avatar}`
                      }
                      alt={user.nickname}
                    />
                  </div>
                  <span className="user-name">{user.nickname}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn-login">Вхід</Link>
              <Link to="/register" className="btn-register">Реєстрація</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;