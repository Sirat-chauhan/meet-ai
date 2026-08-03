import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import { Button as Btn } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";

export function MeetingsPage({ meetings, onNewMeeting, onOpenMeeting }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "all" || m.status === statusFilter)
  );

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>My Meetings</h1>
        <Btn onClick={onNewMeeting} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          + New Meeting
        </Btn>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted, fontSize: 14 }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by name..."
            style={{
              width: "100%", padding: "9px 12px 9px 36px", background: COLORS.card,
              border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text,
              fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box"
            }} />
        </div>
        {["all", "completed", "upcoming", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: statusFilter === s ? COLORS.green : COLORS.card,
            color: statusFilter === s ? "#0a0f0a" : COLORS.muted,
            border: `1px solid ${statusFilter === s ? COLORS.green : COLORS.border}`,
            fontFamily: "inherit", transition: "all 0.2s", textTransform: "capitalize"
          }}>{s}</button>
        ))}
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.map((m, i) => (
          <div key={m.id} onClick={() => onOpenMeeting(m)}
            style={{
              display: "flex", alignItems: "center", padding: "18px 24px",
              borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.border}` : "none",
              cursor: "pointer", transition: "background 0.15s",
              gap: 16
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = COLORS.cardHover}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: COLORS.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{m.title}</div>
              <div style={{ color: COLORS.muted, fontSize: 13 }}>↳ {m.agent} {m.emoji} {m.date}</div>
            </div>
            <StatusBadge status={m.status} />
            <div style={{ color: COLORS.muted, fontSize: 13, display: "flex", alignItems: "center", gap: 6, minWidth: 90 }}>
              ⏱ {m.duration}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: COLORS.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>No meetings found</div>
            <div style={{ fontSize: 14 }}>Try a different search or filter</div>
          </div>
        )}
      </div>
    </div>
  );
}
