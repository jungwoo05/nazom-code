import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ALL_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function DismissalModal({ isOpen, onClose, onSave, childInfo }) {
  const [times, setTimes] = useState({});

  useEffect(() => {
    if (childInfo) {
      if (childInfo.schoolDismissalTimes) {
        setTimes(childInfo.schoolDismissalTimes);
      } else if (childInfo.schoolDismissalTime) {
        // Fallback for previous single time
        const t = childInfo.schoolDismissalTime;
        setTimes({ '일': t, '월': t, '화': t, '수': t, '목': t, '금': t, '토': t });
      } else {
        setTimes({});
      }
    }
  }, [childInfo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(times);
    onClose();
  };

  const handleChange = (day, value) => {
    setTimes(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handleClear = (day) => {
    setTimes(prev => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>🎒 하원 시간 설정</h2>
            <button type="button" className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              각 요일별 하원 시간을 다르게 설정할 수 있습니다. 입력된 시간에 붉은 점선이 그려집니다.
            </p>
            {ALL_DAYS.map(day => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, width: '40px' }}>{day}요일</span>
                <input 
                  type="time" 
                  className="form-control"
                  style={{ flex: 1 }}
                  value={times[day] || ''} 
                  onChange={(e) => handleChange(day, e.target.value)}
                />
                <button type="button" onClick={() => handleClear(day)} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>초기화</button>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}
