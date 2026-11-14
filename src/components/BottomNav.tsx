'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Raffle', path: '#', icon: '🎲' },
    { name: 'Chats', path: '#', icon: '💬' },
    { name: 'AI Robots', path: '/ai-robots', icon: '🤖' },
    { name: 'Income', path: '#', icon: '💲' },
    { name: 'My', path: '/deposit', icon: '👤' }, // Pointing to deposit for now as a placeholder
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#000',
      borderTop: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 10px)'
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link key={item.name} href={item.path} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: isActive ? '#00bfff' : '#666',
            fontSize: '0.65rem',
            gap: '4px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
