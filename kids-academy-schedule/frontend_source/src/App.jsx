import React, { useState, useEffect, useRef } from 'react';
import { Plus, UserPlus, Calendar as CalendarIcon, BookOpen, Clock, Settings, X } from 'lucide-react';
import Calendar from './components/Calendar';
import ScheduleModal from './components/ScheduleModal';
import DismissalModal from './components/DismissalModal';
import './App.css';

// Default initial data if LocalStorage is empty
const DEFAULT_CHILDREN = [
  { id: 'child-1', name: '첫째 자녀' }
];

const DEFAULT_SCHEDULES = {
  'child-1': []
};

// Map JS getDay() to our DAYS array
const DAY_MAP = ['일', '월', '화', '수', '목', '금', '토'];

// Helper to subtract minutes
const getAlarmTimeStr = (startTime, minutesBefore) => {
  if (minutesBefore < 0) return null;
  const [h, m] = startTime.split(':').map(Number);
  let totalMin = h * 60 + m - minutesBefore;
  if (totalMin < 0) totalMin += 24 * 60; 
  const ah = Math.floor(totalMin / 60);
  const am = totalMin % 60;
  return `${ah.toString().padStart(2, '0')}:${am.toString().padStart(2, '0')}`;
};

function App() {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissalModalOpen, setIsDismissalModalOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [childToDelete, setChildToDelete] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const triggeredAlarms = useRef(new Set()); // To prevent multiple rings in the same minute

  // Fetch initial data from backend API
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        const loadedChildren = data.children && data.children.length > 0 ? data.children : DEFAULT_CHILDREN;
        const loadedSchedules = data.schedules ? data.schedules : DEFAULT_SCHEDULES;
        setChildren(loadedChildren);
        setSchedules(loadedSchedules);
        
        const savedActive = localStorage.getItem('kids_academy_active_child');
        setActiveChildId(savedActive && loadedChildren.find(c => c.id === savedActive) ? savedActive : loadedChildren[0].id);
        
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setChildren(DEFAULT_CHILDREN);
        setSchedules(DEFAULT_SCHEDULES);
        setActiveChildId(DEFAULT_CHILDREN[0].id);
        setIsLoading(false);
      });
  }, []);

  // Sync to Backend
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isLoading) {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ children, schedules })
      }).catch(err => console.error('Failed to save data:', err));
    }
  }, [children, schedules, isLoading]);

  useEffect(() => {
    if (activeChildId) {
      localStorage.setItem('kids_academy_active_child', activeChildId);
    }
  }, [activeChildId]);

  // Push Permission Request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Alarm Scheduler Effect
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentDayStr = DAY_MAP[now.getDay()];
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMin = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentHour}:${currentMin}`;

      // Reset triggered alarms set at midnight
      if (timeStr === '00:00') {
        triggeredAlarms.current.clear();
      }

      // Check all schedules
      Object.keys(schedules).forEach(childId => {
        const childSchedules = schedules[childId];
        const childInfo = children.find(c => c.id === childId);
        
        childSchedules.forEach(schedule => {
          const isToday = schedule.days ? schedule.days.includes(currentDayStr) : schedule.day === currentDayStr;
          if (isToday && schedule.alarmMinutesBefore >= 0) {
            const alarmTime = getAlarmTimeStr(schedule.startTime, schedule.alarmMinutesBefore);
            
            // Generate a unique ID for today's alarm of this schedule
            const dateStr = now.toDateString(); 
            const alarmKey = `${schedule.id}-${dateStr}`;

            if (alarmTime === timeStr && !triggeredAlarms.current.has(alarmKey)) {
              triggeredAlarms.current.add(alarmKey);
              
              const title = `학원 갈 시간이에요! 🏃‍♀️`;
              const msg = `${childInfo?.name || '아이'}의 [${schedule.title}] 일정이 ${schedule.alarmMinutesBefore === 0 ? '지금 시작됩니다!' : `${schedule.alarmMinutesBefore}분 뒤 시작됩니다.`}`;
              
              // In-app alert
              alert(`${title}\n${msg}`);

              // Browser push notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body: msg, icon: '/favicon.ico' });
              }
            }
          }
        });
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkAlarms, 10000);
    return () => clearInterval(interval);
  }, [schedules, children]);

  // Handlers
  const handleAddChild = () => {
    setNewChildName('');
    setIsChildModalOpen(true);
  };

  const confirmAddChild = (e) => {
    e.preventDefault();
    if (newChildName && newChildName.trim()) {
      const newChild = { id: `child-${Date.now()}`, name: newChildName.trim() };
      setChildren([...children, newChild]);
      if (!schedules[newChild.id]) {
        setSchedules({ ...schedules, [newChild.id]: [] });
      }
      setActiveChildId(newChild.id);
      setIsChildModalOpen(false);
    }
  };

  const handleDeleteChild = (childId, childName) => {
    setChildToDelete({ id: childId, name: childName });
  };

  const confirmDeleteChild = () => {
    if (childToDelete) {
      const { id, name } = childToDelete;
      const nextChildren = children.filter(c => c.id !== id);
      setChildren(nextChildren);
      
      const nextSchedules = { ...schedules };
      delete nextSchedules[id];
      setSchedules(nextSchedules);
      
      if (activeChildId === id) {
        setActiveChildId(nextChildren.length > 0 ? nextChildren[0].id : null);
      }
      setChildToDelete(null);
    }
  };

  const activeSchedules = schedules[activeChildId] || [];
  const activeChildInfo = children.find(c => c.id === activeChildId);

  const handleUpdateDismissal = (timesObject) => {
    setChildren(prev => prev.map(c => 
      c.id === activeChildId ? { ...c, schoolDismissalTimes: timesObject } : c
    ));
  };

  const handleUpdateMemo = (memoText) => {
    setChildren(prev => prev.map(c => 
      c.id === activeChildId ? { ...c, memo: memoText } : c
    ));
  };

  const handleSaveSchedule = (scheduleData) => {
    setSchedules(prev => {
      const childSchedules = prev[activeChildId] || [];
      const existingIndex = childSchedules.findIndex(s => s.id === scheduleData.id);
      
      let newSchedules;
      if (existingIndex >= 0) {
        // Edit
        newSchedules = [...childSchedules];
        newSchedules[existingIndex] = scheduleData;
      } else {
        // Add
        newSchedules = [...childSchedules, scheduleData];
      }
      
      return { ...prev, [activeChildId]: newSchedules };
    });
  };

  const handleDeleteSchedule = (scheduleId) => {
    setSchedules(prev => {
      const childSchedules = prev[activeChildId] || [];
      const newSchedules = childSchedules.filter(s => s.id !== scheduleId);
      return { ...prev, [activeChildId]: newSchedules };
    });
  };

  const openNewScheduleModal = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const openEditScheduleModal = (schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="app-container app-loading animate-fade-in">
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in">
      <header className="header flat-panel">
        <h1>
          <CalendarIcon size={28} color="var(--color-primary)" />
          학원 시간표
        </h1>
        <button className="btn-primary" onClick={openNewScheduleModal}>
          <Plus size={20} />
          일정 추가
        </button>
      </header>

      <div className="child-tabs">
        {children.map(child => (
          <div 
            key={child.id}
            className={`child-tab ${activeChildId === child.id ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            onClick={() => setActiveChildId(child.id)}
          >
            <span>{child.name}</span>
            {activeChildId === child.id && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteChild(child.id, child.name); }}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  color: 'inherit', opacity: 0.8, borderRadius: '50%', padding: '2px' 
                }}
                title="자녀 삭제"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button className="add-child-btn" onClick={handleAddChild} title="자녀 추가">
          <UserPlus size={20} />
        </button>
      </div>

      {activeChildId && (
        <div style={{ padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>🎒 학교 하원 설정:</span>
          <button 
             className="btn-secondary" 
             style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
             onClick={() => setIsDismissalModalOpen(true)}
          >
             <Settings size={14} /> 요일별 시간 설정하기
          </button>
        </div>
      )}

      {activeChildId ? (
        activeSchedules.length > 0 ? (
          <Calendar 
            schedules={activeSchedules} 
            onEditSchedule={openEditScheduleModal} 
            schoolDismissalTimes={activeChildInfo?.schoolDismissalTimes || (activeChildInfo?.schoolDismissalTime ? {'일': activeChildInfo.schoolDismissalTime, '월': activeChildInfo.schoolDismissalTime, '화': activeChildInfo.schoolDismissalTime, '수': activeChildInfo.schoolDismissalTime, '목': activeChildInfo.schoolDismissalTime, '금': activeChildInfo.schoolDismissalTime, '토': activeChildInfo.schoolDismissalTime} : {})}
          />
        ) : (
          <div className="calendar-container flat-panel" style={{ background: 'var(--color-kakao-bg)' }}>
            <div className="empty-state animate-fade-in">
              <BookOpen />
              <h3>등록된 일정이 없습니다</h3>
              <p>우측 상단의 '일정 추가' 버튼을 눌러 새 학원 일정을 만들어주세요.</p>
            </div>
          </div>
        )
      ) : (
        <div className="calendar-container flat-panel">
          <div className="empty-state">
            <UserPlus />
            <h3>자녀 프로필을 먼저 추가해주세요</h3>
          </div>
        </div>
      )}

      {activeChildId && (
        <div className="memo-container flat-panel animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: '#FFFDF0', border: '1px solid #FFE082' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#191919' }}>
            <span role="img" aria-label="memo">📝</span> {activeChildInfo?.name} 알림장 / 특이사항
          </h3>
          <textarea
            className="form-control"
            rows="3"
            placeholder="예: 영어학원비 결제일은 15일, 금요일 태권도복 챙기기 등 자유롭게 적어주세요!"
            value={activeChildInfo?.memo || ''}
            onChange={(e) => handleUpdateMemo(e.target.value)}
            style={{ resize: 'vertical', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.1)', borderRadius: 0, paddingLeft: 0, paddingRight: 0 }}
          />
        </div>
      )}

      <ScheduleModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSchedule}
        onDelete={handleDeleteSchedule}
        initialData={editingSchedule}
      />
      
      <DismissalModal 
        isOpen={isDismissalModalOpen}
        onClose={() => setIsDismissalModalOpen(false)}
        onSave={handleUpdateDismissal}
        childInfo={activeChildInfo}
      />

      {isChildModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsChildModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '350px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={confirmAddChild}>
              <div className="modal-header">
                <h2>자녀 추가</h2>
                <button type="button" className="btn-icon" onClick={() => setIsChildModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>자녀의 이름을 입력해주세요</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="예: 첫째, 지우" 
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsChildModalOpen(false)}>취소</button>
                <button type="submit" className="btn-primary" disabled={!newChildName.trim()}>추가</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {childToDelete && (
        <div className="modal-overlay animate-fade-in" onClick={() => setChildToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '350px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>자녀 삭제</h2>
              <button type="button" className="btn-icon" onClick={() => setChildToDelete(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
                <strong>'{childToDelete.name}'</strong> 자녀 프로필과 모든 기준 일정을 삭제하시겠습니까?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setChildToDelete(null)}>취소</button>
              <button type="button" className="btn-danger" onClick={confirmDeleteChild}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
