"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link'; // NOWOŚĆ: Importujemy Link z Next.js

// Inicjalizacja połączenia z bazy
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HomePage() {
  const [cars, setCars] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stany dla filtrów
  const [selectedBrand, setSelectedBrand] = useState('Wszystkie marki');
  const [maxPrice, setMaxPrice] = useState('Dowolna');
  const [driveType, setDriveType] = useState('Wszystkie');

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

  const calculateBrandScore = (brandId: number) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return { score: 0, risk: 'Nieznane', color: 'bg-slate-100 text-slate-800' };

    const average = (brand.service_network_score + brand.capital_score + brand.safety_score + brand.volume_score + brand.tech_score) / 5;
    const score10 = (average / 10).toFixed(1);

    if (average >= 75) return { score: score10, risk: 'Niskie Ryzyko', color: 'bg-emerald-100 text-emerald-800' };
    if (average >= 50) return { score: score10, risk: 'Średnie Ryzyko', color: 'bg-amber-100 text-amber-800' };
    return { score: score10, risk: 'Wysokie Ryzyko', color: 'bg-rose-100 text-rose-800' };
  };

  const filteredCars = cars.filter(car => {
    const brand = brands.find(b => b.id === car.brand_id);
    if (selectedBrand !== 'Wszystkie marki' && brand?.name !== selectedBrand) return false;
    if (driveType !== 'Wszystkie' && car.drive_type !== driveType) return false;
    if (maxPrice !== 'Dowolna') {
      const limit = parseInt(maxPrice);
      if (car.price_katalog_eur > limit) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      
      <header className="bg-[#1e222d] text-white pt-16 pb-32 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Poznaj chińskie elektryki</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Zanim kupisz, sprawdź prawdziwe zasięgi, koszty serwisu i wskaźnik utraty wartości. Wybieraj świadomie.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-20">
        
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-12 border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-slate-800">Znajdź model dla siebie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Marka</label>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition">
                <option value="Wszystkie marki">Wszystkie marki</option>
                {brands.map(b => (<option key={b.id} value={b.name}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Maksymalna Cena (EUR)</label>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition">
                <option value="Dowolna">Dowolna</option>
                <option value="30000">do 30 000 €</option>
                <option value="45000">do 45 000 €</option>
                <option value="60000">do 60 000 €</option>
                <option value="80000">do 80 000 €</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Napęd</label>
              <select value={driveType} onChange={(e) => setDriveType(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition">
                <option value="Wszystkie">Wszystkie</option>
                <option value="RWD (Na tył)">RWD (Na tył)</option>
                <option value="AWD (4x4)">AWD (4x4)</option>
                <option value="FWD (Na przód)">FWD (Na przód)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-black text-slate-800">Katalog Pojazdów</h2>
          <span className="text-sm text-slate-500 font-medium">Znaleziono: {filteredCars.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Ładowanie bazy pojazdów...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car) => {
              const brand = brands.find(b => b.id === car.brand_id);
              const reputation = calculateBrandScore(car.brand_id);

              return (
                <div key={car.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col relative group">
                  
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-slate-200 text-slate-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full z-10 shadow-sm">
                    {car.drive_type}
                  </div>

                  <div className="h-56 bg-slate-100 relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                    {car.image_url ? (
                      <img src={car.image_url} alt={`${brand?.name} ${car.model}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">Brak zdjęcia</div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-blue-600 text-xs font-black uppercase tracking-wider mb-1">{brand?.name}</div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight">{car.model}</h3>
                      </div>
                      <div className={`px-2.5 py-1 rounded font-black text-sm border ${reputation.color.replace('bg-', 'border-').replace('100', '200')} ${reputation.color}`}>
                        {reputation.score}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Cena ok:</span>
                        <strong className="text-slate-900">
                          {car.price_katalog_eur ? `~ ${car.price_katalog_eur.toLocaleString('pl-PL')} €` : 'Brak danych'}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Zasięg (Real / WLTP):</span>
                        <strong className="text-slate-900">{car.range_real_km} <span className="text-slate-400 font-normal">/ {car.range_wltp_km} km</span></strong>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Ładowanie DC:</span>
                        <strong className="text-slate-900">{car.charge_time_min} min</strong>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Utrata wartości:</span>
                        <strong className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${reputation.color}`}>
                          {reputation.risk}
                        </strong>
                      </div>
                    </div>

                    {/* NOWOŚĆ: Link zamiast buttona */}
                    <Link href={`/auto/${car.id}`} className="block w-full text-center bg-[#1e222d] text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                      Pełny raport
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Brak wyników</h3>
            <p className="text-slate-500">Spróbuj zmienić kryteria wyszukiwania.</p>
          </div>
        )}
      </main>
    </div>
  );
}