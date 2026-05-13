/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  BarChart3, 
  LayoutDashboard, 
  Layers,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth, signIn, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Clients from './components/Clients';
import CalendarView from './components/CalendarView';
import Earnings from './components/Earnings';
import WeeklyTasks from './components/WeeklyTasks';
import { Button } from './components/ui/button';
import { COMMON_DATES_2026, NICHE_DATES_SAMPLES } from './lib/calendar';
import { differenceInDays, isSameDay } from 'date-fns';

type View = 'dashboard' | 'clients' | 'calendar' | 'earnings' | 'weekly';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ clients: 0, pendingTasks: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setStats(prev => ({ ...prev, clients: snap.size }));
    }, (err) => {
      console.warn("Clients listener failed (likely empty or permissions):", err.message);
      // No throw here to allow app to continue
    });

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingTasks: snap.size }));
    }, (err) => {
      console.warn("Tasks listener failed:", err.message);
    });

    const unsubNiches = onSnapshot(collection(db, 'niches'), (nicheSnap) => {
      // Notification Logic simplified
      if (notificationStatus !== 'granted') return;
      
      const niches = nicheSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We'll just check common dates here to avoid the complexity of nested listeners 
      // since the specific niche dates are also handled in their respective components
      COMMON_DATES_2026.forEach(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        const daysDiff = differenceInDays(eventDate, today);

        if (daysDiff === 3) {
          const storageKey = `notif_${event.title}_${eventDate.getTime()}`;
          if (!localStorage.getItem(storageKey)) {
            new Notification(`🗓️ Data Estratégica em 3 dias!`, {
              body: `${event.title} está chegando dia ${eventDate.toLocaleDateString('pt-BR')}. Prepare seus criativos!`,
              icon: '/vite.svg'
            });
            localStorage.setItem(storageKey, 'sent');
          }
        }
      });
    }, (err) => {
       console.warn("Niches listener failed:", err.message);
    });

    return () => {
      unsubClients();
      unsubTasks();
      unsubNiches();
    };
  }, [notificationStatus, user]);

  const requestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: `Clientes (${stats.clients})`, icon: Users },
    { id: 'calendar', label: 'Calendário 2026', icon: CalendarIcon },
    { id: 'weekly', label: 'AGENDA SEMANAL', icon: Layers },
    { id: 'earnings', label: 'Relatório Financeiro', icon: BarChart3 },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-pulse font-bold text-zinc-400 tracking-widest uppercase text-xs">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
        <div className="max-w-md w-full glass-card p-12 text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter uppercase">STUDIO.<span className="font-light">FLOW</span></h1>
            <p className="text-zinc-500 text-sm font-medium">Faça login para gerenciar seu Studio</p>
          </div>
          <Button 
            onClick={signIn}
            className="w-full bg-zinc-900 text-white hover:bg-black h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            Entrar com Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* Sidebar / Navigation */}
      <aside className={`fixed top-0 left-0 h-full glass border-r z-50 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center justify-between">
            <motion.div 
              initial={false}
              animate={{ opacity: isSidebarOpen ? 1 : 0 }}
              className="font-bold text-xl tracking-tighter uppercase"
            >
              STUDIO.<span className="font-light">FLOW</span>
            </motion.div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-black hover:text-white rounded-xl transition-all duration-300">
              {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 py-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  activeView === item.id 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-black/10' 
                    : 'text-zinc-500 hover:bg-white hover:text-black hover:shadow-sm'
                }`}
              >
                <item.icon size={18} className={`${activeView === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                {isSidebarOpen && (
                  <span className="font-semibold text-[9px] uppercase tracking-[0.1em] flex-1 text-left leading-tight">{item.label}</span>
                )}
                {activeView === item.id && !isSidebarOpen && (
                  <motion.div layoutId="active-dot" className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto space-y-4">
            {user && isSidebarOpen && (
              <div className="px-4 py-2 bg-white/30 rounded-xl mb-2">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Usuário</div>
                <div className="text-[10px] font-semibold truncate text-zinc-600">{user.email}</div>
              </div>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-zinc-400 hover:bg-red-50 hover:text-red-600 group"
            >
              <X size={18} className="translate-x-[2px] rotate-45" />
              {isSidebarOpen && (
                <span className="font-semibold text-xs uppercase tracking-widest">Sair</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-500 ease-in-out min-h-screen ${isSidebarOpen ? 'pl-64' : 'pl-20'}`}>
        <header className="sticky top-0 z-40 px-10 py-10 flex items-center justify-between">
           <div>
              <h1 className="text-3xl font-bold uppercase tracking-tighter text-zinc-900 mb-1">
                {activeView === 'dashboard' ? 'Maio, 2026' : navItems.find(n => n.id === activeView)?.label}
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-1">
                Fluxo Criativo & Gestão Estratégica
              </p>
           </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={requestNotifications}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group shadow-none hover:shadow-xl hover:shadow-black/5 relative ${
                  notificationStatus === 'granted' 
                    ? 'glass text-zinc-900 border-emerald-500/50' 
                    : 'glass text-zinc-400 opacity-60 hover:opacity-100 hover:bg-black hover:text-white'
                }`}
              >
                <Bell size={20} className={notificationStatus === 'granted' ? 'text-emerald-600' : 'group-hover:animate-bounce'} />
                {notificationStatus === 'granted' && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
        </header>

        <section className="px-10 pb-20 max-w-7xl mx-auto space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeView === 'dashboard' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardSummary label="Total Clientes" value={stats.clients.toString()} icon={Users} />
                    <CardSummary label="Arte Pendente" value={stats.pendingTasks.toString()} icon={Layers} />
                    <CardSummary label="Próxima Data" value="20/05" icon={CalendarIcon} />
                    <CardSummary label="Ganhos Estimados" value="R$ 5.000" icon={BarChart3} />
                  </div>
                  
                  <div className="glass-card flex flex-col items-center justify-center text-center p-20 space-y-6">
                    <div className="w-24 h-24 glass-darker rounded-[2rem] flex items-center justify-center mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                       <LayoutDashboard className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold uppercase tracking-tighter text-zinc-900">Bom dia, Mary.</h2>
                      <p className="text-zinc-500 max-w-sm text-sm mx-auto">Você tem {stats.pendingTasks} artes agendadas para esta semana. Vamos começar?</p>
                    </div>
                    <Button onClick={() => setActiveView('weekly')} className="bg-zinc-900 text-white hover:bg-black rounded-full px-10 py-6 text-xs font-bold uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
                      Abrir Planejamento
                    </Button>
                  </div>
                </div>
              )}
              {activeView === 'clients' && <Clients />}
              {activeView === 'calendar' && <CalendarView />}
              {activeView === 'weekly' && <WeeklyTasks />}
              {activeView === 'earnings' && <Earnings />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function CardSummary({ label, value, icon: Icon }: any) {
  return (
    <div className="glass-card hover:bg-white transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <Icon size={80} strokeWidth={1} />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">{label}</p>
        <h3 className="text-3xl font-light tracking-tight text-zinc-900">{value}</h3>
      </div>
    </div>
  );
}

