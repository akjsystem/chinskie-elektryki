"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CatalogPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedBrand, setSelectedBrand] = useState('Wszystkie marki');
  const [maxPrice, setMaxPrice] = useState('Dowolna');
  const [driveType, setDriveType] = useState('Wszystkie');
  
  // NOWOŚĆ: Stan sortowania w katalogu publicznym
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: carsData } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    const { data: brandsData } = await supabase.from('brands').select('*');
    
    if (carsData) setCars(carsData);
    if (brandsData) setBrands(brandsData);
    setLoading(false);
  };

  const calculateRVScore = (car: any, brand: any) => {
    if (!brand || !car) return { score: '0.0', risk: 'Brak danych', color: 'bg-slate-50 text-slate-500 border-slate-200' };

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

    if (score >= 7.5) return { score: formattedScore, risk: 'Niskie Ryzyko', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 5.0) return { score: formattedScore, risk: 'Średnie Ryzyko', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { score: formattedScore, risk: 'Wysokie Ryzyko', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  // Filtrowanie i sortowanie na żywo
  let filteredCars = cars.filter(car => {
    const brand = brands.find(b => b.id === car.brand_id);
    if (selectedBrand !== 'Wszystkie marki' && brand?.name !== selectedBrand) return false;
    if (driveType !== 'Wszystkie' && car.drive_type !== driveType) return false;
    if (maxPrice !== 'Dowolna') {
      const limit = parseInt(maxPrice);
      if (car.price_katalog_eur > limit) return false;
    }
    return true;
  });

  // LOGIKA SORTOWANIA NA FRONCIE
  if (sortBy === 'newest') filteredCars.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'price_asc') filteredCars.sort((a, b) => (a.price_katalog_eur || Infinity) - (b.price_katalog_eur || Infinity));
  if (sortBy === 'price_desc') filteredCars.sort((a, b) => (b.price_katalog_eur || 0) - (a.price_katalog_eur || 0));
  if (sortBy === 'range_desc') filteredCars.sort((a, b) => (b.range_wltp_km || 0) - (a.range_wltp_km || 0));
  if (sortBy === 'battery_desc') filteredCars.sort((a, b) => (b.battery_kwh || 0) - (a.battery_kwh || 0));
  if (sortBy === 'az') filteredCars.sort((a, b) => a.model.localeCompare(b.model));

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-slate-800 tracking-tight">
            EV<span className="text-blue-600">Report</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition">Baza Wiedzy</Link>
            <Link href="/katalog" className="text-sm font-bold text-blue-600">Katalog Aut</Link>
          </div>
        </div>
      </nav>

      <header className="bg-[#1e222d] text-white pt-16 pb-32 px-6 text-center">
        <div className="inline-block bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider text-[10px] px-3 py-1.5 rounded-full mb-4 border border-blue-500/30">
          Autorski Wskaźnik RV
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Interaktywny Katalog</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Porównaj modele i sprawdź nasz algorytmiczny wskaźnik ryzyka utraty wartości (RV) oparty na twardych danych o serwisach i technologii.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-20">
        
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-slate-100">
          {/* NOWOŚĆ: 4-kolumnowy layout filtrów z sortowaniem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Marka</label>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold">
                <option value="Wszystkie marki">Wszystkie marki</option>
                {brands.map(b => (<option key={b.id} value={b.name}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cena (EUR)</label>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold">
                <option value="Dowolna">Dowolna</option>
                <option value="30000">do 30 000 €</option>
                <option value="45000">do 45 000 €</option>
                <option value="60000">do 60 000 €</option>
                <option value="80000">do 80 000 €</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Napęd</label>
              <select value={driveType} onChange={(e) => setDriveType(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold">
                <option value="Wszystkie">Wszystkie</option>
                <option value="RWD (Na tył)">RWD (Na tył)</option>
                <option value="AWD (4x4)">AWD (4x4)</option>
                <option value="FWD (Na przód)">FWD (Na przód)</option>
              </select>
            </div>
            {/* PRZYCISK SORTOWANIA */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sortuj po</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-blue-50 text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-black shadow-sm">
                <option value="newest">Od Najnowszych wpisów</option>
                <option value="price_asc">Od Najtańszych aut</option>
                <option value="price_desc">Od Najdroższych aut</option>
                <option value="range_desc">Największy zasięg</option>
                <option value="battery_desc">Największa bateria</option>
                <option value="az">Alfabetycznie</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-4 px-2">
          <h2 className="text-xl font-black text-slate-800">Znalezione Pojazdy</h2>
          <span className="text-sm text-slate-500 font-bold bg-slate-200 px-3 py-1 rounded-full">{filteredCars.length} wyników</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Wczytywanie bazy danych...</div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100 overflow-hidden">
            {filteredCars.map((car) => {
              const brand = brands.find(b => b.id === car.brand_id);
              const rvData = calculateRVScore(car, brand);

              return (
                <div key={car.id} className="p-5 md:p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50 transition-colors duration-200 group">
                  
                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                    <Link href={`/auto/${car.id}`} className="block aspect-[4/3] md:aspect-auto md:h-44 bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200">
                      {car.image_url ? (
                        <img src={car.image_url} alt={car.model} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">Brak zdjęcia</div>
                      )}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-sm text-slate-700">
                        {car.drive_type}
                      </div>
                    </Link>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                      <div>
                        <div className="text-blue-600 text-xs font-black uppercase tracking-wider mb-1.5">{brand?.name || 'Nieznana Marka'}</div>
                        <Link href={`/auto/${car.id}`} className="text-2xl font-black text-slate-900 hover:text-blue-600 transition-colors leading-tight">
                          {car.model}
                        </Link>
                      </div>
                      
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 ${rvData.color} shrink-0 shadow-sm`}>
                        <div className="text-right">
                          <div className="text-[9px] font-black uppercase opacity-70 tracking-wider">Ryzyko inwestycji</div>
                          <div className="text-xs font-bold">{rvData.risk}</div>
                        </div>
                        <div className="text-2xl font-black leading-none">{rvData.score}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6 mt-auto">
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Euro NCAP</div>
                        <div className="text-sm font-black text-amber-500">
                          {car.ncap_stars > 0 ? "⭐".repeat(car.ncap_stars) : <span className="text-slate-400 font-medium">Brak testu</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Architektura</div>
                        <div className="text-sm font-black text-slate-900">{car.architecture ? `${car.architecture}` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Zasięg WLTP</div>
                        <div className="text-sm font-black text-slate-700">{car.range_wltp_km ? `${car.range_wltp_km} km` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Ładowanie DC</div>
                        <div className="text-sm font-black text-emerald-600">{car.charge_time_min ? `${car.charge_time_min} min` : '-'}</div>
                      </div>

                      <div className="col-span-2 sm:col-span-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 border-slate-100 flex flex-col justify-center">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Cena Bazowa</div>
                        <div className="text-xl font-black text-slate-900">
                          {car.price_katalog_eur ? `${car.price_katalog_eur.toLocaleString('pl-PL')} €` : 'Brak'}
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-2 flex items-center justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                        <Link href={`/auto/${car.id}`} className="text-sm font-black bg-blue-50 text-blue-700 px-6 py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-colors w-full sm:w-auto text-center">
                          Pełny Raport i Analiza
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredCars.length === 0 && (
              <div className="p-16 text-center text-slate-500 font-medium bg-slate-50">
                Brak pojazdów spełniających Twoje kryteria wyszukiwania.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}