import React from 'react';

const TabNav = ({ tabs, active, onChange }) => {
  return (
    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${active === t.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 translate-y-[-2px]' : 'bg-gray-800/40 text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700'}`}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default TabNav;
