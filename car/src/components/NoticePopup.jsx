import { useState, useEffect } from 'react';
import { X, Bell, ChevronRight } from 'lucide-react';
import './NoticePopup.css';

const NoticePopup = ({ onDetail }) => {
  const [activePopup, setActivePopup] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchPopup = async () => {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        const popupPost = data.find(p => p.isPopup === 'true' || p.isPopup === true);
        
        if (popupPost) {
          const hideUntil = localStorage.getItem(`hide_popup_${popupPost.id}`);
          const now = new Date().getTime();
          if (!hideUntil || now > parseInt(hideUntil)) {
            setActivePopup(popupPost);
            setTimeout(() => setIsVisible(true), 500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch popup post:', err);
      }
    };
    fetchPopup();
  }, []);

  const handleClose = (e) => {
    e?.stopPropagation();
    setIsVisible(false);
  };

  const handleHideToday = (e) => {
    e.stopPropagation();
    if (activePopup) {
      const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(`hide_popup_${activePopup.id}`, expiry.toString());
      setIsVisible(false);
    }
  };

  if (!activePopup || !isVisible) return null;

  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-modal shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-badge">
            <Bell size={14} />
            <span>중요 공지</span>
          </div>
          <button className="popup-close-icon" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="popup-content" onClick={() => onDetail(activePopup)} style={{cursor: 'pointer'}}>
          <h2 className="popup-title">{activePopup.title}</h2>
          <div className="popup-divider"></div>
          <p className="popup-text">{activePopup.content}</p>
          <div className="popup-click-hint">
            자세히 보기 <ChevronRight size={14}/>
          </div>
        </div>
        
        <div className="popup-footer">
          <button className="hide-today-btn" onClick={handleHideToday}>
            오늘 하루 보지 않기
          </button>
          <button className="popup-close-btn" onClick={handleClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
