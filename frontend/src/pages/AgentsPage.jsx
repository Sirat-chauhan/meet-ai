import React from "react";
import { COLORS } from "../utils/constants";
import { Button as Btn } from "../components/ui/Button";

export function AgentsPage({ agents, onNewAgent }) {
  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h1 style={{ color: COLORS.text, fontSize: 24, fontWeight: 700, margin: 0 }}>My Agents</h1>
        <Btn onClick={onNewAgent}>+ New Agent</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {agents.map((agent) => (
          <div key={agent.id} style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24,
            cursor: "pointer", transition: "all 0.2s"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.green; e.currentTarget.style.background = COLORS.cardHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.card; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#1a2a1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{agent.emoji}</div>
              <div>
                <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 16 }}>{agent.name}</div>
                <div style={{ color: COLORS.muted, fontSize: 13 }}>{agent.meetings} meetings</div>
              </div>
            </div>
            <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{agent.instructions.substring(0, 80)}...</p>
          </div>
        ))}
        <div onClick={onNewAgent} style={{
          background: "transparent", border: `2px dashed ${COLORS.border}`, borderRadius: 16, padding: 24,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 12, cursor: "pointer", transition: "all 0.2s", minHeight: 160
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.green; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: COLORS.muted }}>+</div>
          <span style={{ color: COLORS.muted, fontSize: 14, fontWeight: 600 }}>Create New Agent</span>
        </div>
      </div>
    </div>
  );
}
