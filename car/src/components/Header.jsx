import { useState } from 'react';
import { PhoneCall, LayoutDashboard, Megaphone, Menu, X } from 'lucide-react';
import './Header.css';

const Header = ({ onAdminOpen, onBoardOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAdminClick = () => {
    onAdminOpen();
    setIsMenuOpen(false);
  };

  const handleBoardClick = () => {
    onBoardOpen();
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-inner container">
        <div className="logo-container" onClick={() => window.location.href='/'} style={{cursor: 'pointer'}}>
          <div className="logo-text">
            <h1 className="logo">THEO<span>MOTORS</span></h1>
            <p className="logo-sub">수입차 메인터넌스 파트너</p>
          </div>
        </div>

        <nav className={`main-nav ${isMenuOpen ? 'mobile-open' : ''}`}>
          <a href="#services" className="nav-link" onClick={() => setIsMenuOpen(false)}>서비스</a>
          <a href="#store" className="nav-link" onClick={() => setIsMenuOpen(false)}>매장 안내</a>
          <a href="#about" className="nav-link" onClick={() => setIsMenuOpen(false)}>브랜드 소개</a>
          
          <div className="mobile-only-cta">
             <button className="admin-btn" onClick={handleAdminClick}>
              <LayoutDashboard size={15} />
              <span>관리자</span>
            </button>
            <a href="tel:0507-1333-3890" className="phone-btn">
              <PhoneCall size={16} />
              <span>전화문의</span>
            </a>
          </div>
        </nav>

        <div className="header-cta desktop-only">
          <button className="board-nav-btn" onClick={onBoardOpen} title="공지사항 게시판">
            <Megaphone size={18} />
          </button>
          <button className="admin-btn" onClick={onAdminOpen}>
            <LayoutDashboard size={15} />
            <span>관리자</span>
          </button>
          <a href="tel:0507-1333-3890" className="phone-btn">
            <PhoneCall size={16} />
            <span>0507-1333-3890</span>
          </a>
        </div>

        <div className="mobile-toggle-area">
          <button className="board-nav-btn mobile-board-btn" onClick={onBoardOpen}>
            <Megaphone size={18} />
          </button>
          <button className="menu-toggle-btn" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
