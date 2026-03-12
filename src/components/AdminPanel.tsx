import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Phone, Globe, Mail, Clock, 
  Image as ImageIcon, CheckCircle, Clock3, X, LogOut, ExternalLink,
  LayoutDashboard, Users, Settings, Filter,
  MessageCircle, ChevronRight, Building2, Calendar, ArrowUpRight,
  PlayCircle, MoreHorizontal, AlertCircle, CheckCircle2
} from 'lucide-react';
import Logo from './Logo';

// Datos de prueba para que el usuario pueda ver el diseño si su base de datos está vacía
const MOCK_CLIENTS = [
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
    description: 'Restaurante familiar de comida italiana tradicional. Buscamos mejorar nuestra presencia en Google Maps para atraer más turistas.'
  },
  {
    id: 'demo-2',
    businessName: 'TechFix Reparaciones',
    ownerName: 'Carlos Rodríguez',
    email: 'carlos@techfix.demo',
    phone: '+34 600 123 456',
    category: 'Servicios Técnicos',
    status: 'contacted',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    city: 'Madrid',
    country: 'España',
    address: 'Calle de la Tecnología 45',
    description: 'Reparación de celulares y computadoras. Necesitamos aparecer cuando la gente busque "reparar celular cerca de mi".'
  },
  {
    id: 'demo-3',
    businessName: 'Spa Relax & Belleza',
    ownerName: 'Ana Smith',
    email: 'ana@sparelax.demo',
    phone: '+1 305 555 1234',
    category: 'Salud y Belleza',
    status: 'completed',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    city: 'Miami',
    country: 'Estados Unidos',
    address: '123 Ocean Drive, Suite 200',
    description: 'Centro de masajes y tratamientos faciales de lujo.'
  }
];

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, contacted, completed
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Simple auth for demo purposes using environment variable
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      fetchClients();
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // Si estamos en modo demo, solo actualizamos el estado local
    if (isDemoMode || id.startsWith('demo-')) {
      const updateList = (list: any[]) => list.map(c => c.id === id ? { ...c, status: newStatus } : c);
      if (isDemoMode) {
        // En un caso real de demo mode, podríamos tener un estado separado para los mocks, 
        // pero para simplificar, si es un ID de demo, solo cerramos el modal o actualizamos la vista
        setClients(updateList(clients));
      } else {
        setClients(updateList(clients));
      }
      if (selectedClient?.id === id) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setClients(clients.map(c => c.id === id ? { ...c, status: newStatus } : c));
      if (selectedClient?.id === id) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setClients(MOCK_CLIENTS);
  };

  const displayClients = clients;

  const filteredClients = displayClients.filter(c => {
    const matchesSearch = 
      c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  // Stats calculations
  const totalLeads = displayClients.length;
  const pendingLeads = displayClients.filter(c => c.status === 'pending').length;
  const contactedLeads = displayClients.filter(c => c.status === 'contacted').length;
  const completedLeads = displayClients.filter(c => c.status === 'completed').length;
  const conversionRate = totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#0F1117] flex items-center justify-center p-4 font-sans z-[100] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.35)_0%,transparent_70%),radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(99,102,241,0.2)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_10%_90%,rgba(16,185,129,0.1)_0%,transparent_60%)] animate-bg-pulse"></div>
        <div className="absolute inset-0 login-grid"></div>
        <motion.div 
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-10 sm:p-12 rounded-3xl w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="w-[52px] h-[52px] bg-blue-600 rounded-[14px] flex items-center justify-center font-display font-bold text-2xl text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)]">
                V
              </div>
            </div>
            <h1 className="text-[26px] font-display font-bold text-white mb-1.5 tracking-tight">Vistoo CRM</h1>
            <p className="text-white/45 text-[13px] font-normal">Ingresa tu contraseña para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-[0.08em] mb-2">Contraseña de acceso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-[13px] bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:bg-blue-600/10 outline-none transition-all text-white text-[15px]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-[14px] px-4 rounded-lg transition-all shadow-[0_4px_16px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.5)] text-[15px]"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-600 to-purple-600',
      'from-sky-500 to-emerald-500',
      'from-amber-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-cyan-500',
      'from-teal-500 to-blue-500',
      'from-orange-500 to-amber-500'
    ];
    if (!name) return gradients[0];
    const charCode = name.charCodeAt(0);
    return gradients[charCode % gradients.length];
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            Cliente Activo
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-amber-500/10 text-amber-600 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            En Gestión
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-blue-600/10 text-blue-600 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 shadow-[0_0_0_2px_rgba(37,99,235,0.25)] animate-pulse-dot"></span>
            Nuevo Lead
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFF] flex font-sans text-slate-900 z-[100]">
      {/* SIDEBAR */}
      <aside className="w-[220px] bg-[#0F1117] text-slate-300 flex flex-col hidden md:flex shrink-0 relative sidebar-gradient-border border-r border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-1 mb-5 mx-3 mt-5 border-b border-white/5 pb-5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-display font-bold text-sm text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
            V
          </div>
          <span className="font-display font-bold text-base text-white tracking-tight">Vistoo CRM</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar">
          <div className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.1em] mb-1.5 px-2">Menú Principal</div>
          <nav className="space-y-0.5 mb-6">
            <button className="w-full flex items-center gap-2.5 bg-blue-600/20 text-blue-500 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
              <LayoutDashboard size={15} />
              Panel de Leads
              <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">3</span>
            </button>
            <button className="w-full flex items-center gap-2.5 text-white/45 hover:bg-white/5 hover:backdrop-blur-md hover:text-white/75 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
              <Users size={15} />
              Directorio
            </button>
          </nav>

          <div className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.1em] mb-1.5 px-2">Configuración</div>
          <nav className="space-y-0.5">
            <button className="w-full flex items-center gap-2.5 text-white/45 hover:bg-white/5 hover:backdrop-blur-md hover:text-white/75 px-2.5 py-[9px] rounded-lg font-medium transition-colors text-[13.5px]">
              <Settings size={15} />
              Ajustes
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/5 mx-3 mb-5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/5 hover:backdrop-blur-md cursor-pointer transition-colors group">
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
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFF] relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-700">
              <LayoutDashboard size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">Gestión de Solicitudes</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar clientes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm sm:hidden">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-[18px] sm:p-5 rounded-[16px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col border-l-[3px] border-l-slate-400 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all cursor-default">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Total Leads</span>
              </div>
              <div className="text-[32px] font-display font-bold text-slate-900 leading-none mb-1.5">{totalLeads}</div>
              <div className="text-xs font-medium text-emerald-500">+12% este mes</div>
            </div>
            <div className="bg-white p-[18px] sm:p-5 rounded-[16px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col border-l-[3px] border-l-blue-600 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all cursor-default">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Nuevos / Pendientes</span>
              </div>
              <div className="text-[32px] font-display font-bold text-slate-900 leading-none mb-1.5">{pendingLeads}</div>
              <div className="text-xs font-medium text-blue-600">Atención requerida</div>
            </div>
            <div className="bg-white p-[18px] sm:p-5 rounded-[16px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col border-l-[3px] border-l-amber-500 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all cursor-default">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em]">En Gestión</span>
              </div>
              <div className="text-[32px] font-display font-bold text-slate-900 leading-none mb-1.5">{contactedLeads}</div>
              <div className="text-xs font-medium text-amber-500">En proceso</div>
            </div>
            <div className="bg-white p-[18px] sm:p-5 rounded-[16px] border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col border-l-[3px] border-l-emerald-500 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-[1px] transition-all cursor-default">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.06em]">Convertidos</span>
              </div>
              <div className="flex items-baseline gap-2 mb-1.5">
                <div className="text-[32px] font-display font-bold text-slate-900 leading-none">{completedLeads}</div>
                <div className="text-base font-semibold text-emerald-500">({conversionRate}%)</div>
              </div>
              <div className="text-xs font-medium text-emerald-500">Tasa de conversión</div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Tabs & Filters */}
            <div className="border-b border-slate-200 px-5 py-4 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-1">
                <button onClick={() => setActiveTab('all')} className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'all' ? 'bg-blue-600/10 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Todos</button>
                <button onClick={() => setActiveTab('pending')} className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'pending' ? 'bg-blue-600/10 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Nuevos</button>
                <button onClick={() => setActiveTab('contacted')} className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'contacted' ? 'bg-blue-600/10 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>En Gestión</button>
                <button onClick={() => setActiveTab('completed')} className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'completed' ? 'bg-blue-600/10 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>Clientes</button>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-md border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Filter size={12} /> Filtrar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : displayClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <LayoutDashboard className="text-slate-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Tu CRM está listo</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">Aún no tienes solicitudes registradas. Cuando los usuarios completen el formulario, aparecerán aquí.</p>
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
                      filteredClients.map((client, index) => {
                        const gradientClass = getAvatarGradient(client.businessName || '');

                        return (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors duration-200 group cursor-pointer" onClick={() => setSelectedClient(client)}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br ${gradientClass} flex items-center justify-center font-display font-bold text-xs text-white shrink-0`}>
                                {client.businessName?.substring(0,2).toUpperCase() || 'NA'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-[14px]">{client.businessName || 'Sin Nombre'}</div>
                                <div className="text-[12px] text-slate-500 mt-px">
                                  {client.ownerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-[13px] text-slate-500">{client.country || 'No especificado'}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-[12.5px] font-medium text-slate-900">
                              {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-[11.5px] text-slate-400">
                              {new Date(client.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {getStatusBadge(client.status)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              {client.phone && (
                                <a 
                                  href={`https://wa.me/${client.phone.replace(/\D/g,'')}`} 
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
                      )})
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* DETAIL SLIDE-OVER (CRM STYLE) */}
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
              className="w-full max-w-[520px] bg-white h-full shadow-[-20px_0_60px_rgba(0,0,0,0.12)] border-l border-slate-200 overflow-y-auto flex flex-col font-sans"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-6 pt-5 pb-0 shrink-0 sticky top-0 z-20">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarGradient(selectedClient.businessName || '')} flex items-center justify-center font-display font-bold text-lg text-white shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]`}>
                      {selectedClient.businessName?.substring(0,1).toUpperCase() || 'N'}
                    </div>
                    <div>
                      <h2 className="text-[18px] font-display font-bold text-slate-900 leading-tight">{selectedClient.businessName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedClient.status)}
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">📅 {new Date(selectedClient.created_at).toLocaleDateString()}</span>
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

                {/* Quick Action Bar */}
                <div className="flex gap-2 mb-4">
                  {selectedClient.phone && (
                    <a href={`https://wa.me/${selectedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-[#25D366] hover:brightness-95 active:scale-97 text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] transition-all">
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-1.5 bg-blue-600 hover:brightness-95 active:scale-97 text-white px-3.5 py-2 rounded-lg font-semibold text-[13px] transition-all">
                    <Mail size={13} /> Email
                  </a>
                  {selectedClient.phone && (
                    <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-1.5 bg-transparent border border-slate-200 hover:brightness-95 active:scale-97 text-slate-600 px-3.5 py-2 rounded-lg font-semibold text-[13px] transition-all">
                      <Phone size={13} /> Llamar
                    </a>
                  )}
                  
                  {/* Status Changer Dropdown (Simulated with buttons for now) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-auto">
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'pending')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedClient.status === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >Nuevo</button>
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'contacted')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedClient.status === 'contacted' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >En Gestión</button>
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'completed')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedClient.status === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >Convertido</button>
                  </div>
                </div>

                {/* Pipeline Steps */}
                <div className="flex gap-0 -mb-px">
                  <div className="px-4 py-2.5 text-[12.5px] font-semibold text-blue-600 border-b-2 border-blue-600 cursor-pointer whitespace-nowrap">Información General</div>
                  <div className="px-4 py-2.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-colors">Archivos & Fotos</div>
                  <div className="px-4 py-2.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-900 border-b-2 border-transparent cursor-pointer whitespace-nowrap transition-colors">Notas Internas</div>
                </div>
              </div>

              <div className="p-6 sm:p-8 flex-1 bg-white">
                <div className="space-y-6">
                  
                  {/* Contact Card */}
                  <div className="mb-5">
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-200"><Users size={12}/> Contacto Principal</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Nombre Completo</div>
                        <div className="text-[13.5px] font-medium text-slate-900">{selectedClient.ownerName}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Teléfono Directo</div>
                        <div className="text-[13.5px] font-medium text-slate-900">{selectedClient.phone || 'No especificado'}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Correo Electrónico</div>
                        <div className="text-[13.5px] font-medium text-blue-600 hover:underline cursor-pointer">{selectedClient.email || 'No especificado'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Business Card */}
                  <div className="mb-5">
                    <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-200"><Building2 size={12}/> Datos del Negocio</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Categoría / Industria</div>
                        <div className="text-[13.5px] font-medium text-slate-900">{selectedClient.category || 'No especificada'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Sitio Web</div>
                        {selectedClient.website ? (
                          <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-[13.5px] font-medium text-blue-600 hover:underline flex items-center gap-1">
                            {selectedClient.website} <ArrowUpRight size={12} />
                          </a>
                        ) : (
                          <div className="text-[13.5px] font-medium text-slate-400 italic">No cuenta con sitio web</div>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-[11px] font-medium text-slate-400 mb-1">Descripción / Notas del cliente</div>
                        <div className="bg-[#FFFBF0] border border-[#FDE68A] border-l-[3px] border-l-amber-500 rounded-md p-3 text-[13px] text-[#78350F] leading-relaxed">
                          {selectedClient.description || 'Sin notas adicionales.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Location & Schedule */}
                  <div className="space-y-6">
                    {/* Location Card */}
                    <div className="mb-5">
                      <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-200"><MapPin size={12}/> Ubicación</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[11px] font-medium text-slate-400 mb-1">Dirección Exacta</div>
                          <div className="text-[13.5px] font-medium text-slate-900 leading-snug">{selectedClient.address || 'No especificada'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[11px] font-medium text-slate-400 mb-1">Ciudad</div>
                            <div className="text-[13.5px] font-medium text-slate-900">{selectedClient.city || '-'}</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-slate-400 mb-1">País</div>
                            <div className="text-[13.5px] font-medium text-slate-900">{selectedClient.country || '-'}</div>
                          </div>
                        </div>
                        
                        {selectedClient.lat && selectedClient.lng && (
                          <div className="pt-1">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedClient.lat},${selectedClient.lng}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 text-slate-600 px-3.5 py-2 rounded-lg font-semibold text-[13px] transition-all"
                            >
                              <MapPin size={13} /> Abrir en Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="mb-5">
                      <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-200"><Clock size={12}/> Horario Comercial</h3>
                      {selectedClient.schedule ? (
                        <div className="space-y-1.5">
                          {Object.entries(selectedClient.schedule).map(([day, data]: [string, any]) => {
                            const dayNames: Record<string, string> = {
                              monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                              thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                            };
                            return (
                              <div key={day} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                <span className="font-medium text-[13px] text-slate-500">{dayNames[day]}</span>
                                <span className={`text-[13px] font-medium ${data.closed ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-900'}`}>
                                  {data.closed ? 'Cerrado' : `${data.open} - ${data.close}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[13.5px] font-medium text-slate-400 italic">No se especificaron horarios.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photos Section */}
                <div className="mt-8">
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5 after:content-[''] after:flex-1 after:h-px after:bg-slate-200"><ImageIcon size={12}/> Archivos Adjuntos ({selectedClient.photo_urls?.length || 0})</h3>
                  {selectedClient.photo_urls && selectedClient.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedClient.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors group relative shadow-sm">
                          <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <ExternalLink className="text-white" size={20} />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                      <ImageIcon className="mx-auto text-slate-300 mb-2" size={28} />
                      <div className="text-[13.5px] font-medium text-slate-600">Sin fotografías</div>
                      <div className="text-[11px] font-medium text-slate-400 mt-1">El cliente no subió imágenes de su negocio.</div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
