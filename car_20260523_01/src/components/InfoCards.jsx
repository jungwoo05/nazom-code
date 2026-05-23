import { MessageCircle, PhoneCall, Clock, MapPin, ExternalLink } from 'lucide-react';
import './InfoCards.css';

const InfoCards = () => {
  return (
    <div className="info-cards-container" id="store">
      {/* Card 1: Contact */}
      <div className="info-card shadow-card">
        <div className="info-card-icon-wrap contact-icon">
          <PhoneCall size={22} />
        </div>
        <div className="info-card-content">
          <p className="info-category">예약 · 문의</p>
          <h4 className="info-value">0507-1333-3890</h4>
          <a
            href="https://pf.kakao.com"
            target="_blank"
            rel="noreferrer"
            className="info-action-link"
          >
            <MessageCircle size={15}/> 카카오 채널 상담
            <ExternalLink size={13}/>
          </a>
        </div>
      </div>

      {/* Card 2: Location */}
      <div className="info-card shadow-card">
        <div className="info-card-icon-wrap location-icon">
          <MapPin size={22} />
        </div>
        <div className="info-card-content">
          <p className="info-category">오시는 길</p>
          <h4 className="info-value">노원 본점</h4>
          <p className="info-detail">서울 노원구 동일로173가길 59 1층</p>
          <p className="info-sub">태릉입구역 3번 출구 384m</p>
        </div>
      </div>

      {/* Card 3: Hours */}
      <div className="info-card shadow-card">
        <div className="info-card-icon-wrap hours-icon">
          <Clock size={22} />
        </div>
        <div className="info-card-content">
          <p className="info-category">운영 시간</p>
          <div className="hours-grid">
            <span className="hours-day">월 — 금</span>
            <span className="hours-time">09:00 – 18:00</span>
            <span className="hours-day">토요일</span>
            <span className="hours-time">09:00 – 15:00</span>
            <span className="hours-day">일요일</span>
            <span className="hours-time closed">정기 휴무</span>
          </div>
          <p className="hours-notice">* 방문 전 예약 필수</p>
        </div>
      </div>

      {/* Card 4: Booking notice */}
      <div className="info-card info-card-highlight shadow-card">
        <div className="info-card-icon-wrap highlight-icon">
          <MessageCircle size={22} />
        </div>
        <div className="info-card-content">
          <p className="info-category">빠른 온라인 예약</p>
          <h4 className="info-value">위 예약 위젯을 통해<br/>바로 온라인 예약 가능합니다</h4>
          <p className="info-sub">차량 선택 → 서비스 선택 → 예약 완료</p>
        </div>
      </div>
    </div>
  );
};

export default InfoCards;
