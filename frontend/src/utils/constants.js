export const COLORS = {
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

export const MOCK_MEETINGS = [
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

export const MOCK_AGENTS = [
  { id: 1, name: "Interview Assistant", emoji: "🤖", instructions: "You are an expert technical interviewer...", meetings: 12 },
  { id: 2, name: "Sales Coach", emoji: "💼", instructions: "You are a high-performance sales coach...", meetings: 8 },
  { id: 3, name: "Language Tutor", emoji: "🌍", instructions: "You are a patient language tutor...", meetings: 15 },
  { id: 4, name: "Therapy Assistant", emoji: "💙", instructions: "You are a compassionate therapy assistant...", meetings: 6 },
];
