'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Inter, Rubik } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' })

export default function LandingPage() {
  useEffect(() => {
    // Reveal on scroll logic
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    // Navbar animation
    const navbar = document.getElementById('iphone-navbar');
    const container = document.getElementById('navbar-container');
    const logo = document.getElementById('nav-logo');
    const sticker = document.getElementById('nav-sticker');

    const handleScroll = () => {
        if (window.scrollY > 20) {
            navbar?.classList.add('bg-brand-bg/90', 'shadow-sm');
            navbar?.classList.remove('bg-brand-bg/70');
            container?.classList.add('py-2');
            container?.classList.remove('py-4');
            logo?.classList.add('md:h-9', 'h-8');
            logo?.classList.remove('md:h-12', 'h-10');
            if (sticker) {
                sticker.classList.add('scale-95', 'opacity-90');
            }
        } else {
            navbar?.classList.add('bg-brand-bg/70');
            navbar?.classList.remove('bg-brand-bg/90', 'shadow-sm');
            container?.classList.add('py-4');
            container?.classList.remove('py-2');
            logo?.classList.add('md:h-12', 'h-10');
            logo?.classList.remove('md:h-9', 'h-8');
            if (sticker) {
                sticker.classList.remove('scale-95', 'opacity-90');
            }
        }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
        elements.forEach(el => observer.unobserve(el));
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-white pb-20 ${inter.variable} ${rubik.variable}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .font-rubik { font-family: var(--font-rubik), sans-serif; }
        h1, h2, h3 { font-family: var(--font-rubik), sans-serif; }
      `}} />

      {/* Barra de Navegación / Logo */}
      <header id="iphone-navbar" className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/70 backdrop-blur-xl border-b border-brand-text/5 transition-all duration-500 animate-slide-down">
          <nav id="navbar-container" className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center transition-all duration-500">
              <div className="flex items-center gap-4">
                  <Link href="/" className="block">
                      <img id="nav-logo" src="/250_x_150_202604071902-removebg-preview.png" alt="Nafiado Logo" className="h-10 md:h-12 w-auto object-contain transition-all duration-500" />
                  </Link>
                  {/* Slogan Sticker */}
                  <div id="nav-sticker" className="hidden md:inline-block bg-brand-accent text-white font-rubik font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-sm rotate-2 shadow-sm transition-all duration-500 hover:rotate-0 cursor-default">
                      Hoy no fio, mañana tampoco
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <Link href="/login" className="hidden sm:inline-flex text-brand-accent font-rubik font-bold px-4 py-2 rounded-xl transition-all hover:bg-brand-accent/10 active:scale-95 items-center justify-center text-xs md:text-sm uppercase tracking-wider border border-brand-accent/20 bg-white/50">
                      Inicia Sesión
                  </Link>
                  <Link href="/registro" className="inline-flex bg-brand-accent hover:bg-brand-accentHover text-white font-rubik font-bold px-5 py-2 md:px-6 md:py-2.5 rounded-xl transition-all active:scale-95 items-center justify-center text-xs md:text-sm uppercase tracking-wider shadow-sm hover:shadow-md">
                      Regístrate
                  </Link>
              </div>
          </nav>
      </header>

      {/* Nueva Sección Hero (Ancho Completo) */}
      <section className="w-full relative overflow-hidden bg-white border-b border-brand-text/5 min-h-[450px] flex items-center mt-[72px] reveal-on-scroll">
          {/* Imagen de Fondo del Banner (Atenuada) */}
          <img className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none select-none" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYfW2dajo--IBdj6gN7lSDrIPpjEakL0wbSWX_rkExaeZS-Qhv02ErQioDphYJ6h3IHv-iw_yJCQjwo4SJ7X8DaWw-7HVZBiLul1hmNvzWafWQTVFPrprqq17S_1fHlakmPeFvDw_Hm-dDvpzpvO77uhdYHstooEHTkYFNuYB1kXJYrbodzuIybVfuag9wTIJyPOZmJuiBJmPeGgDlNNZmL3GmeK2xUWWWuOgQ0nC7DPsUBWkWFxVPp35gaCd7WTVL5avcvY0zzVMN" style={{ zIndex: 0 }} alt="Banner Background" />
          
          {/* Contenido del Banner centrado en la cuadrícula principal */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-16 md:py-24">
              <div className="lg:w-4/5">
                  <p className="font-rubik font-bold text-brand-accent uppercase mb-4 tracking-[0.2em] border-l-4 border-brand-accent pl-4 text-xs md:text-sm">
                      Sistema Financiero
                  </p>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl text-brand-text font-rubik font-bold mb-8 leading-[1.1] text-balance">
                      El gerente financiero que vive en tu celular, nunca duerme y trabaja 24/7 por menos de $1 al día.
                  </h1>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <Link href="/registro" className="font-rubik font-bold bg-brand-accent hover:bg-brand-accentHover text-white px-10 py-5 shadow-lg hover:shadow-xl transition-all active:scale-95 uppercase tracking-wider rounded-2xl text-sm md:text-base inline-flex">
                          Empieza ahora
                      </Link>
                  </div>
              </div>
          </div>
      </section>

      {/* Contenedor Principal para el resto de la página */}
      <main className="max-w-6xl mx-auto px-6 pt-16">

          {/* Features Section 1 (Añadido) */}
          <section className="mb-32 mt-8 reveal-on-scroll">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="bg-[#FFF8F5] p-6 rounded-[2rem] border border-brand-text/5 flex flex-col hover:-translate-y-1 transition-transform">
                      <div className="w-full aspect-square bg-[#E5D9D1]/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                          <svg className="text-brand-accent/30 w-24 h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10" />
                              <line x1="12" y1="20" x2="12" y2="4" />
                              <line x1="6" y1="20" x2="6" y2="14" />
                          </svg>
                      </div>
                      <h3 className="font-rubik font-bold text-2xl text-brand-text mb-3">El Escudo Anti-Desperdicio</h3>
                      <p className="text-sm text-brand-text/80 leading-relaxed">Olvídate de botar dinero. El sistema te avisa qué productos deben salir pronto para proteger tu inversión.</p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-[#FFF8F5] p-6 rounded-[2rem] border border-brand-text/5 flex flex-col hover:-translate-y-1 transition-transform">
                      <div className="w-full aspect-square bg-[#E5D9D1]/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                          <svg className="text-brand-accent/30 w-24 h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="9" cy="21" r="1" />
                              <circle cx="20" cy="21" r="1" />
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                      </div>
                      <h3 className="font-rubik font-bold text-2xl text-brand-text mb-3">Tu Sucursal Digital 24/7</h3>
                      <p className="text-sm text-brand-text/80 leading-relaxed">Una tienda abierta todo el día donde tus clientes compran desde su celular mientras tú descansas.</p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-[#FFF8F5] p-6 rounded-[2rem] border border-brand-text/5 flex flex-col hover:-translate-y-1 transition-transform">
                      <div className="w-full aspect-square bg-[#E5D9D1]/50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                          <svg className="text-brand-accent/30 w-24 h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                      </div>
                      <h3 className="font-rubik font-bold text-2xl text-brand-text mb-3">El Detective de Ganancias</h3>
                      <p className="text-sm text-brand-text/80 leading-relaxed">Un guardia invisible que señala errores de caja o consumos no registrados para asegurar tu beneficio neto.</p>
                  </div>
              </div>
          </section>

          {/* SECCIÓN: ¿A quién va dirigido? */}
          <div className="mt-32 mb-16 reveal-on-scroll">
              <h2 className="text-3xl md:text-5xl leading-tight text-brand-text mb-12 text-center font-rubik">
                  ¿A quién va dirigido este sistema?
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Tarjetas (Izquierda) */}
                  <div className="space-y-6">
                      {/* Tarjeta 1: Minimarkets */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-text/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-100">
                          <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-full bg-brand-success/10 flex items-center justify-center shrink-0">
                                  <svg className="text-brand-success" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
                                  </svg>
                              </div>
                              <h3 className="font-rubik font-bold text-xl text-brand-text">Minimarkets</h3>
                          </div>
                          <p className="text-sm text-brand-text/80 leading-relaxed">
                              Con Nafiado puedes llevar un control total de tus ventas de víveres, comida, dulces y todo tu inventario. También obtendrás un catálogo online con todos tus productos listos para vender.
                          </p>
                      </div>

                      {/* Tarjeta 2: Bodegas */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-text/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-200">
                          <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                                  <svg className="text-brand-accent" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                      <path d="m3.3 7 8.7 5 8.7-5" />
                                      <path d="M12 22V12" />
                                  </svg>
                              </div>
                              <h3 className="font-rubik font-bold text-xl text-brand-text">Bodegas</h3>
                          </div>
                          <p className="text-sm text-brand-text/80 leading-relaxed">
                              Organiza tu stock, cuadra tu caja diaria a la perfección y automatiza tus despachos sin romperte la cabeza. Ponle fin al descontrol y asegura todas tus ganancias.
                          </p>
                      </div>

                      {/* Tarjeta 3: Emprendedores y PYMES */}
                      <div className="bg-white p-6 rounded-2xl border border-brand-text/5 shadow-sm hover:shadow-md transition-shadow reveal-on-scroll delay-300">
                          <div className="flex items-center gap-4 mb-3">
                              <div className="w-10 h-10 rounded-full bg-brand-error/10 flex items-center justify-center shrink-0">
                                  <svg className="text-brand-error" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                  </svg>
                              </div>
                              <h3 className="font-rubik font-bold text-xl text-brand-text">Emprendedores y PYMES</h3>
                          </div>
                          <p className="text-sm text-brand-text/80 leading-relaxed">
                              Lleva la gestión financiera de tu emprendimiento al siguiente nivel. Sé veloz, controla tus métricas y proyecta la imagen de un negocio moderno, estructurado y altamente rentable.
                          </p>
                      </div>
                  </div>

                  {/* Imagen (Derecha) */}
                  <div className="relative mt-8 lg:mt-0 p-4 reveal-on-scroll delay-200">
                      {/* Elementos decorativos */}
                      <div className="absolute -top-4 -right-4 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-8 -left-4 w-40 h-40 bg-brand-success/20 rounded-full blur-3xl"></div>

                      <img src="/Señor%20minimarket.jpeg" alt="Dueño de minimarket confiado" className="relative z-10 w-full h-auto rounded-[2rem] shadow-[0_20px_50px_rgba(25,56,47,0.15)] object-cover aspect-square md:aspect-[4/5] opacity-95 hover:opacity-100 transition-opacity" />


                  </div>
              </div>
          </div>

          {/* SECCIÓN: Preguntas Frecuentes (FAQ) */}
          <div className="max-w-3xl mx-auto mt-32 mb-16 reveal-on-scroll delay-100">
              <h2 className="text-3xl md:text-5xl leading-tight text-brand-text mb-12 text-center font-rubik">
                  Preguntas Frecuentes
              </h2>

              <div className="space-y-4">
                  {[
                      {
                          q: '¿Necesito saber de contabilidad para usar Nafiado?',
                          a: 'Para nada. Fue diseñado específicamente para dueños de minimarkets, no para contadores o ingenieros de software. Si sabes usar WhatsApp, sabes usar Nafiado. Todo se calcula en automático sin que toques una hoja de cálculo.'
                      },
                      {
                          q: '¿Funciona si se me va el internet?',
                          a: '¡Sí! Nafiado cuenta con soporte "Offline-First". Lo que significa que tus ventas y datos se guardan directamente en tu dispositivo y se sincronizan automáticamente a la nube en cuanto recuperas la señal. Jamás pararás de vender.'
                      },
                      {
                          q: '¿Tengo que meter mis miles de productos uno por uno?',
                          a: <>No, gracias al Bono <strong className="text-brand-text">Escáner Mágico con IA</strong>, solo tomas fotos de tus estantes o de las facturas de tus proveedores y Nafiado ingresa y cataloga el stock por ti. Nos deshacemos del trabajo sucio.</>
                      },
                      {
                          q: '¿Qué pasa si mi negocio o bodega es muy pequeño?',
                          a: 'Precisamente los negocios pequeños son los que más sufren económicamente por el "robo hormiga", descuadres de caja o la mercancía vencida. Nafiado tapa esas fugas de capital para que cada centavo cuente íntegramente a tu bolsillo desde el primer día.'
                      }
                  ].map((faq, i) => (
                      <details key={i} className="group bg-white p-6 rounded-2xl border border-brand-text/5 shadow-[0_4px_20px_rgb(25,56,47,0.02)] cursor-pointer hover:shadow-md transition-shadow">
                          <summary className="flex justify-between items-center font-rubik font-bold text-lg text-brand-text list-none [&::-webkit-details-marker]:hidden">
                              {faq.q}
                              <span className="transition group-open:rotate-180 text-brand-accent">
                                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
                                      <path d="M6 9l6 6 6-6"></path>
                                  </svg>
                              </span>
                          </summary>
                          <div className="text-brand-text/80 mt-4 text-sm md:text-base leading-relaxed">
                              {faq.a}
                          </div>
                      </details>
                  ))}
              </div>
          </div>

          {/* Footer profesional */}
          <footer className="mt-20 py-12 border-t border-brand-text/10 reveal-on-scroll">
              <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Columna 1: Marca */}
                  <div className="md:col-span-2">
                      <Link href="#" className="inline-block mb-4">
                          <img src="/250_x_150_202604071902-removebg-preview.png" alt="Nafiado Logo" className="h-10 md:h-14 w-auto object-contain" />
                      </Link>
                      <p className="text-sm text-brand-text/60 max-w-xs">
                          El gerente financiero automático que te da paz mental y control total sobre tu negocio con menos de 5 segundos al día.
                      </p>
                  </div>

                  {/* Columna 2: Redes Sociales */}
                  <div>
                      <h4 className="font-rubik font-bold text-lg mb-4 text-brand-text">Síguenos</h4>
                      <div className="flex gap-4">
                          {/* Instagram */}
                          <Link href="#" className="text-brand-text/60 hover:text-brand-accent transition-colors">
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                              </svg>
                          </Link>
                          {/* TikTok */}
                          <Link href="#" className="text-brand-text/60 hover:text-brand-accent transition-colors">
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.25-.97 4.45-2.58 6.01-1.61 1.53-3.79 2.45-6.04 2.5-2.3.06-4.63-.5-6.43-1.93-1.8-1.41-2.92-3.6-3.11-5.9-.22-2.3.43-4.65 1.83-6.43 1.41-1.78 3.52-2.88 5.79-3.1 2.1-.2 4.24.23 6.03 1.25l-.12 4.1c-1.3-.64-2.77-.96-4.22-.84-1.39.09-2.72.69-3.7 1.69-.96 1-1.46 2.41-1.45 3.84.02 1.48.65 2.89 1.73 3.87 1.12.98 2.66 1.43 4.14 1.3 1.47-.11 2.84-.79 3.8-1.86.95-1.07 1.43-2.5 1.41-3.95-.01-5.06-.01-10.12 0-15.18-.01-.39 0-.78-.01-1.17z" />
                              </svg>
                          </Link>
                      </div>
                  </div>

                  {/* Columna 3: Contacto Legal */}
                  <div>
                      <h4 className="font-rubik font-bold text-lg mb-4 text-brand-text">Contacto</h4>
                      <ul className="space-y-4 text-sm text-brand-text/60">
                          <li>
                              <a href="mailto:soporte@nafiado.com" className="hover:text-brand-accent transition-colors flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect width="20" height="16" x="2" y="4" rx="2" />
                                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                  </svg>
                                  soporte@nafiado.com
                              </a>
                          </li>
                          <li><Link href="#" className="hover:text-brand-accent transition-colors">Términos y Condiciones</Link></li>
                          <li><Link href="#" className="hover:text-brand-accent transition-colors">Política de Privacidad</Link></li>
                      </ul>
                  </div>
              </div>
              <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-brand-text/10 text-center text-sm text-brand-text/40">
                  &copy; 2026 Nafiado - Todos los derechos reservados. Diseñado para bodegueros con visión.
              </div>
          </footer>
      </main>
    </div>
  )
}