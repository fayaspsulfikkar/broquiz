'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/questions', label: 'Questions', icon: '❓' },
  { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!profile?.is_admin) {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 60, background: '#fff',
        borderRight: '1px solid #E8E8ED', padding: '20px 0',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s ease', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ padding: '0 16px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: '#000',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>B</div>
            {sidebarOpen && <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>Admin</span>}
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', margin: '2px 8px', borderRadius: 8,
              background: pathname === item.path ? '#F5F5F7' : 'transparent',
              border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: pathname === item.path ? 600 : 400,
              color: pathname === item.path ? '#1D1D1F' : '#6E6E73',
              transition: 'all 0.15s ease', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {sidebarOpen && item.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ padding: '0 8px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 14, color: '#6E6E73', textAlign: 'left',
            }}
          >
            <span>←</span> {sidebarOpen && 'Back to App'}
          </button>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 14, color: '#FF3B30', textAlign: 'left',
            }}
          >
            <span>⏻</span> {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
