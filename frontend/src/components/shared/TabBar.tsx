/**
 * Tab bar navigation component.
 */

import React from "react";

interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabBar: React.FC<Props> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "text-brand-400 border-brand-500 bg-slate-800/50"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
