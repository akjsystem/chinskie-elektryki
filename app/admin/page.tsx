"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPanel() {
  const [brands, setBrands] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [status, setStatus] = useState({ message: '', type: '' });
  
  const [activeTab, setActiveTab] = useState('katalog_aut'); 
  const [isBrandFormVisible, setIsBrandFormVisible] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingCarId, setEditingCarId] = useState<number | null>(null);
  const [carFilterBrand, setCarFilterBrand] = useState<string>('');
  
  // NOWOŚĆ: Stan przechowujący wybrane pliki przed ich wysłaniem
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [brandForm, setBrandForm] = useState({
    name: '', service_network_score: 50, capital_score: 50, safety_score: 50, volume_score: 50, tech_score: 50
  });

  const emptyCarForm = {
    brand_id: '', model: '', price_katalog_eur: '', range_real_km: '', range_wltp_km: '', 
    charge_time_min: '', architecture: '', drive_type: 'RWD (Na tył)', power_km: '', 
    battery_kwh: '', warranty_years: '', warranty_km: '', warranty_desc: '', image_url: '',
    gallery_urls: [] as string[]
  };
  const [carForm, setCarForm] = useState(emptyCarForm);

  useEffect(() => {
    fetchBrands();
    fetchCars();
  }, []);

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('*').order('name');
    if (data) setBrands(data);
  };

  const fetchCars = async () => {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    if (data) setCars(data);
  };

  // ==========================================
  // ZARZĄDZANIE MARKAMI
  // ==========================================
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: editingBrandId ? 'Aktualizowanie marki...' : 'Dodawanie marki...', type: 'loading' });
    
    if (editingBrandId) {
      const { error } = await supabase.from('brands').update(brandForm).eq('id', editingBrandId);
      if (error) setStatus({ message: `Błąd: ${error.message}`, type: 'error' });
      else {
        setStatus({ message: 'Marka zaktualizowana pomyślnie!', type: 'success' });
        setEditingBrandId(null);
        setBrandForm({ name: '', service_network_score: 50, capital_score: 50, safety_score: 50, volume_score: 50, tech_score: 50 });
        setIsBrandFormVisible(false);
        fetchBrands();
      }
    } else {
      const { error } = await supabase.from('brands').insert([brandForm]);
      if (error) setStatus({ message: `Błąd: ${error.message}`, type: 'error' });
      else {
        setStatus({ message: 'Marka dodana pomyślnie!', type: 'success' });
        setBrandForm({ name: '', service_network_score: 50, capital_score: 50, safety_score: 50, volume_score: 50, tech_score: 50 });
        setIsBrandFormVisible(false);
        fetchBrands(); 
      }
    }
  };

  const handleAddNewBrandClick = () => {
    setEditingBrandId(null);
    setBrandForm({ name: '', service_network_score: 50, capital_score: 50, safety_score: 50, volume_score: 50, tech_score: 50 });
    setIsBrandFormVisible(true);
  };

  const handleEditBrandClick = (brand: any) => {
    setEditingBrandId(brand.id);
    setBrandForm({
      name: brand.name, service_network_score: brand.service_network_score,
      capital_score: brand.capital_score, safety_score: brand.safety_score,
      volume_score: brand.volume_score, tech_score: brand.tech_score
    });
    setIsBrandFormVisible(true);
  };

  const handleDeleteBrand = async (id: number, name: string) => {
    if (!window.confirm(`Czy na pewno chcesz trwale usunąć markę "${name}"?`)) return;
    setStatus({ message: 'Usuwanie marki...', type: 'loading' });
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) setStatus({ message: `Błąd usuwania: ${error.message}`, type: 'error' });
    else {
      setStatus({ message: 'Marka usunięta z bazy.', type: 'success' });
      fetchBrands();
    }
  };

  // ==========================================
  // ZARZĄDZANIE AUTAMI I ZDJĘCIAMI
  // ==========================================
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploadingImage(true);
    setStatus({ message: `Wgrywanie ${selectedFiles.length} zdjęć do galerii...`, type: 'loading' });

    const newUrls: string[] = [];
    let hasErrors = false;

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { error } = await supabase.storage.from('gallery').upload(fileName, file);
      
      if (error) {
        console.error("Błąd uploadu:", error);
        hasErrors = true;
      } else {
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
        newUrls.push(data.publicUrl);
      }
    }

    setCarForm(prev => ({
      ...prev,
      gallery_urls: [...(prev.gallery_urls || []), ...newUrls]
    }));

    setSelectedFiles([]); // Czyścimy listę oczekujących plików
    setUploadingImage(false);

    if (hasErrors) {
      setStatus({ message: 'Wystąpił błąd. Upewnij się, że dodałeś w SQL Editorze komendę RLS na wgrywanie zdjęć.', type: 'error' });
    } else {
      setStatus({ message: 'Zdjęcia wgrane pomyślnie!', type: 'success' });
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setCarForm(prev => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: editingCarId ? 'Aktualizowanie pojazdu...' : 'Dodawanie samochodu...', type: 'loading' });
    
    const carDataToSave = {
      brand_id: parseInt(carForm.brand_id),
      model: carForm.model,
      price_katalog_eur: carForm.price_katalog_eur ? parseInt(carForm.price_katalog_eur) : null,
      range_real_km: carForm.range_real_km ? parseInt(carForm.range_real_km) : null,
      range_wltp_km: carForm.range_wltp_km ? parseInt(carForm.range_wltp_km) : null,
      charge_time_min: carForm.charge_time_min ? parseInt(carForm.charge_time_min) : null,
      architecture: carForm.architecture,
      drive_type: carForm.drive_type,
      power_km: carForm.power_km ? parseInt(carForm.power_km) : null,
      battery_kwh: carForm.battery_kwh ? parseFloat(carForm.battery_kwh) : null,
      warranty_years: carForm.warranty_years ? parseInt(carForm.warranty_years) : null,
      warranty_km: carForm.warranty_km ? parseInt(carForm.warranty_km) : null,
      warranty_desc: carForm.warranty_desc,
      image_url: carForm.image_url,
      gallery_urls: carForm.gallery_urls
    };

    if (editingCarId) {
      const { error } = await supabase.from('cars').update(carDataToSave).eq('id', editingCarId);
      if (error) setStatus({ message: `Błąd: ${error.message}`, type: 'error' });
      else {
        setStatus({ message: 'Pojazd zaktualizowany pomyślnie!', type: 'success' });
        setEditingCarId(null);
        setCarForm(emptyCarForm);
        setSelectedFiles([]);
        fetchCars();
        setActiveTab('katalog_aut'); 
      }
    } else {
      const { error } = await supabase.from('cars').insert([carDataToSave]);
      if (error) setStatus({ message: `Błąd: ${error.message}`, type: 'error' });
      else {
        setStatus({ message: 'Pojazd dodany pomyślnie!', type: 'success' });
        setCarForm(emptyCarForm);
        setSelectedFiles([]);
        fetchCars();
        setActiveTab('katalog_aut'); 
      }
    }
  };

  const handleEditCarClick = (car: any) => {
    setEditingCarId(car.id);
    setSelectedFiles([]);
    setCarForm({
      brand_id: car.brand_id?.toString() || '',
      model: car.model || '',
      price_katalog_eur: car.price_katalog_eur?.toString() || '',
      range_real_km: car.range_real_km?.toString() || '',
      range_wltp_km: car.range_wltp_km?.toString() || '',
      charge_time_min: car.charge_time_min?.toString() || '',
      architecture: car.architecture || '',
      drive_type: car.drive_type || 'RWD (Na tył)',
      power_km: car.power_km?.toString() || '',
      battery_kwh: car.battery_kwh?.toString() || '',
      warranty_years: car.warranty_years?.toString() || '',
      warranty_km: car.warranty_km?.toString() || '',
      warranty_desc: car.warranty_desc || '',
      image_url: car.image_url || '',
      gallery_urls: car.gallery_urls || []
    });
    setActiveTab('dodaj_auto'); 
  };

  const handleDeleteCar = async (id: number, modelName: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć pojazd "${modelName}"?`)) return;
    setStatus({ message: 'Usuwanie pojazdu...', type: 'loading' });
    const { error } = await supabase.from('cars').delete().eq('id', id);
    if (error) setStatus({ message: `Błąd usuwania: ${error.message}`, type: 'error' });
    else {
      setStatus({ message: 'Pojazd usunięty z bazy.', type: 'success' });
      fetchCars();
    }
  };

  const handleMenuDodajAutoClick = () => {
    setEditingCarId(null);
    setCarForm(emptyCarForm);
    setSelectedFiles([]);
    setActiveTab('dodaj_auto');
  };

  const handleFetchFromAPI = async () => {
    if (!carForm.model || !carForm.model.includes('http')) {
      setStatus({ message: 'Wklej najpierw pełny link do auta z ev-database.org w pole Model!', type: 'error' });
      return;
    }
    
    const originalLink = carForm.model;
    setCarForm(prev => ({ ...prev, model: 'Skanowanie...' }));
    setStatus({ message: 'Wysyłam bota AI na poszukiwania danych...', type: 'loading' });

    try {
      const response = await fetch('/api/scrape-ev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: originalLink })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd połączenia z serwerem AI');
      }

      const data = await response.json();

      setCarForm(prev => ({
        ...prev,
        model: data.model || originalLink,
        price_katalog_eur: data.price_katalog_eur || prev.price_katalog_eur,
        range_real_km: data.range_real_km || prev.range_real_km,
        range_wltp_km: data.range_wltp_km || prev.range_wltp_km,
        charge_time_min: data.charge_time_min || prev.charge_time_min,
        battery_kwh: data.battery_kwh || prev.battery_kwh,
        power_km: data.power_km || prev.power_km,
        drive_type: data.drive_type || prev.drive_type,
        architecture: data.architecture || prev.architecture,
        warranty_years: data.warranty_years || prev.warranty_years,
        warranty_km: data.warranty_km || prev.warranty_km,
        image_url: data.image_url || prev.image_url
      }));
      
      setStatus({ message: 'Sukces! Formularz został uzupełniony przez AI.', type: 'success' });
    } catch (error: any) {
      setCarForm(prev => ({ ...prev, model: originalLink }));
      setStatus({ message: `Błąd: ${error.message}`, type: 'error' });
    }
  };

  const filteredCars = carFilterBrand ? cars.filter(car => car.brand_id.toString() === carFilterBrand) : cars;

  return (
    <div className="flex h-screen bg-[#f4f6f9] font-sans text-sm text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#232732] text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-[#1e222d] text-white font-black text-xl tracking-tight">
          Admin<span className="text-blue-500 font-normal">EV</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="mt-2 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Baza Danych</div>
          
          <div 
            onClick={() => setActiveTab('katalog_aut')}
            className={`px-6 py-2.5 flex items-center cursor-pointer transition-colors ${activeTab === 'katalog_aut' ? 'bg-[#2a2f3d] text-white border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent'}`}
          >
            Katalog Aut
          </div>
          <div 
            onClick={handleMenuDodajAutoClick}
            className={`px-6 py-2.5 flex items-center cursor-pointer transition-colors ${activeTab === 'dodaj_auto' ? 'bg-[#2a2f3d] text-white border-l-4 border-emerald-500 font-semibold' : 'hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent'}`}
          >
            Dodaj Auto
          </div>
          <div 
            onClick={() => { setActiveTab('marki'); setIsBrandFormVisible(false); }}
            className={`px-6 py-2.5 flex items-center cursor-pointer transition-colors ${activeTab === 'marki' ? 'bg-[#2a2f3d] text-white border-l-4 border-blue-500 font-semibold' : 'hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent'}`}
          >
            Zarządzanie Markami
          </div>

          <div className="mt-8 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Monetyzacja</div>
          <div className="px-6 py-2.5 flex items-center cursor-pointer hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent transition-colors">
            AdManager
          </div>
          <div className="px-6 py-2.5 flex items-center cursor-pointer hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent transition-colors">
            Kody Afiliacyjne
          </div>
          <div className="px-6 py-2.5 flex items-center cursor-pointer hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent transition-colors">
            Statystyki Leadów
          </div>

          <div className="mt-8 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">System</div>
          <div className="px-6 py-2.5 flex items-center cursor-pointer hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent transition-colors">
            Użytkownicy
          </div>
          <div className="px-6 py-2.5 flex items-center cursor-pointer hover:bg-[#2a2f3d] hover:text-white border-l-4 border-transparent transition-colors">
            Ustawienia SEO
          </div>
        </div>
      </aside>

      {/* GŁÓWNA ZAWARTOŚĆ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="font-bold text-slate-800 text-lg">Pulpit</div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="font-bold text-slate-800 text-sm leading-tight">Superadmin</div>
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Superadmin</div>
            </div>
            <button className="px-5 py-1.5 text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded text-xs font-bold transition-colors">
              Wyloguj
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            
            {status.message && (
              <div className={`p-4 mb-6 rounded-lg font-bold shadow-sm ${status.type === 'error' ? 'bg-rose-100 border border-rose-200 text-rose-900' : status.type === 'success' ? 'bg-emerald-100 border border-emerald-200 text-emerald-950' : 'bg-blue-100 border border-blue-200 text-blue-900'}`}>
                {status.message}
              </div>
            )}

            {/* --- ZAKŁADKA: KATALOG AUT --- */}
            {activeTab === 'katalog_aut' && (
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm text-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4 gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Katalog Wprowadzonych Aut</h2>
                    <p className="text-slate-500 text-xs mt-1">Przeglądaj, filtruj i edytuj bazę pojazdów.</p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <select value={carFilterBrand} onChange={(e) => setCarFilterBrand(e.target.value)} className="w-full sm:w-48 p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">Wszystkie marki</option>
                      {brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredCars.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <p className="text-slate-500 font-medium">Brak aut w katalogu dla tych kryteriów.</p>
                    </div>
                  ) : (
                    filteredCars.map((car) => {
                      const brandName = brands.find(b => b.id === car.brand_id)?.name || 'Nieznana marka';
                      return (
                        <div key={car.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border bg-white border-slate-200 hover:shadow-md transition-shadow gap-4">
                          <div className="flex items-center gap-4">
                            {car.image_url ? (
                              <img src={car.image_url} alt={car.model} className="w-16 h-10 object-contain bg-slate-100 rounded shadow-sm border border-slate-200" />
                            ) : (
                              <div className="w-16 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] text-slate-400">Brak foto</div>
                            )}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded">{brandName}</span>
                              <span className="font-black text-base text-slate-800 block mt-1">{car.model}</span>
                              <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                <span>Bateria: <strong className="text-slate-700">{car.battery_kwh} kWh</strong></span>
                                <span>Zdjęć w galerii: <strong className="text-slate-700">{car.gallery_urls?.length || 0}</strong></span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditCarClick(car)} className="text-[11px] uppercase tracking-wider font-bold border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition">Edytuj</button>
                            <button onClick={() => handleDeleteCar(car.id, car.model)} className="text-[11px] uppercase tracking-wider font-bold border border-rose-200 text-rose-700 px-4 py-2 rounded-lg hover:bg-rose-50 transition">Usuń</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- ZAKŁADKA: DODAJ AUTO --- */}
            {activeTab === 'dodaj_auto' && (
              <div className={`bg-white p-6 md:p-8 rounded-xl border ${editingCarId ? 'border-amber-400 shadow-md ring-4 ring-amber-50' : 'border-emerald-400 shadow-sm'} relative text-gray-900`}>
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-200">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">{editingCarId ? 'Edycja Pojazdu' : 'Dodaj Pojazd do Katalogu'}</h2>
                  </div>
                  {!editingCarId && (
                    <button onClick={handleFetchFromAPI} type="button" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 px-4 py-2 rounded text-xs font-bold transition flex items-center gap-2 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      Wczytaj dane z AI
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveCar} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Przypisz do Marki</label>
                      <select required value={carForm.brand_id} onChange={e => setCarForm({...carForm, brand_id: e.target.value})} className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Wybierz...</option>
                        {brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Model (Wklej link, AI zmieni na nazwę)</label>
                      <input type="text" required placeholder="np. https://ev-database.org/car/..." value={carForm.model} onChange={e => setCarForm({...carForm, model: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    {/* ZDJĘCIE GŁÓWNE */}
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Zdjęcie Główne (Zostaw puste, AI samo uzupełni)</label>
                      <div className="flex gap-4 items-center">
                        <input type="text" value={carForm.image_url} onChange={e => setCarForm({...carForm, image_url: e.target.value})} className="flex-1 p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" placeholder="Pobierane automatycznie przez AI..." />
                        {carForm.image_url && (
                          <div className="w-20 h-12 bg-white rounded overflow-hidden shadow-sm border border-slate-200">
                            <img src={carForm.image_url} alt="Podgląd" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RĘCZNY UPLOAD DO GALERII (Z PRZYCISKIEM ZAPISU!) */}
                    <div className="col-span-2 p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50 shadow-sm">
                      <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Wgraj zdjęcia do galerii (Ręcznie z dysku)</label>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => setSelectedFiles(e.target.files ? Array.from(e.target.files) : [])} 
                          disabled={uploadingImage} 
                          className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition cursor-pointer" 
                        />
                        
                        {selectedFiles.length > 0 && (
                          <button 
                            type="button" 
                            onClick={handleUploadFiles}
                            disabled={uploadingImage}
                            className="whitespace-nowrap px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
                          >
                            {uploadingImage ? 'Wgrywanie...' : `Wgraj ${selectedFiles.length} zdjęć do bazy`}
                          </button>
                        )}
                      </div>
                      
                      {carForm.gallery_urls && carForm.gallery_urls.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {carForm.gallery_urls.map((url, idx) => (
                            <div key={idx} className="relative w-28 h-20 bg-white border border-slate-200 rounded-lg flex-shrink-0 group shadow-sm">
                              <img src={url} alt="Galeria" className="w-full h-full object-cover rounded-lg p-0.5" />
                              <button 
                                type="button" 
                                onClick={() => removeGalleryImage(idx)} 
                                className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic flex items-center bg-white p-3 rounded border border-slate-100">
                          Brak dodatkowych zdjęć. Wgraj pliki powyżej, aby utworzyć inteligentną galerię na karcie pojazdu.
                        </div>
                      )}
                    </div>

                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cena Katalog (EUR)</label><input type="number" required value={carForm.price_katalog_eur} onChange={e => setCarForm({...carForm, price_katalog_eur: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Zasięg Realny (km)</label><input type="number" required value={carForm.range_real_km} onChange={e => setCarForm({...carForm, range_real_km: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Zasięg WLTP (km)</label><input type="number" required value={carForm.range_wltp_km} onChange={e => setCarForm({...carForm, range_wltp_km: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ładowanie (min)</label><input type="number" required value={carForm.charge_time_min} onChange={e => setCarForm({...carForm, charge_time_min: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bateria (kWh)</label><input type="number" step="0.1" required value={carForm.battery_kwh} onChange={e => setCarForm({...carForm, battery_kwh: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Moc (KM)</label><input type="number" required value={carForm.power_km} onChange={e => setCarForm({...carForm, power_km: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gwarancja Baterii (Lata)</label><input type="number" required value={carForm.warranty_years} onChange={e => setCarForm({...carForm, warranty_years: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gwarancja Baterii (km)</label><input type="number" required value={carForm.warranty_km} onChange={e => setCarForm({...carForm, warranty_km: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Napęd</label><select value={carForm.drive_type} onChange={e => setCarForm({...carForm, drive_type: e.target.value})} className="w-full p-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"><option value="RWD (Na tył)">RWD (Na tył)</option><option value="AWD (4x4)">AWD (4x4)</option><option value="FWD (Na przód)">FWD (Na przód)</option></select></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Architektura (np. 400 V)</label><input type="text" required value={carForm.architecture} onChange={e => setCarForm({...carForm, architecture: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 mt-2">Opis Dodatkowy (Opcjonalnie)</label>
                    <textarea value={carForm.warranty_desc} onChange={e => setCarForm({...carForm, warranty_desc: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"></textarea>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                    <button type="submit" className={`flex-1 text-white font-bold py-4 rounded-lg transition shadow-sm text-base ${editingCarId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1e222d] hover:bg-slate-800'}`}>
                      {editingCarId ? 'Zapisz Zmiany w Pojeździe' : 'Zapisz Pojazd w Bazie'}
                    </button>
                    {editingCarId && (
                      <button type="button" onClick={() => { setEditingCarId(null); setActiveTab('katalog_aut'); setCarForm(emptyCarForm); setSelectedFiles([]); }} className="px-6 py-4 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition">Anuluj Edycję</button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* --- ZAKŁADKA: ZARZĄDZANIE MARKAMI --- */}
            {activeTab === 'marki' && (
              <>
                {!isBrandFormVisible ? (
                  <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm text-gray-900">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-800">Baza Mareków</h2>
                        <p className="text-slate-500 text-xs mt-1">Zarządzaj swoimi danymi i usuwaj niepotrzebne wpisy testowe.</p>
                      </div>
                      <button 
                        onClick={handleAddNewBrandClick}
                        className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-xs font-bold transition shadow-sm"
                      >
                        + Dodaj Nową Markę
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {brands.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                          <p className="text-slate-500 font-medium">Twoja baza marek jest pusta.</p>
                        </div>
                      ) : (
                        brands.map((brand) => (
                          <div key={brand.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-white border-slate-200 hover:shadow-md transition-shadow">
                            <div className="mb-3 sm:mb-0">
                              <span className="font-black text-base text-slate-800 block">{brand.name}</span>
                              <span className="text-xs text-slate-400">
                                Średnia ocena systemu: {((brand.service_network_score + brand.capital_score + brand.safety_score + brand.volume_score + brand.tech_score) / 5).toFixed(1)}/100
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditBrandClick(brand)} className="text-[11px] uppercase tracking-wider font-bold border border-blue-200 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition">
                                Edytuj Raport
                              </button>
                              <button onClick={() => handleDeleteBrand(brand.id, brand.name)} className="text-[11px] uppercase tracking-wider font-bold border border-rose-200 text-rose-700 px-4 py-2 rounded-lg hover:bg-rose-50 transition">
                                Usuń
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`bg-white p-6 md:p-8 rounded-xl border ${editingBrandId ? 'border-amber-400 shadow-md ring-4 ring-amber-50' : 'border-blue-400 shadow-md ring-4 ring-blue-50'}`}>
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-800">
                          {editingBrandId ? 'Edycja Raportu Reputacji' : 'Nowy Raport Marki'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">
                          {editingBrandId ? 'Zaktualizuj punkty (0-100), aby wpłynąć na wynik ryzyka utraty wartości.' : 'Wprowadź dane z rynku, aby system obliczył ryzyko inwestycyjne.'}
                        </p>
                      </div>
                      <button onClick={() => setIsBrandFormVisible(false)} className="text-slate-400 hover:text-slate-700 p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>

                    <form onSubmit={handleSaveBrand} className="space-y-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nazwa Marki (np. BYD)</label>
                        <input type="text" required value={brandForm.name} onChange={e => setBrandForm({...brandForm, name: e.target.value})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sieć Serwisowa (0-100)</label>
                          <input type="number" required min="0" max="100" value={brandForm.service_network_score} onChange={e => setBrandForm({...brandForm, service_network_score: parseInt(e.target.value)})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kapitał / Stabilność (0-100)</label>
                          <input type="number" required min="0" max="100" value={brandForm.capital_score} onChange={e => setBrandForm({...brandForm, capital_score: parseInt(e.target.value)})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Euro NCAP / Bezpieczeństwo (0-100)</label>
                          <input type="number" required min="0" max="100" value={brandForm.safety_score} onChange={e => setBrandForm({...brandForm, safety_score: parseInt(e.target.value)})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Wolumen Sprzedaży (0-100)</label>
                          <input type="number" required min="0" max="100" value={brandForm.volume_score} onChange={e => setBrandForm({...brandForm, volume_score: parseInt(e.target.value)})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Technologia i Innowacje (0-100)</label>
                          <input type="number" required min="0" max="100" value={brandForm.tech_score} onChange={e => setBrandForm({...brandForm, tech_score: parseInt(e.target.value)})} className="w-full p-3 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                        <button type="submit" className={`flex-1 text-white font-bold py-3.5 rounded-lg transition shadow-sm text-base ${editingBrandId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {editingBrandId ? 'Zapisz Zmiany' : 'Zapisz Nowy Raport'}
                        </button>
                        
                        <button type="button" onClick={() => setIsBrandFormVisible(false)} className="px-6 py-3.5 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition">
                          Anuluj / Wróć do listy
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}