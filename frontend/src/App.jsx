import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useOutletContext } from "react-router-dom";
import { MOCK_MEETINGS, MOCK_AGENTS } from "./utils/constants";
import { AuthPage } from "./pages/AuthPage";
import { MeetingsPage } from "./pages/MeetingsPage";
import { MeetingDetailPage } from "./pages/MeetingDetailPage";
import { AgentsPage } from "./pages/AgentsPage";
import { UpgradePage } from "./pages/UpgradePage";
import { SidebarLayout } from "./layouts/SidebarLayout";

// Wrapper components to map Outlet context and props correctly
function MeetingsWrapper({ meetings }) {
  const navigate = useNavigate();
  const { openNewMeeting } = useOutletContext();
  return <MeetingsPage 
    meetings={meetings} 
    onNewMeeting={openNewMeeting} 
    onOpenMeeting={(m) => navigate(`/meeting/${m.id}`)} 
  />;
}

function MeetingDetailWrapper({ meetings }) {
  const navigate = useNavigate();
  // Simple extraction of ID from window location to avoid complex matchers if we were strictly outside router, 
  // but we have router so we can use useParams. Let's do it simply by reading from url manually for now, 
  // or just use window.location.pathname.split("/").pop()
  const id = parseInt(window.location.pathname.split("/").pop(), 10);
  const meeting = meetings.find(m => m.id === id);
  if (!meeting) return <div style={{padding: 40, color: "white"}}>Meeting not found.</div>;
  
  return <MeetingDetailPage meeting={meeting} onBack={() => navigate("/")} />;
}

function AgentsWrapper({ agents }) {
  const { openNewAgent } = useOutletContext();
  return <AgentsPage agents={agents} onNewAgent={openNewAgent} />;
}

function MainApp() {
  const [authed, setAuthed] = useState(false);
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const navigate = useNavigate();

  if (!authed) return <AuthPage onLogin={() => setAuthed(true)} />;

  const handleCreateMeeting = (title, agentName) => {
    const agent = agents.find((a) => a.name === agentName) || agents[0];
    const newM = { id: Date.now(), title: title, agent: agent.name, emoji: agent.emoji, date: "Today", status: "upcoming", duration: "--" };
    setMeetings((m) => [newM, ...m]);
    navigate(`/meeting/${newM.id}`);
  };

  const handleCreateAgent = (name, instructions) => {
    const emojis = ["🤖", "🎯", "💡", "🌟", "🔮", "⚡"];
    const newA = { id: Date.now(), name: name, emoji: emojis[agents.length % emojis.length], instructions: instructions, meetings: 0 };
    setAgents((a) => [...a, newA]);
    navigate("/agents");
  };

  return (
    <Routes>
      <Route path="/" element={<SidebarLayout agents={agents} meetings={meetings} onCreateMeeting={handleCreateMeeting} onCreateAgent={handleCreateAgent} />}>
        <Route index element={<MeetingsWrapper meetings={meetings} />} />
        <Route path="meeting/:id" element={<MeetingDetailWrapper meetings={meetings} />} />
        <Route path="agents" element={<AgentsWrapper agents={agents} />} />
        <Route path="upgrade" element={<UpgradePage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
