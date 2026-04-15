"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPanel() {
  const [brands, setBrands] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [status, setStatus] = useState({ message: '', type: '' });
  const [activeTab, setActiveTab] = useState('katalog_aut'); 
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isBrandFormVisible, setIsBrandFormVisible] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '', has_official_importer: false, has_eu_warehouse: false, aso_network_size: 'Początkująca (1-10)', global_position: 'Nowy Startup'
  });

  const [isCategoryFormVisible, setIsCategoryFormVisible] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  const [editingCarId, setEditingCarId] = useState<number | null>(null);
  const [carFilterBrand, setCarFilterBrand] = useState<string>('');
  
  // NOWOŚĆ: Stan sortowania w panelu admina
  const [carSortOrder, setCarSortOrder] = useState<string>('newest');
  
  const [selectedCarFiles, setSelectedCarFiles] = useState<File[]>([]);
  const emptyCarForm = {
    brand_id: '', model: '', price_katalog_eur: '', range_real_km: '', range_wltp_km: '', 
    charge_time_min: '', architecture: '', drive_type: 'RWD (Na tył)', power_km: '', 
    battery_kwh: '', warranty_years: '', warranty_km: '', warranty_desc: '', image_url: '',
    gallery_urls: [] as string[], ncap_stars: 0
  };
  const [carForm, setCarForm] = useState(emptyCarForm);

  const [isPostFormVisible, setIsPostFormVisible] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [selectedPostFiles, setSelectedPostFiles] = useState<File[]>([]);
  const emptyPostForm = { title: '', slug: '', excerpt: '', content: '', category: '', cover_image: '', gallery_urls: [] as string[], is_published: false };
  const [postForm, setPostForm] = useState(emptyPostForm);

  const [isBannerFormVisible, setIsBannerFormVisible] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const emptyBannerForm = { title: '', media_type: 'image', media_url: '', target_url: '', is_active: false };
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  useEffect(() => { fetchBrands(); fetchCars(); fetchPosts(); fetchBanners(); fetchCategories(); }, []);

  const fetchBrands = async () => { const { data } = await supabase.from('brands').select('*').order('name'); if (data) setBrands(data); };
  const fetchCars = async () => { const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false }); if (data) setCars(data); };
  const fetchPosts = async () => { const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }); if (data) setPosts(data); };
  const fetchBanners = async () => { const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false }); if (data) setBanners(data); };
  const fetchCategories = async () => { const { data } = await supabase.from('categories').select('*').order('name'); if (data) setCategories(data); };

  const uploadFilesToStorage = async (files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('gallery').upload(fileName, file);
      if (!error) { const { data } = supabase.storage.from('gallery').getPublicUrl(fileName); urls.push(data.publicUrl); }
    }
    return urls;
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Aktualizacja infrastruktury marki...', type: 'loading' });
    if (editingBrandId) await supabase.from('brands').update(brandForm).eq('id', editingBrandId);
    else await supabase.from('brands').insert([brandForm]);
    setStatus({ message: 'Raport marki zaktualizowany!', type: 'success' });
    setEditingBrandId(null); setIsBrandFormVisible(false); fetchBrands();
  };

  const handleEditBrandClick = (brand: any) => {
    setEditingBrandId(brand.id);
    setBrandForm({
      name: brand.name || '', has_official_importer: brand.has_official_importer || false,
      has_eu_warehouse: brand.has_eu_warehouse || false, aso_network_size: brand.aso_network_size || 'Początkująca (1-10)', global_position: brand.global_position || 'Nowy Startup'
    });
    setIsBrandFormVisible(true);
  };

  const handleDeleteBrand = async (id: number, name: string) => {
    if (!window.confirm(`Usunąć markę "${name}"?`)) return;
    await supabase.from('brands').delete().eq('id', id); fetchBrands();
  };

  const handleCarGalleryUpload = async () => {
    if (selectedCarFiles.length === 0) return;
    setUploadingImage(true); setStatus({ message: 'Wgrywanie zdjęć...', type: 'loading' });
    const newUrls = await uploadFilesToStorage(selectedCarFiles);
    setCarForm(prev => ({ ...prev, gallery_urls: [...(prev.gallery_urls || []), ...newUrls] }));
    setSelectedCarFiles([]); setUploadingImage(false); setStatus({ message: 'Zdjęcia dodane!', type: 'success' });
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Zapisywanie pojazdu...', type: 'loading' });
    const brandIdToSave = carForm.brand_id ? parseInt(carForm.brand_id) : null;
    const carData = { ...carForm, brand_id: brandIdToSave };
    if (editingCarId) await supabase.from('cars').update(carData).eq('id', editingCarId);
    else await supabase.from('cars').insert([carData]);
    setStatus({ message: 'Pojazd zapisany!', type: 'success' });
    setEditingCarId(null); setCarForm(emptyCarForm); fetchCars(); setActiveTab('katalog_aut');
  };

  const handleEditCarClick = (car: any) => {
    setEditingCarId(car.id);
    setSelectedCarFiles([]);
    setCarForm({
      brand_id: car.brand_id?.toString() || '', model: car.model || '', price_katalog_eur: car.price_katalog_eur?.toString() || '',
      range_real_km: car.range_real_km?.toString() || '', range_wltp_km: car.range_wltp_km?.toString() || '', charge_time_min: car.charge_time_min?.toString() || '',
      architecture: car.architecture || '', drive_type: car.drive_type || 'RWD (Na tył)', power_km: car.power_km?.toString() || '', battery_kwh: car.battery_kwh?.toString() || '',
      warranty_years: car.warranty_years?.toString() || '', warranty_km: car.warranty_km?.toString() || '', warranty_desc: car.warranty_desc || '',
      image_url: car.image_url || '', gallery_urls: car.gallery_urls || [], ncap_stars: car.ncap_stars || 0
    });
    setActiveTab('dodaj_auto');
  };

  const handleDeleteCar = async (id: number, name: string) => {
    if (!window.confirm(`Usunąć pojazd "${name}"?`)) return;
    await supabase.from('cars').delete().eq('id', id); fetchCars();
  };

  const handleFetchFromAPI = async () => {
    if (!carForm.model) return;
    const originalLink = carForm.model;
    setCarForm(prev => ({ ...prev, model: 'Skanowanie...' }));
    setStatus({ message: 'Asystent AI analizuje dane...', type: 'loading' });
    try {
      const response = await fetch('/api/scrape-ev', { method: 'POST', body: JSON.stringify({ model: originalLink }) });
      const data = await response.json();
      setCarForm(prev => ({ ...prev, ...data, model: data.model || originalLink }));
      setStatus({ message: 'Dane techniczne pobrane pomyślnie!', type: 'success' });
    } catch (error: any) { setCarForm(prev => ({ ...prev, model: originalLink })); }
  };

  const handlePostGalleryUpload = async () => {
    if (selectedPostFiles.length === 0) return;
    setUploadingImage(true); setStatus({ message: 'Wgrywanie galerii wpisu...', type: 'loading' });
    const newUrls = await uploadFilesToStorage(selectedPostFiles);
    setPostForm(prev => ({ ...prev, gallery_urls: [...(prev.gallery_urls || []), ...newUrls] }));
    setSelectedPostFiles([]); setUploadingImage(false); setStatus({ message: 'Galeria wgrana!', type: 'success' });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true); setStatus({ message: 'Wgrywanie okładki...', type: 'loading' });
    const urls = await uploadFilesToStorage([e.target.files[0]]);
    if (urls.length > 0) setPostForm(prev => ({ ...prev, cover_image: urls[0] }));
    setUploadingImage(false); setStatus({ message: 'Okładka wgrana!', type: 'success' });
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Zapisywanie artykułu...', type: 'loading' });
    const finalSlug = postForm.slug || postForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const postData = { ...postForm, slug: finalSlug };
    if (editingPostId) await supabase.from('posts').update(postData).eq('id', editingPostId);
    else await supabase.from('posts').insert([postData]);
    setStatus({ message: 'Artykuł zapisany!', type: 'success' });
    setEditingPostId(null); setPostForm(emptyPostForm); setIsPostFormVisible(false); fetchPosts();
  };

  const handleDeletePost = async (id: number, title: string) => {
    if (!window.confirm(`Usunąć artykuł "${title}"?`)) return;
    await supabase.from('posts').delete().eq('id', id); fetchPosts();
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Zapisywanie kategorii...', type: 'loading' });
    if (editingCategoryId) await supabase.from('categories').update(categoryForm).eq('id', editingCategoryId);
    else await supabase.from('categories').insert([categoryForm]);
    setStatus({ message: 'Kategoria zapisana!', type: 'success' });
    setIsCategoryFormVisible(false); fetchCategories();
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Usunąć kategorię "${name}"?`)) return;
    await supabase.from('categories').delete().eq('id', id); fetchCategories();
  };

  const handleBannerMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImage(true); setStatus({ message: 'Wgrywanie pliku media...', type: 'loading' });
    const urls = await uploadFilesToStorage([e.target.files[0]]);
    if (urls.length > 0) setBannerForm(prev => ({ ...prev, media_url: urls[0] }));
    setUploadingImage(false); setStatus({ message: 'Plik wgrany!', type: 'success' });
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: 'Zapisywanie banera...', type: 'loading' });
    if (editingBannerId) await supabase.from('banners').update(bannerForm).eq('id', editingBannerId);
    else await supabase.from('banners').insert([bannerForm]);
    setStatus({ message: 'Baner zapisany!', type: 'success' });
    setIsBannerFormVisible(false); fetchBanners();
  };

  const handleDeleteBanner = async (id: number, title: string) => {
    if (!window.confirm(`Usunąć baner "${title}"?`)) return;
    await supabase.from('banners').delete().eq('id', id); fetchBanners();
  };

  // LOGIKA SORTOWANIA AUT W PANELU
  let adminCars = cars.filter(c => !carFilterBrand || c.brand_id?.toString() === carFilterBrand);
  if (carSortOrder === 'newest') adminCars.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (carSortOrder === 'oldest') adminCars.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (carSortOrder === 'az') adminCars.sort((a, b) => a.model.localeCompare(b.model));
  if (carSortOrder === 'za') adminCars.sort((a, b) => b.model.localeCompare(a.model));

  return (
    <div className="flex h-screen bg-[#f4f6f9] font-sans text-sm text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#232732] text-slate-300 flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-[#1e222d] text-white font-black text-xl">Admin<span className="text-blue-500 font-normal">EV</span></div>
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <div className="mt-2 px-6 text-[10px] font-bold text-slate-500 uppercase mb-2">Baza Pojazdów</div>
          <div onClick={() => setActiveTab('katalog_aut')} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'katalog_aut' ? 'bg-[#2a2f3d] text-white border-l-4 border-blue-500' : 'hover:bg-[#2a2f3d]'}`}>Katalog Aut</div>
          <div onClick={() => { setEditingCarId(null); setCarForm(emptyCarForm); setSelectedCarFiles([]); setActiveTab('dodaj_auto'); }} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'dodaj_auto' ? 'bg-[#2a2f3d] text-white border-l-4 border-emerald-500' : 'hover:bg-[#2a2f3d]'}`}>Dodaj Auto</div>
          <div onClick={() => { setActiveTab('marki'); setIsBrandFormVisible(false); }} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'marki' ? 'bg-[#2a2f3d] text-white border-l-4 border-blue-500' : 'hover:bg-[#2a2f3d]'}`}>Zarządzanie Markami</div>
          <div className="mt-8 px-6 text-[10px] font-bold text-slate-500 uppercase mb-2">Portal / Edukacja</div>
          <div onClick={() => { setActiveTab('blog'); setIsPostFormVisible(false); }} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'blog' ? 'bg-[#2a2f3d] text-white border-l-4 border-purple-500' : 'hover:bg-[#2a2f3d]'}`}>Blog / Artykuły</div>
          <div onClick={() => { setActiveTab('kategorie'); setIsCategoryFormVisible(false); }} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'kategorie' ? 'bg-[#2a2f3d] text-white border-l-4 border-indigo-500' : 'hover:bg-[#2a2f3d]'}`}>Kategorie</div>
          <div onClick={() => { setActiveTab('banery'); setIsBannerFormVisible(false); }} className={`px-6 py-2.5 cursor-pointer ${activeTab === 'banery' ? 'bg-[#2a2f3d] text-white border-l-4 border-amber-500' : 'hover:bg-[#2a2f3d]'}`}>Banery Główne</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="font-bold text-slate-800 text-lg uppercase tracking-tight">{activeTab.replace('_', ' ')}</div>
          <button className="text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded border border-rose-100">Wyloguj</button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto">
            {status.message && (
              <div className={`p-4 mb-6 rounded-lg font-bold shadow-sm ${status.type === 'error' ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-950'}`}>
                {status.message}
              </div>
            )}

            {/* --- ZAKŁADKA: KATALOG AUT (Z SORTOWANIEM) --- */}
            {activeTab === 'katalog_aut' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between mb-6 pb-4 border-b gap-4">
                  <h2 className="text-xl font-black">Lista Pojazdów</h2>
                  <div className="flex gap-2">
                    <select value={carFilterBrand} onChange={(e) => setCarFilterBrand(e.target.value)} className="p-2 border rounded-lg bg-slate-50 text-xs font-bold">
                      <option value="">Wszystkie marki</option>
                      {brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                    <select value={carSortOrder} onChange={(e) => setCarSortOrder(e.target.value)} className="p-2 border rounded-lg bg-blue-50 text-blue-800 text-xs font-bold">
                      <option value="newest">Od Najnowszych (Data dodania)</option>
                      <option value="oldest">Od Najstarszych</option>
                      <option value="az">Alfabetycznie A-Z</option>
                      <option value="za">Alfabetycznie Z-A</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {adminCars.map((car) => {
                    const brand = brands.find(b => b.id === car.brand_id);
                    return (
                      <div key={car.id} className="flex justify-between items-center p-4 border rounded-xl bg-white hover:shadow-md transition">
                        <div className="flex items-center gap-4">
                          {car.image_url ? (
                            <img src={car.image_url} className="w-16 h-10 object-contain rounded bg-slate-50 border" alt=""/>
                          ) : (
                            <div className="w-16 h-10 bg-slate-50 border rounded flex items-center justify-center text-[10px] text-slate-400">Brak</div>
                          )}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blue-600">{brand?.name || 'Bez Marki'}</span>
                            <div className="font-black text-base">{car.model}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditCarClick(car)} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded hover:bg-blue-100">Edytuj</button>
                          <button onClick={() => handleDeleteCar(car.id, car.model)} className="px-4 py-2 bg-rose-50 text-rose-700 font-bold text-xs rounded hover:bg-rose-100">Usuń</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- ZAKŁADKA: DODAJ AUTO --- */}
            {activeTab === 'dodaj_auto' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-200">
                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                  <h2 className="text-xl font-black">{editingCarId ? 'Edycja Pojazdu' : 'Nowe Auto w Katalogu'}</h2>
                  {!editingCarId && <button onClick={handleFetchFromAPI} type="button" className="bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold shadow-md hover:bg-emerald-700">Wczytaj dane z AI</button>}
                </div>
                <form onSubmit={handleSaveCar} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Marka</label>
                      <select required value={carForm.brand_id} onChange={e => setCarForm({...carForm, brand_id: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50">
                        <option value="">Wybierz markę</option>
                        {brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                      </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Model (Link dla AI lub pełna nazwa)</label>
                      <input type="text" required value={carForm.model} onChange={e => setCarForm({...carForm, model: e.target.value})} className="w-full p-3 border rounded-xl" />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-blue-600">Bezpieczeństwo Euro NCAP</label>
                      <select value={carForm.ncap_stars} onChange={e => setCarForm({...carForm, ncap_stars: parseInt(e.target.value)})} className="w-full p-3 border-2 border-blue-100 rounded-xl font-black">
                        <option value="0">Brak testu (0 gwiazdek)</option>
                        <option value="1">⭐</option><option value="2">⭐⭐</option><option value="3">⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="5">⭐⭐⭐⭐⭐</option>
                      </select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Zdjęcie Główne (URL)</label>
                      <input type="text" value={carForm.image_url} onChange={e => setCarForm({...carForm, image_url: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50" />
                    </div>

                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cena EUR</label><input type="number" required value={carForm.price_katalog_eur} onChange={e => setCarForm({...carForm, price_katalog_eur: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bateria kWh</label><input type="number" step="0.1" required value={carForm.battery_kwh} onChange={e => setCarForm({...carForm, battery_kwh: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Zasięg Real (km)</label><input type="number" required value={carForm.range_real_km} onChange={e => setCarForm({...carForm, range_real_km: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Zasięg WLTP (km)</label><input type="number" required value={carForm.range_wltp_km} onChange={e => setCarForm({...carForm, range_wltp_km: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Moc (KM)</label><input type="number" required value={carForm.power_km} onChange={e => setCarForm({...carForm, power_km: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Ładowanie DC (min)</label><input type="number" required value={carForm.charge_time_min} onChange={e => setCarForm({...carForm, charge_time_min: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-emerald-600">Gwarancja Baterii (Lata)</label><input type="number" required value={carForm.warranty_years} onChange={e => setCarForm({...carForm, warranty_years: e.target.value})} className="w-full p-3 border-2 border-emerald-50 rounded-xl font-bold" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-emerald-600">Gwarancja Baterii (KM)</label><input type="number" required value={carForm.warranty_km} onChange={e => setCarForm({...carForm, warranty_km: e.target.value})} className="w-full p-3 border-2 border-emerald-50 rounded-xl font-bold" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Architektura (np. 400V)</label><input type="text" required value={carForm.architecture} onChange={e => setCarForm({...carForm, architecture: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Napęd</label><select value={carForm.drive_type} onChange={e => setCarForm({...carForm, drive_type: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50"><option value="RWD (Na tył)">RWD (Na tył)</option><option value="AWD (4x4)">AWD (4x4)</option><option value="FWD (Na przód)">FWD (Na przód)</option></select></div>
                   </div>

                   <div className="col-span-1 md:col-span-3">
                     <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 mt-2">Opis Dodatkowy (Opcjonalnie)</label>
                     <textarea value={carForm.warranty_desc} onChange={e => setCarForm({...carForm, warranty_desc: e.target.value})} className="w-full p-3 border rounded-xl h-24 resize-none"></textarea>
                   </div>

                   <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                    <label className="block text-[13px] font-bold mb-4">Galeria Zdjęć</label>
                    <div className="flex gap-4 mb-4">
                      <input type="file" multiple accept="image/*" onChange={(e) => setSelectedCarFiles(e.target.files ? Array.from(e.target.files) : [])} className="flex-1 text-sm file:bg-blue-600 file:text-white file:py-2.5 file:px-5 file:rounded-lg file:border-0 cursor-pointer" />
                      {selectedCarFiles.length > 0 && <button type="button" onClick={handleCarGalleryUpload} disabled={uploadingImage} className="bg-blue-700 text-white px-6 rounded-lg font-bold">Wgraj pliki</button>}
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {carForm.gallery_urls?.map((url, i) => (
                        <div key={i} className="relative shrink-0 w-28 h-20 border border-slate-200 rounded-lg bg-white shadow-sm group">
                          <img src={url} className="w-full h-full object-cover rounded-lg p-0.5" alt=""/>
                          <button type="button" onClick={() => setCarForm(p => ({...p, gallery_urls: p.gallery_urls.filter((_, idx)=>idx!==i)}))} className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t">
                    <button type="submit" className="flex-1 bg-[#1e222d] text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 transition">Zapisz Pojazd</button>
                    {editingCarId && <button type="button" onClick={() => { setEditingCarId(null); setActiveTab('katalog_aut'); }} className="px-8 py-4 border-2 rounded-xl font-bold hover:bg-slate-50 transition">Anuluj</button>}
                  </div>
                </form>
              </div>
            )}

            {/* --- ZAKŁADKA: ZARZĄDZANIE MARKAMI --- */}
            {activeTab === 'marki' && (
              <>
                {!isBrandFormVisible ? (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <div>
                        <h2 className="text-xl font-black">Audyt Infrastruktury Marek</h2>
                        <p className="text-xs text-slate-500 mt-1">Zaznacz fakty o producencie. System automatycznie wyliczy bezpieczeństwo zakupu (RV).</p>
                      </div>
                      <button onClick={() => { setEditingBrandId(null); setBrandForm({ name: '', has_official_importer: false, has_eu_warehouse: false, aso_network_size: 'Początkująca (1-10)', global_position: 'Nowy Startup' }); setIsBrandFormVisible(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md hover:bg-blue-700">+ Dodaj Producenta</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {brands.map(brand => (
                        <div key={brand.id} className="p-6 border rounded-2xl bg-white hover:border-blue-300 transition group">
                          <div className="flex justify-between items-start mb-4">
                            <strong className="text-xl font-black text-slate-800">{brand.name}</strong>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditBrandClick(brand)} className="px-4 py-2 bg-slate-50 rounded-lg text-blue-600 font-bold text-xs hover:bg-blue-50 transition">Edytuj</button>
                              <button onClick={() => handleDeleteBrand(brand.id, brand.name)} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-lg hover:bg-rose-100 transition">Usuń</button>
                            </div>
                          </div>
                          <div className="space-y-2 text-[11px] font-bold uppercase tracking-tight text-slate-500">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2"><span>Oficjalny Importer w PL:</span> <span className={brand.has_official_importer ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" : "text-rose-500 bg-rose-50 px-2 py-0.5 rounded"}>{brand.has_official_importer ? "TAK" : "NIE"}</span></div>
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2"><span>Magazyn Części UE:</span> <span className={brand.has_eu_warehouse ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" : "text-rose-500 bg-rose-50 px-2 py-0.5 rounded"}>{brand.has_eu_warehouse ? "TAK" : "NIE"}</span></div>
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2"><span>Rozwój Sieci ASO:</span> <span className="text-blue-600">{brand.aso_network_size}</span></div>
                            <div className="flex justify-between items-center"><span>Pozycja Globalna:</span> <span className="text-slate-800">{brand.global_position}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-blue-500">
                    <h2 className="text-xl font-black mb-8 border-b pb-4">{editingBrandId ? 'Audyt Marki' : 'Nowa Marka w Bazie'}</h2>
                    <form onSubmit={handleSaveBrand} className="space-y-8">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Nazwa Marki</label>
                        <input type="text" required value={brandForm.name} onChange={e => setBrandForm({...brandForm, name: e.target.value})} className="w-full p-4 border rounded-xl text-lg font-black focus:ring-2 focus:ring-blue-500 outline-none" placeholder="np. BYD" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl cursor-pointer border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition">
                              <span className="font-bold text-slate-700">Oficjalny Importer w Polsce?</span>
                              <input type="checkbox" checked={brandForm.has_official_importer} onChange={e => setBrandForm({...brandForm, has_official_importer: e.target.checked})} className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                           </label>
                           <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl cursor-pointer border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition">
                              <span className="font-bold text-slate-700">Magazyn Części w Europie?</span>
                              <input type="checkbox" checked={brandForm.has_eu_warehouse} onChange={e => setBrandForm({...brandForm, has_eu_warehouse: e.target.checked})} className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                           </label>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Rozwój Sieci ASO w Polsce</label>
                            <select value={brandForm.aso_network_size} onChange={e => setBrandForm({...brandForm, aso_network_size: e.target.value})} className="w-full p-4 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                              <option>Brak (sprzedaż online)</option>
                              <option>Początkująca (1-10)</option>
                              <option>Rozwinięta (10-30)</option>
                              <option>Ogólnopolska (30+)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Pozycja Marki na Świecie</label>
                            <select value={brandForm.global_position} onChange={e => setBrandForm({...brandForm, global_position: e.target.value})} className="w-full p-4 border rounded-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                              <option>Nowy Startup (ryzykowny)</option>
                              <option>Ugruntowany Gracz</option>
                              <option>Globalny Gigant (np. BYD, SAIC)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-8 border-t">
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition shadow-lg text-lg">Zapisz Audyt i Przelicz RV</button>
                        <button type="button" onClick={() => setIsBrandFormVisible(false)} className="px-10 py-5 border-2 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition">Anuluj</button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* --- ZAKŁADKA: BLOG / ARTYKUŁY --- */}
            {activeTab === 'blog' && (
              <>
                {!isPostFormVisible ? (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <h2 className="text-xl font-black">Baza Wiedzy (Artykuły)</h2>
                      <button onClick={() => { setEditingPostId(null); setPostForm(emptyPostForm); setIsPostFormVisible(true); }} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md hover:bg-purple-700">+ Nowy Artykuł</button>
                    </div>
                    <div className="space-y-3">
                      {posts.length === 0 ? <p className="text-center py-8 text-slate-500">Brak artykułów.</p> : 
                        posts.map(post => (
                          <div key={post.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition">
                            <div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded mr-2 ${post.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {post.is_published ? 'Opublikowany' : 'Szkic'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded mr-2 bg-indigo-50 text-indigo-700">{post.category || 'Brak kategorii'}</span>
                              <strong className="text-slate-800">{post.title}</strong>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingPostId(post.id); setPostForm(post); setIsPostFormVisible(true); }} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200">Edytuj</button>
                              <button onClick={() => handleDeletePost(post.id, post.title)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100">Usuń</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-purple-200">
                    <h2 className="text-xl font-black mb-8 border-b pb-4">{editingPostId ? 'Edytuj Artykuł' : 'Nowy Artykuł'}</h2>
                    <form onSubmit={handleSavePost} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1"><label className="block text-[11px] font-bold text-slate-500 mb-1">Tytuł Artykułu</label><input type="text" required value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full p-4 border rounded-xl" /></div>
                        
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Kategoria</label>
                          <select required value={postForm.category} onChange={e => setPostForm({...postForm, category: e.target.value})} className="w-full p-4 border rounded-xl bg-slate-50">
                            <option value="">Wybierz kategorię...</option>
                            {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                          </select>
                        </div>
                        
                        <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-500 mb-1">Zajawka (Excerpt)</label><textarea required value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} className="w-full p-4 border rounded-xl bg-slate-50 h-24 resize-none"></textarea></div>
                        
                        <div className="col-span-2 border p-6 rounded-2xl bg-slate-50">
                          <label className="block text-[11px] font-bold text-slate-500 mb-4">Zdjęcie Okładkowe</label>
                          <div className="flex gap-4 items-center">
                            <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingImage} className="text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white cursor-pointer hover:file:bg-purple-700" />
                            {postForm.cover_image && <img src={postForm.cover_image} className="h-16 object-cover rounded border shadow-sm" alt="Okładka" />}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-2">Główna Treść Artykułu</label>
                          <div className="bg-white rounded-xl border border-slate-300 min-h-[400px]">
                            <ReactQuill theme="snow" value={postForm.content} onChange={(val) => setPostForm({...postForm, content: val})} className="h-80 mb-12" />
                          </div>
                        </div>

                        <div className="col-span-2 p-6 border border-dashed rounded-2xl bg-slate-50 mt-4">
                          <label className="block text-[13px] font-bold mb-4">Galeria zdjęć w artykule</label>
                          <div className="flex gap-4 mb-5">
                            <input type="file" multiple accept="image/*" onChange={(e) => setSelectedPostFiles(e.target.files ? Array.from(e.target.files) : [])} className="flex-1 text-sm file:bg-purple-600 file:text-white file:py-2.5 file:px-5 file:rounded-lg file:border-0 cursor-pointer hover:file:bg-purple-700" />
                            {selectedPostFiles.length > 0 && <button type="button" onClick={handlePostGalleryUpload} disabled={uploadingImage} className="px-6 py-2.5 bg-purple-700 text-white font-bold rounded-lg">Wgraj pliki</button>}
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {postForm.gallery_urls?.map((url, idx) => (
                              <div key={idx} className="relative w-28 h-20 bg-white border rounded group"><img src={url} className="w-full h-full object-cover rounded p-0.5" alt=""/><button type="button" onClick={() => setPostForm(p => ({...p, gallery_urls: p.gallery_urls.filter((_, i)=>i!==idx)}))} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity">✕</button></div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6 border-t">
                        <label className="flex items-center gap-3 cursor-pointer font-bold text-emerald-600">
                          <input type="checkbox" checked={postForm.is_published} onChange={e => setPostForm({...postForm, is_published: e.target.checked})} className="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          Publikuj od razu na stronie głównej
                        </label>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setIsPostFormVisible(false)} className="px-8 py-4 border-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Anuluj</button>
                          <button type="submit" className="px-10 py-4 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 shadow-lg">Zapisz Artykuł</button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* --- ZAKŁADKA: KATEGORIE ARTYKUŁÓW --- */}
            {activeTab === 'kategorie' && (
              <>
                {!isCategoryFormVisible ? (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <h2 className="text-xl font-black">Zarządzanie Kategoriami</h2>
                      <button onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '' }); setIsCategoryFormVisible(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md hover:bg-indigo-700">+ Nowa Kategoria</button>
                    </div>
                    <div className="space-y-3">
                      {categories.length === 0 ? <p className="text-center py-8 text-slate-500">Brak kategorii.</p> : 
                        categories.map(category => (
                          <div key={category.id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition">
                            <strong className="text-slate-800 text-lg">{category.name}</strong>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingCategoryId(category.id); setCategoryForm(category); setIsCategoryFormVisible(true); }} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200">Edytuj</button>
                              <button onClick={() => handleDeleteCategory(category.id, category.name)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100">Usuń</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-200">
                    <h2 className="text-xl font-black mb-8 border-b pb-4">{editingCategoryId ? 'Edytuj Kategorię' : 'Nowa Kategoria'}</h2>
                    <form onSubmit={handleSaveCategory} className="space-y-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Nazwa Kategorii</label>
                        <input type="text" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full p-4 border rounded-xl text-lg font-bold" />
                      </div>
                      <div className="flex justify-end gap-4 pt-6 border-t">
                        <button type="button" onClick={() => setIsCategoryFormVisible(false)} className="px-8 py-4 border-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Anuluj</button>
                        <button type="submit" className="px-10 py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg">Zapisz Kategorię</button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* --- ZAKŁADKA: BANERY GŁÓWNE --- */}
            {activeTab === 'banery' && (
              <>
                {!isBannerFormVisible ? (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <h2 className="text-xl font-black">Zarządzanie Banerami (Strona Główna)</h2>
                      <button onClick={() => { setEditingBannerId(null); setBannerForm(emptyBannerForm); setIsBannerFormVisible(true); }} className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-xs font-black shadow-md hover:bg-amber-600">+ Nowy Baner</button>
                    </div>
                    <div className="space-y-4">
                      {banners.length === 0 ? <p className="text-center py-8 text-slate-500">Brak banerów.</p> : 
                        banners.map(banner => (
                          <div key={banner.id} className="flex justify-between items-center p-5 border rounded-2xl hover:bg-slate-50 transition">
                            <div className="flex items-center gap-6">
                              {banner.media_type === 'video' ? (
                                <div className="w-24 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">WIDEO</div>
                              ) : (
                                <img src={banner.media_url} className="w-24 h-16 object-cover rounded-lg bg-slate-100 shadow-sm" alt="Baner" />
                              )}
                              <div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full mr-3 ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                  {banner.is_active ? 'Aktywny' : 'Wyłączony'}
                                </span>
                                <strong className="text-slate-800 text-lg">{banner.title || 'Brak tytułu'}</strong>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingBannerId(banner.id); setBannerForm(banner); setIsBannerFormVisible(true); }} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold hover:bg-slate-200">Edytuj</button>
                              <button onClick={() => handleDeleteBanner(banner.id, banner.title)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100">Usuń</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-200">
                    <h2 className="text-xl font-black mb-8 border-b pb-4">{editingBannerId ? 'Edytuj Baner' : 'Nowy Baner'}</h2>
                    <form onSubmit={handleSaveBanner} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Nazwa robocza (Tytuł widoczny na banerze)</label><input type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full p-4 border rounded-xl text-lg font-bold" /></div>
                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Typ Banera</label><select value={bannerForm.media_type} onChange={e => setBannerForm({...bannerForm, media_type: e.target.value})} className="w-full p-4 border rounded-xl bg-slate-50"><option value="image">Zdjęcie</option><option value="video">Wideo (np. .mp4)</option></select></div>
                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Docelowy Link (Po kliknięciu)</label><input type="text" placeholder="np. /katalog lub https://..." value={bannerForm.target_url} onChange={e => setBannerForm({...bannerForm, target_url: e.target.value})} className="w-full p-4 border rounded-xl" /></div>
                        
                        <div className="col-span-2 border p-6 rounded-2xl bg-slate-50">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-4">Plik Banera (Zdjęcie lub Wideo)</label>
                          <div className="flex gap-4 items-center">
                            <input type="file" accept="image/*,video/*" onChange={handleBannerMediaUpload} disabled={uploadingImage} className="text-sm file:bg-amber-500 file:text-white file:py-2.5 file:px-5 file:rounded-lg file:border-0 cursor-pointer hover:file:bg-amber-600" />
                            {bannerForm.media_url && <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded">✓ Plik wgrany na serwer</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-6 border-t">
                        <label className="flex items-center gap-3 cursor-pointer font-bold text-emerald-600">
                          <input type="checkbox" checked={bannerForm.is_active} onChange={e => setBannerForm({...bannerForm, is_active: e.target.checked})} className="w-6 h-6 rounded border-gray-300 text-emerald-600" />
                          Aktywny (Wyświetlaj w Karuzeli na stronie głównej)
                        </label>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setIsBannerFormVisible(false)} className="px-8 py-4 border-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Anuluj</button>
                          <button type="submit" className="px-10 py-4 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 shadow-lg">Zapisz Baner</button>
                        </div>
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