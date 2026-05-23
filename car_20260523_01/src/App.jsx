import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import InfoCards from './components/InfoCards';
import CarSelectionWidget from './components/CarSelectionWidget';
import ProductSelection from './components/ProductSelection';
import AdminPanel from './components/AdminPanel';
import NoticeBoard from './components/NoticeBoard';
import NoticePopup from './components/NoticePopup';
import NoticeDetail from './components/NoticeDetail';
import './App.css';

function App() {
  const [bookingStep, setBookingStep] = useState('car');
  const [carSelections, setCarSelections] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  
  // New Navigation State
  const [viewState, setViewState] = useState('landing'); // 'landing', 'board', 'detail'
  const [selectedPost, setSelectedPost] = useState(null);

  const handleCarSelect = (selections) => {
    setCarSelections(selections);
    setBookingStep('product');
  };

  const handleBackToCar = () => setBookingStep('car');

  const handleComplete = () => {
    setBookingStep('car');
    setCarSelections(null);
  };

  // Navigation handlers
  const openBoard = () => setViewState('board');
  const openDetail = (post) => {
    setSelectedPost(post);
    setViewState('detail');
  };
  const closeOverlays = () => {
    setViewState('landing');
    setSelectedPost(null);
  };

  return (
    <div className="app-container">
      <Header 
        onAdminOpen={() => setAdminOpen(true)} 
        onBoardOpen={openBoard}
      />

      <NoticePopup onDetail={openDetail} />

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
      
      {/* Notice Overlays */}
      {viewState === 'board' && (
        <NoticeBoard 
          onClose={closeOverlays} 
          onSelect={openDetail} 
        />
      )}
      
      {viewState === 'detail' && (
        <NoticeDetail 
          post={selectedPost} 
          onClose={closeOverlays}
          onBackToList={() => setViewState('board')}
        />
      )}

      <main className="main-content">
        <div className="hero-section">
          <div className="hero-bg" style={{backgroundImage: "url('/hero_bg.png')"}}></div>
          <div className="hero-bg-overlay"></div>
          <div className="hero-text container">
            <h2>THEO MOTORS PREMIER</h2>
            <p>최고의 전문가가 제안하는 완벽한 수입차 메인터넌스 스토어</p>
          </div>
        </div>

        <div className="wizard-container container">
          <div className="wizard-floating-card shadow-card">
            {bookingStep === 'car' ? (
              <CarSelectionWidget onProceed={handleCarSelect} />
            ) : (
              <ProductSelection
                carSelections={carSelections}
                onBack={handleBackToCar}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>

        {/* NoticeBoard has been removed from landing page per request */}

        <div className="store-info-wrapper container">
          <h3 className="wrapper-title">오프라인 스토어 및 고객 센터</h3>
          <InfoCards />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
