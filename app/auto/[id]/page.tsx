"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CarReportPage() {
  const params = useParams();
  const id = params.id; 

  const [car, setCar] = useState<any>(null);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { if (id) fetchCarData(id as string); }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen || !car?.gallery_urls) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextImage(e as any);
      if (e.key === 'ArrowLeft') prevImage(e as any);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, car, currentImageIndex]);

  const fetchCarData = async (carId: string) => {
    setLoading(true);
    const { data: carData } = await supabase.from('cars').select('*').eq('id', carId).single();
    if (carData) {
      setCar(carData);
      const { data: brandData } = await supabase.from('brands').select('*').eq('id', carData.brand_id).single();
      if (brandData) setBrand(brandData);
    }
    setLoading(false);
  };

  // ZAKTUALIZOWANY ALGORYTM RV (Z uwzględnieniem 800V)
  const calculateRVScore = () => {
    if (!brand || !car) return { score: '0.0', risk: 'Brak danych', color: 'bg-slate-100 text-slate-800' };

    let score = 1.0; 
    
    if (brand.has_official_importer) score += 1.5;
    if (brand.has_eu_warehouse) score += 1.0;
    
    if (brand.aso_network_size === 'Ogólnopolska (30+)') score += 2.5;
    else if (brand.aso_network_size === 'Rozwinięta (10-30)') score += 1.5;
    else if (brand.aso_network_size === 'Początkująca (1-10)') score += 0.5;

    if (brand.global_position === 'Globalny Gigant (np. BYD, SAIC)') score += 1.5;
    else if (brand.global_position === 'Ugruntowany Gracz') score += 1.0;

    if (car.ncap_stars === 5) score += 1.5;
    else if (car.ncap_stars === 4) score += 1.0;
    else if (car.ncap_stars > 0) score += 0.5;

    const warranty = parseInt(car.warranty_years) || 0;
    if (warranty >= 7) score += 1.0;
    else if (warranty >= 5) score += 0.5;

    if (car.architecture && car.architecture.includes('800')) score += 1.0;
    else if (car.architecture && car.architecture.includes('400')) score += 0.5;

    score = Math.min(10.0, score);
    const formattedScore = score.toFixed(1);

    if (score >= 7.5) return { score: formattedScore, risk: 'Niskie Ryzyko', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (score >= 5.0) return { score: formattedScore, risk: 'Średnie Ryzyko', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { score: formattedScore, risk: 'Wysokie Ryzyko', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  const openGallery = (index: number) => { setCurrentImageIndex(index); setIsGalleryOpen(true); document.body.style.overflow = 'hidden'; };
  const closeGallery = () => { setIsGalleryOpen(false); document.body.style.overflow = 'auto'; };
  const nextImage = (e: any) => { e?.stopPropagation(); if (car?.gallery_urls) setCurrentImageIndex((prev) => (prev === car.gallery_urls.length - 1 ? 0 : prev + 1)); };
  const prevImage = (e: any) => { e?.stopPropagation(); if (car?.gallery_urls) setCurrentImageIndex((prev) => (prev === 0 ? car.gallery_urls.length - 1 : prev - 1)); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-500 font-bold animate-pulse">Ładowanie pełnego raportu...</div>;
  if (!car || !brand) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]"><h1 className="text-2xl font-bold mb-4">Nie znaleziono pojazdu</h1><Link href="/katalog" className="px-6 py-2 bg-blue-600 text-white rounded">Wróć</Link></div>;

  const rvData = calculateRVScore();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 relative pb-20">
      
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/katalog" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Katalog Pojazdów
          </Link>
          <div className="font-black text-slate-800 tracking-tight">EV<span className="text-blue-600">Report</span></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* HERO */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8 flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#eaedf1] relative min-h-[300px] flex items-center justify-center p-6">
             {car.image_url ? (
                <img src={car.image_url} alt={car.model} className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl" />
              ) : (
                <div className="text-slate-400 font-medium">Brak zdjęcia</div>
              )}
              <div className="absolute top-4 left-4 bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-sm">
                {car.drive_type}
              </div>
          </div>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="text-blue-600 text-sm font-black uppercase tracking-wider mb-2">{brand.name}</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">{car.model}</h1>
            
            <div className="text-slate-500 text-sm font-medium mb-1">Cena katalogowa</div>
            <div className="text-3xl font-black text-slate-800 mb-8">
              {car.price_katalog_eur ? `${car.price_katalog_eur.toLocaleString('pl-PL')} €` : 'Brak danych'}
            </div>

            <div className={`p-5 border-2 rounded-2xl flex items-center justify-between shadow-sm ${rvData.color}`}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-1">Wskaźnik Utraty Wartości</div>
                <div className="font-bold text-sm">{rvData.risk} Inwestycji</div>
              </div>
              <div className="text-4xl font-black">{rvData.score}<span className="text-lg opacity-50">/10</span></div>
            </div>
          </div>
        </div>

        {/* DANE TECHNICZNE */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Dane Techniczne</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Zasięg WLTP</div>
            <div className="text-2xl font-black text-slate-800">{car.range_wltp_km || '-'} <span className="text-sm font-medium text-slate-500">km</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Zasięg Realny</div>
            <div className="text-2xl font-black text-blue-600">{car.range_real_km || '-'} <span className="text-sm font-medium text-blue-400">km</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Bateria</div>
            <div className="text-2xl font-black text-slate-800">{car.battery_kwh || '-'} <span className="text-sm font-medium text-slate-500">kWh</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ładowanie DC</div>
            <div className="text-2xl font-black text-emerald-600">{car.charge_time_min || '-'} <span className="text-sm font-medium text-emerald-400">min</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Moc Silnika</div>
            <div className="text-2xl font-black text-slate-800">{car.power_km || '-'} <span className="text-sm font-medium text-slate-500">KM</span></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Architektura</div>
            <div className="text-xl font-black text-slate-800">{car.architecture || '-'}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center col-span-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Gwarancja Baterii</div>
            <div className="text-2xl font-black text-slate-800">
              {car.warranty_years ? `${car.warranty_years} lat` : '?'} <span className="text-slate-400 font-medium mx-2">/</span> {car.warranty_km ? `${(car.warranty_km).toLocaleString('pl-PL')} km` : '?'}
            </div>
          </div>
        </div>

        {/* SZCZEGÓŁOWY AUDYT RV */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Audyt Bezpieczeństwa Inwestycji (RV)</h2>
        <div className="bg-[#1e222d] text-white rounded-3xl p-8 md:p-12 mb-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="grid md:grid-cols-2 gap-12 relative z-10">
            <div>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                Wskaźnik utraty wartości (Residual Value) modelu <strong>{car.model}</strong> jest wyliczany w oparciu o autorski algorytm naszego portalu. Analizujemy wyłącznie twarde fakty infrastrukturalne oraz certyfikaty technologii i bezpieczeństwa.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{brand.has_official_importer ? '✅' : '❌'}</span>
                    <span className="font-bold text-slate-200">Oficjalny Importer w Polsce</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400">{brand.has_official_importer ? '+1.5 pkt' : '0 pkt'}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{brand.has_eu_warehouse ? '✅' : '❌'}</span>
                    <span className="font-bold text-slate-200">Magazyn Części w EU</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400">{brand.has_eu_warehouse ? '+1.0 pkt' : '0 pkt'}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔧</span>
                    <span className="font-bold text-slate-200">Sieć ASO: <span className="text-white font-black">{brand.aso_network_size}</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <span className="font-bold text-slate-200">Technologia 800V</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400">
                    {car.architecture?.includes('800') ? '+1.0 pkt' : car.architecture?.includes('400') ? '+0.5 pkt' : '0 pkt'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 text-center">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Kluczowe Parametry</div>
                
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <span className="text-slate-300 font-medium">Euro NCAP</span>
                  <span className="text-2xl text-amber-400 font-black">{car.ncap_stars > 0 ? "⭐".repeat(car.ncap_stars) : "Brak"}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <span className="text-slate-300 font-medium">Napięcie</span>
                  <span className="text-xl font-black text-white">{car.architecture || '?'}</span>
                </div>
                
                {/* POPRAWIONA GWARANCJA */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <span className="text-slate-300 font-medium">Gw. Baterii</span>
                  <span className="text-xl font-black text-white text-right">
                    {car.warranty_years ? `${car.warranty_years} lat` : '?'} <span className="text-slate-400 font-normal mx-1">/</span> {car.warranty_km ? `${(car.warranty_km).toLocaleString('pl-PL')} km` : '?'}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 mb-6">
                  <span className="text-slate-300 font-medium">Pozycja Rynkowa</span>
                  <span className="text-sm font-bold text-blue-300 text-right">{brand.global_position}</span>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <div className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-black">Wynik Algorytmu RV</div>
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    {rvData.score}<span className="text-3xl text-slate-500">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GALERIA */}
        {car.gallery_urls && car.gallery_urls.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Galeria Pojazdu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {car.gallery_urls.map((url: string, index: number) => (
                <div key={index} onClick={() => openGallery(index)} className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group cursor-pointer relative">
                  <img src={url} alt={`Zdjęcie ${car.model} ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {car.warranty_desc && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 text-blue-900 text-sm leading-relaxed">
            <h3 className="font-black text-blue-800 mb-3 uppercase tracking-wider text-[11px]">Notatki eksperta / Szczegóły</h3>
            {car.warranty_desc}
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {isGalleryOpen && car.gallery_urls && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeGallery}>
          <button onClick={closeGallery} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-black/40 rounded-full"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          <button onClick={prevImage} className="absolute left-4 md:left-10 text-white/70 hover:text-white p-3 bg-black/40 rounded-full"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
          <img src={car.gallery_urls[currentImageIndex]} alt={`Zdjęcie ${currentImageIndex + 1}`} className="max-h-[90vh] max-w-full object-contain rounded shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={nextImage} className="absolute right-4 md:right-10 text-white/70 hover:text-white p-3 bg-black/40 rounded-full"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></button>
          <div className="absolute bottom-6 text-white/70 font-bold text-sm bg-black/40 px-4 py-1.5 rounded-full">{currentImageIndex + 1} / {car.gallery_urls.length}</div>
        </div>
      )}
    </div>
  );
}