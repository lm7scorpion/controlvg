import React, { useState, useEffect } from 'react';
import { Clock, Play, StopCircle, RotateCcw, TrendingUp, Calendar, Save, BarChart3, History, LogIn, LogOut, Lock } from 'lucide-react';

// ============================================
// 🔥 CONFIGURACIÓN DE FIREBASE
// ============================================
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBbyKtJUh0dFKP8HspcjvW2HHFT6FHsXo",
  authDomain: "controlvg-223b9.firebaseapp.com",
  projectId: "controlvg-223b9",
  storageBucket: "controlvg-223b9.firebasestorage.app",
  messagingSenderId: "649168608183",
  appId: "1:649168608183:web:62dfb4439d9e365144e632"
};

// Instrucciones para obtener tu configuración:
// 1. Ve a https://console.firebase.google.com/
// 2. Selecciona tu proyecto o crea uno nuevo
// 3. Ve a Project Settings (⚙️)
// 4. En "Your apps", clic en el ícono web </> 
// 5. Copia los valores y reemplázalos arriba

export default function ControlTiempoTrabajos() {
  const archivos = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
  
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [fechaActual, setFechaActual] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  
  const [trabajosActivos, setTrabajosActivos] = useState(() => {
    const inicial = {};
    archivos.forEach(archivo => {
      inicial[archivo] = {
        horaInicio: '',
        horaFin: '',
        enProceso: false
      };
    });
    return inicial;
  });
  
  const [historial, setHistorial] = useState([]);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(new Date());
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);

  // Cargar Firebase dinámicamente
  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestoreDb);
        setAuth(firebaseAuth);
        setFirebaseLoaded(true);

        // Escuchar cambios de autenticación
        onAuthStateChanged(firebaseAuth, async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            // Verificar si es admin comparando el email
            const adminEmail = "lm7scorp.ion@gmail.com"; // CAMBIA ESTO por tu email
            setIsAdmin(currentUser.email === adminEmail);
          } else {
            setIsAdmin(false);
          }
        });

        // Escuchar cambios en tiempo real del historial
        const q = query(collection(firestoreDb, 'historial'), orderBy('fecha', 'desc'));
        onSnapshot(q, (snapshot) => {
          const datos = [];
          snapshot.forEach((doc) => {
            datos.push({ id: doc.id, ...doc.data() });
          });
          setHistorial(datos);
        });

      } catch (error) {
        console.error('Error al cargar Firebase:', error);
        alert('Error al conectar con Firebase. Verifica tu configuración.');
      }
    };

    loadFirebase();
  }, []);
  
  // Actualizar tiempo cada segundo
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTiempoActual(new Date());
    }, 1000);
    
    return () => clearInterval(intervalo);
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) return;
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión');
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };
  
  const calcularTiempoTranscurrido = (horaInicio, horaFin) => {
    if (!horaInicio) return { horas: 0, minutos: 0, segundos: 0, totalMinutos: 0 };
    
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const inicioDate = new Date();
    inicioDate.setHours(horaIni, minIni, 0, 0);
    
    let finDate;
    if (horaFin) {
      const [horaFn, minFn] = horaFin.split(':').map(Number);
      finDate = new Date();
      finDate.setHours(horaFn, minFn, 0, 0);
    } else {
      finDate = tiempoActual;
    }
    
    let diffMs = finDate - inicioDate;
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
    
    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    const totalMinutos = Math.floor(totalSegundos / 60);
    
    return { horas, minutos, segundos, totalMinutos };
  };

  const iniciarTrabajo = (archivo) => {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    setTrabajosActivos(prev => ({
      ...prev,
      [archivo]: {
        horaInicio: horaActual,
        horaFin: '',
        enProceso: true
      }
    }));
  };

  const finalizarTrabajo = (archivo) => {
    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    setTrabajosActivos(prev => ({
      ...prev,
      [archivo]: {
        ...prev[archivo],
        horaFin: horaActual,
        enProceso: false
      }
    }));
  };

  const reiniciarTrabajo = (archivo) => {
    setTrabajosActivos(prev => ({
      ...prev,
      [archivo]: {
        horaInicio: '',
        horaFin: '',
        enProceso: false
      }
    }));
  };

  const cambiarHoraInicio = (archivo, hora) => {
    setTrabajosActivos(prev => ({
      ...prev,
      [archivo]: {
        ...prev[archivo],
        horaInicio: hora
      }
    }));
  };

  const cambiarHoraFin = (archivo, hora) => {
    setTrabajosActivos(prev => ({
      ...prev,
      [archivo]: {
        ...prev[archivo],
        horaFin: hora,
        enProceso: false
      }
    }));
  };

  const obtenerColorRendimiento = (minutos) => {
    if (minutos <= 60) return 'from-green-500 to-emerald-500';
    if (minutos <= 90) return 'from-blue-500 to-cyan-500';
    if (minutos <= 120) return 'from-yellow-500 to-orange-500';
    if (minutos <= 150) return 'from-orange-600 to-red-500';
    return 'from-red-600 to-pink-600';
  };

  const obtenerClasificacionProductividad = (minutos) => {
    if (minutos <= 60) return { 
      nombre: 'Rendimiento Óptimo', 
      emoji: '✅', 
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    };
    if (minutos <= 90) return { 
      nombre: 'Plazo Máximo', 
      emoji: '🎯', 
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/20'
    };
    if (minutos <= 150) return { 
      nombre: 'Entrega Tardía', 
      emoji: '⚠️', 
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20'
    };
    return { 
      nombre: 'Entrega Nula', 
      emoji: '✖️', 
      color: 'text-red-400',
      bg: 'bg-red-500/20'
    };
  };

  const obtenerDiaSemana = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    const dia = date.getDay();
    const diasMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return diasMap[dia];
  };

  const guardarDia = async () => {
    if (!isAdmin) {
      alert('❌ Solo el administrador puede guardar datos');
      return;
    }

    if (!db) {
      alert('Firebase no está configurado correctamente');
      return;
    }

    const hayDatos = Object.values(trabajosActivos).some(t => t.horaInicio || t.horaFin);
    
    if (!hayDatos) {
      alert('No hay datos para guardar. Registra al menos un archivo.');
      return;
    }

    try {
      const { collection, addDoc, query, where, getDocs, updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      
      const archivosConTiempo = {};
      archivos.forEach(archivo => {
        const trabajo = trabajosActivos[archivo];
        if (trabajo.horaInicio && trabajo.horaFin) {
          const tiempo = calcularTiempoTranscurrido(trabajo.horaInicio, trabajo.horaFin);
          const clasificacion = obtenerClasificacionProductividad(tiempo.totalMinutos);
          archivosConTiempo[archivo] = {
            horaInicio: trabajo.horaInicio,
            horaFin: trabajo.horaFin,
            duracion: tiempo,
            clasificacion: clasificacion.nombre
          };
        }
      });

      const nuevoRegistro = {
        fecha: fechaActual,
        diaSemana: obtenerDiaSemana(fechaActual),
        archivos: archivosConTiempo,
        timestamp: new Date().getTime()
      };

      // Verificar si ya existe un registro para esta fecha
      const q = query(collection(db, 'historial'), where('fecha', '==', fechaActual));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Actualizar el registro existente
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, nuevoRegistro);
      } else {
        // Crear nuevo registro
        await addDoc(collection(db, 'historial'), nuevoRegistro);
      }

      alert('✅ ¡Día guardado exitosamente!');
      
      // Reiniciar trabajos actuales
      const inicial = {};
      archivos.forEach(archivo => {
        inicial[archivo] = {
          horaInicio: '',
          horaFin: '',
          enProceso: false
        };
      });
      setTrabajosActivos(inicial);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el día: ' + error.message);
    }
  };

  const calcularEstadisticasGenerales = () => {
    if (historial.length === 0) return null;

    let totalArchivos = 0;
    let sumaMinutos = 0;
    let archivoStats = {};
    
    let clasificaciones = {
      'Rendimiento Óptimo': 0,
      'Plazo Máximo': 0,
      'Entrega Tardía': 0,
      'Entrega Nula': 0
    };
    
    archivos.forEach(archivo => {
      archivoStats[archivo] = {
        total: 0,
        sumaMinutos: 0,
        mejorTiempo: null,
        peorTiempo: null
      };
    });

    historial.forEach(dia => {
      if (dia.archivos) {
        Object.entries(dia.archivos).forEach(([archivo, datos]) => {
          totalArchivos++;
          sumaMinutos += datos.duracion.totalMinutos;
          
          if (datos.clasificacion) {
            clasificaciones[datos.clasificacion]++;
          }
          
          archivoStats[archivo].total++;
          archivoStats[archivo].sumaMinutos += datos.duracion.totalMinutos;
          
          if (!archivoStats[archivo].mejorTiempo || datos.duracion.totalMinutos < archivoStats[archivo].mejorTiempo) {
            archivoStats[archivo].mejorTiempo = datos.duracion.totalMinutos;
          }
          
          if (!archivoStats[archivo].peorTiempo || datos.duracion.totalMinutos > archivoStats[archivo].peorTiempo) {
            archivoStats[archivo].peorTiempo = datos.duracion.totalMinutos;
          }
        });
      }
    });

    const promedioGeneral = totalArchivos > 0 ? sumaMinutos / totalArchivos : 0;

    return {
      totalDias: historial.length,
      totalArchivos,
      promedioGeneralMinutos: promedioGeneral,
      archivoStats,
      clasificaciones
    };
  };

  const stats = calcularEstadisticasGenerales();

  if (!firebaseLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Cargando Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con Login */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <div className="flex items-center gap-3">
              <Clock className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Control de Transformaciones
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white text-sm">{user.email}</p>
                    {isAdmin && <p className="text-green-400 text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> Admin</p>}
                  </div>
                  <button
                    onClick={signOutUser}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-300 text-sm">Monitoreo diario de archivos G1-G7 {!isAdmin && '(Solo visualización)'}</p>
        </div>

        {/* Barra de control */}
        <div className="mb-4 bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-purple-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1">📅 Fecha de Trabajo</label>
                <input
                  type="date"
                  value={fechaActual}
                  onChange={(e) => setFechaActual(e.target.value)}
                  disabled={!isAdmin}
                  className="bg-gray-700/70 text-white rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 disabled:opacity-50"
                />
              </div>
              <div className="text-left">
                <p className="text-gray-400 text-xs mb-1">Día de la semana</p>
                <p className="text-cyan-400 font-bold text-lg">{obtenerDiaSemana(fechaActual)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={guardarDia}
                disabled={!isAdmin}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Guardar Día
              </button>
              
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <History className="w-5 h-5" />
                Historial ({historial.length})
              </button>
              
              <button
                onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                Estadísticas
              </button>
            </div>
          </div>
        </div>

        {/* Reglas de Productividad */}
        <div className="mb-4 bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-purple-500/20">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Reglas de Productividad
          </h2>
          <div className="flex gap-3 overflow-x-auto">
            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl p-4 border-2 border-cyan-400/50 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-center">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-white font-bold text-base mb-2">Plazo Máximo</p>
                <div className="bg-white/20 rounded-lg py-2 px-3 backdrop-blur-sm">
                  <p className="text-white font-bold text-2xl">1:30</p>
                  <p className="text-cyan-100 text-xs">hora por transformación</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-4 border-2 border-green-400/50 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-white font-bold text-base mb-2">Rendimiento Óptimo</p>
                <div className="bg-white/20 rounded-lg py-2 px-3 backdrop-blur-sm">
                  <p className="text-white font-bold text-2xl">1 hora</p>
                  <p className="text-green-100 text-xs">= Excelente</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-4 border-2 border-yellow-400/50 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-center">
                <p className="text-3xl mb-2">⚠️</p>
                <p className="text-white font-bold text-base mb-2">Entrega Tardía</p>
                <div className="bg-white/20 rounded-lg py-2 px-3 backdrop-blur-sm">
                  <p className="text-white font-bold text-2xl">+2 horas</p>
                  <p className="text-yellow-100 text-xs">Después de 2 horas</p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-4 border-2 border-red-400/50 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-center">
                <p className="text-3xl mb-2">✖️</p>
                <p className="text-white font-bold text-base mb-2">Entrega Nula</p>
                <div className="bg-white/20 rounded-lg py-2 px-3 backdrop-blur-sm">
                  <p className="text-white font-bold text-2xl">+2:30</p>
                  <p className="text-red-100 text-xs">Más de 2:30 horas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Estadísticas */}
        {mostrarEstadisticas && stats && (
          <div className="mb-4 bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-yellow-500/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
              Estadísticas Generales
            </h2>
            
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3">
                <p className="text-purple-100 text-xs mb-1">Total Días Registrados</p>
                <p className="text-white font-bold text-2xl">{stats.totalDias}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-3">
                <p className="text-blue-100 text-xs mb-1">Total Archivos Procesados</p>
                <p className="text-white font-bold text-2xl">{stats.totalArchivos}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-3">
                <p className="text-green-100 text-xs mb-1">Promedio General</p>
                <p className="text-white font-bold text-xl">
                  {Math.floor(stats.promedioGeneralMinutos / 60)}h {Math.round(stats.promedioGeneralMinutos % 60)}m
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-3">
                <p className="text-orange-100 text-xs mb-1">Promedio por Día</p>
                <p className="text-white font-bold text-xl">
                  {stats.totalDias > 0 ? Math.floor(stats.totalArchivos / stats.totalDias) : 0} archivos
                </p>
              </div>
            </div>

            {/* Clasificaciones por Productividad */}
            <div className="mb-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
              <h3 className="text-white font-bold text-lg mb-3">📊 Clasificaciones por Productividad</h3>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg p-3 text-center">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-white font-bold text-sm mb-1">Rendimiento Óptimo</p>
                  <p className="text-white font-bold text-3xl">{stats.clasificaciones['Rendimiento Óptimo']}</p>
                  <p className="text-green-100 text-xs">
                    {stats.totalArchivos > 0 ? Math.round((stats.clasificaciones['Rendimiento Óptimo'] / stats.totalArchivos) * 100) : 0}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg p-3 text-center">
                  <p className="text-2xl mb-1">🎯</p>
                  <p className="text-white font-bold text-sm mb-1">Plazo Máximo</p>
                  <p className="text-white font-bold text-3xl">{stats.clasificaciones['Plazo Máximo']}</p>
                  <p className="text-cyan-100 text-xs">
                    {stats.totalArchivos > 0 ? Math.round((stats.clasificaciones['Plazo Máximo'] / stats.totalArchivos) * 100) : 0}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg p-3 text-center">
                  <p className="text-2xl mb-1">⚠️</p>
                  <p className="text-white font-bold text-sm mb-1">Entrega Tardía</p>
                  <p className="text-white font-bold text-3xl">{stats.clasificaciones['Entrega Tardía']}</p>
                  <p className="text-yellow-100 text-xs">
                    {stats.totalArchivos > 0 ? Math.round((stats.clasificaciones['Entrega Tardía'] / stats.totalArchivos) * 100) : 0}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-lg p-3 text-center">
                  <p className="text-2xl mb-1">✖️</p>
                  <p className="text-white font-bold text-sm mb-1">Entrega Nula</p>
                  <p className="text-white font-bold text-3xl">{stats.clasificaciones['Entrega Nula']}</p>
                  <p className="text-red-100 text-xs">
                    {stats.totalArchivos > 0 ? Math.round((stats.clasificaciones['Entrega Nula'] / stats.totalArchivos) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-7 gap-2">
              {archivos.map(archivo => {
                const archivoStat = stats.archivoStats[archivo];
                const promedio = archivoStat.total > 0 ? archivoStat.sumaMinutos / archivoStat.total : 0;
                
                return (
                  <div key={archivo} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-lg">{archivo}</span>
                    </div>
                    <p className="text-gray-400 text-xs text-center mb-2">{archivoStat.total} veces</p>
                    {archivoStat.total > 0 && (
                      <>
                        <p className="text-cyan-400 text-xs text-center font-bold">
                          Promedio: {Math.floor(promedio / 60)}h {Math.round(promedio % 60)}m
                        </p>
                        <p className="text-green-400 text-xs text-center">
                          Mejor: {Math.floor(archivoStat.mejorTiempo / 60)}h {Math.round(archivoStat.mejorTiempo % 60)}m
                        </p>
                        <p className="text-red-400 text-xs text-center">
                          Peor: {Math.floor(archivoStat.peorTiempo / 60)}h {Math.round(archivoStat.peorTiempo % 60)}m
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel de Historial */}
        {mostrarHistorial && (
          <div className="mb-4 bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-blue-500/20 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 sticky top-0 bg-gray-800/90 pb-2">
              <History className="w-6 h-6 text-blue-400" />
              Historial de Días
            </h2>
            
            {historial.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No hay días guardados aún</p>
            ) : (
              <div className="space-y-3">
                {historial.map((dia) => (
                  <div key={dia.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-white font-bold text-lg">📅 {dia.fecha}</p>
                        <p className="text-cyan-400 text-sm">{dia.diaSemana}</p>
                      </div>
                      <p className="text-gray-400 text-sm">{dia.archivos ? Object.keys(dia.archivos).length : 0} archivos procesados</p>
                    </div>
                    
                    {dia.archivos && (
                      <div className="grid grid-cols-7 gap-2">
                        {archivos.map(archivo => {
                          const datos = dia.archivos[archivo];
                          return (
                            <div key={archivo} className="text-center">
                              <div className={`w-full rounded-lg p-2 ${
                                datos ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gray-600/30'
                              }`}>
                                <span className="text-white font-bold text-sm block">{archivo}</span>
                                {datos && (
                                  <>
                                    <span className="text-white text-xs block mt-1">
                                      {datos.duracion.horas}h {datos.duracion.minutos}m
                                    </span>
                                    {datos.clasificacion && (
                                      <span className="text-yellow-300 text-xs block mt-1 font-bold">
                                        {datos.clasificacion === 'Rendimiento Óptimo' && '✅'}
                                        {datos.clasificacion === 'Plazo Máximo' && '🎯'}
                                        {datos.clasificacion === 'Entrega Tardía' && '⚠️'}
                                        {datos.clasificacion === 'Entrega Nula' && '✖️'}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lista de Archivos G */}
        <div className="space-y-3">
          {archivos.map((archivo) => {
            const trabajo = trabajosActivos[archivo];
            const tiempo = calcularTiempoTranscurrido(trabajo.horaInicio, trabajo.horaFin);
            const colorRendimiento = obtenerColorRendimiento(tiempo.totalMinutos);
            const clasificacion = obtenerClasificacionProductividad(tiempo.totalMinutos);
            
            return (
              <div 
                key={archivo}
                className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-5 shadow-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-xl border-2 border-purple-400/50">
                      <span className="text-white font-bold text-3xl">{archivo}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-44">
                    <label className="block text-blue-400 text-sm font-bold mb-2">📥 Hora Recepción</label>
                    <input
                      type="time"
                      value={trabajo.horaInicio}
                      onChange={(e) => cambiarHoraInicio(archivo, e.target.value)}
                      disabled={trabajo.enProceso || !isAdmin}
                      className="w-full bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    />
                  </div>

                  <div className="flex-shrink-0 w-44">
                    <label className="block text-pink-400 text-sm font-bold mb-2">✅ Hora Finalización</label>
                    <input
                      type="time"
                      value={trabajo.horaFin}
                      onChange={(e) => cambiarHoraFin(archivo, e.target.value)}
                      disabled={!trabajo.horaInicio || !isAdmin}
                      className="w-full bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-pink-500 border-2 border-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    />
                  </div>

                  <div className="flex-grow">
                    <label className="block text-cyan-400 text-sm font-bold mb-2">⏱️ Tiempo Transcurrido</label>
                    <div className={`bg-gradient-to-r ${colorRendimiento} rounded-xl p-3 text-center shadow-lg`}>
                      {trabajo.horaInicio ? (
                        <>
                          <p className="text-white font-bold text-3xl mb-1">
                            {String(tiempo.horas).padStart(2, '0')}:{String(tiempo.minutos).padStart(2, '0')}:{String(tiempo.segundos).padStart(2, '0')}
                          </p>
                          {trabajo.horaFin && (
                            <div className={`mt-2 ${clasificacion.bg} rounded-lg py-1 px-3`}>
                              <p className={`${clasificacion.color} font-bold text-sm`}>
                                {clasificacion.emoji} {clasificacion.nombre}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-white/60 text-2xl">--:--:--</p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex-shrink-0 flex gap-2">
                      {!trabajo.enProceso && !trabajo.horaFin && (
                        <button
                          onClick={() => iniciarTrabajo(archivo)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          <span className="text-sm">Iniciar</span>
                        </button>
                      )}
                      
                      {trabajo.enProceso && (
                        <button
                          onClick={() => finalizarTrabajo(archivo)}
                          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span className="text-sm">Finalizar</span>
                        </button>
                      )}
                      
                      {(trabajo.horaInicio || trabajo.horaFin) && (
                        <button
                          onClick={() => reiniciarTrabajo(archivo)}
                          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}