'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Inter, Rubik } from 'next/font/google'

// Configuración de fuentes de Google (nativo de Next.js)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' })

export default function LandingPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Manejador del formulario
  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Aquí puedes capturar los valores usando FormData o estados adicionales
    const formData = new FormData(e.currentTarget)
    console.log('Lead Capturado:', {
      nombre: formData.get('name'),
      email: formData.get('email')
    })
    // TODO: Conectar con tu N8N Webhook u otra App
  }

  // Animaciones de scroll (Intersection Observer adaptado a React)
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        } else {
          entry.target.classList.remove('is-visible')
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll('.reveal-on-scroll')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect() // Limpieza al desmontar
  }, [])

  // Función para scrollear al formulario (reemplaza el onclick manual)
  const scrollToForm = () => {
    nameInputRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`min-h-screen bg-[#F7F5F0] text-[#19382F] font-sans selection:bg-[#F25C05] selection:text-white pb-20 ${inter.variable} ${rubik.variable}`}>

      {/* Estilos globales inyectados (puedes moverlos a globals.css luego) */}
      <style jsx global>{`
        h1, h2, h3, .font-rubik { font-family: var(--font-rubik), sans-serif; }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .reveal-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-100 { transition-delay: 100ms; }
        .delay-200 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 300ms; }
      `}</style>

      {/* Barra de Navegación / Logo */}
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="block">
            {/* NOTA: Asegúrate de mover esta imagen a la carpeta /public de tu proyecto Next.js */}
            <img src="/250_x_150_202604071902-removebg-preview.png" alt="Nafiado Logo" className="h-10 md:h-12 w-auto object-contain" />
          </Link>
          <div className="hidden md:inline-block bg-[#F25C05] text-[#F7F5F0] font-rubik font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-sm rotate-2 shadow-sm">
            Hoy no fio, mañana tampoco
          </div>
        </div>
        <div className="flex items">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex bg-[#F25C05] hover:bg-[#D95204] text-white font-rubik font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 items-center justify-center text-sm shadow-sm"
          >
            Iniciar Sesión
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/registro"
            className="hidden sm:inline-flex bg-[#F25C05] hover:bg-[#D95204] text-white font-rubik font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 items-center justify-center text-sm shadow-sm"
          >
            Registrarte
          </Link>
        </div>
      </nav>


      <main className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mt-4 md:mt-8">

          {/* Copy Principal */}
          <div className="lg:col-span-7 space-y-6 reveal-on-scroll">
            <div className="inline-flex items-center gap-2 bg-[#D32F2F]/10 text-[#D32F2F] px-4 py-2 rounded-full text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
              Atención Dueños de Minimarkets y Abastos
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] text-[#19382F]">
              Descubre exactamente <span className="text-[#F25C05] relative inline-block">
                cuánto dinero estás perdiendo
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#F25C05]/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span> esta semana en menos de 5 minutos.
            </h1>

            <p className="text-lg md:text-xl text-[#19382F]/80 leading-relaxed max-w-2xl">
              Descarga la <strong>plantilla gratuita</strong> y descubre hoy mismo si tienes productos vencidos o si el dinero de tu caja no cuadra. Únete a la lista VIP de fundadores para tomar el control real de tu negocio (sin Excel).
            </p>

            {/* Formulario Reactificado */}
            <form onSubmit={handleLeadSubmit} className="bg-white p-3 rounded-2xl shadow-[0_8px_30px_rgb(25,56,47,0.04)] max-w-xl flex flex-col gap-3 border border-[#19382F]/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="name"
                  ref={nameInputRef}
                  placeholder="Tu nombre..."
                  required
                  disabled={isSubmitted}
                  className="bg-[#F7F5F0]/50 px-5 py-3 outline-none text-[#19382F] placeholder:text-[#19382F]/40 min-h-[52px] rounded-xl border border-[#19382F]/10 focus:border-[#F25C05]/50 focus:bg-white transition-all disabled:opacity-50"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Tu correo electrónico..."
                  required
                  disabled={isSubmitted}
                  className="bg-[#F7F5F0]/50 px-5 py-3 outline-none text-[#19382F] placeholder:text-[#19382F]/40 min-h-[52px] rounded-xl border border-[#19382F]/10 focus:border-[#F25C05]/50 focus:bg-white transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitted}
                className={`font-rubik font-bold px-6 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-white ${isSubmitted ? 'bg-[#4CAF50] cursor-not-allowed' : 'bg-[#F25C05] hover:bg-[#D95204]'
                  }`}
              >
                <span>{isSubmitted ? '¡Enviado, revisa tu correo!' : '¡Quiero tapar mis fugas de dinero y asegurar mi lugar VIP!'}</span>
                {!isSubmitted && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                )}
              </button>
            </form>

            <p className="text-sm text-[#19382F]/50 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>Toma menos de 1 minuto. Al enviar aceptas nuestra <Link href="#" className="underline hover:text-[#19382F] transition-colors">Política de Privacidad</Link>.</span>
            </p>
          </div>

          {/* Columna Derecha: Visual */}
          <div className="lg:col-span-5 relative reveal-on-scroll delay-100">
            <div className="aspect-[4/5] md:aspect-video w-full bg-[#19382F]/5 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center p-8 border-2 border-dashed border-[#19382F]/20">
              <div className="text-center text-[#19382F]/40">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
                <p className="font-rubik font-medium">Espacio reservado para Video</p>
              </div>
            </div>
          </div>
        </div>

        {/* OFERTA GRAND SLAM HORMOZI */}
        <div className="mt-32 bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(25,56,47,0.03)] border border-[#19382F]/5 relative overflow-hidden reveal-on-scroll">
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl leading-tight text-[#19382F] mb-6 flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
                <span>El Sistema Principal:</span>
                <img src="/250_x_150_202604071902-removebg-preview.png" alt="Nafiado Logo" className="h-14 md:h-20 lg:h-24 object-contain" />
              </h2>
              <p className="text-lg text-[#19382F]/80 mb-4 text-left md:text-center">
                Es el gerente financiero más confiable del mundo que vive en tu celular, nunca duerme y trabaja 24/7 por menos de $1 al día.
              </p>
              <p className="text-lg text-[#19382F]/80 text-left md:text-center">
                Elimina para siempre la ceguera financiera y el estrés de no saber a dónde va a parar tu plata. Te da la paz mental de saber exactamente cuántos dólares de ganancia neta te quedaron en el bolsillo hoy, con solo mirar tu pantalla por 5 segundos. Te da el control absoluto de tu negocio para que puedas dormir tranquilo, sin tener que ser un experto en números ni volver a tocar un Excel.
              </p>
            </div>

            <div className="space-y-6">
              {/* Bono 1 */}
              <div className="bg-[#F7F5F0] p-6 rounded-2xl border border-[#19382F]/5 flex flex-col md:flex-row gap-6 items-start reveal-on-scroll delay-100">
                <div className="w-16 h-16 rounded-2xl bg-[#4CAF50]/10 flex items-center justify-center shrink-0">
                  <svg className="text-[#4CAF50]" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect width="10" height="8" x="7" y="8" rx="1" /><path d="m11 12 2-2" /><path d="m15 12-2-2" /></svg>
                </div>
                <div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F] mb-2">BONO 1: El Escáner Mágico con IA</h3>
                  <p className="text-sm text-[#19382F]/80 mb-2">Es tu ingresador de datos automático.</p>
                  <p className="text-sm text-[#19382F]/70">Destruye el trabajo manual. En lugar de perder horas y horas de tu vida tecleando productos uno por uno, simplemente le tomas una foto a tus estantes y el sistema hace todo el trabajo sucio por ti al instante, ahorrándote tiempo libre para que lo pases con tu familia o descansando.</p>
                </div>
              </div>

              {/* Bono 2 */}
              <div className="bg-[#F7F5F0] p-6 rounded-2xl border border-[#19382F]/5 flex flex-col md:flex-row gap-6 items-start reveal-on-scroll delay-200">
                <div className="w-16 h-16 rounded-2xl bg-[#F25C05]/10 flex items-center justify-center shrink-0">
                  <svg className="text-[#F25C05]" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                </div>
                <div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F] mb-2">BONO 2: La Tienda Web de 1 Clic</h3>
                  <p className="text-sm text-[#19382F]/80 mb-2">Es tu propia sucursal digital automática.</p>
                  <p className="text-sm text-[#19382F]/70">Eleva el estatus de tu negocio, haciéndote ver como el minimarket más moderno y prestigioso de tu zona. Además, te permite ganar dinero sin estar amarrado al mostrador: tus vecinos hacen sus pedidos directo desde tu enlace de WhatsApp mientras tú haces otras cosas, multiplicando tus ventas sin esfuerzo extra.</p>
                </div>
              </div>

              {/* Bono 3 */}
              <div className="bg-[#F7F5F0] p-6 rounded-2xl border border-[#19382F]/5 flex flex-col md:flex-row gap-6 items-start reveal-on-scroll delay-300">
                <div className="w-16 h-16 rounded-2xl bg-[#D32F2F]/10 flex items-center justify-center shrink-0">
                  <svg className="text-[#D32F2F]" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                </div>
                <div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F] mb-2">BONO 3: El Detector de Fugas de Dinero</h3>
                  <p className="text-sm text-[#19382F]/80 mb-2">Es tu perro guardián contra robos y pérdidas.</p>
                  <p className="text-sm text-[#19382F]/70">Protege cada centavo que tanto te cuesta ganar. Detecta inmediatamente si un empleado deshonesto te está robando o si un producto está a punto de vencerse, asegurando que tu dinero se quede donde pertenece: en tu cuenta bancaria.</p>
                </div>
              </div>
            </div>

            {/* Tarjeta de Escasez / Action Box */}
            <div className="mt-12 bg-[#19382F] p-8 rounded-2xl text-[#F7F5F0] text-center shadow-xl reveal-on-scroll">
              <h3 className="font-rubik text-2xl mb-4 text-[#4CAF50]">Todo este valor incluido GRATIS</h3>
              <p className="text-[#F7F5F0]/70 mb-8 max-w-2xl mx-auto">Inscríbete ahora para recibir el sistema principal y todos los bonos exclusivos.</p>
              <button
                onClick={scrollToForm}
                className="w-full md:w-auto bg-[#F25C05] hover:bg-[#D95204] text-white font-rubik font-bold px-8 py-5 rounded-xl transition-all active:scale-95 text-lg"
              >
                ¡Quiero tapar mis fugas de dinero y asegurar mi lugar VIP!
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN: ¿A quién va dirigido? */}
        <div className="mt-32 mb-16 reveal-on-scroll">
          <h2 className="text-3xl md:text-5xl leading-tight text-[#19382F] mb-12 text-center font-rubik">
            ¿A quién va dirigido este sistema?
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Tarjetas (Izquierda) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-100">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center shrink-0">
                    <svg className="text-[#4CAF50]" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" /></svg>
                  </div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F]">Minimarkets</h3>
                </div>
                <p className="text-sm text-[#19382F]/80 leading-relaxed">
                  Con Nafiado puedes llevar un control total de tus ventas de víveres, comida, dulces y todo tu inventario. También obtendrás un catálogo online con todos tus productos listos para vender.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-200">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#F25C05]/10 flex items-center justify-center shrink-0">
                    <svg className="text-[#F25C05]" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                  </div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F]">Bodegas</h3>
                </div>
                <p className="text-sm text-[#19382F]/80 leading-relaxed">
                  Organiza tu stock, cuadra tu caja diaria a la perfección y automatiza tus despachos sin romperte la cabeza. Ponle fin al descontrol y asegura todas tus ganancias.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#D32F2F]/10 flex items-center justify-center shrink-0">
                    <svg className="text-[#D32F2F]" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <h3 className="font-rubik font-bold text-xl text-[#19382F]">Emprendedores y PYMES</h3>
                </div>
                <p className="text-sm text-[#19382F]/80 leading-relaxed">
                  Lleva la gestión financiera de tu emprendimiento al siguiente nivel. Sé veloz, controla tus métricas y proyecta la imagen de un negocio moderno, estructurado y altamente rentable.
                </p>
              </div>
            </div>

            {/* Imagen (Derecha) */}
            <div className="relative mt-8 lg:mt-0 p-4 reveal-on-scroll delay-200">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#F25C05]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -left-4 w-40 h-40 bg-[#4CAF50]/20 rounded-full blur-3xl"></div>

              {/* NOTA: Asegúrate de mover esta imagen a la carpeta /public */}
              <img src="/Señor_minimarket.jpeg" alt="Dueño de minimarket confiado"
                className="relative z-10 w-full h-auto rounded-[2rem] shadow-[0_20px_50px_rgba(25,56,47,0.15)] object-cover aspect-square md:aspect-[4/5] opacity-95 hover:opacity-100 transition-opacity" />

              <div className="absolute bottom-10 -left-6 bg-white py-4 px-6 rounded-2xl shadow-xl border border-[#19382F]/5 z-20 hidden md:block">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex text-[#F25C05]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  </div>
                  <span className="text-xs font-bold text-[#19382F]">5.0</span>
                </div>
                <p className="text-xs text-[#19382F]/70 font-medium">Elección #1 de dueños de abastos</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: Preguntas Frecuentes (FAQ) */}
        <div className="max-w-3xl mx-auto mt-32 mb-16 reveal-on-scroll delay-100">
          <h2 className="text-3xl md:text-5xl leading-tight text-[#19382F] mb-12 text-center font-rubik">
            Preguntas Frecuentes
          </h2>

          <div className="space-y-4">
            <details className="group bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-[0_4px_20px_rgb(25,56,47,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <summary className="flex justify-between items-center font-rubik font-bold text-lg text-[#19382F] list-none [&::-webkit-details-marker]:hidden">
                ¿Necesito saber de contabilidad para usar Nafiado?
                <span className="transition group-open:rotate-180 text-[#F25C05]">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-[#19382F]/80 mt-4 text-sm md:text-base leading-relaxed">
                Para nada. Fue diseñado específicamente para dueños de minimarkets, no para contadores o ingenieros de software. Si sabes usar WhatsApp, sabes usar Nafiado. Todo se calcula en automático sin que toques una hoja de cálculo.
              </div>
            </details>

            <details className="group bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-[0_4px_20px_rgb(25,56,47,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <summary className="flex justify-between items-center font-rubik font-bold text-lg text-[#19382F] list-none [&::-webkit-details-marker]:hidden">
                ¿Funciona si se me va el internet?
                <span className="transition group-open:rotate-180 text-[#F25C05]">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-[#19382F]/80 mt-4 text-sm md:text-base leading-relaxed">
                ¡Sí! Nafiado cuenta con soporte "Offline-First". Lo que significa que tus ventas y datos se guardan directamente en tu dispositivo y se sincronizan automáticamente a la nube en cuanto recuperas la señal. Jamás pararás de vender.
              </div>
            </details>

            <details className="group bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-[0_4px_20px_rgb(25,56,47,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <summary className="flex justify-between items-center font-rubik font-bold text-lg text-[#19382F] list-none [&::-webkit-details-marker]:hidden">
                ¿Tengo que meter mis miles de productos uno por uno?
                <span className="transition group-open:rotate-180 text-[#F25C05]">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-[#19382F]/80 mt-4 text-sm md:text-base leading-relaxed">
                No, gracias al Bono <strong className="text-[#19382F]">Escáner Mágico con IA</strong>, solo tomas fotos de tus estantes o de las facturas de tus proveedores y Nafiado ingresa y cataloga el stock por ti. Nos deshacemos del trabajo sucio.
              </div>
            </details>

            <details className="group bg-white p-6 rounded-2xl border border-[#19382F]/5 shadow-[0_4px_20px_rgb(25,56,47,0.02)] cursor-pointer hover:shadow-md transition-shadow">
              <summary className="flex justify-between items-center font-rubik font-bold text-lg text-[#19382F] list-none [&::-webkit-details-marker]:hidden">
                ¿Qué pasa si mi negocio o bodega es muy pequeño?
                <span className="transition group-open:rotate-180 text-[#F25C05]">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-[#19382F]/80 mt-4 text-sm md:text-base leading-relaxed">
                Precisamente los negocios pequeños son los que más sufren económicamente por el "robo hormiga", descuadres de caja o la mercancía vencida. Nafiado tapa esas fugas de capital para que cada centavo cuente íntegramente a tu bolsillo desde el primer día.
              </div>
            </details>
          </div>
        </div>

        {/* Footer profesional */}
        <footer className="mt-20 py-12 border-t border-[#19382F]/10 reveal-on-scroll">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-4">
                <img src="/250_x_150_202604071902-removebg-preview.png" alt="Nafiado Logo" className="h-10 md:h-14 w-auto object-contain" />
              </Link>
              <p className="text-sm text-[#19382F]/60 max-w-xs">
                El gerente financiero automático que te da paz mental y control total sobre tu negocio con menos de 5 segundos al día.
              </p>
            </div>

            <div>
              <h4 className="font-rubik font-bold text-lg mb-4 text-[#19382F]">Sistema</h4>
              <ul className="space-y-2 text-sm text-[#19382F]/60">
                <li><Link href="#" className="hover:text-[#F25C05] transition-colors">Características</Link></li>
                <li><Link href="#" className="hover:text-[#F25C05] transition-colors">Lista VIP</Link></li>
                <li><Link href="#" className="hover:text-[#F25C05] transition-colors">Cómo Funciona</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-rubik font-bold text-lg mb-4 text-[#19382F]">Contacto</h4>
              <ul className="space-y-2 text-sm text-[#19382F]/60">
                <li><Link href="mailto:soporte@nafiado.com" className="hover:text-[#F25C05] transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  soporte@nafiado.com
                </Link></li>
                <li><Link href="#" className="hover:text-[#F25C05] transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="#" className="hover:text-[#F25C05] transition-colors">Política de Privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-[#19382F]/10 text-center text-sm text-[#19382F]/40">
            &copy; {new Date().getFullYear()} Nafiado - Todos los derechos reservados. Diseñado para bodegueros con visión.
          </div>
        </footer>
      </main>
    </div>
  )
}