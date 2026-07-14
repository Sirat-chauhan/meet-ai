import React, { useState } from "react";

const COLORS = {
  bg: "#0a0f0a",
  sidebar: "#0d1410",
  card: "#111a14",
  cardHover: "#162019",
  green: "#22c55e",
  greenDark: "#16a34a",
  greenGlow: "#22c55e33",
  text: "#e8f5e9",
  muted: "#6b7f6e",
  border: "#1e2e22",
  accent: "#4ade80",
};

const MOCK_MEETINGS = [
  { id: 1, title: "Technical Interview With Senior Developer", agent: "Interview Assistant", emoji: "🤖", date: "May 17", status: "completed", duration: "45 minutes" },
  { id: 2, title: "Product Launch Presentation", agent: "Presentation Coach", emoji: "🎯", date: "May 16", status: "completed", duration: "1 hour" },
  { id: 3, title: "Spanish Language Practice Session", agent: "Language Tutor", emoji: "🌍", date: "May 15", status: "completed", duration: "30 minutes" },
  { id: 4, title: "Enterprise Sales Call", agent: "Sales Coach", emoji: "💼", date: "May 14", status: "completed", duration: "2 hours" },
  { id: 5, title: "Technical Support Session", agent: "Customer Support Assistant", emoji: "🔧", date: "May 13", status: "completed", duration: "50 minutes" },
  { id: 6, title: "New Feature Training", agent: "Training Coach", emoji: "📚", date: "May 12", status: "completed", duration: "40 minutes" },
  { id: 7, title: "Therapy Session", agent: "Therapy Assistant", emoji: "💙", date: "May 11", status: "upcoming", duration: "1 hour" },
  { id: 8, title: "Legal Consultation", agent: "Legal Scribe", emoji: "⚖️", date: "May 10", status: "upcoming", duration: "55 minutes" },
  { id: 9, title: "Medical Consultation", agent: "Medical Scribe", emoji: "🏥", date: "May 9", status: "cancelled", duration: "1 hour" },
];

const MOCK_AGENTS = [
  { id: 1, name: "Interview Assistant", emoji: "🤖", instructions: "You are an expert technical interviewer...", meetings: 12 },
  { id: 2, name: "Sales Coach", emoji: "💼", instructions: "You are a high-performance sales coach...", meetings: 8 },
  { id: 3, name: "Language Tutor", emoji: "🌍", instructions: "You are a patient language tutor...", meetings: 15 },
  { id: 4, name: "Therapy Assistant", emoji: "💙", instructions: "You are a compassionate therapy assistant...", meetings: 6 },
];

const StatusBadge = ({ status }) => {
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

const Modal = ({ title, subtitle, children, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "#00000088", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    animation: "fadeIn 0.15s ease"
  }}>
    <div style={{
      background: "#0f1a12", border: `1px solid ${COLORS.border}`, borderRadius: 16,
      padding: "32px", width: "100%", maxWidth: 480, boxShadow: "0 24px 80px #000a",
      animation: "slideUp 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
          <p style={{ color: COLORS.muted, fontSize: 14, margin: "4px 0 0" }}>{subtitle}</p>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 20,
          padding: 4, lineHeight: 1, borderRadius: 6, transition: "color 0.2s"
        }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, multiline }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: "block", color: COLORS.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        rows={4} style={{
          width: "100%", background: "#0a0f0a", border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14,
          outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
          transition: "border-color 0.2s"
        }} />
    ) : (
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", background: "#0a0f0a", border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: "10px 14px", color: COLORS.text, fontSize: 14,
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          transition: "border-color 0.2s"
        }} />
    )}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style: s }) => (
  <button onClick={onClick} style={{
    padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
    border: variant === "primary" ? "none" : `1px solid ${COLORS.border}`,
    background: variant === "primary" ? COLORS.green : "transparent",
    color: variant === "primary" ? "#0a0f0a" : COLORS.muted,
    transition: "all 0.2s", fontFamily: "inherit", ...s
  }}>{children}</button>
);

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "John Doe", email: "john.doe@test.com", password: "••••••••", confirm: "••••••••" });

  return (
    <div style={{
      minHeight: "100vh", background: "#f4f4f0", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20
    }}>
      <div style={{
        display: "flex", borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 760,
        boxShadow: "0 32px 80px #0004"
      }}>
        <div style={{ flex: 1, background: "#fff", padding: "48px 40px" }}>
          {mode === "login" ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Welcome back</h1>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>Login to your account</p>
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" />
              <Input label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" />
              <Btn onClick={onLogin} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15 }}>Sign in</Btn>
              <div style={{ textAlign: "center", margin: "20px 0", color: "#aaa", fontSize: 13 }}>Or continue with</div>
              <div style={{ display: "flex", gap: 12 }}>
                {["G", "⌥"].map((icon) => (
                  <button key={icon} style={{
                    flex: 1, padding: "11px", background: "#fff", border: "1px solid #e0e0e0",
                    borderRadius: 8, fontSize: 18, cursor: "pointer"
                  }}>{icon}</button>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign up</button>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Let's get started</h1>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>Create your account</p>
              <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="John Doe" />
              <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="m@example.com" />
              <Input label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Input label="Confirm Password" value={form.confirm} onChange={(v) => setForm({ ...form, confirm: v })} />
              <Btn onClick={onLogin} style={{ width: "100%", padding: "13px 20px", borderRadius: 8, fontSize: 15 }}>Sign up</Btn>
              <div style={{ textAlign: "center", margin: "20px 0", color: "#aaa", fontSize: 13 }}>Or continue with</div>
              <div style={{ display: "flex", gap: 10 }}>
                {["🍎", "G", "∞"].map((icon) => (
                  <button key={icon} style={{
                    flex: 1, padding: "11px", background: "#fff", border: "1px solid #e0e0e0",
                    borderRadius: 8, fontSize: 18, cursor: "pointer"
                  }}>{icon}</button>
                ))}
              </div>
              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#888" }}>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Sign in</button>
              </p>
            </>
          )}
        </div>
        <div style={{
          width: 280, background: "linear-gradient(160deg, #0d2015 0%, #0a1a0f 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36
          }}>🎯</div>
          <span style={{ color: "#e8f5e9", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>Meet.AI</span>
          <p style={{ color: "#4ade8088", fontSize: 13, textAlign: "center", padding: "0 24px", lineHeight: 1.6 }}>
            AI-powered meetings with real-time intelligence
          </p>
        </div>
      </div>
    </div>
  );
}

function MeetingsPage({ meetings, onNewMeeting, onOpenMeeting }) {
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

function MeetingDetailPage({ meeting, onBack }) {
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

function AgentsPage({ agents, onNewAgent }) {
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

function UpgradePage() {
  const plans = [
    { name: "Monthly", sub: "For teams getting started", price: "$29", period: "/month", features: ["Unlimited meetings", "Unlimited transcripts", "Unlimited recording storage", "Unlimited agents"] },
    { name: "Yearly", sub: "For teams that need to scale", price: "$259", period: "/year", badge: "Best value", features: ["Unlimited agents", "Unlimited recording storage", "Unlimited transcripts", "Unlimited meetings", "2 months free"], highlighted: true },
    { name: "Enterprise", sub: "For teams with special requests", price: "$999", period: "/year", features: ["Unlimited agents", "Unlimited recording storage", "Unlimited transcripts", "Unlimited meetings", "Dedicated Discord support"] },
  ];
  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ color: COLORS.text, fontSize: 30, fontWeight: 800, margin: "0 0 8px" }}>
          You are on the <span style={{ color: COLORS.green }}>Free</span> plan
        </h1>
        <p style={{ color: COLORS.muted }}>Upgrade to unlock unlimited power</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            background: plan.highlighted ? "linear-gradient(160deg, #16532a, #0d2015)" : COLORS.card,
            border: `1px solid ${plan.highlighted ? COLORS.green : COLORS.border}`, borderRadius: 20,
            padding: 28, position: "relative", overflow: "hidden"
          }}>
            {plan.badge && (
              <span style={{ position: "absolute", top: 20, right: 20, background: "#f59e0b", color: "#0a0f0a", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{plan.badge}</span>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: COLORS.text, fontWeight: 700, fontSize: 18 }}>{plan.name}</div>
              <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{plan.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 24 }}>
              <span style={{ color: COLORS.text, fontSize: 36, fontWeight: 800 }}>{plan.price}</span>
              <span style={{ color: COLORS.muted, fontSize: 14 }}>{plan.period}</span>
            </div>
            <button style={{
              width: "100%", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", marginBottom: 24,
              background: plan.highlighted ? COLORS.green : "transparent",
              color: plan.highlighted ? "#0a0f0a" : COLORS.text,
              border: plan.highlighted ? "none" : `1px solid ${COLORS.border}`
            }}>Upgrade</button>
            <div style={{ color: COLORS.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase" }}>Features</div>
            {plan.features.map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: COLORS.green, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ color: plan.highlighted ? "#c8f5d0" : COLORS.muted, fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("meetings");
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetAgent, setNewMeetAgent] = useState("");

  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentInstructions, setNewAgentInstructions] = useState("You are a helpful assistant that can answer questions and help with tasks.");

  if (!authed) return <AuthPage onLogin={() => setAuthed(true)} />;

  const createMeeting = () => {
    if (!newMeetTitle) return;
    const agent = agents.find((a) => a.name === newMeetAgent) || agents[0];
    const newM = { id: Date.now(), title: newMeetTitle, agent: agent.name, emoji: agent.emoji, date: "Today", status: "upcoming", duration: "--" };
    setMeetings((m) => [newM, ...m]);
    setNewMeetTitle("");
    setNewMeetAgent("");
    setShowNewMeeting(false);
    setActiveMeeting(newM);
    setPage("meeting");
  };

  const createAgent = () => {
    if (!newAgentName) return;
    const emojis = ["🤖", "🎯", "💡", "🌟", "🔮", "⚡"];
    const newA = { id: Date.now(), name: newAgentName, emoji: emojis[agents.length % emojis.length], instructions: newAgentInstructions, meetings: 0 };
    setAgents((a) => [...a, newA]);
    setNewAgentName("");
    setShowNewAgent(false);
  };

  const navItems = [
    { id: "meetings", icon: "📅", label: "Meetings" },
    { id: "agents", icon: "🤖", label: "Agents" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1e2e22; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes wave { from { transform: scaleY(0.5) } to { transform: scaleY(1.5) } }
        @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        input:focus, textarea:focus { border-color: #22c55e !important; }
      `}</style>

      <div style={{
        width: sidebarOpen ? 240 : 0, flexShrink: 0, background: COLORS.sidebar,
        borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", overflow: "hidden"
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎯</div>
            <span style={{ color: COLORS.text, fontWeight: 800, fontSize: 18, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>Meet.AI</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setPage(item.id); setActiveMeeting(null); }} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%",
              borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s", marginBottom: 4, whiteSpace: "nowrap",
              background: page === item.id ? "#1e3326" : "transparent",
              color: page === item.id ? COLORS.green : COLORS.muted
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ margin: "12px 0", height: 1, background: COLORS.border }} />
          <button onClick={() => setPage("upgrade")} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%",
            borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
            background: page === "upgrade" ? "#1e3326" : "transparent",
            color: page === "upgrade" ? COLORS.green : COLORS.muted, whiteSpace: "nowrap"
          }}>
            <span style={{ fontSize: 16 }}>⭐</span> Upgrade
          </button>
        </nav>

        <div style={{ padding: "12px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ background: "#0d1a10", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>🚀</span>
              <span style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>Free Trial</span>
            </div>
            {[{ label: "Agents", val: agents.length, max: 10 }, { label: "Meetings", val: meetings.length, max: 10 }].map((item) => (
              <div key={item.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: COLORS.muted, fontSize: 11 }}>{item.val}/{item.max} {item.label}</span>
                </div>
                <div style={{ height: 4, background: COLORS.border, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${(item.val / item.max) * 100}%`, background: COLORS.green, borderRadius: 2, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
            <button onClick={() => setPage("upgrade")} style={{
              width: "100%", padding: "8px", borderRadius: 8, background: COLORS.green, border: "none",
              color: "#0a0f0a", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4, whiteSpace: "nowrap"
            }}>Upgrade</button>
          </div>
        </div>

        <div style={{ padding: "12px 16px 20px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0f0a", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>JD</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>John Doe</div>
            <div style={{ color: COLORS.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>john.doe@test.com</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 56, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen((s) => !s)} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 18, padding: 4 }}>☰</button>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted, fontSize: 14 }}>🔍</span>
            <input placeholder="Search..." style={{
              padding: "7px 12px 7px 34px", background: COLORS.card, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, color: COLORS.text, fontSize: 14, outline: "none", fontFamily: "inherit", width: 240
            }} />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.muted, fontSize: 11, background: COLORS.border, padding: "1px 6px", borderRadius: 4 }}>⌘K</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {page === "meetings" && <MeetingsPage meetings={meetings} onNewMeeting={() => setShowNewMeeting(true)} onOpenMeeting={(m) => { setActiveMeeting(m); setPage("meeting"); }} />}
          {page === "meeting" && activeMeeting && <MeetingDetailPage meeting={activeMeeting} onBack={() => { setPage("meetings"); setActiveMeeting(null); }} />}
          {page === "agents" && <AgentsPage agents={agents} onNewAgent={() => setShowNewAgent(true)} />}
          {page === "upgrade" && <UpgradePage />}
        </div>
      </div>

      {showNewMeeting && (
        <Modal title="New Meeting" subtitle="Create a new meeting" onClose={() => setShowNewMeeting(false)}>
          <Input label="Title" value={newMeetTitle} onChange={setNewMeetTitle} placeholder="Enter meeting title..." />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: COLORS.muted, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Agent</label>
            <select value={newMeetAgent} onChange={(e) => setNewMeetAgent(e.target.value)} style={{
              width: "100%", background: "#0a0f0a", border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: "10px 14px", color: newMeetAgent ? COLORS.text : COLORS.muted,
              fontSize: 14, outline: "none", fontFamily: "inherit", appearance: "none"
            }}>
              <option value="">Select an agent</option>
              {agents.map((a) => <option key={a.id} value={a.name}>{a.emoji} {a.name}</option>)}
            </select>
          </div>
          <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 20 }}>
            Not found what you're looking for?{" "}
            <button onClick={() => { setShowNewMeeting(false); setShowNewAgent(true); }} style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Create new agent</button>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowNewMeeting(false)} variant="secondary">Cancel</Btn>
            <Btn onClick={createMeeting}>Create</Btn>
          </div>
        </Modal>
      )}

      {showNewAgent && (
        <Modal title="New Agent" subtitle="Create a new agent" onClose={() => setShowNewAgent(false)}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1a2a1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto" }}>😍</div>
          </div>
          <Input label="Name" value={newAgentName} onChange={setNewAgentName} placeholder="Agent name..." />
          <Input label="Instructions" value={newAgentInstructions} onChange={setNewAgentInstructions} multiline placeholder="Describe how this agent should behave..." />
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowNewAgent(false)} variant="secondary">Cancel</Btn>
            <Btn onClick={createAgent}>Create</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
