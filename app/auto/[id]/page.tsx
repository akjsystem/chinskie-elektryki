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
  
  // --- STANY DLA GALERII PEŁNOEKRANOWEJ (LIGHTBOX) ---
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCarData(id as string);
    }
  }, [id]);

  // Obsługa klawiatury dla otwartej galerii
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
    const { data: carData, error: carError } = await supabase.from('cars').select('*').eq('id', carId).single();
    
    if (carData) {
      setCar(carData);
      const { data: brandData } = await supabase.from('brands').select('*').eq('id', carData.brand_id).single();
      if (brandData) setBrand(brandData);
    }
    setLoading(false);
  };

  const calculateBrandScore = () => {
    if (!brand) return { score: 0, risk: 'Nieznane', color: 'bg-slate-100 text-slate-800' };
    const average = (brand.service_network_score + brand.capital_score + brand.safety_score + brand.volume_score + brand.tech_score) / 5;
    const score10 = (average / 10).toFixed(1);

    if (average >= 75) return { score: score10, risk: 'NISKIE RYZYKO UTRATY WARTOŚCI', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (average >= 50) return { score: score10, risk: 'ŚREDNIE RYZYKO UTRATY WARTOŚCI', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { score: score10, risk: 'WYSOKIE RYZYKO UTRATY WARTOŚCI', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  };

  // --- FUNKCJE STERUJĄCE GALERIĄ ---
  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
    // Blokujemy scrollowanie strony pod spodem
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    // Przywracamy scrollowanie
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e: React.MouseEvent | any) => {
    e?.stopPropagation(); // Zapobiega zamknięciu galerii przy kliknięciu w strzałkę
    if (car?.gallery_urls) {
      setCurrentImageIndex((prev) => (prev === car.gallery_urls.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e: React.MouseEvent | any) => {
    e?.stopPropagation();
    if (car?.gallery_urls) {
      setCurrentImageIndex((prev) => (prev === 0 ? car.gallery_urls.length - 1 : prev - 1));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-500 font-bold animate-pulse">Ładowanie pełnego raportu...</div>;
  }

  if (!car || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Pojazd nie został znaleziony</h1>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Wróć do katalogu</Link>
      </div>
    );
  }

  const reputation = calculateBrandScore();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 relative">
      
      {/* PASEK NAWIGACJI (GÓRA) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Wróć do listy pojazdów
          </Link>
          <div className="font-black text-slate-800 tracking-tight">EV<span className="text-blue-600">Report</span></div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-20">
        
        {/* SEKCJA HERO (ZDJĘCIE + GŁÓWNE DANE) */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-8 flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-[#eaedf1] relative min-h-[300px] flex items-center justify-center p-6">
             {car.image_url ? (
                <img src={car.image_url} alt={car.model} className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl" />
              ) : (
                <div className="text-slate-400 font-medium">Brak zdjęcia</div>
              )}
              <div className="absolute top-4 left-4 bg-white border border-slate-200 text-slate-800 text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm">
                {car.drive_type}
              </div>
          </div>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="text-blue-600 text-sm font-black uppercase tracking-wider mb-2">{brand.name}</div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">{car.model}</h1>
            
            <div className="text-slate-500 text-sm font-medium mb-1">Cena bazowa (Niemcy)</div>
            <div className="text-3xl font-black text-slate-800 mb-8">
              {car.price_katalog_eur ? `${car.price_katalog_eur.toLocaleString('pl-PL')} €` : 'Brak danych'}
            </div>

            <div className={`p-4 border rounded-xl flex items-center justify-between ${reputation.color}`}>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-1">Wskaźnik Bezpieczeństwa Inwestycji</div>
                <div className="font-bold text-sm">{reputation.risk}</div>
              </div>
              <div className="text-3xl font-black">{reputation.score}<span className="text-lg opacity-50">/10</span></div>
            </div>
          </div>
        </div>

        {/* SIATKA DANYCH TECHNICZNYCH */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Dane Techniczne</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Bateria Netto</div>
            <div className="text-2xl font-black text-slate-800">{car.battery_kwh} <span className="text-sm font-medium text-slate-500">kWh</span></div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Zasięg Realny</div>
            <div className="text-2xl font-black text-blue-600">{car.range_real_km} <span className="text-sm font-medium text-blue-400">km</span></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Szybkie Ładowanie DC</div>
            <div className="text-2xl font-black text-emerald-600">{car.charge_time_min} <span className="text-sm font-medium text-emerald-400">min</span></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Moc Silnika</div>
            <div className="text-2xl font-black text-slate-800">{car.power_km} <span className="text-sm font-medium text-slate-500">KM</span></div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Architektura Napięcia</div>
            <div className="text-xl font-black text-slate-800">{car.architecture || 'Brak danych'}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Zasięg WLTP (Lab)</div>
            <div className="text-xl font-black text-slate-800">{car.range_wltp_km} km</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center col-span-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Gwarancja na Baterię</div>
            <div className="text-xl font-black text-slate-800">
              {car.warranty_years ? `${car.warranty_years} lat` : '?'} / {car.warranty_km ? `${car.warranty_km.toLocaleString('pl-PL')} km` : '?'}
            </div>
          </div>

        </div>

        {/* --- GALERIA ZDJĘĆ Z FUNKCJĄ KLIKNIĘCIA --- */}
        {car.gallery_urls && car.gallery_urls.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Galeria</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {car.gallery_urls.map((url: string, index: number) => (
                <div 
                  key={index} 
                  onClick={() => openGallery(index)} // Wywołanie otwarcia galerii
                  className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group cursor-pointer relative"
                >
                  <img 
                    src={url} 
                    alt={`Zdjęcie ${car.model} ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Ikonka lupy na hoverze */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SZCZEGÓŁOWY RAPORT MARKI */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 px-2">Analiza Reputacji Marki {brand.name}</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 mb-8">
          <p className="text-slate-600 leading-relaxed mb-8">
            Poniższa ocena jest generowana przez algorytm uwzględniający stabilność finansową producenta, dostępność części zamiennych, rozbudowę sieci serwisowej w Polsce oraz innowacyjność technologiczną.
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2 text-slate-700">
                <span>Sieć Serwisowa w PL</span>
                <span>{brand.service_network_score}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${brand.service_network_score}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2 text-slate-700">
                <span>Stabilność Kapitałowa (Ryzyko bankructwa)</span>
                <span>{brand.capital_score}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${brand.capital_score}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2 text-slate-700">
                <span>Bezpieczeństwo (Euro NCAP)</span>
                <span>{brand.safety_score}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${brand.safety_score}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2 text-slate-700">
                <span>Technologia i Innowacje</span>
                <span>{brand.tech_score}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${brand.tech_score}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* OPIS DODATKOWY (Jeśli istnieje) */}
        {car.warranty_desc && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 text-blue-900 text-sm leading-relaxed">
            <h3 className="font-black text-blue-800 mb-3 uppercase tracking-wider text-[11px]">Notatki eksperta / Gwarancja pojazdu</h3>
            {car.warranty_desc}
          </div>
        )}
      </main>

      {/* --- KOMPONENT LIGHTBOX (MODAL) --- */}
      {isGalleryOpen && car.gallery_urls && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
          onClick={closeGallery} // Kliknięcie w czarne tło zamyka galerię
        >
          {/* Przycisk Zamknij */}
          <button 
            onClick={closeGallery} 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-2 rounded-full"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {/* Przycisk Poprzednie (Strzałka w lewo) */}
          <button 
            onClick={prevImage} 
            className="absolute left-4 md:left-10 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-3 rounded-full"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          {/* Wyświetlane Zdjęcie */}
          <img 
            src={car.gallery_urls[currentImageIndex]} 
            alt={`Zdjęcie ${currentImageIndex + 1}`} 
            className="max-h-[90vh] max-w-full object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Zapobiega zamknięciu przy kliknięciu w samo zdjęcie
          />

          {/* Przycisk Następne (Strzałka w prawo) */}
          <button 
            onClick={nextImage} 
            className="absolute right-4 md:right-10 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-3 rounded-full"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          {/* Licznik zdjęć */}
          <div className="absolute bottom-6 text-white/70 font-bold tracking-widest text-sm bg-black/40 px-4 py-1.5 rounded-full">
            {currentImageIndex + 1} / {car.gallery_urls.length}
          </div>
        </div>
      )}
    </div>
  );
}