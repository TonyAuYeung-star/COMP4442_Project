import React from 'react';

const Header = ({ loading, onRefresh, apiBaseUrl }) => {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-900 to-indigo-900 p-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Service Registry</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">COMP4442 Dashboard App</h1>
          <p className="mt-1 text-sm text-cyan-100">Real workflow UI for services and service instances.</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:opacity-60"
        >
          {loading ? "Syncing..." : "Refresh All"}
        </button>
      </div>
      <p className="mt-3 text-xs text-cyan-100">API: {apiBaseUrl}</p>
    </section>
  );
};

export default Header;