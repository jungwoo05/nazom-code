import { useState, useEffect } from 'react';
import { Megaphone, ChevronRight, X, ArrowLeft } from 'lucide-react';
import './NoticeBoard.css';

const NoticeBoard = ({ onClose, onSelect }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(data); // Show all posts
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="notice-board-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="notice-board-view animate-slide-up">
        <div className="board-header-fixed container">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={20} />
            <span>메인으로</span>
          </button>
          <div className="board-title-group">
            <div className="notice-tag">
              <Megaphone size={14} />
              <span>THEO MOTORS NOTICE</span>
            </div>
            <h2 className="board-main-title">공지사항 및 이벤트</h2>
          </div>
          <button className="close-circle-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="board-content-scroll">
          <div className="notice-container container">
            {loading ? (
              <div className="board-loading">불러오는 중...</div>
            ) : posts.length === 0 ? (
              <div className="board-empty">등록된 소식이 없습니다.</div>
            ) : (
              <div className="notice-list board-list-grid">
                {posts.map((post) => (
                  <div key={post.id} className="notice-item shadow-card" onClick={() => onSelect(post)}>
                    <div className="notice-item-content">
                      <div className="notice-meta">
                        <span className="notice-date">{post.date}</span>
                        {post.isPopup === 'true' && <span className="p-badge">HOT</span>}
                      </div>
                      <h3 className="notice-item-title">{post.title}</h3>
                      <p className="notice-excerpt">{post.content}</p>
                    </div>
                    <button className="notice-more-btn">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;
