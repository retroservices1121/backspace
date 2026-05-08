'use client';

import { useState, useTransition } from 'react';

export function VerifyToggle({
  userId,
  verified: initial,
}: {
  userId: string;
  verified: boolean;
}) {
  const [verified, setVerified] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const next = !verified;
      const res = await fetch(`/api/users/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ verified: next }),
      });
      if (res.ok) setVerified(next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`rounded px-3 py-1.5 text-sm transition ${
        verified
          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
          : 'bg-white/5 text-white/60 hover:bg-white/10'
      }`}
    >
      {verified ? '✓ Verified' : 'Not verified'}
    </button>
  );
}
