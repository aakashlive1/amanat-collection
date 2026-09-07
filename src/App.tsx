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

export function App() {
  useStoreUpdate(); // Reactive re-render on any store change

  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getAuthUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [memberToken, setMemberToken] = useState<string | null>(null);

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
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (user: User) => {
    store.setAuthUser(user);
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'dashboard' : 'collect');
  };

  const handleLogout = () => {
    store.logout();
    setCurrentUser(null);
  };

  const handleSelectUser = (user: User) => {
    store.setAuthUser(user);
    setCurrentUser(user);
    setActiveTab(user.role === 'admin' ? 'dashboard' : 'collect');
  };

  // If user is accessing public member passbook route
  if (memberToken) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MemberPassbook token={memberToken} />
      </div>
    );
  }

  // If not logged in, show Login view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Login onLoginSuccess={handleLogin} />
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentUser.role === 'admin' ? (
          <>
            {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
            {activeTab === 'members' && <AdminMembers />}
            {activeTab === 'collectors' && <AdminCollectors />}
            {activeTab === 'verifications' && <OnlineVerifications currentUser={currentUser} />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'settlements' && <AdminSettlements />}
            {activeTab === 'settings' && <AdminSettings />}
          </>
        ) : (
          <>
            {activeTab === 'collect' && <CollectorCollect collector={currentUser} />}
            {activeTab === 'verifications' && <OnlineVerifications currentUser={currentUser} />}
            {activeTab === 'summary' && <CollectorSummary collector={currentUser} />}
          </>
        )}
      </main>

      {/* Mobile-first bottom navigation bar */}
      <BottomNav
        role={currentUser.role}
        canVerifyPayments={currentUser.canVerifyPayments}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingSettlementsCount={pendingSettlementsCount}
        pendingVerificationsCount={pendingVerificationsCount}
      />
    </div>
  );
}

export default App;
