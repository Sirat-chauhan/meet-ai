import React from "react";
import { COLORS } from "../../utils/constants";

export const Input = ({ label, value, onChange, placeholder, multiline }) => (
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
