import React, { useState, useEffect } from 'react';
import { X, Bus, Bell } from 'lucide-react';

const COLORS = [
  { value: '#FFCDD2', label: 'Math/Red' },
  { value: '#C8E6C9', label: 'English/Green' },
  { value: '#BBDEFB', label: 'Science/Blue' },
  { value: '#FFE082', label: 'Art/Orange' },
  { value: '#E1BEE7', label: 'Music/Purple' },
  { value: '#FFCC80', label: 'Sport/Yellow' }
];

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

const ALARM_OPTIONS = [
  { value: -1, label: '알람 끄기' },
  { value: 0, label: '정각 알람' },
  { value: 10, label: '10분 전' },
  { value: 20, label: '20분 전' },
  { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전' }
];

const generateTimeOptions = () => {
  const options = [];
  for (let i = 9; i <= 21; i++) {
    for (let j = 0; j < 60; j += 10) { // Changed to 10 min interval for shuttle precision
      const hour = i.toString().padStart(2, '0');
      const min = j.toString().padStart(2, '0');
      options.push(`${hour}:${min}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Default form state
const defaultForm = {
  id: null,
  title: '',
  days: ['월'],
  startTime: '13:00',
  endTime: '14:00',
  color: COLORS[0].value,
  hasShuttle: false,
  shuttleTime: '12:30',
  shuttleLocation: '',
  alarmMinutesBefore: -1,
  memo: ''
};

export default function ScheduleModal({ isOpen, onClose, onSave, onDelete, initialData }) {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultForm,
        ...initialData,
        days: initialData.days || (initialData.day ? [initialData.day] : ['월'])
      });
    } else {
      setFormData(defaultForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('학원(과목) 이름을 입력해주세요.');
      return;
    }
    
    if (!formData.days || formData.days.length === 0) {
      alert('최소 하루 이상의 요일을 선택해주세요.');
      return;
    }
    
    // Validate time
    const [h1, m1] = formData.startTime.split(':').map(Number);
    const [h2, m2] = formData.endTime.split(':').map(Number);
    if (h1 * 60 + m1 >= h2 * 60 + m2) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    onSave({
      ...formData,
      id: formData.id || Date.now().toString()
    });
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" style={{ animation: 'fadeIn 0.2s ease-out' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{initialData ? '일정 수정' : '새 일정 추가'}</h2>
            <button type="button" className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {/* 기본 정보 */}
            <div className="form-group">
              <label>학원명 / 과목</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="예: 영어학원, 태권도" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>요일 (다중 선택 가능)</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {DAYS.map(day => {
                  const isSelected = formData.days && formData.days.includes(day);
                  return (
                    <button 
                      key={day}
                      type="button" 
                      onClick={() => {
                        if (isSelected) {
                          setFormData({...formData, days: formData.days.filter(d => d !== day)});
                        } else {
                          setFormData({...formData, days: [...(formData.days || []), day]});
                        }
                      }}
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid var(--color-kakao-border)',
                        background: isSelected ? 'var(--color-kakao-brown)' : 'var(--color-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      {day}요일
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>시작 시간</label>
                <select 
                  className="form-control"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>종료 시간</label>
                <select 
                  className="form-control"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                >
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-kakao-border)', margin: '0.5rem 0' }} />

            {/* 알람 설정 */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Bell size={16} /> 알람 설정
              </label>
              <select 
                className="form-control"
                value={formData.alarmMinutesBefore}
                onChange={(e) => setFormData({...formData, alarmMinutesBefore: parseInt(e.target.value)})}
              >
                {ALARM_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>*알람 시간: 시작시간 기준</small>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-kakao-border)', margin: '0.5rem 0' }} />

            {/* 셔틀 설정 */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.hasShuttle}
                  onChange={(e) => setFormData({...formData, hasShuttle: e.target.checked})}
                  style={{ width: '16px', height: '16px' }}
                />
                <Bus size={18} /> 셔틀 탑승 여부
              </label>
            </div>

            {formData.hasShuttle && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-kakao-border)' }}>
                <div className="form-group">
                  <label>탑승 시간</label>
                  <select 
                    className="form-control"
                    value={formData.shuttleTime}
                    onChange={(e) => setFormData({...formData, shuttleTime: e.target.value})}
                  >
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>탑승 위치</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="예: 아파트 단지 앞" 
                    value={formData.shuttleLocation}
                    onChange={(e) => setFormData({...formData, shuttleLocation: e.target.value})}
                  />
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-kakao-border)', margin: '0.5rem 0' }} />

            {/* 메모 설정 */}
            <div className="form-group">
              <label>상세 메모 (준비물, 특이사항 등)</label>
              <textarea 
                className="form-control" 
                rows="3"
                placeholder="해당 일정에 대한 메모를 자유롭게 적어주세요." 
                value={formData.memo || ''}
                onChange={(e) => setFormData({...formData, memo: e.target.value})}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label>색상 테마</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`color-option ${formData.color === c.value ? 'selected' : ''}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setFormData({...formData, color: c.value})}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            {initialData && (
              <button 
                type="button" 
                className="btn-danger" 
                style={{ marginRight: 'auto' }}
                onClick={() => {
                  if (window.confirm('이 일정을 삭제하시겠습니까?')) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
              >
                삭제
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
