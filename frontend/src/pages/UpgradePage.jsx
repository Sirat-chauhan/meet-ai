import React from "react";

export function UpgradePage() {
  const plans = [
    { name: "Monthly", sub: "For teams getting started", price: "$29", period: "/month", features: ["Unlimited meetings", "Unlimited transcripts", "Unlimited recording storage", "Unlimited agents"] },
    { name: "Yearly", sub: "For teams that need to scale", price: "$259", period: "/year", badge: "Best value", features: ["Unlimited agents", "Unlimited recording storage", "Unlimited transcripts", "Unlimited meetings", "2 months free"], highlighted: true },
    { name: "Enterprise", sub: "For teams with special requests", price: "$999", period: "/year", features: ["Unlimited agents", "Unlimited recording storage", "Unlimited transcripts", "Unlimited meetings", "Dedicated Discord support"] },
  ];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h1 style={{ color: "#0f172a", fontSize: 32, fontWeight: 800, margin: "0 0 8px" }}>
          You are on the <span style={{ color: "#16a34a" }}>Free</span> plan
        </h1>
        <p style={{ color: "#64748b", fontSize: 16 }}>Upgrade to unlock unlimited power</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 960, margin: "0 auto" }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            background: plan.highlighted ? "linear-gradient(160deg, #15803d, #166534)" : "#ffffff",
            color: plan.highlighted ? "#ffffff" : "#0f172a",
            border: `1px solid ${plan.highlighted ? "#15803d" : "#e2e8f0"}`, borderRadius: 20,
            padding: 28, position: "relative", overflow: "hidden",
            boxShadow: plan.highlighted ? "0 20px 40px rgba(22, 163, 74, 0.25)" : "0 4px 12px rgba(0, 0, 0, 0.03)"
          }}>
            {plan.badge && (
              <span style={{
                position: "absolute", top: 20, right: 20, background: "#f59e0b",
                color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20
              }}>{plan.badge}</span>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{plan.name}</div>
              <div style={{ color: plan.highlighted ? "rgba(255,255,255,0.8)" : "#64748b", fontSize: 13, marginTop: 4 }}>{plan.sub}</div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 24 }}>
              <span style={{ fontSize: 38, fontWeight: 800 }}>{plan.price}</span>
              <span style={{ color: plan.highlighted ? "rgba(255,255,255,0.8)" : "#64748b", fontSize: 14 }}>{plan.period}</span>
            </div>

            <button style={{
              width: "100%", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", marginBottom: 24,
              background: plan.highlighted ? "#ffffff" : "#16a34a",
              color: plan.highlighted ? "#15803d" : "#ffffff",
              border: "none"
            }}>
              Upgrade
            </button>

            <div style={{
              color: plan.highlighted ? "rgba(255,255,255,0.8)" : "#64748b",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase"
            }}>Features</div>

            {plan.features.map((f) => (
              <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                <span style={{ color: plan.highlighted ? "#ffffff" : "#16a34a", marginTop: 1, flexShrink: 0, fontWeight: 800 }}>✓</span>
                <span style={{ color: plan.highlighted ? "#ffffff" : "#475569", fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
