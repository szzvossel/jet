/**
 * Tab bar navigation component with icons and keyboard shortcuts.
 */

import React from "react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabBar: React.FC<Props> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(71, 85, 105, 0.25)' }}>
      <div className="flex">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-all duration-200 relative flex items-center gap-2 ${
              activeTab === tab.id
                ? "text-brand-300"
                : "text-slate-500 hover:text-slate-300"
            }`}
            style={{
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
            }}
          >
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--brand-400), var(--brand-600))' }}
              />
            )}
            <span className={`transition-colors duration-200 ${activeTab === tab.id ? "text-brand-400" : "text-slate-600"}`}>
              {tab.icon}
            </span>
            {tab.label}
            <kbd className="hidden lg:inline-block ml-0.5 text-[9px] px-1 py-0.5 rounded bg-slate-800/80 text-slate-600 border border-slate-700/50 font-mono">
              {idx + 1}
            </kbd>
          </button>
        ))}
      </div>
    </div>
  );
};
