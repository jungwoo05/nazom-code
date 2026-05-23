import { ArrowLeft, X, Calendar, Share2 } from 'lucide-react';
import './NoticeDetail.css';

const NoticeDetail = ({ post, onClose, onBackToList }) => {
  if (!post) return null;

  return (
    <div className="notice-detail-overlay">
      <div className="notice-detail-view animate-fade-in">
        <div className="detail-header-fixed container">
          <div className="header-left">
            <button className="back-btn-ghost" onClick={onBackToList || onClose}>
              <ArrowLeft size={18} />
              <span>목록으로</span>
            </button>
          </div>
          <button className="close-circle-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <article className="detail-content container">
          <header className="article-header">
            <div className="article-meta">
              <span className="meta-tag">NOTICE</span>
              <span className="meta-sep"></span>
              <div className="meta-date">
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
            </div>
            <h1 className="article-title">{post.title}</h1>
            <div className="article-toolbar">
              <button className="tool-btn"><Share2 size={16}/> 공유하기</button>
            </div>
          </header>

          <div className="article-body">
            <p className="article-text">{post.content}</p>
            {/* Extended content simulation if needed */}
            <p className="article-text-sub">
              항상 저희 태오모터스를 이용해주시는 고객님들께 깊은 감사를 드립니다. 
              최상의 서비스를 위해 끊임없이 연구하고 노력하겠습니다. 
              궁금하신 점은 언제든 고객센터로 문의 부탁드립니다.
            </p>
          </div>
          
          <footer className="article-footer">
            <button className="btn-primary list-return-btn" onClick={onBackToList || onClose}>
              목록으로 돌아가기
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default NoticeDetail;
