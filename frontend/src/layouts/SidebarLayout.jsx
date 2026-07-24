import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Button as Btn } from "../components/ui/Button";

export function SidebarLayout({ agents, meetings, onCreateMeeting, onCreateAgent }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Modal state
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetAgent, setNewMeetAgent] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentInstructions, setNewAgentInstructions] = useState("You are a helpful assistant that can answer questions and help with tasks.");

  const navItems = [
    { id: "/", icon: "📅", label: "Meetings" },
    { id: "/agents", icon: "🤖", label: "Agents" },
  ];

  const handleCreateMeeting = () => {
    if (!newMeetTitle) return;
    onCreateMeeting(newMeetTitle, newMeetAgent);
    setNewMeetTitle("");
    setNewMeetAgent("");
    setShowNewMeeting(false);
  };

  const handleCreateAgent = () => {
    if (!newAgentName) return;
    onCreateAgent(newAgentName, newAgentInstructions);
    setNewAgentName("");
    setShowNewAgent(false);
  };

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
        a { text-decoration: none; }
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
            <Link key={item.id} to={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%",
              borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s", marginBottom: 4, whiteSpace: "nowrap",
              background: location.pathname === item.id ? "#1e3326" : "transparent",
              color: location.pathname === item.id ? COLORS.green : COLORS.muted
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
            </Link>
          ))}
          <div style={{ margin: "12px 0", height: 1, background: COLORS.border }} />
          <Link to="/upgrade" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%",
            borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s",
            background: location.pathname === "/upgrade" ? "#1e3326" : "transparent",
            color: location.pathname === "/upgrade" ? COLORS.green : COLORS.muted, whiteSpace: "nowrap"
          }}>
            <span style={{ fontSize: 16 }}>⭐</span> Upgrade
          </Link>
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
            <Link to="/upgrade" style={{
              display: "block", textAlign: "center", textDecoration: "none",
              width: "100%", padding: "8px", borderRadius: 8, background: COLORS.green, border: "none",
              color: "#0a0f0a", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 4, whiteSpace: "nowrap"
            }}>Upgrade</Link>
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
          {/* We pass down the modal trigger functions via context or cloneElement, but since we are refactoring quickly, 
              we can just use React Router Outlet context. */}
          <Outlet context={{ 
            openNewMeeting: () => setShowNewMeeting(true), 
            openNewAgent: () => setShowNewAgent(true) 
          }} />
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
            <Btn onClick={handleCreateMeeting}>Create</Btn>
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
            <Btn onClick={handleCreateAgent}>Create</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
