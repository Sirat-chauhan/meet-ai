import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import { useOutletContext } from "react-router-dom";

export function MeetingsPage({ meetings, onOpenMeeting }) {
  const context = useOutletContext();
  const openNewMeeting = context?.openNewMeeting;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "all" || m.status === statusFilter)
  );

  const getStatusChip = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "ok") {
      return <span style={{ background: "#d7f2e3", color: "#1e7c49", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>Completed</span>;
    }
    if (s === "active" || s === "live") {
      return <span style={{ background: "#deeeff", color: "#225fa6", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>Active</span>;
    }
    return <span style={{ background: "#faedd9", color: "#8f6a29", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>Pending</span>;
  };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {/* Meetings Card */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#161c26", margin: "0 0 16px" }}>My Meetings</h2>
        
        {/* Filters Row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name"
            style={{
              border: "1px solid #dde1e7", borderRadius: 8, background: "#ffffff",
              padding: "8px 12px", fontSize: 13, outline: "none", width: 220
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              border: "1px solid #dde1e7", borderRadius: 8, background: "#ffffff",
              padding: "8px 12px", fontSize: 13, outline: "none"
            }}
          >
            <option value="all">Status: All</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            style={{
              background: "#ffffff", color: "#6e7380", border: "1px solid #dde1e7",
              borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            Clear
          </button>
        </div>

        {/* Table Head */}
        <div style={{
          display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 1fr", gap: 10,
          fontSize: 11, color: "#767c89", textTransform: "uppercase", letterSpacing: "0.06em",
          padding: "0 12px", marginBottom: 8, fontWeight: 700
        }}>
          <span>Meeting</span>
          <span>Status</span>
          <span>Duration</span>
          <span>Action</span>
        </div>

        {/* Meeting Rows */}
        <div style={{ border: "1px solid #e6e8ed", borderRadius: 8, overflow: "hidden" }}>
          {filtered.map((m, i) => (
            <div key={m.id} style={{
              display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 1fr", gap: 10,
              alignItems: "center", padding: "12px 14px", background: "#ffffff",
              borderTop: i > 0 ? "1px solid #eceef2" : "none"
            }}>
              <div>
                <strong style={{ color: "#161c26", fontSize: 14, display: "block" }}>{m.title}</strong>
                <span style={{ color: "#6e7380", fontSize: 12 }}>{m.agent} {m.emoji} • {m.date}</span>
              </div>
              <div>{getStatusChip(m.status)}</div>
              <div style={{ color: "#6e7380", fontSize: 13 }}>{m.duration}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => onOpenMeeting(m)}
                  style={{
                    background: "#1fb15a", color: "#ffffff", border: "none",
                    borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Open
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://meet.jit.si/${m.id}`)}
                  style={{
                    background: "#ffffff", color: "#374151", border: "1px solid #d1d5db",
                    borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Copy Invite
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#6e7380" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <p style={{ margin: 0, fontSize: 14 }}>No meetings match current filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
