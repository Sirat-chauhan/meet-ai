import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import { Button as Btn } from "../components/ui/Button";

export function MeetingDetailPage({ meeting, onBack }) {
  const [tab, setTab] = useState("summary");
  const [started, setStarted] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState([
    { role: "user", text: "Who were the two people talking?" },
    { role: "agent", text: "The conversation involved John Doe and " + meeting.agent + ".", agent: meeting.agent }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMsg = async () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    setChatMsg("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are ${meeting.agent}, an AI assistant. The user is asking about a meeting titled "${meeting.title}". Answer concisely and helpfully.`,
          messages: [{ role: "user", content: userMsg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm processing your question about the meeting.";
      setMessages((m) => [...m, { role: "agent", text: reply, agent: meeting.agent }]);
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "I've analyzed the meeting and can answer questions about the key discussions, decisions, and participants.", agent: meeting.agent }]);
    }
    setLoading(false);
  };

  if (inCall) return (
    <div style={{ height: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.green, animation: "pulse 1.5s infinite" }} />
        <span style={{ color: COLORS.text, fontWeight: 600 }}>{meeting.title}</span>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 16, padding: "0 24px" }}>
        <div style={{ flex: 1, background: "#111", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 64 }}>{meeting.emoji}</div>
          <div style={{ color: COLORS.muted, fontSize: 14 }}>{meeting.agent}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 3, background: COLORS.green, borderRadius: 2, animation: `wave 0.8s ease-in-out ${i * 0.15}s infinite alternate`, height: 16 + Math.random() * 16 }} />
            ))}
          </div>
        </div>
        <div style={{ width: 180, background: "#111", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0f0a", fontWeight: 700, fontSize: 18 }}>JD</div>
          <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 8 }}>You</div>
          <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>🎤 Muted</div>
        </div>
      </div>
      <div style={{ padding: "20px", display: "flex", justifyContent: "center", gap: 16 }}>
        {["🎤", "📷", "😊", "↗", "⏺"].map((icon, i) => (
          <button key={i} style={{
            width: 48, height: 48, borderRadius: "50%", background: i === 0 ? "#ef4444" : "#222",
            border: "none", fontSize: 18, cursor: "pointer", transition: "transform 0.15s"
          }}>{icon}</button>
        ))}
        <button onClick={() => setInCall(false)} style={{
          width: 48, height: 48, borderRadius: "50%", background: "#ef4444",
          border: "none", fontSize: 18, cursor: "pointer"
        }}>📵</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, color: COLORS.muted, fontSize: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 14, padding: 0 }}>My Meetings</button>
        <span>›</span>
        <span style={{ color: COLORS.text, fontWeight: 600 }}>{meeting.title}</span>
      </div>

      {!started ? (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16,
          padding: "80px 40px", textAlign: "center"
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎥</div>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Not started yet</h2>
          <p style={{ color: COLORS.muted, fontSize: 15, marginBottom: 32 }}>Once you start this meeting, a summary will appear here</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Btn onClick={onBack} variant="secondary">Cancel meeting</Btn>
            <Btn onClick={() => { setStarted(true); setInCall(true); }} style={{ display: "flex", alignItems: "center", gap: 6 }}>🎥 Start meeting</Btn>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
            {["summary", "transcript", "recording", "askAI"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer",
                background: "transparent",
                color: tab === t ? COLORS.green : COLORS.muted,
                border: "none", borderBottom: tab === t ? `2px solid ${COLORS.green}` : "2px solid transparent",
                fontFamily: "inherit", transition: "all 0.2s", textTransform: "capitalize"
              }}>{t === "askAI" ? "Ask AI" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>

          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
            {tab === "summary" && (
              <div style={{ padding: 32 }}>
                <h3 style={{ color: COLORS.text, fontWeight: 700, marginBottom: 16 }}>Meeting Summary</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "Key Insights", icon: "💡", items: ["Discussed project timeline and milestones", "Identified 3 critical blockers", "Team alignment achieved on priorities"] },
                    { label: "Action Items", icon: "✅", items: ["Follow up with design team by Friday", "Schedule technical review", "Update project roadmap"] },
                  ].map((section) => (
                    <div key={section.label} style={{ background: "#0a0f0a", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>{section.icon} {section.label}</div>
                      {section.items.map((item, i) => (
                        <div key={i} style={{ color: COLORS.muted, fontSize: 14, padding: "6px 0", borderBottom: i < section.items.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                          • {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: "#0a0f0a", borderRadius: 12, padding: 20, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 12 }}>📊 Overview</div>
                  <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.8 }}>
                    The {meeting.title} meeting was a productive session between the team. The agent {meeting.agent} facilitated discussions around key topics and helped synthesize important decisions for future action.
                  </p>
                </div>
              </div>
            )}
            {tab === "transcript" && (
              <div style={{ padding: 32 }}>
                <h3 style={{ color: COLORS.text, fontWeight: 700, marginBottom: 20 }}>Full Transcript</h3>
                {[
                  { speaker: "JD", time: "0:00", text: "Hello! Thanks for joining today." },
                  { speaker: meeting.agent, time: "0:02", text: "Great to be here! I'm ready to assist with the session." },
                  { speaker: "JD", time: "0:15", text: "Let's go over the main agenda items for today." },
                  { speaker: meeting.agent, time: "0:18", text: "Absolutely. I've reviewed the background materials and have some insights to share." },
                  { speaker: "JD", time: "1:02", text: "What are your thoughts on the current approach?" },
                  { speaker: meeting.agent, time: "1:06", text: "Based on the data, I'd recommend a phased rollout strategy to minimize risk while maximizing impact." },
                ].map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                    <div style={{ minWidth: 80, color: COLORS.muted, fontSize: 12, paddingTop: 2 }}>{line.time}</div>
                    <div>
                      <div style={{ color: COLORS.green, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{line.speaker}</div>
                      <div style={{ color: COLORS.text, fontSize: 14, lineHeight: 1.6 }}>{line.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === "recording" && (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h3 style={{ color: COLORS.text, fontWeight: 700, marginBottom: 8 }}>Recording Available</h3>
                <p style={{ color: COLORS.muted, marginBottom: 24 }}>Duration: {meeting.duration}</p>
                <div style={{ background: "#0a0f0a", borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.green, border: "none", cursor: "pointer", fontSize: 16 }}>▶</button>
                    <div style={{ flex: 1, height: 4, background: COLORS.border, borderRadius: 2 }}>
                      <div style={{ width: "35%", height: "100%", background: COLORS.green, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: COLORS.muted, fontSize: 13 }}>35:00</span>
                  </div>
                </div>
                <Btn>⬇ Download Recording</Btn>
              </div>
            )}
            {tab === "askAI" && (
              <div style={{ display: "flex", flexDirection: "column", height: 480 }}>
                <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 12 }}>
                      {msg.role === "agent" && (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a2a1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{meeting.emoji}</div>
                      )}
                      <div style={{
                        maxWidth: "70%", padding: "12px 16px", borderRadius: 12, fontSize: 14, lineHeight: 1.6,
                        background: msg.role === "user" ? COLORS.green : "#1a2a1e",
                        color: msg.role === "user" ? "#0a0f0a" : COLORS.text,
                        borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                        borderBottomLeftRadius: msg.role === "agent" ? 4 : 12,
                      }}>{msg.text}</div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a2a1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{meeting.emoji}</div>
                      <div style={{ background: "#1a2a1e", padding: "12px 20px", borderRadius: 12, display: "flex", gap: 6 }}>
                        {[0, 1, 2].map((i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.green, animation: `bounce 0.8s ${i * 0.15}s infinite` }} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 12 }}>
                  <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                    placeholder="Ask about this meeting..." style={{
                      flex: 1, background: "#0a0f0a", border: `1px solid ${COLORS.border}`, borderRadius: 8,
                      padding: "11px 16px", color: COLORS.text, fontSize: 14, outline: "none", fontFamily: "inherit"
                    }} />
                  <button onClick={sendMsg} style={{
                    background: COLORS.green, border: "none", borderRadius: 8, padding: "11px 20px",
                    color: "#0a0f0a", fontWeight: 700, cursor: "pointer", fontSize: 16
                  }}>➤</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
