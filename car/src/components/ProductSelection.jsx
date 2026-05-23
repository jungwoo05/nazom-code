import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import './ProductSelection.css';

const categoryLabels = {
  engine: '🔧 엔진 케어',
  brake: '🛑 브레이크',
  transmission: '⚙️ 미션 / 변속기',
  filter: '🌀 필터 교체',
  battery: '🔋 배터리',
  inspection: '📋 점검 서비스',
};

const ProductSelection = ({ carSelections, onBack, onComplete }) => {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar States
  const [appointmentDate, setAppointmentDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.map(item => ({ ...item, price: parseInt(item.price, 10) }))))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const removeItem = (id) => setSelectedItems(selectedItems.filter(i => i.id !== id));

  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const filteredProducts = products.filter(item => {
    if (item['브랜드'] && item['브랜드'].trim() !== '' && item['브랜드'] !== carSelections.manufacturer) return false;
    if (item['차종'] && item['차종'].trim() !== '' && item['차종'] !== carSelections.model) return false;
    if (item['연식'] && item['연식'].trim() !== '' && String(item['연식']) !== String(carSelections.year)) return false;
    if (item['세부모델'] && item['세부모델'].trim() !== '' && item['세부모델'] !== carSelections.detailedModel) return false;
    return true;
  });

  const groupedProducts = filteredProducts.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Calendar logic
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const prevNumberOfDays = new Date(year, month, 0).getDate();

  const prevDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDays.push({ day: prevNumberOfDays - i, isCurrentMonth: false });
  }

  const currentDays = [];
  for (let i = 1; i <= numberOfDays; i++) {
    currentDays.push({ day: i, isCurrentMonth: true });
  }

  const nextDays = [];
  const totalCells = prevDays.length + currentDays.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    nextDays.push({ day: i, isCurrentMonth: false });
  }

  const allDays = [...prevDays, ...currentDays, ...nextDays];

  const isPastDate = (dayVal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month, dayVal);
    return target < today;
  };

  const isSelectedDate = (dayVal) => {
    if (!appointmentDate) return false;
    const [selY, selM, selD] = appointmentDate.split('-').map(Number);
    return selY === year && selM === month + 1 && selD === dayVal;
  };

  const handleSelectDay = (dayVal) => {
    const formattedM = String(month + 1).padStart(2, '0');
    const formattedD = String(dayVal).padStart(2, '0');
    setAppointmentDate(`${year}-${formattedM}-${formattedD}`);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => setCalDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalDate(new Date(year, month + 1, 1));

  const handleSubmit = async () => {
    if (!customer.trim()) { alert('고객명 및 연락처를 입력해주세요.'); return; }
    if (!appointmentDate) { alert('희망 예약 날짜를 선택해주세요.'); return; }
    if (selectedItems.length === 0) { alert('최소 1개 이상의 정비 항목을 선택해주세요.'); return; }
    setLoading(true);
    const reservationData = {
      customer,
      appointmentDate,
      car: `${carSelections.manufacturer} ${carSelections.model} (${carSelections.year}) - ${carSelections.detailedModel}`,
      items: selectedItems.map(i => i.name),
      total: `${totalPrice.toLocaleString()}원`
    };
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      if (res.ok) {
        alert('✅ 예약이 완료되었습니다!\n빠른 시일 내에 연락드리겠습니다.');
        onComplete();
      } else {
        alert('❌ 예약 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('❌ 네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-selection-root">
      {/* LEFT PANEL: Cart + Summary */}
      <aside className="product-sidebar">
        <div className="sidebar-header">
          <button className="back-pill" onClick={onBack}>
            <ArrowLeft size={15}/> 차량 재선택
          </button>
        </div>

        <div className="car-summary-card">
          <p className="summary-sub">선택하신 차량</p>
          <h3 className="summary-car">
            {carSelections.manufacturer} <span>{carSelections.model}</span>
          </h3>
          <p className="summary-detail">{carSelections.year}년형 · {carSelections.detailedModel}</p>
        </div>

        <div className="cart-section">
          <div className="cart-header">
            <ShoppingCart size={18}/>
            <span>선택 항목 ({selectedItems.length})</span>
          </div>

          {selectedItems.length === 0 ? (
            <div className="cart-empty">원하시는 서비스를 선택해주세요</div>
          ) : (
            <div className="cart-items">
              {selectedItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <span>{item.name}</span>
                    <strong>{item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}</strong>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="cart-divider"/>
          <div className="total-row">
            <span>총 견적 금액</span>
            <strong className="total-amount">{totalPrice.toLocaleString()}원</strong>
          </div>
        </div>

        <div className="customer-section">
          <label className="input-label">고객명 / 연락처</label>
          <input
            type="text"
            className="input-field"
            placeholder="예: 홍길동  010-1234-5678"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
          />
        </div>

        <div className="customer-section appointment-section" style={{ position: 'relative' }}>
          <label className="input-label">희망 예약 날짜</label>
          <div className="date-picker-wrap">
            <input
              type="text"
              className="input-field date-input-field"
              placeholder="방문 희망 날짜 선택"
              value={appointmentDate ? `${appointmentDate}` : ''}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              style={{ cursor: 'pointer' }}
            />
            <button 
              type="button" 
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              📅
            </button>
          </div>
          
          {showCalendar && (
            <div className="compact-calendar-popup">
              <div className="cal-header">
                <button type="button" className="cal-nav-btn" onClick={handlePrevMonth}>&lt;</button>
                <span className="cal-title">{year}년 {month + 1}월</span>
                <button type="button" className="cal-nav-btn" onClick={handleNextMonth}>&gt;</button>
              </div>
              <div className="cal-weekdays">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
              </div>
              <div className="cal-days-grid">
                {allDays.map((item, idx) => {
                  if (!item.isCurrentMonth) {
                    return <span key={idx} className="cal-day pad">{item.day}</span>;
                  }
                  const disabled = isPastDate(item.day);
                  const selected = isSelectedDate(item.day);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`cal-day active-day ${selected ? 'selected' : ''}`}
                      disabled={disabled}
                      onClick={() => handleSelectDay(item.day)}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          className="btn-primary submit-btn"
          onClick={handleSubmit}
          disabled={loading || selectedItems.length === 0 || !customer.trim() || !appointmentDate}
        >
          {loading ? '전송 중...' : '예약 확정'}
        </button>
      </aside>

      {/* RIGHT PANEL: Product List */}
      <div className="product-catalog">
        <div className="catalog-header">
          <h3>정비 서비스 선택</h3>
          <p>원하시는 항목을 여러 개 선택할 수 있습니다</p>
        </div>

        {Object.entries(groupedProducts).map(([cat, items]) => (
          <div key={cat} className="catalog-category">
            <h4 className="category-title">{categoryLabels[cat] || cat}</h4>
            <div className="catalog-grid">
              {items.map(item => {
                const isSelected = !!selectedItems.find(i => i.id === item.id);
                return (
                  <button
                    key={item.id}
                    className={`catalog-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleItem(item)}
                  >
                    <div className="card-check">
                      {isSelected
                        ? <CheckCircle2 size={20} className="check-on"/>
                        : <div className="check-off"/>
                      }
                    </div>
                    <div className="card-body">
                      <span className="card-name">{item.name}</span>
                      <span className="card-price">
                        {item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSelection;
