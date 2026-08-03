import React from "react";
import { COLORS } from "../utils/constants";

export function UpgradePage() {
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
