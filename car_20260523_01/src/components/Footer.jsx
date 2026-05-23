import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <div className="footer-logo-mark">T</div>
          <div>
            <p className="footer-logo-text">THEO <span>MOTORS</span></p>
            <p className="footer-tagline">Premium Import Auto Care — 노원 본점</p>
          </div>
        </div>

        <div className="footer-links">
          <a href="#">이용안내</a>
          <a href="#">개인정보처리방침</a>
          <a href="#">이용약관</a>
        </div>

        <div className="footer-copy">
          <p>서울 노원구 동일로173가길 59 1층 · 0507-1333-3890</p>
          <p>© 2026 Theo Motors. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
