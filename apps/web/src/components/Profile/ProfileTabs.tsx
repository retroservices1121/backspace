// X-style sticky tab bar — even-width segments with an underline on
// the active one. Hover lift on inactive segments. Sticks to the top
// of the scrolling column so it stays visible while the feed scrolls.

import React from 'react';

export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'posts',   label: 'Posts' },
  { key: 'replies', label: 'Replies' },
  { key: 'media',   label: 'Media' },
  { key: 'likes',   label: 'Likes' },
];

type Props = {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const ProfileTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="sticky top-0 z-10 flex border-b border-dividerColor bg-backgroundDark/80 backdrop-blur">
      {TABS.map(({ key, label }) => {
        const isActive = key === active;
        return (
          <button
            type="button"
            key={key}
            onClick={() => onChange(key)}
            className={
              `flex-1 px-4 py-4 text-sm font-semibold transition-colors hover:bg-backgroundLight ${
                isActive ? 'text-fontFocus' : 'text-fontTertiary'
              }`
            }
          >
            <span className="relative inline-block py-3">
              {label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-4 mx-auto h-1 w-12 rounded-full bg-primary" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ProfileTabs;
