import Link from 'next/link';

const NAV = [
  { href: '/users', label: 'Users' },
  { href: '/communities', label: 'Communities' },
  { href: '/reports', label: 'Reports' },
  { href: '/audit', label: 'Audit log' },
];

export function Sidebar() {
  return (
    <nav className="w-56 border-r border-white/10 bg-black/30 p-6">
      <div className="mb-8 text-sm font-semibold uppercase tracking-widest text-white/60">
        Backspace · Ops
      </div>
      <ul className="space-y-1">
        {NAV.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
