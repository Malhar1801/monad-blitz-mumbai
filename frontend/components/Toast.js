import { useState, useEffect } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return { toasts, toast };
}

export function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      maxWidth: "380px",
      width: "100%",
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const colors = {
    success: { bg: "rgba(16,40,24,0.97)", border: "rgba(34,197,94,0.4)", accent: "#4ade80", icon: "✓" },
    error:   { bg: "rgba(40,10,16,0.97)", border: "rgba(239,68,68,0.4)",  accent: "#f87171", icon: "✕" },
    info:    { bg: "rgba(20,12,45,0.97)", border: "rgba(124,58,237,0.4)", accent: "#a78bfa", icon: "i" },
  };

  const c = colors[toast.type];

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeft: `3px solid ${c.accent}`,
      borderRadius: "8px",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      backdropFilter: "blur(12px)",
      transform: visible ? "translateX(0)" : "translateX(120%)",
      opacity: visible ? 1 : 0,
      transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease",
    }}>
      <span style={{
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: c.accent,
        color: "#000",
        fontSize: "0.65rem",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: "1px",
      }}>{c.icon}</span>
      <p style={{
        color: "rgba(240,230,255,0.92)",
        fontSize: "0.82rem",
        lineHeight: "1.5",
        margin: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>{toast.message}</p>
    </div>
  );
}