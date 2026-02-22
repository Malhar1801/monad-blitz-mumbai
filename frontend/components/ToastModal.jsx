import { useEffect } from "react";

export default function ToastModal({ message, type = "info", onClose }) {
  const bg = type === "error" ? "bg-red-950/90 border-red-700" :
              type === "success" ? "bg-emerald-950/90 border-emerald-700" :
              "bg-purple-950/90 border-purple-700";

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4 pointer-events-none">
      <div className={`max-w-md w-full ${bg} backdrop-blur-xl border text-white rounded-2xl p-5 shadow-2xl shadow-black/60 transform transition-all duration-300 scale-100`}>
        <p className="text-base leading-relaxed">{message}</p>
      </div>
    </div>
  );
}