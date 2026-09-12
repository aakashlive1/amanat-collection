import { useState, useEffect } from 'react';
import { store } from './services/store';
import { User } from './types';
import { useStoreUpdate } from './hooks/useStore';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminCollectors } from './pages/admin/AdminCollectors';
import { AdminSettlements } from './pages/admin/AdminSettlements';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminReports } from './pages/admin/AdminReports';

// Collector Pages
import { CollectorCollect } from './pages/collector/CollectorCollect';
import { CollectorSummary } from './pages/collector/CollectorSummary';

// Online UPI Verification View
import { OnlineVerifications } from './components/OnlineVerifications';

// Member Passbook Page
import { MemberPassbook } from './pages/member/MemberPassbook';

// Public Landing Page
import { LandingPage } from './pages/LandingPage';

export function App() {
  useStoreUpdate(); // Reactive re-render on any store change

  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getAuthUser());
  const [viewLanding, setViewLanding] = useState<boolean>(() => !store.getAuthUser());
  const [showLogin, setShowLogin] = useState<boolean>(() => {
    return window.location.hash === '#/login' || window.location.pathname === '/login';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const authUser = store.getAuthUser();
    if (!authUser) return 'dashboard';
    const saved = localStorage.getItem(`amanat_active_tab_${authUser.role}`);
    if (saved) return saved;
    return authUser.role === 'collector' ? 'collect' : 'dashboard';
  });
  const [memberToken, setMemberToken] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (currentUser) {
      localStorage.setItem(`amanat_active_tab_${currentUser.role}`, tab);
    }
  };

  // Periodic background sync with Cloudflare D1 every 8 seconds
  useEffect(() => {
    store.syncWithCloud();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        store.syncWithCloud();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Check URL hash for public member passbook link (e.g. #/m/ramesh-101 or /m/ramesh-101)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (hash.startsWith('#/m/')) {
        const token = hash.replace('#/m/', '').split('?')[0];
        setMemberToken(token);
      } else if (pathname.startsWith('/m/')) {
        const token = pathname.replace('/m/', '').split('?')[0];
        setMemberToken(token);
      } else {
        setMemberToken(null);
      }

      if (hash === '#/login' || pathname === '/login') {
        setShowLogin(true);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (user: User) => {
    store.setAuthUser(user);
    setCurrentUser(user);
    setShowLogin(false);
    setViewLanding(false);
    const defaultTab = user.role === 'admin' ? 'dashboard' : 'collect';
    const saved = localStorage.getItem(`amanat_active_tab_${user.role}`) || defaultTab;
    setActiveTab(saved);
  };

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
    setShowLogin(false);
    setViewLanding(true);
  };

  const handleSelectUser = (user: User) => {
    store.setAuthUser(user);
    setCurrentUser(user);
    setShowLogin(false);
    setViewLanding(false);
    const defaultTab = user.role === 'admin' ? 'dashboard' : 'collect';
    const saved = localStorage.getItem(`amanat_active_tab_${user.role}`) || defaultTab;
    setActiveTab(saved);
  };

  // If user is accessing public member passbook route
  if (memberToken) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MemberPassbook token={memberToken} />
      </div>
    );
  }

  // If user or guest is on the Landing Page
  if (viewLanding && !showLogin) {
    return (
      <LandingPage
        currentUser={currentUser}
        onOpenLogin={() => setShowLogin(true)}
        onGoToDashboard={() => setViewLanding(false)}
      />
    );
  }

  // If user requested Login view
  if (!currentUser || showLogin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Login
          onLoginSuccess={handleLogin}
          onBack={() => {
            setShowLogin(false);
            if (!currentUser) setViewLanding(true);
          }}
        />
      </div>
    );
  }

  const pendingSettlementsCount =
    currentUser.role === 'admin'
      ? store.getSettlements().filter(s => s.status === 'pending').length
      : 0;

  // Calculate pending online UTR verifications count for this user
  const allMembers = store.getMembers();
  const pendingVerifications = store.getTransactions().filter(t => {
    if (t.status !== 'pending_verification') return false;
    if (currentUser.role === 'admin') return true;
    if (!currentUser.canVerifyPayments) return false;
    if (currentUser.canCollectAll) return true;
    const member = allMembers.find(m => m.id === t.memberId);
    return member?.assignedCollectorId === currentUser.id;
  });
  const pendingVerificationsCount = pendingVerifications.length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onSelectUser={handleSelectUser}
        onViewWebsite={() => setViewLanding(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentUser.role === 'admin' ? (
          <>
            {activeTab === 'members' && <AdminMembers />}
            {activeTab === 'collectors' && <AdminCollectors />}
            {activeTab === 'verifications' && <OnlineVerifications currentUser={currentUser} />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'settlements' && <AdminSettlements />}
            {activeTab === 'settings' && <AdminSettings />}
            {(activeTab === 'dashboard' || !['members', 'collectors', 'verifications', 'reports', 'settlements', 'settings'].includes(activeTab)) && (
              <AdminDashboard onNavigateTab={handleTabChange} />
            )}
          </>
        ) : (
          <>
            {activeTab === 'verifications' && <OnlineVerifications currentUser={currentUser} />}
            {activeTab === 'summary' && <CollectorSummary collector={currentUser} />}
            {(activeTab === 'collect' || !['verifications', 'summary'].includes(activeTab)) && (
              <CollectorCollect collector={currentUser} />
            )}
          </>
        )}
      </main>

      {/* Mobile-first bottom navigation bar */}
      <BottomNav
        role={currentUser.role}
        canVerifyPayments={currentUser.canVerifyPayments}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingSettlementsCount={pendingSettlementsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />
    </div>
  );
}

export default App;
