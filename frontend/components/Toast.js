'use client';

import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-400' : type === 'error' ? 'bg-red-400' : 'bg-yellow-400';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 font-mono font-bold px-5 py-3 border-3 border-black shadow-brutal ${bg} transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="flex items-center gap-3">
        <span>{type === 'success' ? '✓' : type === 'error' ? '✗' : '!'}</span>
        <span className="text-sm">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 text-black opacity-60 hover:opacity-100">×</button>
      </div>
    </div>
  );
}

// Toast manager hook
import { useState as useStateHook, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useStateHook([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
