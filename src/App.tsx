import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Order, Driver, ServiceType } from './types';
import { DB } from './services/storageService';
import { getDriverSession, clearDriverSession, getAdminSession, clearAdminSession } from './services/authService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NotificationCenter } from './components/NotificationCenter';
import { CustomerHome } from './pages/CustomerHome';
import { CustomerOrderModal } from './pages/CustomerOrderModal';
import { DriverLogin } from './pages/DriverLogin';
import { DriverRegister } from './pages/DriverRegister';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { WarungMarketView } from './pages/WarungMarketView';
import { RatingModal } from './components/RatingModal';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('CUSTOMER');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loggedInDriver, setLoggedInDriver] = useState<Driver | null>(null);
  const [driverAuthView, setDriverAuthView] = useState<'login' | 'register'>('login');
  const [adminUser, setAdminUser] = useState<string | null>(() => getAdminSession().username);

  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType>('O-RIDE');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRatingOrder, setSelectedRatingOrder] = useState<Order | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Bottom Navigation Active Tabs
  const [activeCustTab, setActiveCustTab] = useState<string>('home');
  const [activeDriverTab, setActiveDriverTab] = useState<string>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<string>('overview');

  // Load and refresh state from DB
  const refreshData = useCallback(() => {
    const freshOrders = DB.getOrders();
    const freshDrivers = DB.getDrivers();
    setOrders(freshOrders);
    setDrivers(freshDrivers);

    // Refresh logged in driver if any
    const session = getDriverSession();
    if (session) {
      const found = freshDrivers.find((d) => d.id === session.driverId);
      if (found) {
        setLoggedInDriver(found);
      } else {
        clearDriverSession();
        setLoggedInDriver(null);
      }
    } else {
      setLoggedInDriver(null);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Listen to window storage events (cross-tab sync)
    const handleStorageChange = () => {
      refreshData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    refreshData();
  };

  const handleOpenOrderModal = (service: ServiceType = 'O-RIDE') => {
    setSelectedService(service);
    setIsOrderModalOpen(true);
  };

  const handleOpenRatingModal = (order: Order) => {
    setSelectedRatingOrder(order);
    setIsRatingModalOpen(true);
  };

  const unreadNotifs = DB.getNotifications().filter(
    (n) => !n.read && (n.targetRole === 'ALL' || n.targetRole === currentRole)
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      <OfflineIndicator />

      {/* Main Top Header Navbar with App Identity and Testing Role Switcher */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenNotifications={() => setIsNotifOpen(true)}
        unreadNotifsCount={unreadNotifs}
      />

      {/* Primary Role View Content */}
      <main className="flex-1">
        {/* ROLE: CUSTOMER */}
        {currentRole === 'CUSTOMER' && (
          <CustomerHome
            orders={orders}
            onOpenOrderModal={handleOpenOrderModal}
            onOpenRatingModal={handleOpenRatingModal}
            activeTab={activeCustTab}
            onTabChange={setActiveCustTab}
          />
        )}

        {/* ROLE: DRIVER */}
        {currentRole === 'DRIVER' && (
          <>
            {loggedInDriver ? (
              <DriverDashboard
                driver={loggedInDriver}
                orders={orders}
                onLogout={() => {
                  setLoggedInDriver(null);
                  refreshData();
                }}
                onRefreshDriver={refreshData}
              />
            ) : driverAuthView === 'login' ? (
              <DriverLogin
                onLoginSuccess={(driver) => {
                  setLoggedInDriver(driver);
                  refreshData();
                }}
                onGoToRegister={() => setDriverAuthView('register')}
              />
            ) : (
              <DriverRegister
                onBackToLogin={() => setDriverAuthView('login')}
                onRegisteredSuccess={() => {
                  setDriverAuthView('login');
                  refreshData();
                }}
              />
            )}
          </>
        )}

        {/* ROLE: ADMIN */}
        {currentRole === 'ADMIN' && (
          adminUser ? (
            <AdminDashboard
              orders={orders}
              drivers={drivers}
              onRefresh={refreshData}
              adminUsername={adminUser}
              onLogout={() => {
                clearAdminSession();
                setAdminUser(null);
                refreshData();
              }}
            />
          ) : (
            <AdminLogin
              onLoginSuccess={(username) => {
                setAdminUser(username);
                refreshData();
              }}
              onCancel={() => {
                setCurrentRole('CUSTOMER');
              }}
            />
          )
        )}

        {/* ROLE: WARUNG */}
        {currentRole === 'WARUNG' && <WarungMarketView />}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav
        currentRole={currentRole}
        isAdminAuthenticated={!!adminUser}
        activeTab={
          currentRole === 'CUSTOMER'
            ? activeCustTab
            : currentRole === 'DRIVER'
            ? activeDriverTab
            : activeAdminTab
        }
        onTabChange={(tab) => {
          if (currentRole === 'CUSTOMER') setActiveCustTab(tab);
          else if (currentRole === 'DRIVER') setActiveDriverTab(tab);
          else setActiveAdminTab(tab);
        }}
        onOpenOrderModal={() => handleOpenOrderModal('O-RIDE')}
        activeOrderCount={
          orders.filter((o) => o.status !== 'SELESAI' && o.status !== 'DIBATALKAN').length
        }
      />

      {/* Modal: Customer Order O-RIDE / Services */}
      <CustomerOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        defaultService={selectedService}
        onOrderCreated={(newOrder) => {
          refreshData();
        }}
        onViewOrderDetail={(order) => {
          setActiveCustTab('orders');
          refreshData();
        }}
      />

      {/* Modal: Rating Driver */}
      <RatingModal
        isOpen={isRatingModalOpen}
        order={selectedRatingOrder}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedRatingOrder(null);
        }}
        onRated={() => {
          refreshData();
        }}
      />

      {/* Modal: Notification Center with Sound & Haptics Toggle */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        currentRole={currentRole}
      />
    </div>
  );
}
