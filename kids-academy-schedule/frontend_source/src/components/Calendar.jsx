import React from 'react';
import { Bus, Bell } from 'lucide-react';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const START_HOUR = 9;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;

// Helper to convert time string (e.g. "13:30") to top offset percentage
const timeToPixels = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  if (h < START_HOUR || h > END_HOUR) return 0; // Out of bounds safety
  
  const fromStart = (h - START_HOUR) * 60 + m;
  // 1 pixel = 1 minute visually, since 60px = 1 hour in our CSS
  return fromStart;
};

const getDurationPixels = (startStr, endStr) => {
  const [h1, m1] = startStr.split(':').map(Number);
  const [h2, m2] = endStr.split(':').map(Number);
  
  const totalMins = (h2 - h1) * 60 + (m2 - m1);
  return totalMins;
};

export default function Calendar({ schedules, onEditSchedule, schoolDismissalTimes }) {
  // Generate time labels
  const timeLabels = Array.from({ length: TOTAL_HOURS }, (_, i) => {
    const hour = START_HOUR + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="calendar-container flat-panel animate-fade-in">
      <div className="calendar-header">
        <div className="calendar-header-cell" style={{ borderRight: '1px solid var(--color-kakao-border)' }}>Time</div>
        {DAYS.map(day => (
          <div key={day} className="calendar-header-cell day-col">
            {day}
          </div>
        ))}
      </div>
      
      <div className="calendar-body">
        {/* Time Column */}
        <div className="time-col">
          {timeLabels.map(time => (
            <div key={time} className="time-cell">
              {time}
            </div>
          ))}
        </div>
        
        {/* Background Grid Lines per hour */}
        {timeLabels.map((_, i) => (
          <div key={`hr-${i}`} className="grid-line" style={{ top: `${i * 60}px` }} />
        ))}

        {/* Day Columns */}
        {DAYS.map((day, dayIndex) => {
          const daySchedules = schedules.filter(s => {
            if (s.days && s.days.includes(day)) return true;
            if (!s.days && s.day === day) return true; // fallback for older data
            return false;
          });
          
          const dayDismissalTime = schoolDismissalTimes ? schoolDismissalTimes[day] : null;

          return (
            <div key={day} className="day-col" style={{ gridColumn: dayIndex + 2, gridRow: 1 }}>
              
              {/* School Dismissal Line per day */}
              {dayDismissalTime && (
                <div className="dismissal-line" style={{ top: `${timeToPixels(dayDismissalTime)}px`, gridColumn: 'auto' }}>
                  <span>🎒 {dayDismissalTime}</span>
                </div>
              )}
              {/* Render Schedules */}
              {daySchedules.map(schedule => {
                const topPx = timeToPixels(schedule.startTime);
                const heightPx = getDurationPixels(schedule.startTime, schedule.endTime);
                
                return (
                  <div 
                    key={schedule.id}
                    className="schedule-card"
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      backgroundColor: schedule.color,
                      borderLeft: `4px solid ${schedule.color === '#FFFFFF' ? '#E5E5E5' : schedule.color}` // simple fallback
                    }}
                    onClick={() => onEditSchedule(schedule)}
                  >
                    <div className="schedule-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{schedule.title}</span>
                      {schedule.alarmMinutesBefore >= 0 && <Bell size={16} color="#191919" />}
                    </div>
                    <div className="schedule-time" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      <span style={{ letterSpacing: '-0.5px' }}>{schedule.startTime} - {schedule.endTime}</span>
                      {schedule.hasShuttle && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#191919', fontWeight: 700, marginTop: '2px' }}>
                          <Bus size={14} color="#191919" /> {schedule.shuttleTime}탑승
                        </span>
                      )}
                      {schedule.memo && schedule.memo.trim() !== '' && (
                        <div style={{
                          marginTop: '4px',
                          fontSize: '0.75rem',
                          color: '#555',
                          background: 'rgba(255,255,255,0.5)',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: '1.2'
                        }}>
                          {schedule.memo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
