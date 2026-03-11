import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Phone, Globe, Mail, Clock, 
  Image as ImageIcon, CheckCircle, Clock3, X, LogOut, ExternalLink
} from 'lucide-react';
import Logo from './Logo';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setClients(clients.map(c => c.id === id ? { ...c, status: newStatus } : c));
      if (selectedClient?.id === id) {
        setSelectedClient({ ...selectedClient, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const filteredClients = clients.filter(c => 
    c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              <Logo className="text-3xl text-slate-900" />
            </div>
            <p className="text-slate-500 text-sm">Ingresa tu contraseña para acceder al panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña (admin123)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Entrar al Panel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <Logo className="text-xl" />
          <button onClick={() => setIsAuthenticated(false)} className="text-slate-400 hover:text-white md:hidden">
            <LogOut size={20} />
          </button>
        </div>
        <div className="p-4 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Menú Principal</div>
          <button className="w-full flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium">
            <Search size={18} />
            Solicitudes
          </button>
        </div>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">Solicitudes Recientes</h1>
          <div className="relative w-full max-w-xs hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar negocio o cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
            />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Negocio</th>
                      <th className="p-4 font-semibold">Cliente</th>
                      <th className="p-4 font-semibold">Fecha</th>
                      <th className="p-4 font-semibold">Estado</th>
                      <th className="p-4 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No hay solicitudes registradas aún.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{client.businessName || 'Sin Nombre'}</div>
                            <div className="text-xs text-slate-500">{client.category || 'Sin Categoría'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-800">{client.ownerName}</div>
                            <div className="text-xs text-slate-500">{client.email}</div>
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {new Date(client.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              client.status === 'completed' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {client.status === 'completed' ? <CheckCircle size={12} /> : <Clock3 size={12} />}
                              {client.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedClient(client)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Ver Detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedClient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setSelectedClient(null)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-slate-900">Detalles de Solicitud</h2>
                <button 
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-1">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedClient.businessName}</h1>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium">{selectedClient.category}</span>
                      <span>•</span>
                      <span>{selectedClient.country}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedClient.status === 'pending' ? (
                      <button 
                        onClick={() => updateStatus(selectedClient.id, 'completed')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle size={16} /> Marcar Completado
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(selectedClient.id, 'pending')}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <Clock3 size={16} /> Marcar Pendiente
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Contacto</h3>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={16} /></div>
                      <div>
                        <div className="text-xs text-slate-500">Dueño / Email</div>
                        <div className="font-medium text-slate-900">{selectedClient.ownerName}</div>
                        <a href={`mailto:${selectedClient.email}`} className="text-sm text-blue-600 hover:underline">{selectedClient.email}</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Phone size={16} /></div>
                      <div>
                        <div className="text-xs text-slate-500">Teléfono</div>
                        <div className="font-medium text-slate-900">{selectedClient.phone || 'No especificado'}</div>
                        {selectedClient.phone && (
                          <a href={`https://wa.me/${selectedClient.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink size={12} /> Abrir WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Globe size={16} /></div>
                      <div>
                        <div className="text-xs text-slate-500">Sitio Web</div>
                        {selectedClient.website ? (
                          <a href={selectedClient.website} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1">
                            {selectedClient.website} <ExternalLink size={12} />
                          </a>
                        ) : (
                          <div className="text-sm text-slate-500">No especificado</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Ubicación</h3>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={16} /></div>
                      <div>
                        <div className="text-xs text-slate-500">Dirección Exacta</div>
                        <div className="font-medium text-slate-900 text-sm leading-relaxed">{selectedClient.address}</div>
                        <div className="text-xs text-slate-500 mt-1">{selectedClient.city}</div>
                        
                        {selectedClient.lat && selectedClient.lng && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedClient.lat},${selectedClient.lng}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            <MapPin size={12} /> Ver en Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Descripción del Negocio</h3>
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 leading-relaxed border border-slate-100">
                    {selectedClient.description || <span className="italic text-slate-400">Sin descripción proporcionada.</span>}
                  </div>
                </div>

                {/* Schedule */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <Clock size={16} /> Horarios
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedClient.schedule && Object.entries(selectedClient.schedule).map(([day, data]: [string, any]) => {
                      const dayNames: Record<string, string> = {
                        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
                        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
                      };
                      return (
                        <div key={day} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="font-medium text-sm text-slate-700">{dayNames[day]}</span>
                          <span className={`text-sm ${data.closed ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                            {data.closed ? 'Cerrado' : `${data.open} - ${data.close}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <ImageIcon size={16} /> Fotos Subidas ({selectedClient.photo_urls?.length || 0})
                  </h3>
                  {selectedClient.photo_urls && selectedClient.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedClient.photo_urls.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-500 transition-colors group relative">
                          <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="text-white" size={24} />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      No se subieron fotos.
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
