"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug; 

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- STANY DLA GALERII PEŁNOEKRANOWEJ (LIGHTBOX) ---
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchPostData(slug as string);
    }
  }, [slug]);

  // Obsługa klawiatury dla otwartej galerii
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen || !post?.gallery_urls) return;
      
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') nextImage(e as any);
      if (e.key === 'ArrowLeft') prevImage(e as any);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, post, currentImageIndex]);

  const fetchPostData = async (postSlug: string) => {
    setLoading(true);
    const { data: postData, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', postSlug)
      .single();
    
    if (postData) {
      setPost(postData);
    }
    setLoading(false);
  };

  // --- FUNKCJE STERUJĄCE GALERIĄ ---
  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
    document.body.style.overflow = 'auto'; 
  };

  const nextImage = (e: React.MouseEvent | any) => {
    e?.stopPropagation();
    if (post?.gallery_urls) {
      setCurrentImageIndex((prev) => (prev === post.gallery_urls.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e: React.MouseEvent | any) => {
    e?.stopPropagation();
    if (post?.gallery_urls) {
      setCurrentImageIndex((prev) => (prev === 0 ? post.gallery_urls.length - 1 : prev - 1));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-500 font-bold animate-pulse">Wczytywanie artykułu...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <h1 className="text-3xl font-black text-slate-800 mb-4">Artykuł nie został znaleziony</h1>
        <p className="text-slate-500 mb-8">Prawdopodobnie adres URL jest niepoprawny lub wpis został usunięty.</p>
        <Link href="/" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg">
          Wróć do Bazy Wiedzy
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 pb-20">
      
      {/* PASEK NAWIGACJI - Zmieniony na max-w-6xl */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Wróć do Bazy Wiedzy
          </Link>
          <div className="font-black text-slate-800 tracking-tight">EV<span className="text-blue-600">Report</span></div>
        </div>
      </nav>

      {/* MAIN CONTAINER - Zmieniony na max-w-6xl */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {/* NAGŁÓWEK ARTYKUŁU */}
        <header className="mb-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {post.category && (
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-black uppercase px-4 py-1.5 rounded-full self-start md:self-auto tracking-wider">
                {post.category}
              </span>
            )}
            <span className="text-slate-400 font-bold text-sm uppercase tracking-wider">
              {formattedDate}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-8">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed border-l-4 border-blue-500 pl-6 text-left">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* ZDJĘCIE OKŁADKOWE */}
        {post.cover_image && (
          <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-xl mb-12 bg-slate-100">
            <img 
              src={post.cover_image} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* GŁÓWNA TREŚĆ ARTYKUŁU */}
        <article 
          className="
            w-full max-w-full overflow-hidden break-words
            bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 
            text-lg text-slate-700 leading-relaxed
            [&>h1]:text-4xl [&>h1]:font-black [&>h1]:text-slate-900 [&>h1]:mb-6 [&>h1]:mt-10
            [&>h2]:text-3xl [&>h2]:font-black [&>h2]:text-slate-800 [&>h2]:mb-5 [&>h2]:mt-10
            [&>h3]:text-2xl [&>h3]:font-black [&>h3]:text-slate-800 [&>h3]:mb-4 [&>h3]:mt-8
            [&>p]:mb-6
            [&>ul]:list-disc [&>ul]:ml-8 [&>ul]:mb-6 [&>ul>li]:mb-2
            [&>ol]:list-decimal [&>ol]:ml-8 [&>ol]:mb-6 [&>ol>li]:mb-2
            [&>strong]:text-slate-900 [&>strong]:font-black
            [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:my-8 [&>blockquote]:text-slate-500
            [&>a]:text-blue-600 [&>a]:underline [&>a]:font-bold hover:[&>a]:text-blue-800
            [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-8 [&_img]:w-full [&_img]:object-cover
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* GALERIA ZDJĘĆ POD ARTYKUŁEM */}
        {post.gallery_urls && post.gallery_urls.length > 0 && (
          <section className="mt-16">
            <h3 className="text-2xl font-black text-slate-800 mb-6 px-2">Galeria Zdjęć</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {post.gallery_urls.map((url: string, index: number) => (
                <div 
                  key={index} 
                  onClick={() => openGallery(index)}
                  className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white group cursor-pointer relative"
                >
                  <img 
                    src={url} 
                    alt={`Zdjęcie do artykułu ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors duration-300">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MOCNY BANER CTA POD ARTYKUŁEM */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-12 text-center text-white mt-16 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Teoria za Tobą. Czas na praktykę.</h3>
            <p className="text-slate-300 mb-8 text-lg max-w-xl mx-auto">
              Wiesz już na co zwracać uwagę. Przejdź do naszego interaktywnego katalogu i porównaj parametry techniczne, pakiety gwarancyjne oraz wskaźniki utraty wartości rynkowej (RV) dostępnych w Polsce samochodów.
            </p>
            <Link href="/katalog" className="inline-block bg-blue-600 text-white font-black px-10 py-4 rounded-xl hover:bg-blue-500 transition shadow-lg text-lg hover:scale-105 transform duration-300">
              Przeszukaj Baze Aut
            </Link>
          </div>
        </section>

      </main>

      {/* --- KOMPONENT LIGHTBOX (MODAL) --- */}
      {isGalleryOpen && post.gallery_urls && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 transition-opacity"
          onClick={closeGallery} 
        >
          <button 
            onClick={closeGallery} 
            className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/80 p-2 rounded-full z-50"
            aria-label="Zamknij galerię"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <button 
            onClick={prevImage} 
            className="absolute left-2 md:left-10 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/80 p-3 rounded-full z-50"
            aria-label="Poprzednie zdjęcie"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>

          <img 
            src={post.gallery_urls[currentImageIndex]} 
            alt={`Zdjęcie ${currentImageIndex + 1}`} 
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />

          <button 
            onClick={nextImage} 
            className="absolute right-2 md:right-10 text-white/70 hover:text-white transition-colors bg-black/40 hover:bg-black/80 p-3 rounded-full z-50"
            aria-label="Następne zdjęcie"
          >
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <div className="absolute bottom-6 text-white/70 font-bold tracking-widest text-sm bg-black/60 px-5 py-2 rounded-full z-50">
            {currentImageIndex + 1} / {post.gallery_urls.length}
          </div>
        </div>
      )}
    </div>
  );
}