import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import TrackerPage from "./TrackerPage";
import StatsPage from "./StatsPage";
import "./App.css";

export const ACTIVITIES = [
  { key: "dsa",          label: "DSA",          duration: "2 hr",   icon: "⚡" },
  { key: "data_science", label: "Data Science",  duration: "1 hr",   icon: "🧪" },
  { key: "aptitude",     label: "Aptitude",      duration: "45 min", icon: "🎯" },
  { key: "college",      label: "College",       duration: "",       icon: "🏛️" },
  { key: "internship",   label: "Internship",    duration: "",       icon: "💼" },
  { key: "gym",          label: "Gym",           duration: "",       icon: "🏋️" },
];

export function getDateStr(date) {
  return date.toISOString().split("T")[0];
}

export function getDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
}

export function getDisplayDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function App() {
  const [page, setPage]         = useState("tracker");
  const [logs, setLogs]         = useState({});
  const [allDates, setAllDates] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("date", { ascending: false });

    if (!error && data) {
      const map = {};
      const dates = [];
      data.forEach((row) => {
        map[row.date] = {
          dsa: row.dsa, data_science: row.data_science,
          aptitude: row.aptitude, college: row.college,
          internship: row.internship, gym: row.gym,
        };
        dates.push(row.date);
      });
      setLogs(map);
      setAllDates(dates);
    }
    setLoading(false);
  }

  async function toggleActivity(dateStr, key) {
    const current = logs[dateStr] || {};
    const updated  = { ...current, [key]: !current[key] };

    setLogs((prev) => ({ ...prev, [dateStr]: updated }));
    setSaving(true);

    const { error } = await supabase.from("daily_logs").upsert(
      {
        date: dateStr,
        dsa:          updated.dsa          ?? false,
        data_science: updated.data_science ?? false,
        aptitude:     updated.aptitude     ?? false,
        college:      updated.college      ?? false,
        internship:   updated.internship   ?? false,
        gym:          updated.gym          ?? false,
      },
      { onConflict: "date" }
    );

    if (error) {
      console.error("Save failed:", error.message);
      setLogs((prev) => ({ ...prev, [dateStr]: current }));
    } else {
      setAllDates((prev) =>
        prev.includes(dateStr) ? prev : [dateStr, ...prev].sort((a, b) => b.localeCompare(a))
      );
    }
    setSaving(false);
  }

  function streakCount() {
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = getDateStr(d);
      const log = logs[ds] || {};
      const done = ACTIVITIES.filter((a) => log[a.key]).length;
      if (done === ACTIVITIES.length) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  }

  const streak = streakCount();

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo-mark">◈</span>
          <div>
            <h1 className="logo-text">SHASHANK'S LOG</h1>
            <p className="logo-sub">Daily Consistency Tracker</p>
          </div>
        </div>
        <div className="header-right">
          <div className="stat-pill">
            <span className="stat-val">{streak}</span>
            <span className="stat-label">DAY STREAK 🔥</span>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${page === "tracker" ? "active" : ""}`}
          onClick={() => setPage("tracker")}
        >
          <span className="nav-icon">📅</span> Today
        </button>
        <button
          className={`nav-tab ${page === "stats" ? "active" : ""}`}
          onClick={() => setPage("stats")}
        >
          <span className="nav-icon">📊</span> Stats &amp; History
        </button>
      </nav>

      {page === "tracker" && (
        <TrackerPage
          logs={logs}
          loading={loading}
          saving={saving}
          onToggle={toggleActivity}
        />
      )}
      {page === "stats" && (
        <StatsPage
          logs={logs}
          allDates={allDates}
          loading={loading}
        />
      )}
    </div>
  );
}