import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Building2, MapPin, Phone, Rocket, Sparkles } from 'lucide-react';
import { supabase } from '../services/supabase';
import Logo from './Logo';

const initialSchedule = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '', close: '', closed: true },
};

declare global {
  interface Window {
    google: any;
  }
}

const days = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function RegistrationForm() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);

  const mockExamples = [
    {
      name: "La Trattoria del Centro",
      rating: "4.8",
      reviews: "342",
      category: "Restaurante Italiano",
      address: "Av. Principal 123, Centro",
      hoursStatus: "Abierto",
      hoursDetail: " ⋅ Cierra a las 23:00",
      phone: "+1 234 567 8900",
      img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      reviewText: "Excelente comida y servicio. La pasta estaba al dente y el ambiente es muy acogedor. Definitivamente volveré.",
      reviewer: "María G.",
      reviewTime: "hace 2 semanas",
      reviewerColor: "bg-purple-600"
    },
    {
      name: "Farmacia San José 24h",
      rating: "4.9",
      reviews: "128",
      category: "Farmacia",
      address: "Calle Comercio 45, Zona Norte",
      hoursStatus: "Abierto 24 horas",
      hoursDetail: "",
      phone: "+1 987 654 3210",
      img: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80",
      reviewText: "Siempre tienen lo que necesito y la atención es muy rápida. Me salvaron en una emergencia de madrugada.",
      reviewer: "Carlos R.",
      reviewTime: "hace 1 mes",
      reviewerColor: "bg-blue-600"
    },
    {
      name: "Studio Glamour",
      rating: "4.7",
      reviews: "89",
      category: "Salón de Belleza",
      address: "Plaza Central Local 4",
      hoursStatus: "Abierto",
      hoursDetail: " ⋅ Cierra a las 20:00",
      phone: "+1 555 123 4567",
      img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
      reviewText: "Me encantó el corte y el color. Las chicas son súper amables y profesionales. El mejor salón de la ciudad.",
      reviewer: "Ana L.",
      reviewTime: "hace 3 días",
      reviewerColor: "bg-pink-600"
    }
  ];

  const slides = [
    {
      title: "Registro y Verificación Oficial",
      desc: "Creamos tu perfil desde cero y gestionamos la verificación oficial ante Google para que tu negocio exista y sea legítimo.",
      img: "https://images.unsplash.com/photo-1560472355-536de3962603?auto=format&fit=crop&w=600&q=80",
      check: "Identidad Digital Verificada"
    },
    {
      title: "Posicionamiento SEO Local",
      desc: "Optimizamos tu ficha con las palabras clave exactas que usan tus clientes para que aparezcas primero en el mapa.",
      img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      check: "Top 3 en Búsquedas"
    },
    {
      title: "Estrategia de Reseñas y Reputación",
      desc: "Implementamos sistemas para conseguir más estrellas y responder profesionalmente, generando confianza inmediata.",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      check: "Confianza y Prestigio"
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    country: '',
    category: '',
    businessName: '',
    description: '',
    ownerName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    lat: null,
    lng: null,
  });
  const [photos, setPhotos] = useState([]);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const COUNTRY_CODES: Record<string, string> = {
    'PE': '+51',
    'MX': '+52',
    'CO': '+57',
    'CL': '+56',
    'AR': '+54',
    'EC': '+593',
    'BO': '+591',
    'UY': '+598',
    'VE': '+58',
    'ES': '+34',
    'GT': '+502',
    'PA': '+507',
    'US': '+1'
  };

  useEffect(() => {
    // Detect country by IP
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code) {
          setFormData(prev => ({ ...prev, country: data.country_code }));
        }
      })
      .catch(() => console.error('Could not fetch country'));

    // Load Google Maps script
    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    const handleScriptLoad = () => {
      if (window.google && window.google.maps) {
        initMap();
      }
    };

    if (window.google && window.google.maps) {
      handleScriptLoad();
    } else if (existingScript) {
      existingScript.addEventListener('load', handleScriptLoad);
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = handleScriptLoad;
      document.head.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        script.removeEventListener('load', handleScriptLoad);
      }
    };
  }, []);

  useEffect(() => {
    if (showForm && window.google && window.google.maps && mapRef.current && !mapInstance.current) {
      initMap();
    }
  }, [showForm]);

  const initMap = () => {
    if (!window.google || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: -12.046374, lng: -77.042793 }, // Lima, Peru
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a2235' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6b7fa3' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0f1e' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2d45' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0f1e' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ]
    });
    mapInstance.current = map;

    const autocomplete = new window.google.maps.places.Autocomplete(
      document.getElementById('addressSearch'),
      { fields: ['geometry', 'formatted_address', 'address_components'] }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setFormData(prev => ({
        ...prev,
        lat,
        lng,
        address: place.formatted_address,
        city: place.address_components?.find(c => c.types.includes('locality'))?.long_name || ''
      }));

      map.setCenter({ lat, lng });
      map.setZoom(16);

      if (markerInstance.current) markerInstance.current.setMap(null);
      markerInstance.current = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      markerInstance.current.addListener('dragend', (e) => {
        setFormData(prev => ({ ...prev, lat: e.latLng.lat(), lng: e.latLng.lng() }));
      });
    });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = [...e.target.files].slice(0, 5 - photos.length);
      const newPhotos = files.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const displayStep = (step) => ({
    display: currentStep === step ? 'block' : 'none',
  });

  const handleSubmit = async () => {
    if (!supabase) {
      alert('La configuración del backend no está completa. Contacta al administrador.');
      return;
    }

    if (!formData.businessName || !formData.ownerName || !formData.phone || !formData.country) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data payload
      const fullPhone = formData.country && COUNTRY_CODES[formData.country] 
        ? `${COUNTRY_CODES[formData.country]} ${formData.phone}`
        : formData.phone;

      const payload = {
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        phone: fullPhone,
        country: formData.country,
        status: 'pending', // Initial status
      };

      // Insert into database
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([payload])
        .select()
        .single();

      if (clientError) {
        throw clientError;
      }

      // Success
      setTrackingCode(clientData?.tracking_code || 'N/A');
      setCurrentStep(5); // Success step

    } catch (error) {
      console.error('Submission error:', error);
      alert('Hubo un error al enviar tu solicitud. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      <header>
        <div className="logo"><Logo /></div>
        <div className="tagline">Visibilidad real para tu negocio 🌍</div>
      </header>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div 
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="portal-view"
          >
            {/* HERO SECTION - IMPACTO FUERTE */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 1, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1
              }}
              className="portal-hero"
            >
              <motion.h1
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
              >
                🚀 Si no apareces en Google, estás perdiendo <span>dinero</span> TODOS los días.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{ fontSize: '20px', fontWeight: '500' }}
              >
                Tus clientes ya están buscando en Google Maps. La pregunta es… ¿te encuentran a ti o a tu competencia? Con Vistoo, asegúrate de ser la primera opción.
              </motion.p>
              
              <div className="hero-visual-container">
                {/* Central Card */}
                <motion.div 
                  className="winner-card"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
                  whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.3)" }}
                >
                  <div className="winner-header">
                    <div className="winner-avatar">📍</div>
                    <div className="winner-info">
                      <h3>Tu Negocio</h3>
                      <div className="winner-stars">
                        ⭐⭐⭐⭐⭐ (5.0)
                      </div>
                    </div>
                  </div>
                  <div className="winner-stats">
                    <div className="winner-stat">
                      <span>1.2k</span>
                      <p>Vistas/mes</p>
                    </div>
                    <div className="winner-stat">
                      <span>#1</span>
                      <p>Ranking Google</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Notifications */}
                <motion.div 
                  className="notification-pill call"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                >
                  <span style={{ fontSize: '16px' }}>📞</span> +15 Llamadas hoy
                </motion.div>

                <motion.div 
                  className="notification-pill review"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.5, type: "spring" }}
                >
                  <span style={{ fontSize: '16px' }}>⭐</span> Nueva reseña 5★
                </motion.div>

                <motion.div 
                  className="notification-pill rank"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.8, type: "spring" }}
                >
                  <span style={{ fontSize: '16px' }}>🏆</span> Dominando la zona
                </motion.div>

                {/* Background Glow Effect */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                    zIndex: 0,
                    filter: 'blur(40px)',
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{ fontSize: '16px', marginTop: '-20px', marginBottom: '32px', color: 'var(--accent)', fontWeight: '600' }}
              >
                Vistoo te ayuda a posicionar tu negocio para que aparezcas cuando buscan “cerca de mí”.
              </motion.p>

              <div className="portal-cta">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary" 
                  onClick={() => setShowForm(true)}
                >
                  QUIERO MÁS CLIENTES AHORA
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary" 
                  onClick={() => setShowForm(true)}
                >
                  HABLAR CON UN ASESOR
                </motion.button>
              </div>
            </motion.div>

            {/* PROBLEM SECTION - DOLOR DIRECTO */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                x: [0, -2, 2, -2, 2, 0]
              }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ 
                opacity: { duration: 0.8 },
                y: { duration: 0.8 },
                x: {
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: "linear"
                }
              }}
              className="problem-section"
            >
              <div className="section-title">
                <motion.h2
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    textShadow: [
                      "0 0 0px rgba(239, 68, 68, 0)",
                      "2px 0 5px rgba(239, 68, 68, 0.5)",
                      "-2px 0 5px rgba(239, 68, 68, 0.5)",
                      "0 0 0px rgba(239, 68, 68, 0)"
                    ]
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    textShadow: {
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 4
                    }
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ display: 'inline-block', marginRight: '8px' }}
                  >
                    ⚠️
                  </motion.span>
                  Cada día que no estás optimizado…
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ 
                    opacity: 1,
                    scale: [1, 1.02, 1]
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    opacity: { delay: 0.3 },
                    scale: { 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }
                  }}
                  style={{ color: '#ef4444', fontWeight: '700' }}
                >
                  No es que no haya clientes. Es que no te están viendo.
                </motion.p>
              </div>
              <div className="problem-list">
                {[
                  { icon: "❌", text: "Tu competencia aparece primero" },
                  { icon: "❌", text: "Los clientes llaman a otro negocio" },
                  { icon: "❌", text: "Pierdes ventas sin darte cuenta" },
                  { icon: "❌", text: "Tu perfil se ve vacío o poco profesional" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8, x: i % 2 === 0 ? -20 : 20 }}
                    whileInView={{ 
                      opacity: 1, 
                      scale: 1, 
                      x: 0,
                      filter: ["blur(10px)", "blur(0px)"]
                    }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: i * 0.1, 
                      duration: 0.4,
                      type: "spring",
                      stiffness: 120
                    }}
                    whileHover={{ 
                      scale: 1.03,
                      backgroundColor: "rgba(239, 68, 68, 0.02)",
                      borderColor: "#ef4444"
                    }}
                    className="problem-item"
                  >
                    <motion.span 
                      className="icon"
                      animate={{ 
                        rotate: [0, -15, 15, -15, 15, 0],
                        scale: [1, 1.2, 1],
                        color: ["#ef4444", "#b91c1c", "#ef4444"]
                      }}
                      whileHover={{ 
                        rotate: [0, -20, 20, -20, 20, 0],
                        scale: 1.4,
                        transition: { duration: 0.2, repeat: Infinity }
                      }}
                      transition={{ 
                        animate: {
                          duration: 1.5, 
                          repeat: Infinity, 
                          repeatDelay: 2 + (i * 0.3) 
                        }
                      }}
                    >
                      {item.icon}
                    </motion.span>
                    <p>{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* SOLUTION SECTION - SLIDE SHOWCASE */}
            <div className="problem-section" style={{ maxWidth: '1100px' }}>
              <div className="solution-header">
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  Vistoo pone tu negocio en el <span>mapa</span> (de verdad)
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  En Vistoo nos encargamos de TODO para que tu negocio trabaje incluso cuando tú estás descansando.
                </motion.p>
              </div>

              <div className="solution-slider-container">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentSlide}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -50) nextSlide();
                      if (info.offset.x > 50) prevSlide();
                    }}
                    className="solution-slide"
                  >
                    <div className="slide-content">
                      <div className="slide-badge">Paso 0{currentSlide + 1}</div>
                      <h3>{slides[currentSlide].title}</h3>
                      <p>{slides[currentSlide].desc}</p>
                      <div className="slide-check">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          ✔
                        </motion.span>
                        {slides[currentSlide].check}
                      </div>
                    </div>
                    <motion.div 
                      initial={{ scale: 1.1, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      className="slide-image"
                    >
                      <img src={slides[currentSlide].img} alt={slides[currentSlide].title} referrerPolicy="no-referrer" />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                <div className="slider-nav">
                  <button onClick={prevSlide} className="nav-btn prev">←</button>
                  <div className="slider-dots">
                    {slides.map((_, i) => (
                      <div 
                        key={i} 
                        className={`dot ${i === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(i)}
                      />
                    ))}
                  </div>
                  <button onClick={nextSlide} className="nav-btn next">→</button>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', marginTop: '60px' }}
              >
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(37, 99, 235, 0.7)" }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    scale: [1, 1.02, 1],
                    boxShadow: ["0 10px 20px rgba(37, 99, 235, 0.3)", "0 15px 30px rgba(37, 99, 235, 0.5)", "0 10px 20px rgba(37, 99, 235, 0.3)"]
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity },
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                  onClick={() => setShowForm(true)}
                  className="btn-mega"
                >
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      transform: 'skewX(-25deg)',
                    }}
                  />
                  <span>🚀</span>
                  ¡QUIERO USAR VISTOO PARA MI NEGOCIO!
                </motion.button>
              </motion.div>
            </div>

            {/* RESULTADO FINAL SECTION */}
            <div className="section-title" style={{ marginTop: '60px', marginBottom: '0' }}>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Aparece cuando buscan y sé la <span>primera</span> opción:
              </motion.h2>
            </div>
            <div className="benefits-grid" style={{ marginTop: '24px' }}>
              {[
                {
                  img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
                  title: "“Restaurante cerca de mí”",
                  desc: "Tu restaurante lleno de clientes que te encuentran en el momento exacto que tienen hambre."
                },
                {
                  img: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80",
                  title: "“Farmacia abierta ahora”",
                  desc: "Sé la primera opción cuando alguien necesita una solución urgente en tu zona."
                },
                {
                  img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
                  title: "“Salón de belleza en tu ciudad”",
                  desc: "Atrae a nuevas clientas mostrando tus mejores trabajos y reseñas de 5 estrellas."
                }
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.8 }}
                  whileHover={{ 
                    y: -15, 
                    boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
                    transition: { duration: 0.3 }
                  }}
                  className="benefit-card"
                  onClick={() => setSelectedExample(i)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="benefit-icon">
                    <motion.img 
                      whileHover={{ scale: 1.1 }}
                      src={benefit.img} 
                      alt={benefit.title} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="testimonials-section">
              <AnimatePresence>
                {selectedExample !== null && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedExample(null)}
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.95, y: 10, opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="bg-white rounded-xl overflow-hidden w-full max-w-[400px] shadow-2xl font-sans flex flex-col max-h-[90vh] text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Fake Google Maps Header */}
                      <div className="bg-white px-3 py-2 border-b border-gray-200 flex items-center gap-2 shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => setSelectedExample(null)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </div>
                        <div className="bg-[#f1f3f4] rounded-full px-3 py-1.5 text-sm text-[#5f6368] flex-1 flex items-center gap-2 shadow-inner">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          <span className="truncate">{mockExamples[selectedExample].name}</span>
                        </div>
                      </div>

                      {/* Image */}
                      <div className="relative h-48 bg-gray-100 shrink-0">
                        <img 
                          src={mockExamples[selectedExample].img} 
                          alt={mockExamples[selectedExample].name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Content Container - Scrollable */}
                      <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar">
                        <h2 className="text-xl leading-tight font-medium text-[#202124] mb-1">{mockExamples[selectedExample].name}</h2>
                        
                        <div className="flex items-center text-sm mb-1">
                          <span className="font-medium text-[#70757a] mr-1">{mockExamples[selectedExample].rating}</span>
                          <div className="flex text-[#fbbc04] text-sm tracking-tighter mr-1">
                            {'★'.repeat(Math.round(parseFloat(mockExamples[selectedExample].rating)))}
                            <span className="text-gray-300">{'★'.repeat(5 - Math.round(parseFloat(mockExamples[selectedExample].rating)))}</span>
                          </div>
                          <span className="text-[#1a73e8] hover:underline cursor-pointer">({mockExamples[selectedExample].reviews})</span>
                        </div>
                        
                        <p className="text-[#70757a] text-sm mb-4">{mockExamples[selectedExample].category}</p>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-between mb-6 px-1">
                          <div className="flex flex-col items-center gap-1.5 cursor-pointer group w-14">
                            <div className="w-10 h-10 rounded-full border border-[#1a73e8] flex items-center justify-center text-[#1a73e8] group-hover:bg-[#e8f0fe] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            </div>
                            <span className="text-[11px] font-medium text-[#1a73e8]">Llamar</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 cursor-pointer group w-14">
                            <div className="w-10 h-10 rounded-full border border-[#25D366] flex items-center justify-center text-[#25D366] group-hover:bg-[#dcf8c6] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            </div>
                            <span className="text-[11px] font-medium text-[#25D366]">WhatsApp</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 cursor-pointer group w-14">
                            <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white hover:bg-[#1557b0] transition-colors shadow-sm">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                            </div>
                            <span className="text-[11px] font-medium text-[#1a73e8] text-center leading-tight">Llegar</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 cursor-pointer group w-14">
                            <div className="w-10 h-10 rounded-full border border-[#1a73e8] flex items-center justify-center text-[#1a73e8] group-hover:bg-[#e8f0fe] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            </div>
                            <span className="text-[11px] font-medium text-[#1a73e8] text-center leading-tight">Sitio web</span>
                          </div>
                          <div className="flex flex-col items-center gap-1.5 cursor-pointer group w-14">
                            <div className="w-10 h-10 rounded-full border border-[#1a73e8] flex items-center justify-center text-[#1a73e8] group-hover:bg-[#e8f0fe] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <span className="text-[11px] font-medium text-[#1a73e8]">Guardar</span>
                          </div>
                        </div>

                        <hr className="border-gray-200 mb-4" />

                        {/* Info List */}
                        <div className="space-y-3 text-sm text-[#3c4043] mb-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-[#1a73e8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="leading-snug pt-0.5">{mockExamples[selectedExample].address}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-[#1a73e8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div className="leading-snug pt-0.5">
                              <span className="text-[#188038] font-medium">{mockExamples[selectedExample].hoursStatus}</span>
                              <span className="text-[#70757a]">{mockExamples[selectedExample].hoursDetail}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-[#1a73e8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            <span className="pt-0.5">{mockExamples[selectedExample].phone}</span>
                          </div>
                        </div>

                        <hr className="border-gray-200 mb-4" />

                        {/* Reseñas Section */}
                        <div>
                          <h3 className="font-medium text-[#202124] text-base mb-3">Resumen de reseñas</h3>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-medium text-sm shrink-0 ${mockExamples[selectedExample].reviewerColor}`}>
                              {mockExamples[selectedExample].reviewer.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-[#202124]">{mockExamples[selectedExample].reviewer}</div>
                              <div className="flex items-center gap-1.5 mt-0.5 mb-1">
                                <div className="flex text-[#fbbc04] text-[10px] tracking-tighter">
                                  ★★★★★
                                </div>
                                <span className="text-xs text-[#70757a]">{mockExamples[selectedExample].reviewTime}</span>
                              </div>
                              <p className="text-sm text-[#3c4043] leading-snug">"{mockExamples[selectedExample].reviewText}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="testimonials-title"
              >
                Negocios que ya están creciendo
              </motion.h2>
              <div className="testimonials-grid">
                {[
                  {
                    quote: "Desde que optimizaron nuestro perfil, nuestras llamadas aumentaron un 40%. Fue la mejor inversión.",
                    name: "Carlos Mendoza",
                    role: "Restaurante",
                    seed: "owner1"
                  },
                  {
                    quote: "Ahora aparezco primero en mi ciudad y llegan clientes todos los días.",
                    name: "Elena Rodríguez",
                    role: "Salón de Belleza",
                    seed: "owner2"
                  }
                ].map((t, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.3, duration: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    className="testimonial-card"
                  >
                    <p className="testimonial-quote">"{t.quote}"</p>
                    <div className="testimonial-user">
                      <img src={`https://picsum.photos/seed/${t.seed}/100/100`} alt={t.name} className="testimonial-avatar" referrerPolicy="no-referrer" />
                      <div className="testimonial-info">
                        <h4>{t.name}</h4>
                        <p>{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* FINAL CTA - PODEROSO */}
            <motion.div 
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="final-cta"
            >
              <h2>¿Cuántos clientes estás perdiendo hoy?</h2>
              <p>No esperes a que tu competencia siga creciendo. Activa tu negocio ahora y empieza a recibir más llamadas esta misma semana.</p>
              <div className="portal-cta" style={{ justifyContent: 'center' }}>
                <motion.button 
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 25px 50px rgba(37, 99, 235, 0.4)"
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="btn btn-primary" 
                  onClick={() => setShowForm(true)}
                >
                  ACTIVAR MI NEGOCIO GRATIS
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary" 
                  onClick={() => setShowForm(true)}
                >
                  QUIERO POSICIONARME HOY
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6 }}
            className="container"
          >
            <div className="page-title">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Registra tu negocio<br /><span>en Google Maps</span>
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Aparece cuando tus clientes te buscan. Rápido, fácil, sin complicaciones.
              </motion.p>
            </div>

            

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg mx-auto p-8 relative">
              <button 
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                title="Volver a la web"
              >
                <X size={24} />
              </button>
              {currentStep === 1 ? (
            <div className="block">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Activa tu negocio hoy</h2>
                <p className="text-slate-500 text-sm mt-2">Déjanos tus datos básicos y un asesor te contactará por WhatsApp para activar tu perfil en Google Maps.</p>
              </div>
              <div className="flex flex-col gap-5">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2 text-sm">
                    <User size={16} className="text-blue-500" /> Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="ownerName" placeholder="Ej: Juan Pérez" value={formData.ownerName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900" />
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2 text-sm">
                    <Building2 size={16} className="text-blue-500" /> Nombre de tu negocio <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="businessName" placeholder="Ej: Restaurante El Rincón" value={formData.businessName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2 text-sm">
                    <MapPin size={16} className="text-blue-500" /> País <span className="text-red-500">*</span>
                  </label>
                  <select id="country" value={formData.country} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900 bg-white">
                    <option value="">Selecciona tu país...</option>
                    <option value="PE">🇵🇪 Perú</option>
                    <option value="MX">🇲🇽 México</option>
                    <option value="CO">🇨🇴 Colombia</option>
                    <option value="CL">🇨🇱 Chile</option>
                    <option value="AR">🇦🇷 Argentina</option>
                    <option value="EC">🇪🇨 Ecuador</option>
                    <option value="BO">🇧🇴 Bolivia</option>
                    <option value="UY">🇺🇾 Uruguay</option>
                    <option value="VE">🇻🇪 Venezuela</option>
                    <option value="ES">🇪🇸 España</option>
                    <option value="GT">🇬🇹 Guatemala</option>
                    <option value="PA">🇵🇦 Panamá</option>
                    <option value="US">🇺🇸 Estados Unidos</option>
                  </select>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="flex items-center gap-2 font-semibold text-slate-700 mb-2 text-sm">
                    <Phone size={16} className="text-blue-500" /> WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {formData.country && COUNTRY_CODES[formData.country] && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold flex items-center"
                      >
                        {COUNTRY_CODES[formData.country]}
                      </motion.div>
                    )}
                    <input type="tel" id="phone" placeholder={formData.country && COUNTRY_CODES[formData.country] ? "Ej: 1234 5678" : "Ej: +52 55 1234 5678"} value={formData.phone} onChange={handleInputChange} className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-900" />
                  </div>
                </motion.div>

                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 mt-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={20} />
                      ¡Quiero despegar mi negocio!
                      <Rocket size={20} />
                    </>
                  )}
                </motion.button>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-xs text-slate-500 mt-2"
                >
                  Tus datos están seguros. No enviamos spam.
                </motion.p>
                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setShowForm(false)}
                  className="w-full py-3 mt-2 rounded-lg text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Volver a la web
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="text-center py-8"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">¡Solicitud enviada!</h2>
              <p className="text-slate-500 mb-6">Hemos recibido tus datos.<br />Un asesor te contactará por WhatsApp en breve para activar tu negocio.</p>
              <button 
                onClick={() => {
                  setCurrentStep(1);
                  setFormData({ ...formData, businessName: '', ownerName: '', phone: '' });
                  setShowForm(false);
                }}
                className="px-6 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Volver a la web
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
