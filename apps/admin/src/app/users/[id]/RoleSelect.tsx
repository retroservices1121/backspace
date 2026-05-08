'use client';

import { PlatformUserType } from '@backspace/db';
import { useState, useTransition } from 'react';

const ROLES: PlatformUserType[] = [
  PlatformUserType.DISABLED,
  PlatformUserType.USER,
  PlatformUserType.CREATOR,
  PlatformUserType.MODERATOR,
  PlatformUserType.ELEVATED,
  PlatformUserType.ADMIN,
];

export function RoleSelect({
  userId,
  role: initial,
}: {
  userId: string;
  role: PlatformUserType;
}) {
  const [role, setRole] = useState<PlatformUserType>(initial);
  const [pending, start] = useTransition();

  function change(next: PlatformUserType) {
    if (next === role) return;
    start(async () => {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: next }),
      });
      if (res.ok) setRole(next);
    });
  }

  return (
    <select
      value={role}
      onChange={(e) => change(e.target.value as PlatformUserType)}
      disabled={pending}
      className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-sm font-mono"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
