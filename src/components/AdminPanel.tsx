import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, MapPin, Phone, Globe, Mail, Clock,
  Image as ImageIcon, X, LogOut, ExternalLink,
  LayoutDashboard, Users, Settings, Filter,
  MessageCircle, ChevronRight, Building2, Calendar,
  ArrowUpRight, PlayCircle, MoreHorizontal, CheckCircle2,
  User, Menu
} from 'lucide-react';
import Logo from './Logo';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientStatus = 'pending' | 'contacted' | 'completed';

interface BusinessScheduleDay {
  open: string;
  close: string;
  closed?: boolean;
}

interface Client {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  category?: string;
  status: ClientStatus;
  created_at: string;
  city?: string;
  country?: string;
  address?: string;
  description?: string;
  website?: string;
  schedule?: Record<string, BusinessScheduleDay>;
  photo_urls?: string[];
}

type ActiveTab = 'all' | ClientStatus;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLIENTS: Client[] = [
  {
    id: 'demo-1',
    businessName: 'La Trattoria del Centro',
    ownerName: 'María González',
    email: 'maria@latrattoria.demo',
    phone: '+52 55 1234 5678',
    category: 'Restaurante Italiano',
    status: 'pending',
    created_at: new Date().toISOString(),
    city: 'Ciudad de México',
    country: 'México',
    address: 'Av. Principal 123, Centro Histórico',
    description:
      'Restaurante familiar de comida italiana tradicional. Buscamos mejorar nuestra presencia en Google Maps para atraer más turistas.',
  },
  {
    id: 'demo-2',
    businessName: 'TechFix Reparaciones',
    ownerName: 'Carlos Rodríguez',
    email: 'carlos@techfix.demo',
    phone: '+34 600 123 456',
    category: 'Servicios Técnicos',
    status: 'contacted',
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
    city: 'Madrid',
    country: 'España',
    address: 'Calle de la Tecnología 45',
    description:
      'Reparación de celulares y computadoras. Necesitamos aparecer cuando la gente busque "reparar celular cerca de mi".',
  },
  {
    id: 'demo-3',
    businessName: 'Spa Relax & Belleza',
    ownerName: 'Ana Smith',
    email: 'ana@sparelax.demo',
    phone: '+1 305 555 1234',
    category: 'Salud y Belleza',
    status: 'completed',
    created_at: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    city: 'Miami',
    country: 'Estados Unidos',
    address: '123 Ocean Drive, Suite 200',
    description: 'Centro de masajes y tratamientos faciales de lujo.',
  },
];

// ─── Helpers (outside component) ─────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-blue-600 to-purple-600',
  'from-sky-500 to-emerald-500',
  'from-amber-500 to-red-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-cyan-500',
  'from-teal-500 to-blue-500',
  'from-orange-500 to-amber-500',
] as const;

function getAvatarGradient(name: string): string {
  if (!name) return AVATAR_GRADIENTS[0];
  return AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function getStatusBadge(status: ClientStatus) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Cliente Activo
        </span>
      );
    case 'contacted':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-amber-500/10 text-amber-600 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          En Gestión
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-blue-600/10 text-blue-600 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_0_2px_rgba(37,99,235,0.25)] animate-pulse-dot" />
          Nuevo Lead
        </span>
      );
  }
}

const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      fetchClients();
    } else {
      setLoginError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  // ── Data ──────────────────────────────────────────────────────────────────

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClients((data as Client[]) ?? []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, newStatus: ClientStatus) => {
    const isDemo = isDemoMode || id.startsWith('demo-');

    const applyLocally = () => {
      setClients(prev => prev.map(c => (c.id === id ? { ...c, status: newStatus } : c)));
      setSelectedClient(prev => (prev?.id === id ? { ...prev, status: newStatus } : prev));
    };

    if (isDemo) {
      applyLocally();
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      applyLocally();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setClients(MOCK_CLIENTS);
  };

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.businessName?.toLowerCase().includes(q) ||
      c.ownerName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalLeads = clients.length;
  const pendingLeads = clients.filter(c => c.status === 'pending').length;
  const contactedLeads = clients.filter(c => c.status === 'contacted').length;
  const completedLeads = clients.filter(c => c.status === 'completed').length;
  const conversionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0F1117] flex items-center justify-center p-4 font-sans z-[100] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.35)_0%,transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(99,102,241,0.2)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_10%_90%,rgba(16,185,129,0.1)_0%,transparent_60%)] animate-bg-pulse" />
        <div className="absolute inset-0 login-grid" />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#1A1D24] border border-white/5 p-10 sm:p-12 rounded-3xl w-full max-w-md relative z-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="w-[52px] h-[52px] bg-blue-600 rounded-[14px] flex items-center justify-center font-display font-bold text-2xl text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                V
              </div>
            </div>
            <h1 className="text-[26px] font-display font-bold text-white mb-1.5 tracking-tight">
              Vistoo CRM
            </h1>
            <p className="text-white/45 text-[13px]">Ingresa tu contraseña para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-[0.08em] mb-2">
                Contraseña de acceso
              </label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="••••••••"
                className="w-full px-4 py-[13px] bg-[#222630] border border-white/5 rounded-lg focus:border-blue-500 focus:bg-[#2A2F3A] outline-none transition-all text-white text-[15px]"
                required
              />
              {loginError && (
                <p className="mt-2 text-[12px] text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {loginError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-[14px] px-4 rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] text-[15px]"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2.5 px-2 py-1 mb-5 mx-3 mt-5 border-b border-white/5 pb-5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-display font-bold text-sm text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
          V
        </div>
        <span className="font-display font-bold text-base text-white tracking-tight">Vistoo CRM</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
        <div className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.1em] mb-1.5 px-2">
          Menú Principal
        </div>
        <nav className="space-y-0.5 mb-6">
          <button className="w-full flex items-center gap-2.5 bg-blue-600/20 text-blue-500 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
            <LayoutDashboard size={15} />
            Panel de Leads
            <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {totalLeads}
            </span>
          </button>
          <button className="w-full flex items-center gap-2.5 text-white/45 hover:bg-white/5 hover:text-white/75 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
            <Users size={15} />
            Directorio
          </button>
        </nav>

        <div className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.1em] mb-1.5 px-2">
          Configuración
        </div>
        <nav className="space-y-0.5">
          <button className="w-full flex items-center gap-2.5 text-white/45 hover:bg-white/5 hover:text-white/75 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
            <Settings size={15} />
            Ajustes
          </button>
        </nav>
      </div>

      <div className="pt-4 border-t border-white/5 mx-3 mb-5">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] shrink-0">
            AD
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-white/75 truncate leading-[1.2]">Admin</div>
            <div className="text-[11px] text-white/30 truncate">Administrador</div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-[#F8FAFF] flex font-sans text-slate-900 z-[100]">

      {/* ── Desktop sidebar ── */}
      <aside className="w-[220px] bg-[#0F1117] text-slate-300 hidden md:flex flex-col shrink-0 relative sidebar-gradient-border border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[110] md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0F1117] text-slate-300 flex flex-col z-[120] md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFF] relative">

        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-500 hover:text-slate-700 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">Gestión de Solicitudes</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              />
            </div>
            {/* Mobile search icon */}
            <button className="sm:hidden text-slate-500 hover:text-slate-700">
              <Search size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            {[
              { label: 'Total Leads', value: totalLeads, sub: '+12% este mes', subColor: 'text-emerald-500', accent: 'border-l-slate-400' },
              { label: 'Nuevos / Pendientes', value: pendingLeads, sub: 'Atención requerida', subColor: 'text-blue-600', accent: 'border-l-blue-600' },
              { label: 'En Gestión', value: contactedLeads, sub: 'En proceso', subColor: 'text-amber-500', accent: 'border-l-amber-500' },
              { label: 'Convertidos', value: completedLeads, valueSuffix: `(${conversionRate}%)`, sub: 'Tasa de conversión', subColor: 'text-emerald-500', accent: 'border-l-emerald-500' },
            ].map(card => (
              <div
                key={card.label}
                className={`bg-white p-[18px] sm:p-5 rounded-[16px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col border-l-[3px] ${card.accent} hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all cursor-default`}
              >
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em] mb-2.5">
                  {card.label}
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <div className="text-[32px] font-display font-bold text-slate-900 leading-none">
                    {card.value}
                  </div>
                  {card.valueSuffix && (
                    <div className={`text-base font-semibold ${card.subColor}`}>{card.valueSuffix}</div>
                  )}
                </div>
                <div className={`text-xs font-medium ${card.subColor}`}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className="bg-white rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-slate-200 flex flex-col overflow-hidden">

            <div className="border-b border-slate-200 px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex gap-1">
                {(['all', 'pending', 'contacted', 'completed'] as const).map(tab => {
                  const labels: Record<string, string> = {
                    all: 'Todos',
                    pending: 'Nuevos',
                    contacted: 'En Gestión',
                    completed: 'Clientes',
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-blue-600/10 text-blue-600 font-semibold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-md border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Filter size={12} /> Filtrar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <LayoutDashboard className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Tu CRM está listo</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  Aún no tienes solicitudes registradas. Cuando los usuarios completen el formulario, aparecerán aquí.
                </p>
                <button
                  onClick={enableDemoMode}
                  className="bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg transition-all shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <PlayCircle size={16} className="text-blue-600" />
                  Cargar Datos de Prueba
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#FAFBFF] border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-[0.06em] font-semibold">
                      <th className="px-5 py-2.5">Negocio / Contacto</th>
                      <th className="px-5 py-2.5">Ubicación</th>
                      <th className="px-5 py-2.5">Fecha</th>
                      <th className="px-5 py-2.5">Estado</th>
                      <th className="px-5 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                          No se encontraron resultados para tu búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map(client => (
                        <tr
                          key={client.id}
                          className={`hover:bg-slate-50 transition-colors duration-150 cursor-pointer ${
                            selectedClient?.id === client.id ? 'bg-blue-50/60' : ''
                          }`}
                          onClick={() => setSelectedClient(client)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br ${getAvatarGradient(client.businessName)} flex items-center justify-center font-display font-bold text-xs text-white shrink-0`}
                              >
                                {client.businessName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-[14px]">
                                  {client.businessName}
                                </div>
                                <div className="text-[12px] text-slate-500 mt-px">{client.ownerName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[13px] text-slate-500">
                            {client.country ?? 'No especificado'}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-[12.5px] font-medium text-slate-900">
                              {new Date(client.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                            <div className="text-[11.5px] text-slate-400">
                              {new Date(client.created_at).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">{getStatusBadge(client.status)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={e => e.stopPropagation()}
                            >
                              {client.phone && (
                                <a
                                  href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-[30px] h-[30px] rounded-[7px] border border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={13} />
                                </a>
                              )}
                              <a
                                href={`mailto:${client.email}`}
                                className="w-[30px] h-[30px] rounded-[7px] border border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"
                                title="Enviar Email"
                              >
                                <Mail size={13} />
                              </a>
                              <button
                                onClick={() => setSelectedClient(client)}
                                className="w-[30px] h-[30px] rounded-[7px] border border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"
                                title="Ver Detalles"
                              >
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Detail drawer ── */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex justify-end"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-[520px] bg-white h-full shadow-[-20px_0_60px_rgba(0,0,0,0.12)] border-l border-slate-200 flex flex-col font-sans"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-0 shrink-0 sticky top-0 z-20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(selectedClient.businessName)} flex items-center justify-center font-display font-bold text-lg text-white shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]`}
                    >
                      {selectedClient.businessName.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-display font-bold text-slate-900 leading-tight">
                        {selectedClient.businessName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedClient.status)}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(selectedClient.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-slate-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {selectedClient.phone && (
                    <a
                      href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.97] text-white px-3 py-1.5 rounded-full font-medium text-[12px] transition-all"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white px-3 py-1.5 rounded-full font-medium text-[12px] transition-all"
                  >
                    <Mail size={14} /> Email
                  </a>
                  {selectedClient.phone && (
                    <a
                      href={`tel:${selectedClient.phone}`}
                      className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.97] text-slate-700 px-3 py-1.5 rounded-full font-medium text-[12px] transition-all shadow-sm"
                    >
                      <Phone size={14} /> Llamar
                    </a>
                  )}
                  <button
                    onClick={() => updateStatus(selectedClient.id, 'pending')}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.97] text-slate-700 px-3 py-1.5 rounded-full font-medium text-[12px] transition-all shadow-sm ml-auto"
                  >
                    <ArrowUpRight size={14} /> Nuevo
                  </button>
                  <button
                    onClick={() => updateStatus(selectedClient.id, 'contacted')}
                    className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.97] text-emerald-700 px-3 py-1.5 rounded-full font-medium text-[12px] transition-all"
                  >
                    <CheckCircle2 size={14} /> En Gestión
                  </button>
                </div>

                {/* Pipeline tabs */}
                <div className="flex gap-6 -mb-px border-b border-slate-200">
                  <div className="pb-3 text-[13px] font-semibold text-blue-600 border-b-2 border-blue-600 cursor-pointer whitespace-nowrap">
                    Información General
                  </div>
                  <div className="pb-3 text-[13px] font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-colors">
                    Archivos & Fotos
                  </div>
                  <div className="pb-3 text-[13px] font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-colors">
                    Notas Internas
                  </div>
                </div>
              </div>

              {/* Drawer body */}
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-white custom-scrollbar">
                <div className="space-y-8">

                  {/* Contact */}
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-5 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
                      <User size={14} /> Contacto Principal
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                      <div>
                        <div className="text-[12px] text-slate-500 mb-1">Nombre Completo</div>
                        <div className="text-[14px] font-medium text-slate-900">{selectedClient.ownerName}</div>
                      </div>
                      <div>
                        <div className="text-[12px] text-slate-500 mb-1">Teléfono Directo</div>
                        <div className="text-[14px] font-medium text-slate-900">
                          {selectedClient.phone ?? 'No especificado'}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[12px] text-slate-500 mb-1">Correo Electrónico</div>
                        <a
                          href={`mailto:${selectedClient.email}`}
                          className="text-[14px] font-medium text-blue-600 hover:underline"
                        >
                          {selectedClient.email ?? 'No especificado'}
                        </a>
                      </div>
                    </div>
                  </section>

                  {/* Business */}
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-5 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
                      <Building2 size={14} /> Datos del Negocio
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                      <div>
                        <div className="text-[12px] text-slate-500 mb-1">Categoría / Industria</div>
                        <div className="text-[14px] font-medium text-slate-900">
                          {selectedClient.category ?? 'No especificada'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[12px] text-slate-500 mb-1">Sitio Web</div>
                        {selectedClient.website ? (
                          <a
                            href={selectedClient.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[14px] font-medium text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {selectedClient.website} <ExternalLink size={13} />
                          </a>
                        ) : (
                          <div className="text-[14px] text-slate-400 italic">No cuenta con sitio web</div>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[12px] text-slate-500 mb-2">Descripción / Notas del cliente</div>
                        <div className="bg-[#FFFDF5] border border-amber-200/60 rounded-lg p-4 text-[13.5px] text-amber-900 leading-relaxed">
                          {selectedClient.description ?? 'Sin notas adicionales.'}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Location */}
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-5 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
                      <MapPin size={14} /> Ubicación
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <div className="text-[12px] text-slate-500 mb-1">Dirección Exacta</div>
                        <div className="text-[14px] font-medium text-slate-900 leading-snug">
                          {selectedClient.address ?? 'No especificada'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[12px] text-slate-500 mb-1">Ciudad</div>
                          <div className="text-[14px] font-medium text-slate-900">
                            {selectedClient.city ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[12px] text-slate-500 mb-1">País</div>
                          <div className="text-[14px] font-medium text-slate-900">
                            {selectedClient.country ?? '—'}
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="pt-2">
                        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
                          <Clock size={14} /> Horario Comercial
                        </h3>
                        {selectedClient.schedule ? (
                          <div className="space-y-2">
                            {Object.entries(selectedClient.schedule).map(([day, data]) => (
                              <div
                                key={day}
                                className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0"
                              >
                                <span className="text-[13px] text-slate-500">{DAY_NAMES[day] ?? day}</span>
                                <span
                                  className={`text-[13px] font-medium ${
                                    data.closed ? 'text-slate-400 italic' : 'text-slate-900'
                                  }`}
                                >
                                  {data.closed ? 'Cerrado' : `${data.open} – ${data.close}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[13.5px] text-slate-400 italic">
                            No se especificaron horarios.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Photos */}
                  <section>
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-5 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-200">
                      <ImageIcon size={14} /> Archivos Adjuntos ({selectedClient.photo_urls?.length ?? 0})
                    </h3>
                    {selectedClient.photo_urls && selectedClient.photo_urls.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {selectedClient.photo_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors group relative shadow-sm"
                          >
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                              <ExternalLink className="text-white" size={20} />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-transparent border border-dashed border-slate-300 rounded-xl p-10 text-center flex flex-col items-center justify-center">
                        <ImageIcon className="text-slate-300 mb-3" size={32} />
                        <div className="text-[14px] font-medium text-slate-500">Sin fotografías</div>
                        <div className="text-[12px] text-slate-400 mt-1">
                          El cliente no subió imágenes de su negocio.
                        </div>
                      </div>
                    )}
                  </section>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
