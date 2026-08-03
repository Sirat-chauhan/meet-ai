import React from "react";
import { COLORS } from "../../utils/constants";

export const Modal = ({ title, subtitle, children, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    animation: "fadeIn 0.15s ease"
  }}>
    <div style={{
      background: "#ffffff", border: `1px solid ${COLORS.border}`, borderRadius: 16,
      padding: "32px", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0, 0, 0, 0.15)",
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
