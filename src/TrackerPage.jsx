import { useState, useRef, useEffect, useCallback } from "react";
import { ACTIVITIES, getDateStr, getDayLabel, getDisplayDate } from "./App";

function getRecentDays(n = 14) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDateStr(d));
  }
  return days;
}

export default function TrackerPage({ logs, loading, saving, onToggle }) {
  const today = getDateStr(new Date());
  const days  = getRecentDays(14);

  const [selectedDate, setSelectedDate] = useState(today);
  const [slideDir, setSlideDir]         = useState(null);   // "left" | "right" | null
  const [animKey, setAnimKey]           = useState(0);       // bump to re-trigger animation

  const stripRef   = useRef(null);
  const touchStart = useRef(null);   // { x, y, date }

  // ── Auto-scroll selected date button into view ──────────────────────────────
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const idx = days.indexOf(selectedDate);
    const btn = strip.children[idx];
    if (btn) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDate]);

  // ── Navigate to a date with slide direction ─────────────────────────────────
  const goTo = useCallback((newDate) => {
    if (newDate === selectedDate) return;
    setSlideDir(newDate > selectedDate ? "left" : "right");
    setAnimKey((k) => k + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  // ── Arrow nav ───────────────────────────────────────────────────────────────
  function goPrev() {
    const idx = days.indexOf(selectedDate);
    if (idx > 0) goTo(days[idx - 1]);
  }
  function goNext() {
    const idx = days.indexOf(selectedDate);
    if (idx < days.length - 1) goTo(days[idx + 1]);
  }

  // ── Touch / swipe on day panel ──────────────────────────────────────────────
  function onTouchStart(e) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, date: selectedDate };
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const t   = e.changedTouches[0];
    const dx  = t.clientX - touchStart.current.x;
    const dy  = Math.abs(t.clientY - touchStart.current.y);
    if (Math.abs(dx) > 50 && dy < 60) {
      if (dx < 0) goNext(); // swipe left → next day
      else         goPrev(); // swipe right → prev day
    }
    touchStart.current = null;
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  function completedCount(d) {
    return ACTIVITIES.filter((a) => logs[d]?.[a.key]).length;
  }

  const selectedLog = logs[selectedDate] || {};
  const totalDone   = completedCount(selectedDate);
  const percent     = Math.round((totalDone / ACTIVITIES.length) * 100);
  const idx         = days.indexOf(selectedDate);
  const canPrev     = idx > 0;
  const canNext     = idx < days.length - 1;

  return (
    <>
      {/* ── Date Strip ── */}
      <section className="date-strip-section">
        <div className="date-strip" ref={stripRef}>
          {days.map((d) => {
            const count      = completedCount(d);
            const full       = count === ACTIVITIES.length;
            const isSelected = d === selectedDate;
            const isToday    = d === today;
            return (
              <button
                key={d}
                className={`date-btn ${isSelected ? "selected" : ""} ${full ? "full" : ""} ${isToday ? "today" : ""}`}
                onClick={() => goTo(d)}
              >
                <span className="date-day">{getDayLabel(d)}</span>
                <span className="date-num">{new Date(d + "T00:00:00").getDate()}</span>
                <span className="date-dots">
                  {ACTIVITIES.map((a) => (
                    <span key={a.key} className={`dot ${logs[d]?.[a.key] ? "filled" : ""}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Day Panel ── */}
      <main
        className="main"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Arrow nav */}
        <div className="day-nav">
          <button className="nav-arrow" onClick={goPrev} disabled={!canPrev}>‹</button>

          {/* Sliding content */}
          <div
            key={animKey}
            className={`day-slide ${slideDir === "left" ? "slide-from-right" : slideDir === "right" ? "slide-from-left" : ""}`}
          >
            <div className="day-header">
              <div>
                <h2 className="day-title">
                  {selectedDate === today ? "TODAY" : getDayLabel(selectedDate)}
                  <span className="day-date"> — {getDisplayDate(selectedDate)}</span>
                </h2>
                <p className="day-sub">{totalDone} of {ACTIVITIES.length} completed</p>
              </div>

              <div className="progress-ring-wrap">
                <svg viewBox="0 0 60 60" className="progress-ring">
                  <circle cx="30" cy="30" r="25" className="ring-bg" />
                  <circle
                    cx="30" cy="30" r="25" className="ring-fg"
                    strokeDasharray={`${(percent / 100) * 157.08} 157.08`}
                    transform="rotate(-90 30 30)"
                  />
                </svg>
                <span className="ring-label">{percent}%</span>
              </div>
            </div>

            <div className="activities">
              {loading ? (
                <p className="loading">Loading your logs…</p>
              ) : (
                ACTIVITIES.map((act) => {
                  const done = !!selectedLog[act.key];
                  return (
                    <button
                      key={act.key}
                      className={`activity-card ${done ? "done" : ""}`}
                      onClick={() => onToggle(selectedDate, act.key)}
                      disabled={saving}
                    >
                      <span className="act-icon">{act.icon}</span>
                      <div className="act-info">
                        <span className="act-label">{act.label}</span>
                        {act.duration && <span className="act-duration">{act.duration}</span>}
                      </div>
                      <div className={`act-check ${done ? "checked" : ""}`}>{done ? "✓" : ""}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <button className="nav-arrow" onClick={goNext} disabled={!canNext}>›</button>
        </div>

        {saving && <p className="save-note">Saving…</p>}
      </main>

      {/* ── Heatmap ── */}
      <section className="heatmap-section">
        <h3 className="section-title">14-DAY OVERVIEW</h3>
        <div className="heatmap">
          {days.map((d) => {
            const count = completedCount(d);
            const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 5 ? 3 : 4;
            return (
              <div
                key={d}
                className={`heat-cell level-${level} ${d === selectedDate ? "heat-selected" : ""}`}
                onClick={() => goTo(d)}
                title={`${getDisplayDate(d)} — ${count}/${ACTIVITIES.length}`}
              >
                <span className="heat-label">{new Date(d + "T00:00:00").getDate()}</span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}