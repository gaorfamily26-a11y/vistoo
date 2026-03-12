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
      <div className="fixed inset-0 bg-[#F3F4F6] flex items-center justify-center p-4 font-sans z-[100]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-200 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-600/20">
                V
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Vistoo CRM</h1>
            <p className="text-slate-500 text-sm">Ingresa tu contraseña para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña de acceso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white outline-none transition-all text-slate-900"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Cliente Activo</span>;
      case 'contacted':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><MessageCircle size={12} /> En Gestión</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><AlertCircle size={12} /> Nuevo Lead</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F3F4F6] flex font-sans text-slate-900 z-[100]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111827] text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg">
              V
            </div>
            <span className="font-bold text-lg tracking-tight">Vistoo CRM</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Menú Principal</div>
          <nav className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors">
              <LayoutDashboard size={18} />
              Panel de Leads
            </button>
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-lg font-medium transition-colors">
              <Users size={18} />
              Directorio
            </button>
          </nav>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Configuración</div>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 hover:text-white px-3 py-2 rounded-lg font-medium transition-colors">
              <Settings size={18} />
              Ajustes
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">Administrador</div>
              <div className="text-xs text-slate-400 truncate">admin@vistoo.com</div>
            </div>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F4F6]">
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
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Total Leads</span>
                <Users size={18} className="text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{totalLeads}</div>
              <div className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 inline-flex self-start px-2 py-1 rounded">+12% este mes</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Nuevos / Pendientes</span>
                <AlertCircle size={18} className="text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{pendingLeads}</div>
              <div className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 inline-flex self-start px-2 py-1 rounded">Atención requerida</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">En Gestión</span>
                <MessageCircle size={18} className="text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{contactedLeads}</div>
              <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-100 inline-flex self-start px-2 py-1 rounded">En proceso</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500">Convertidos</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-slate-800">{completedLeads}</div>
                <div className="text-sm font-semibold text-emerald-500">({conversionRate}%)</div>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500 bg-slate-100 inline-flex self-start px-2 py-1 rounded">Tasa de conversión</div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            
            {/* Tabs & Filters */}
            <div className="border-b border-slate-200 px-5 py-3 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                <button onClick={() => setActiveTab('pending')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Nuevos</button>
                <button onClick={() => setActiveTab('contacted')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'contacted' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>En Gestión</button>
                <button onClick={() => setActiveTab('completed')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Clientes</button>
              </div>
              <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
                <Filter size={14} /> Filtrar
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
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Negocio / Contacto</th>
                      <th className="px-6 py-3">Ubicación</th>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3 text-right">Acciones</th>
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
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                                {client.businessName?.substring(0,2).toUpperCase() || 'NA'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{client.businessName || 'Sin Nombre'}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Users size={12} /> {client.ownerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">{client.country || 'No especificado'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">
                              {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(client.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(client.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {client.phone && (
                                <a 
                                  href={`https://wa.me/${client.phone.replace(/\D/g,'')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-md text-slate-400 hover:bg-[#25D366]/10 hover:text-[#25D366] flex items-center justify-center transition-colors"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </a>
                              )}
                              <a 
                                href={`mailto:${client.email}`}
                                className="w-8 h-8 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors"
                                title="Enviar Email"
                              >
                                <Mail size={16} />
                              </a>
                              <button 
                                onClick={() => setSelectedClient(client)}
                                className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                                title="Ver Detalles"
                              >
                                <ChevronRight size={18} />
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

      {/* DETAIL SLIDE-OVER (CRM STYLE) */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col font-sans"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-6 sticky top-0 z-20">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 shrink-0">
                      {selectedClient.businessName?.substring(0,1).toUpperCase() || 'N'}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{selectedClient.businessName}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(selectedClient.status)}
                        <span className="text-sm text-slate-500 flex items-center gap-1"><Calendar size={14}/> {new Date(selectedClient.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Quick Action Bar */}
                <div className="flex flex-wrap gap-3">
                  {selectedClient.phone && (
                    <a href={`https://wa.me/${selectedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${selectedClient.email}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                    <Mail size={16} /> Email
                  </a>
                  {selectedClient.phone && (
                    <a href={`tel:${selectedClient.phone}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
                      <Phone size={16} /> Llamar
                    </a>
                  )}
                  
                  {/* Status Changer Dropdown (Simulated with buttons for now) */}
                  <div className="flex-1 sm:flex-none flex items-center gap-1 bg-slate-100 p-1 rounded-lg ml-auto">
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
              </div>

              {/* Content Tabs (Visual only for now, showing all info) */}
              <div className="flex border-b border-slate-200 px-6 sm:px-8 bg-white">
                <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">Información General</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">Archivos & Fotos</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">Notas Internas</button>
              </div>

              <div className="p-6 sm:p-8 flex-1 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Contact & Business */}
                  <div className="space-y-6">
                    {/* Contact Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Users size={14}/> Contacto Principal</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nombre Completo</div>
                          <div className="font-medium text-slate-800">{selectedClient.ownerName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Correo Electrónico</div>
                          <div className="font-medium text-blue-600">{selectedClient.email || 'No especificado'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Teléfono Directo</div>
                          <div className="font-medium text-slate-800">{selectedClient.phone || 'No especificado'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Business Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 size={14}/> Datos del Negocio</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Categoría / Industria</div>
                          <div className="inline-block bg-slate-100 px-2.5 py-1 rounded text-sm font-medium text-slate-700">{selectedClient.category || 'No especificada'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Sitio Web</div>
                          {selectedClient.website ? (
                            <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1 text-sm">
                              {selectedClient.website} <ArrowUpRight size={14} />
                            </a>
                          ) : (
                            <div className="text-sm text-slate-500 italic">No cuenta con sitio web</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Descripción / Notas del cliente</div>
                          <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {selectedClient.description || <span className="italic text-slate-400">Sin descripción proporcionada.</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Location & Schedule */}
                  <div className="space-y-6">
                    {/* Location Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin size={14}/> Ubicación</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Dirección Exacta</div>
                          <div className="font-medium text-slate-800 leading-snug">{selectedClient.address || 'No especificada'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Ciudad</div>
                            <div className="font-medium text-slate-800">{selectedClient.city || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">País</div>
                            <div className="font-medium text-slate-800">{selectedClient.country || '-'}</div>
                          </div>
                        </div>
                        
                        {selectedClient.lat && selectedClient.lng && (
                          <div className="pt-2">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedClient.lat},${selectedClient.lng}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                              <MapPin size={16} /> Abrir en Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Clock size={14}/> Horario Comercial</h3>
                      {selectedClient.schedule ? (
                        <div className="space-y-2">
                          {Object.entries(selectedClient.schedule).map(([day, data]: [string, any]) => {
                            const dayNames: Record<string, string> = {
                              monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                              thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                            };
                            return (
                              <div key={day} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                                <span className="font-medium text-sm text-slate-600">{dayNames[day]}</span>
                                <span className={`text-sm font-medium ${data.closed ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-800'}`}>
                                  {data.closed ? 'Cerrado' : `${data.open} - ${data.close}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No se especificaron horarios.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photos Section */}
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><ImageIcon size={14}/> Archivos Adjuntos ({selectedClient.photo_urls?.length || 0})</h3>
                  {selectedClient.photo_urls && selectedClient.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {selectedClient.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors group relative shadow-sm">
                          <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                      <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
                      <div className="text-sm font-medium text-slate-600">Sin fotografías</div>
                      <div className="text-xs text-slate-400 mt-1">El cliente no subió imágenes de su negocio.</div>
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
