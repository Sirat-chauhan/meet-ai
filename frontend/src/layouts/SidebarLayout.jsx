import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f3f5", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(15px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        a { text-decoration: none; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 232 : 0, flexShrink: 0,
        background: "linear-gradient(180deg, #031f17 0%, #02251c 100%)",
        color: "#e8f7ef", display: "flex", flexDirection: "column", gap: 14,
        padding: sidebarOpen ? "16px 10px" : 0, borderRight: "1px solid #10382b",
        transition: "all 0.25s ease", overflow: "hidden"
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: "flex", alignItems: "center", gap: 8, color: "#fff",
          fontSize: 28, fontWeight: 800, padding: "6px 4px 12px", borderBottom: "1px solid #173e31"
        }}>
          <span style={{ color: "#25c765", fontSize: 30 }}>◎</span>
          <span>Meet.AI</span>
        </Link>

        {/* Navigation Menu */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.id;
            return (
              <Link key={item.id} to={item.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, fontSize: 14, fontWeight: 500,
                background: isActive ? "#0d4633" : "transparent",
                color: isActive ? "#ffffff" : "#c7e3d7", transition: "all 0.15s"
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
              </Link>
            );
          })}
          <div style={{ margin: "8px 0", height: 1, background: "#173e31" }} />
          <Link to="/upgrade" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: location.pathname === "/upgrade" ? "#0d4633" : "transparent",
            color: location.pathname === "/upgrade" ? "#ffffff" : "#c7e3d7"
          }}>
            <span style={{ fontSize: 16 }}>⭐</span> Upgrade
          </Link>
        </nav>

        {/* Sidebar Bottom Widgets */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Free Trial Card */}
          <div style={{
            background: "linear-gradient(180deg, #113629 0%, #0a2a20 100%)",
            border: "1px solid #1a4b39", borderRadius: 9, padding: 12, display: "flex",
            flexDirection: "column", gap: 6
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#fff" }}>🚀 Free Trial</p>
            </div>
            <small style={{ color: "#b8d8c8", fontSize: 11 }}>{agents.length}/10 Agents</small>
            <div style={{ height: 4, background: "#2e5e4b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(agents.length / 10) * 100}%`, background: "#21bf62", transition: "width 0.5s" }} />
            </div>
            <small style={{ color: "#b8d8c8", fontSize: 11 }}>{meetings.length}/10 Meetings</small>
            <div style={{ height: 4, background: "#2e5e4b", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(meetings.length / 10) * 100}%`, background: "#21bf62", transition: "width 0.5s" }} />
            </div>
            <Link to="/upgrade" style={{
              marginTop: 4, background: "transparent", color: "#ecfff4", border: "1px solid #2a654e",
              borderRadius: 6, padding: "6px 8px", textAlign: "center", fontSize: 12, fontWeight: 600
            }}>Upgrade</Link>
          </div>

          {/* User Profile Card */}
          <div style={{
            border: "1px solid #1e4b3a", borderRadius: 9, background: "rgba(14, 50, 37, 0.86)",
            display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "center", padding: "8px 10px"
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "#21bf62",
              color: "#03150b", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800
            }}>JD</div>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", fontSize: 12, color: "#ecfbf3", textTransform: "capitalize" }}>John Doe</strong>
              <small style={{ color: "#b7d7c6", fontSize: 10, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>john.doe@test.com</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f3f3f5" }}>
        {/* Topbar Lite */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen((s) => !s)} style={{ background: "none", border: "none", color: "#6e7380", cursor: "pointer", fontSize: 18, padding: 4 }}>☰</button>
            <div style={{ position: "relative", width: 280 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8b909b", fontSize: 13 }}>⌕</span>
              <input placeholder="Search by meeting, agent, or status" style={{
                width: "100%", border: "1px solid #dfe3e8", background: "#f8f8f9",
                borderRadius: 8, padding: "8px 10px 8px 28px", fontSize: 13, outline: "none"
              }} />
            </div>
          </div>
          <button
            onClick={() => setShowNewMeeting(true)}
            style={{
              background: "#1fb15a", color: "#ffffff", border: "none", borderRadius: 8,
              padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}
          >
            + New Meeting
          </button>
        </div>

        {/* Page Content Container */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <Outlet context={{ 
            openNewMeeting: () => setShowNewMeeting(true), 
            openNewAgent: () => setShowNewAgent(true) 
          }} />
        </div>
      </div>

      {/* Modals */}
      {showNewMeeting && (
        <Modal title="New Meeting" subtitle="Create a new meeting" onClose={() => setShowNewMeeting(false)}>
          <Input label="Title" value={newMeetTitle} onChange={setNewMeetTitle} placeholder="Enter meeting title..." />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#64748b", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Agent</label>
            <select value={newMeetAgent} onChange={(e) => setNewMeetAgent(e.target.value)} style={{
              width: "100%", background: "#ffffff", border: "1px solid #e2e8f0",
              borderRadius: 8, padding: "10px 14px", color: newMeetAgent ? "#0f172a" : "#64748b",
              fontSize: 14, outline: "none", fontFamily: "inherit"
            }}>
              <option value="">Select an agent</option>
              {agents.map((a) => <option key={a.id} value={a.name}>{a.emoji} {a.name}</option>)}
            </select>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
            Not found what you're looking for?{" "}
            <button onClick={() => { setShowNewMeeting(false); setShowNewAgent(true); }} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Create new agent</button>
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
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto", border: "1px solid #bbf7d0" }}>🤖</div>
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
