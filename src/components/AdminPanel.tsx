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

  // Simple hardcoded auth for demo purposes
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Logo className="text-3xl text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Panel de Control</h1>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales para administrar los clientes.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña de acceso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ej: admin123"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Ingresar al CRM
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative z-10">
      {/* SIDEBAR */}
      <div className="w-full md:w-72 bg-[#0A0A0A] text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Logo className="text-lg text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Vistoo CRM</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-slate-500 hover:text-white md:hidden">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Gestión Principal</div>
          <nav className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 bg-blue-600/10 text-blue-400 px-3 py-2.5 rounded-xl font-medium border border-blue-500/20 transition-colors">
              <LayoutDashboard size={18} />
              Panel de Leads
            </button>
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 px-3 py-2.5 rounded-xl font-medium transition-colors">
              <Users size={18} />
              Directorio de Clientes
            </button>
          </nav>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Configuración</div>
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 px-3 py-2.5 rounded-xl font-medium transition-colors">
              <Settings size={18} />
              Ajustes de Cuenta
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/50 bg-[#0A0A0A]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              AD
            </div>
            <div>
              <div className="text-sm font-bold text-white">Administrador</div>
              <div className="text-xs text-slate-500">admin@vistoo.com</div>
            </div>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 py-2.5 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Solicitudes</h1>
            <p className="text-sm text-slate-500 mt-1">Administra, contacta y convierte tus leads en clientes.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o negocio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={24} /></div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12% este mes</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 mb-1">Total Leads</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertCircle size={24} /></div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Atención req.</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 mb-1">Nuevos / Pendientes</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{pendingLeads}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><MessageCircle size={24} /></div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 mb-1">En Gestión</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{contactedLeads}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Tasa de conv.</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-500 mb-1">Convertidos</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{completedLeads} <span className="text-base font-medium text-emerald-500 ml-1">({conversionRate}%)</span></div>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Tabs & Filters */}
            <div className="border-b border-slate-200 px-6 py-4 flex flex-wrap gap-4 items-center justify-between bg-white">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Todos</button>
                <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Nuevos</button>
                <button onClick={() => setActiveTab('contacted')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'contacted' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>En Gestión</button>
                <button onClick={() => setActiveTab('completed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>Clientes</button>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                <Filter size={16} /> Filtros
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : displayClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50/50">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-200">
                  <LayoutDashboard className="text-slate-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tu CRM está listo</h3>
                <p className="text-slate-500 max-w-md mb-8">Aún no tienes solicitudes registradas. Cuando los usuarios completen el formulario, aparecerán aquí para que puedas gestionarlos.</p>
                <button 
                  onClick={enableDemoMode}
                  className="bg-white hover:bg-slate-50 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <PlayCircle size={20} className="text-blue-600" />
                  Cargar Datos de Prueba (Demo)
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-200 text-slate-400 text-xs uppercase tracking-widest">
                      <th className="p-4 font-bold pl-6">Negocio / Contacto</th>
                      <th className="p-4 font-bold">Ubicación</th>
                      <th className="p-4 font-bold">Fecha</th>
                      <th className="p-4 font-bold">Estado</th>
                      <th className="p-4 font-bold text-right pr-6">Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500 font-medium">
                          No se encontraron resultados para tu búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedClient(client)}>
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {client.businessName?.substring(0,2).toUpperCase() || 'NA'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{client.businessName || 'Sin Nombre'}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Users size={12} /> {client.ownerName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-700">{client.country || 'No especificado'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-slate-700 font-medium">
                              {new Date(client.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(client.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(client.status)}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {client.phone && (
                                <a 
                                  href={`https://wa.me/${client.phone.replace(/\D/g,'')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </a>
                              )}
                              <a 
                                href={`mailto:${client.email}`}
                                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                title="Enviar Email"
                              >
                                <Mail size={16} />
                              </a>
                              <button 
                                onClick={() => setSelectedClient(client)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors ml-2"
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
        </main>
      </div>

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
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-6 sticky top-0 z-20">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl font-black text-blue-600">
                      {selectedClient.businessName?.substring(0,1).toUpperCase() || 'N'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">{selectedClient.businessName}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(selectedClient.status)}
                        <span className="text-sm text-slate-500 flex items-center gap-1"><Calendar size={14}/> {new Date(selectedClient.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full text-slate-500 transition-colors shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Quick Action Bar */}
                <div className="flex flex-wrap gap-3">
                  {selectedClient.phone && (
                    <a href={`https://wa.me/${selectedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-[#25D366]/20">
                      <MessageCircle size={18} /> WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${selectedClient.email}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm shadow-blue-600/20">
                    <Mail size={18} /> Enviar Email
                  </a>
                  {selectedClient.phone && (
                    <a href={`tel:${selectedClient.phone}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                      <Phone size={18} /> Llamar
                    </a>
                  )}
                  
                  {/* Status Changer Dropdown (Simulated with buttons for now) */}
                  <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm ml-auto">
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedClient.status === 'pending' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                    >Nuevo</button>
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'contacted')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedClient.status === 'contacted' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >En Gestión</button>
                    <button 
                      onClick={() => updateStatus(selectedClient.id, 'completed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedClient.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'}`}
                    >Convertido</button>
                  </div>
                </div>
              </div>

              {/* Content Tabs (Visual only for now, showing all info) */}
              <div className="flex border-b border-slate-200 px-8 bg-white">
                <button className="px-4 py-4 border-b-2 border-blue-600 text-blue-600 font-bold text-sm">Información General</button>
                <button className="px-4 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-bold text-sm">Archivos & Fotos</button>
                <button className="px-4 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-bold text-sm">Notas Internas</button>
              </div>

              <div className="p-8 flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left Column: Contact & Business */}
                  <div className="space-y-8">
                    {/* Contact Card */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Contacto Principal</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Nombre Completo</div>
                          <div className="font-bold text-slate-900">{selectedClient.ownerName}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Correo Electrónico</div>
                          <div className="font-medium text-blue-600">{selectedClient.email || 'No especificado'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Teléfono Directo</div>
                          <div className="font-medium text-slate-900">{selectedClient.phone || 'No especificado'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Business Card */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={14}/> Datos del Negocio</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Categoría / Industria</div>
                          <div className="inline-block bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm font-bold text-slate-700">{selectedClient.category || 'No especificada'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Sitio Web</div>
                          {selectedClient.website ? (
                            <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                              {selectedClient.website} <ArrowUpRight size={14} />
                            </a>
                          ) : (
                            <div className="text-sm text-slate-500 italic">No cuenta con sitio web</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Descripción / Notas del cliente</div>
                          <div className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                            {selectedClient.description || <span className="italic text-slate-400">Sin descripción proporcionada.</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Location & Schedule */}
                  <div className="space-y-8">
                    {/* Location Card */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={14}/> Ubicación</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Dirección Exacta</div>
                          <div className="font-medium text-slate-900 leading-snug">{selectedClient.address || 'No especificada'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Ciudad</div>
                            <div className="font-medium text-slate-900">{selectedClient.city || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1">País</div>
                            <div className="font-medium text-slate-900">{selectedClient.country || '-'}</div>
                          </div>
                        </div>
                        
                        {selectedClient.lat && selectedClient.lng && (
                          <div className="pt-2">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${selectedClient.lat},${selectedClient.lng}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                            >
                              <MapPin size={16} /> Abrir en Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14}/> Horario Comercial</h3>
                      {selectedClient.schedule ? (
                        <div className="space-y-2">
                          {Object.entries(selectedClient.schedule).map(([day, data]: [string, any]) => {
                            const dayNames: Record<string, string> = {
                              monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                              thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                            };
                            return (
                              <div key={day} className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                                <span className="font-bold text-sm text-slate-600">{dayNames[day]}</span>
                                <span className={`text-sm font-medium ${data.closed ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded-md' : 'text-slate-900'}`}>
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
                <div className="mt-8">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon size={14}/> Archivos Adjuntos ({selectedClient.photo_urls?.length || 0})</h3>
                  {selectedClient.photo_urls && selectedClient.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {selectedClient.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-blue-500 transition-colors group relative shadow-sm">
                          <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
                      <ImageIcon className="mx-auto text-slate-300 mb-2" size={32} />
                      <div className="text-sm font-bold text-slate-600">Sin fotografías</div>
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
