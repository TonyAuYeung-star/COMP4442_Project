import React from 'react';

const noticeTone = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700"
};

const Notification = ({ message, onDismiss }) => {
  if (!message.text) return null;

  return (
    <section className={`relative rounded-2xl border px-4 py-3 text-sm ${noticeTone[message.type] || noticeTone.info}`}>
      {message.text}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-current opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </section>
  );
};

export default Notification;