import React from "react";

export const StatusBadge = ({ status }) => {
  const styles = {
    completed: { bg: "#14532d22", border: "#22c55e44", color: "#4ade80", icon: "✓", label: "Completed" },
    upcoming: { bg: "#78350f22", border: "#f59e0b44", color: "#fbbf24", icon: "◷", label: "Upcoming" },
    cancelled: { bg: "#7f1d1d22", border: "#ef444444", color: "#f87171", icon: "✕", label: "Cancelled" },
  };
  const s = styles[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px",
      borderRadius: 20, border: `1px solid ${s.border}`, background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600, letterSpacing: "0.02em"
    }}>
      <span style={{ fontSize: 10 }}>{s.icon}</span> {s.label}
    </span>
  );
};
