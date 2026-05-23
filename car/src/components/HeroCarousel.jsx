import { useState, useEffect } from 'react';
import './HeroCarousel.css';

const slides = [
  {
    id: 1,
    title: '태오모터스 고객 감사 이벤트',
    subtitle: '최고의 전문가들이 당신의 차량을 완벽하게 케어합니다. 신규 방문 고객 대상 무상 점검 서비스를 제공합니다.',
    date: '2026년 한정 진행',
    type: 'notice',
    bgImage: '/bg_notice.png',
  },
  {
    id: 2,
    title: '노원 수입차 정비 전문',
    subtitle: '정직하고 완벽한 수입자동차 정비, 태오모터스',
    type: 'map',
    bgImage: '/bg_map.png',
  }
];

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-carousel">
      <div className="hero-header">
        <h2>THEO MOTORS</h2>
        <p>수입차 메인터넌스 파트너</p>
      </div>
      
      <div className="carousel-container shadow-card">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ 
              backgroundImage: `url(${slide.bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {slide.type === 'notice' ? (
              <div className="slide-content notice-slide">
                <div className="letter-envelope">
                  <h3 className="notice-title">{slide.title}</h3>
                  <p className="notice-desc">{slide.subtitle}</p>
                  <p className="notice-date">{slide.date}</p>
                </div>
              </div>
            ) : (
              <div className="slide-content map-slide">
                <h3 className="slide-title">{slide.subtitle}</h3>
                <h2 className="slide-main-title">{slide.title}</h2>
                <button className="btn-outline map-btn">매장 정보</button>
              </div>
            )}
          </div>
        ))}
        
        <div className="carousel-controls glass-panel">
          <button 
            className="pause-btn"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? 1 : 0))}
          >
            ||
          </button>
          <span className="carousel-indicator">{currentSlide + 1} / {slides.length}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
