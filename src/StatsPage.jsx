import { useState } from "react";
import { ACTIVITIES, getDayLabel, getDisplayDate } from "./App";
import "./StatsPage.css";

export default function StatsPage({ logs, allDates, loading }) {
  const [expandedDate, setExpandedDate] = useState(null);

  if (loading) return <p className="loading">Loading stats…</p>;

  const totalDays = allDates.length;

  // ── Per-activity totals ──────────────────────────────────────────────────────
  const activityTotals = ACTIVITIES.map((act) => {
    const count = allDates.filter((d) => logs[d]?.[act.key]).length;
    const pct   = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
    return { ...act, count, pct };
  }).sort((a, b) => b.count - a.count);

  // ── Best day (most activities done) ─────────────────────────────────────────
  let bestDay = null, bestCount = 0;
  allDates.forEach((d) => {
    const c = ACTIVITIES.filter((a) => logs[d]?.[a.key]).length;
    if (c > bestCount) { bestCount = c; bestDay = d; }
  });

  // ── Perfect days (all 6 done) ────────────────────────────────────────────────
  const perfectDays = allDates.filter(
    (d) => ACTIVITIES.filter((a) => logs[d]?.[a.key]).length === ACTIVITIES.length
  ).length;

  return (
    <div className="stats-page">

      {/* ── Summary cards ── */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-val">{totalDays}</span>
          <span className="summary-label">Days Tracked</span>
        </div>
        <div className="summary-card accent">
          <span className="summary-val">{perfectDays}</span>
          <span className="summary-label">Perfect Days ✦</span>
        </div>
        <div className="summary-card">
          <span className="summary-val">
            {totalDays > 0
              ? Math.round(
                  allDates.reduce(
                    (sum, d) => sum + ACTIVITIES.filter((a) => logs[d]?.[a.key]).length,
                    0
                  ) / totalDays
                )
              : 0}
            <span className="summary-unit">/{ACTIVITIES.length}</span>
          </span>
          <span className="summary-label">Avg / Day</span>
        </div>
      </div>

      {/* ── Activity breakdown ── */}
      <section className="stats-section">
        <h3 className="section-title">ACTIVITY BREAKDOWN</h3>
        <div className="breakdown-list">
          {activityTotals.map((act, i) => (
            <div key={act.key} className="breakdown-row">
              <div className="breakdown-meta">
                <span className="breakdown-rank">#{i + 1}</span>
                <span className="breakdown-icon">{act.icon}</span>
                <div className="breakdown-info">
                  <span className="breakdown-label">{act.label}</span>
                  {act.duration && <span className="breakdown-dur">{act.duration}</span>}
                </div>
                <div className="breakdown-count-wrap">
                  <span className="breakdown-count">{act.count}</span>
                  <span className="breakdown-total">/{totalDays} days</span>
                </div>
                <span className="breakdown-pct">{act.pct}%</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${act.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── History ── */}
      <section className="stats-section">
        <h3 className="section-title">FULL HISTORY</h3>

        {allDates.length === 0 ? (
          <p className="empty-note">No history yet — start logging on the Today tab!</p>
        ) : (
          <div className="history-list">
            {allDates.map((dateStr) => {
              const log      = logs[dateStr] || {};
              const done     = ACTIVITIES.filter((a) => log[a.key]);
              const missed   = ACTIVITIES.filter((a) => !log[a.key]);
              const count    = done.length;
              const pct      = Math.round((count / ACTIVITIES.length) * 100);
              const perfect  = count === ACTIVITIES.length;
              const isOpen   = expandedDate === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`history-row ${perfect ? "perfect" : ""} ${isOpen ? "open" : ""}`}
                >
                  {/* ── Row header ── */}
                  <button
                    className="history-row-btn"
                    onClick={() => setExpandedDate(isOpen ? null : dateStr)}
                  >
                    <div className="history-date-col">
                      <span className="history-day">{getDayLabel(dateStr)}</span>
                      <span className="history-date">{getDisplayDate(dateStr)}</span>
                    </div>

                    {/* Activity dots */}
                    <div className="history-dots">
                      {ACTIVITIES.map((act) => (
                        <span
                          key={act.key}
                          className={`history-dot ${log[act.key] ? "done" : ""}`}
                          title={act.label}
                        />
                      ))}
                    </div>

                    <div className="history-right">
                      <span className={`history-score ${perfect ? "perfect-score" : ""}`}>
                        {count}/{ACTIVITIES.length}
                      </span>
                      {perfect && <span className="perfect-badge">✦</span>}
                      <span className="chevron">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* ── Expanded detail ── */}
                  {isOpen && (
                    <div className="history-detail">
                      {/* Mini bar */}
                      <div className="detail-bar-track">
                        <div className="detail-bar-fill" style={{ width: `${pct}%` }} />
                        <span className="detail-bar-pct">{pct}%</span>
                      </div>

                      {done.length > 0 && (
                        <div className="detail-group">
                          <span className="detail-group-label">✓ Completed</span>
                          <div className="detail-chips">
                            {done.map((a) => (
                              <span key={a.key} className="chip chip-done">
                                {a.icon} {a.label}
                                {a.duration && <span className="chip-dur">{a.duration}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {missed.length > 0 && (
                        <div className="detail-group">
                          <span className="detail-group-label">✗ Missed</span>
                          <div className="detail-chips">
                            {missed.map((a) => (
                              <span key={a.key} className="chip chip-missed">
                                {a.icon} {a.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}