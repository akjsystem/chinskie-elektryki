"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function HomePage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  
  // NOWOŚĆ: Stan określający ile artykułów widać na start
  const [visibleCount, setVisibleCount] = useState(6); 

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: bannersData } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    // Pobieramy wszystkie, ale na froncie wyświetlimy tylko "visibleCount"
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
      
    if (bannersData) setBanners(bannersData);
    if (postsData) setPosts(postsData);
    
    setLoading(false);
  };

  const categories = ['Wszystkie', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  const displayedPosts = selectedCategory === 'Wszystkie' 
    ? posts 
    : posts.filter(p => p.category === selectedCategory);

  // Zmienne do obsługi przycisku "Załaduj więcej"
  const postsToShow = displayedPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < displayedPosts.length;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(6); // Resetujemy licznik do 6 przy zmianie kategorii
  };

  const loadMorePosts = () => {
    setVisibleCount(prev => prev + 6); // Dokładamy kolejne 6 wpisów
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      
      {/* GLOBALNA NAWIGACJA */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-slate-800 tracking-tight">
            EV<span className="text-blue-600">Report</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/" className="text-sm font-bold text-blue-600">Baza Wiedzy</Link>
            <Link href="/katalog" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm">
              Katalog Aut
            </Link>
          </div>
        </div>
      </nav>

      {/* INTELIGENTNA KARUZELA BANERÓW */}
      <section className="relative w-full h-[500px] md:h-[600px] bg-[#1e222d] overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold animate-pulse">
            Ładowanie mediów...
          </div>
        ) : banners.length > 0 ? (
          <>
            {banners.map((banner, index) => (
              <div 
                key={banner.id} 
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e222d] via-[#1e222d]/60 to-transparent z-10"></div>
                
                {banner.media_type === 'video' ? (
                  <video 
                    src={banner.media_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={banner.media_url} 
                    alt={banner.title} 
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 px-4 text-center">
                  {banner.title && (
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg max-w-4xl">
                      {banner.title}
                    </h2>
                  )}
                  {banner.target_url && (
                    <Link href={banner.target_url} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-xl text-lg">
                      Sprawdź szczegóły
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {banners.length > 1 && (
              <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
                {banners.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-3 h-3 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-blue-500 w-8' : 'bg-white/50 hover:bg-white'}`}
                    aria-label={`Przejdź do banera ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center px-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">Kupujesz elektryka z Chin?</h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">Poznaj fakty, zignoruj mity. Analizy utraty wartości, testy realnego zasięgu i pełne zestawienia TCO.</p>
              <Link href="/katalog" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-lg text-lg">
                Przejdź do Katalogu
              </Link>
            </div>
          </div>
        )}
      </section>

      <main className="max-w-6xl mx-auto px-4 mt-16">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Najnowsze Wiadomości i Poradniki</h2>
            <p className="text-slate-500 mt-2">Bądź na bieżąco z rynkiem elektromobilności i programami dopłat.</p>
          </div>
        </div>

        {/* INTERAKTYWNY PASEK KATEGORII */}
        {!loading && posts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat as string)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* SIATKA ARTYKUŁÓW */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : displayedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Używamy postsToShow zamiast displayedPosts */}
              {postsToShow.map(post => (
                <article key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
                  
                  <div className="h-56 bg-slate-100 relative overflow-hidden">
                    {post.cover_image ? (
                      <img 
                        src={post.cover_image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">Brak okładki</div>
                    )}
                    
                    {post.category && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-blue-700 text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-sm">
                        {post.category}
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">
                      {new Date(post.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <Link href={`/artykul/${post.slug}`} className="inline-flex items-center text-sm font-black text-blue-600 hover:text-blue-800 transition-colors">
                      Czytaj dalej 
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* PRZYCISK "ZAŁADUJ WIĘCEJ" */}
            {hasMorePosts && (
              <div className="mt-12 text-center">
                <button 
                  onClick={loadMorePosts}
                  className="px-8 py-3.5 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
                >
                  Pokaż więcej wpisów
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Brak artykułów w tej kategorii</h3>
            <p className="text-slate-500">Nie opublikowano jeszcze żadnych wpisów pasujących do tego filtru.</p>
          </div>
        )}

        {/* SEKCJA CALL TO ACTION (CTA) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 md:p-16 text-center text-white mt-20 mb-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black mb-6">Gotowy na analizę konkretnego modelu?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              W naszym katalogu znajdziesz nie tylko suche dane techniczne, ale również wyliczany przez nas unikalny wskaźnik utraty wartości (RV), oparty na zaawansowanej analityce.
            </p>
            <Link href="/katalog" className="inline-block bg-white text-blue-700 font-black px-10 py-4 rounded-xl hover:bg-slate-50 transition shadow-lg text-lg hover:scale-105 transform duration-300">
              Przeszukaj Baze Aut
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}