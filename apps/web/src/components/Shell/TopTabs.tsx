// Sticky top tab bar used at the top of the center column on the
// Feed (and other pages later). Pattern from /webui: a backdrop-
// blurred row with an H1 title + optional icon action buttons +
// horizontal tabs underneath with a brand-2 underline on the
// active tab.
//
// Stateless. The parent owns the tab key state — pass `active` +
// `onChange` and an array of tab specs. Tab labels can include a
// mono count badge by adding ` · N` in the label or rendering one
// via the `count` prop.

import React from 'react';

import { ShellIcons as I } from './icons';

export type TabSpec = {
  key: string;
  label: string;
  count?: number;
};

type Props = {
  title: string;
  tabs: TabSpec[];
  active: string;
  onChange: (key: string) => void;
  actions?: React.ReactNode;
};

const TopTabs: React.FC<Props> = ({ title, tabs, active, onChange, actions }) => {
  return (
    <div
      className="
        sticky top-0 z-10
        px-6 pt-3.5
        border-b border-line
        bg-canvas/[0.78]
        backdrop-blur-[14px] backdrop-saturate-[160%]
      "
    >
      <div className="flex items-center justify-between gap-3.5 pb-3.5">
        <h1 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <IconButton><I.dots className="w-5 h-5" /></IconButton>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 -mx-1">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              type="button"
              key={t.key}
              onClick={() => onChange(t.key)}
              className={[
                'relative px-3 py-3 text-[14px] font-medium tracking-[-0.005em]',
                'transition-colors duration-150',
                isActive ? 'text-ink' : 'text-ink-2 hover:text-ink',
              ].join(' ')}
            >
              <span>{t.label}</span>
              {typeof t.count === 'number' && (
                <span className="ml-1.5 text-[11px] font-mono text-ink-3">
                  · {t.count}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-brand-2"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="
        w-9 h-9 rounded-full flex items-center justify-center
        bg-transparent text-ink-2 hover:bg-hover hover:text-ink
        transition-colors duration-150
      "
    >
      {children}
    </button>
  );
}

export default TopTabs;
