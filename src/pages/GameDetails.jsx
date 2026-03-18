import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, Star, Bookmark, Trophy, AlertCircle, ChevronLeft, Trash2, X } from 'lucide-react';
import '../App.css';
import './GameDetails.css';
import Footer from '../components/Footer';
import Header from '../components/Header';

function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null
  });

  const showModal = (title, message, type = 'alert', onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', message: '', type: 'confirm', onConfirm: null });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      if (parsedUser.games) {
        const mySavedGame = parsedUser.games.find(g =>
          String(g.gameId) === String(id) || String(g._id) === String(id)
        );
        if (mySavedGame && mySavedGame.rating) {
          setRating(mySavedGame.rating);
        }
      }
    }

    const fetchComments = async () => {
      try {
        const res = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/comments/${id}`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Помилка завантаження коментарів:", err);
      }
    };

    const fetchGame = async () => {
      try {
        const response = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/games/${id}`);
        if (!response.ok) throw new Error('Гру не знайдено');
        const data = await response.json();
        setGame(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
    fetchComments();
  }, [id]);

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!currentUser) return showModal("Потрібна авторизація", "Увійдіть в акаунт, щоб залишити коментар.", "alert");
    if (!newCommentText.trim()) return;

    const commentBody = {
      userId: currentUser._id,
      gameId: id,
      nickname: currentUser.nickname,
      avatar: currentUser.avatar || '',
      text: newCommentText,
      rating: rating
    };

    try {
      const res = await fetch('https://nexus-api-server-9g9o.onrender.com/api/comments/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentBody)
      });

      const data = await res.json();

      if (res.ok) {
        setComments([data, ...comments]);
        setNewCommentText('');

        if (data.status === 'На перевірці') {
          showModal("Відправлено", "Дякуємо! Ваш відгук з'явиться для всіх після перевірки адміністратором.", "alert");
        }
      } else {
        showModal("Помилка", data.message || "Не вдалося додати коментар", "alert");
      }
    } catch (err) {
      console.error("Помилка відправки:", err);
    }
  };

  const handleStarClick = async (num) => {
    setRating(num);
    if (!currentUser) return showModal("Потрібна авторизація", "Увійдіть в акаунт, щоб ваш голос був врахований.", "alert");

    const gameIdStr = String(game?._id || id);
    const currentStatus = currentUser.games?.find(g => String(g.gameId) === gameIdStr)?.status || 'played';

    try {
      await fetch('https://nexus-api-server-9g9o.onrender.com/api/comments/save-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: id, nickname: currentUser.nickname, rating: num })
      });

      const userRes = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/add-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: currentUser.nickname,
          gameId: gameIdStr,
          title: game?.title || "Невідома гра",
          year: game?.year || "",
          genre: game?.genre || game?.tags || "",
          img: game?.img || "",
          status: currentStatus,
          rating: num
        })
      });

      if (userRes.ok) {
        const data = await userRes.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Помилка зв'язку з сервером:", err);
    }
  };

  const handleDeleteComment = (commentId) => {
    showModal(
      "Видалити коментар",
      "Ви впевнені, що хочете видалити цей коментар? Цю дію неможливо скасувати.",
      "confirm",
      async () => {
        try {
          const res = await fetch(`https://nexus-api-server-9g9o.onrender.com/api/comments/${commentId}`, { method: 'DELETE' });
          if (res.ok) setComments(comments.filter(c => c._id !== commentId));
          closeModal();
        } catch (err) {
          console.error("Помилка видалення:", err);
          closeModal();
        }
      }
    );
  };

  const getGameStatus = (statusName) => {
    if (!currentUser || !currentUser.games || !game) return false;
    const currentPageId = String(game._id).trim();
    const userGame = currentUser.games.find(g => String(g.gameId).trim() === currentPageId);
    return userGame ? userGame.status === statusName : false;
  };

  const handleGameAction = async (targetStatus) => {
    if (!currentUser) return showModal("Потрібна авторизація", "Будь ласка, увійдіть в акаунт.", "alert");
    const gameIdStr = String(game._id || id);
    const currentStatus = currentUser.games?.find(g => String(g.gameId) === gameIdStr)?.status;
    const finalStatus = currentStatus === targetStatus ? 'remove' : targetStatus;

    try {
      const response = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/add-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: currentUser.nickname,
          gameId: gameIdStr,
          title: game.title,
          year: game.year,
          genre: game.genre || game.tags,
          img: game.img,
          status: finalStatus,
          rating: rating
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);

        setGame(prevGame => {
          let newLikes = prevGame.likes || 0;
          if (finalStatus === 'liked' && currentStatus !== 'liked') newLikes += 1;
          else if (currentStatus === 'liked' && finalStatus !== 'liked') newLikes = Math.max(0, newLikes - 1);
          return { ...prevGame, likes: newLikes };
        });
      }
    } catch (error) {
      console.error("Помилка дії:", error);
    }
  };

  const scrollToComments = () => {
    document.querySelector('.comments-section-container')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.querySelector('.add-comment-form textarea')?.focus(), 500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDislike = () => {
    if (!currentUser) return showModal("Потрібна авторизація", "Увійдіть в акаунт, щоб сховати гру.", "alert");
    showModal(
      "Приховати гру",
      "Ця гра більше не буде з'являтися у ваших рекомендаціях та трендах.",
      "confirm",
      async () => {
        try {
          const res = await fetch('https://nexus-api-server-9g9o.onrender.com/api/users/dislike-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: currentUser.nickname, gameId: id })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            closeModal();
            navigate('/');
          }
        } catch (err) {
          console.error("Помилка приховування гри:", err);
          closeModal();
        }
      }
    );
  };

  const calculateAverageRating = () => {
    const published = comments.filter(c => !c.status || c.status === 'Опубліковано');
    if (published.length === 0) return 0;
    const sum = published.reduce((acc, comment) => acc + (comment.rating || 0), 0);
    return (sum / published.length).toFixed(1);
  };

  if (loading) return <div className="gd-loading">Завантаження...</div>;
  if (error) return <div className="gd-error"><AlertCircle size={40} /><p>{error}</p><Link to="/">На головну</Link></div>;
  if (!game) return null;

  const posterUrl = game.img?.startsWith('/uploads') ? `https://nexus-api-server-9g9o.onrender.com${game.img}` : game.img;
  const backgroundUrl = game.background ? (game.background.startsWith('/uploads') ? `https://nexus-api-server-9g9o.onrender.com${game.background}` : game.background) : posterUrl;
  const displayRating = calculateAverageRating() > 0 ? calculateAverageRating() : (game.rating > 0 ? Number(game.rating).toFixed(1) : '0.0');

  return (
    <div className="main-wrapper">
      <Header />
      <div className="game-hero-banner" style={{ backgroundImage: `url(${backgroundUrl})` }}>
        <div className="game-hero-overlay"></div>
      </div>
      <div className="game-content-container">

        <div className="game-left-col">
          <div className="game-poster-large"><img src={posterUrl} alt={game.title} /></div>
          <div className="game-stats-row">
            <span><Heart size={14} /> {game.likes || 0}</span>
            <span><Eye size={14} /> {game.views || 0}</span>
            <span style={{ color: '#eab308' }}><Star size={14} fill="#eab308" color="#eab308" /> {displayRating}</span>
          </div>
          <div className="stores-widget">
            <h4 className="widget-title">ДЕ ПРИДБАТИ</h4>
            <div className="store-list">
              {game.steamLink?.trim() && <div className="store-item"><div className="store-info"><div className="store-icon steam"></div> Steam</div><a href={game.steamLink} target="_blank" rel="noreferrer" className="store-buy-btn">Відкрити</a></div>}
              {game.epicLink?.trim() && <div className="store-item"><div className="store-info"><div className="store-icon epic"></div> Epic Games</div><a href={game.epicLink} target="_blank" rel="noreferrer" className="store-buy-btn">Відкрити</a></div>}
              {game.psLink?.trim() && <div className="store-item"><div className="store-info"><div className="store-icon ps"></div> PS Store</div><a href={game.psLink} target="_blank" rel="noreferrer" className="store-buy-btn">Відкрити</a></div>}
              {game.xboxLink?.trim() && <div className="store-item"><div className="store-info"><div className="store-icon xbox"></div> Xbox Store</div><a href={game.xboxLink} target="_blank" rel="noreferrer" className="store-buy-btn">Відкрити</a></div>}
            </div>
          </div>
        </div>

        <div className="game-center-col">
          <div className="game-header-text">
            <h1 className="game-title">{game.title}</h1>
            <span className="game-meta">{game.year}, <span className="studio-link">{game.genre || game.tags}</span></span>
          </div>
          <div className="game-description"><p>{game.longDesc || game.shortDesc || "Опис відсутній."}</p></div>
          {game.sysReq && <div className="game-sys-req"><h3>Мінімальні системні вимоги</h3><ul className="req-list"><li style={{ whiteSpace: 'pre-line' }}>{game.sysReq}</li></ul></div>}
        </div>

        <div className="game-right-col">
          <div className="action-card-widget">
            <div className="action-card-top">
              <div className={`action-btn-item ${getGameStatus('played') ? 'active' : ''}`} onClick={() => handleGameAction('played')}><Trophy size={28} /><span>Played</span></div>
              <div className={`action-btn-item ${getGameStatus('liked') ? 'active' : ''}`} onClick={() => handleGameAction('liked')}><Heart size={28} /><span>Like</span></div>
              <div className={`action-btn-item ${getGameStatus('wishlist') ? 'active' : ''}`} onClick={() => handleGameAction('wishlist')}><Bookmark size={28} /><span>Wishlist</span></div>
            </div>
            <div className="action-card-rating">
              <span className="rating-title">Оцінити</span>
              <div className="stars-row" style={{ display: 'flex', gap: '5px' }}>
                {[...Array(5)].map((_, index) => (
                  <div key={index} onClick={() => handleStarClick(index + 1)} onMouseEnter={() => setHover(index + 1)} onMouseLeave={() => setHover(0)} style={{ cursor: 'pointer' }}>
                    <Star size={32} fill={(index + 1) <= (hover || rating) ? "#8b5cf6" : "transparent"} color={(index + 1) <= (hover || rating) ? "#8b5cf6" : "#27272a"} />
                  </div>
                ))}
              </div>
            </div>
            <div className="action-card-list">
              <button onClick={scrollToComments}>Написати рецензію</button>
              <button onClick={handleShare}>{copySuccess ? 'Копійовано!' : 'Поділитися'}</button>
              <button className="danger-btn" onClick={handleDislike}>Не рекомендувати</button>
            </div>
          </div>
        </div>
      </div>

      <div className="comments-section-container">
        <h3 className="comments-title">Коментарі ({comments.filter(c => !c.status || c.status === 'Опубліковано').length})</h3>
        {currentUser ? (
          <form className="add-comment-form" onSubmit={handleSendComment}>
            <textarea placeholder="Напишіть ваші враження..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} required />
            <button type="submit" className="btn-purple-sm">Опублікувати</button>
          </form>
        ) : (
          <p className="login-prompt">Будь ласка, <Link to="/login" style={{ color: '#8b5cf6' }}>увійдіть</Link>, щоб коментувати.</p>
        )}

        <div className="comment-list">
          {comments
            .filter(c => {
              const isPublished = !c.status || c.status.toLowerCase() === 'опубліковано';
              const isMine = currentUser && c.nickname === currentUser.nickname;
              return isPublished || isMine;
            })
            .map((c) => (
              <div className="comment-item" key={c._id} style={{ opacity: c.status === 'На перевірці' ? 0.6 : 1, display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div className="comment-avatar">
                  {c.avatar ? (
                    <img
                      src={
                        c.avatar?.startsWith('http') || c.avatar?.startsWith('data:') || c.avatar === '/avatar.jpg'
                          ? c.avatar
                          : `https://nexus-api-server-9g9o.onrender.com${c.avatar}`
                      }
                      alt={c.nickname}
                    />
                  ) : (
                    <div className="avatar-placeholder">{c.nickname[0]}</div>
                  )}
                </div>
                <div className="comment-content" style={{ width: '100%' }}>
                  <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="comment-author-info">
                      <span className="comment-author">
                        {c.nickname}
                        {c.status === 'На перевірці' && <span style={{ marginLeft: '10px', fontSize: '10px', color: '#eab308', border: '1px solid #eab308', padding: '2px 6px', borderRadius: '10px' }}>На перевірці</span>}
                      </span>
                      <div className="comment-stars">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < c.rating ? "#8b5cf6" : "transparent"} color={i < c.rating ? "#8b5cf6" : "#27272a"} />)}
                      </div>
                    </div>
                    {currentUser?.nickname === c.nickname && (
                      <button className="delete-comment-btn" onClick={() => handleDeleteComment(c._id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                  <p className="comment-text" style={{ marginTop: '8px', color: '#f4f4f5' }}>{c.text || "(Тільки оцінка)"}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {modal.isOpen && (
        <div className="nx-modal-overlay" onClick={closeModal}>
          <div className="nx-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nx-modal-header">
              <h3>{modal.title}</h3>
              <button className="nx-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="nx-modal-body"><p>{modal.message}</p></div>
            <div className="nx-modal-actions">
              {modal.type === 'confirm' ? (
                <><button className="nx-btn-cancel" onClick={closeModal}>Скасувати</button><button className="nx-btn-confirm" onClick={modal.onConfirm}>Підтвердити</button></>
              ) : (
                <button className="nx-btn-confirm" onClick={closeModal}>ОК</button>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default GameDetails;