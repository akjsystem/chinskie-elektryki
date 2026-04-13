export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Nagłówek (Hero Section) */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-24 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
          Chińskie Elektryki <br className="md:hidden" /> Bez Tajemnic
        </h1>
        <p className="text-xl max-w-2xl mx-auto mb-10 text-blue-100">
          Zautomatyzowane recenzje, algorytmiczna analiza utraty wartości i prawdziwe zasięgi. Wybierz świadomie.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-white text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
            Katalog Modeli
          </button>
        </div>
      </section>

      {/* Sekcja: Ostatnio dodane (Mockup zautomatyzowanych danych) */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold">Ostatnio Zaktualizowane</h2>
          <span className="text-sm text-gray-500 hidden md:block">Aktualizacja API: Dzisiaj 04:00</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Przykładowa Karta Samochodu (Później będzie generowana z bazy) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Miejsce na zdjęcie */}
            <div className="h-56 bg-slate-200 flex items-center justify-center relative">
              <span className="text-slate-400 font-medium">Zdjęcie API: BYD Seal</span>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                AWD (4x4)
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">BYD</p>
                  <h3 className="text-2xl font-black leading-tight">Seal Excellence</h3>
                </div>
                <div className="bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center w-12 h-12 rounded-xl font-bold">
                  8.5
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mb-6 pb-4 border-b border-gray-100">Sportowy sedan z innowacyjną baterią Blade.</p>
              
              {/* Parametry z API */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Szacowana cena:</span>
                  <span className="font-bold text-lg">~ 207 000 PLN</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Zasięg (Realny / WLTP):</span>
                  <span className="font-semibold">480 km / <span className="text-gray-400">520 km</span></span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Ładowanie 10-80%:</span>
                  <span className="font-semibold">26 minut</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Algorytm utraty wartości:</span>
                  <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Niskie Ryzyko</span>
                </div>
              </div>
              
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                Pełny raport i koszty
              </button>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}