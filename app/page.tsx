// NOWA IMPORTOWANA LINIJKA NA SAMEJ GÓRZE
import Link from 'next/link';

export default function Home() {
  // Symulacja bazy danych (bez zmian)
  const cars = [
    {
      id: 1,
      brand: "BYD",
      model: "Seal Excellence",
      price: "~ 207 000 PLN",
      rangeReal: 480,
      rangeWLTP: 520,
      chargeTime: 26,
      serviceCost: "~ 1 200 PLN / rok",
      depreciation: "Niskie Ryzyko",
      depreciationColor: "text-emerald-700 bg-emerald-50",
      score: 8.5,
      drive: "AWD (4x4)",
      desc: "Sportowy sedan z innowacyjną baterią Blade."
    },
    {
      id: 2,
      brand: "MG",
      model: "MG4 XPOWER",
      price: "~ 169 900 PLN",
      rangeReal: 330,
      rangeWLTP: 385,
      chargeTime: 26,
      serviceCost: "~ 950 PLN / rok",
      depreciation: "Średnie Ryzyko",
      depreciationColor: "text-amber-700 bg-amber-50",
      score: 7.8,
      drive: "AWD (4x4)",
      desc: "Elektryczny hot-hatch oferujący niesamowite przyspieszenie w rewelacyjnej cenie."
    },
    {
      id: 3,
      brand: "Zeekr",
      model: "001 Long Range",
      price: "~ 275 000 PLN",
      rangeReal: 540,
      rangeWLTP: 620,
      chargeTime: 28,
      serviceCost: "~ 1 800 PLN / rok",
      depreciation: "Niskie Ryzyko",
      depreciationColor: "text-emerald-700 bg-emerald-50",
      score: 9.1,
      drive: "RWD (Tył)",
      desc: "Luksusowy shooting brake o potężnym zasięgu i genialnym wykończeniu wnętrza."
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Nagłówek (Hero Section) (bez zmian) */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
          Chińskie Elektryki <br className="md:hidden" /> Bez Tajemnic
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-blue-100">
          Zautomatyzowane recenzje, algorytmiczna analiza utraty wartości i prawdziwe zasięgi. Wybierz świadomie.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        {/* Panel Filtrów (bez zmian) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-12">
          <h2 className="text-lg font-bold mb-4">Znajdź model dla siebie</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-semibold mb-1 uppercase">Marka</label>
              <select className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option>Wszystkie marki</option>
                <option>BYD</option>
                <option>MG</option>
                <option>Nio</option>
                <option>Zeekr</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-semibold mb-1 uppercase">Maksymalna Cena</label>
              <select className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option>Dowolna</option>
                <option>do 150 000 PLN</option>
                <option>do 200 000 PLN</option>
                <option>do 250 000 PLN</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-semibold mb-1 uppercase">Napęd</label>
              <select className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option>Wszystkie</option>
                <option>RWD (Na tył)</option>
                <option>AWD (4x4)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">
                Szukaj
              </button>
            </div>

          </div>
        </div>

        {/* Sekcja: Katalog */}
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">Katalog Pojazdów</h2>
          <span className="text-sm text-gray-500 hidden md:block">Znaleziono: {cars.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          
          {cars.map((car) => (
            <div key={car.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
              {/* Miejsce na zdjęcie */}
              <div className="h-52 bg-slate-100 flex items-center justify-center relative border-b border-gray-100">
                <span className="text-slate-400 font-medium">Zdjęcie API: {car.brand} {car.model}</span>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  {car.drive}
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{car.brand}</p>
                    <h3 className="text-xl font-black leading-tight">{car.model}</h3>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center w-10 h-10 rounded-lg font-bold text-sm shadow-sm">
                    {car.score}
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm mb-6 pb-4 border-b border-gray-100 flex-grow">{car.desc}</p>
                
                {/* Parametry z API */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Szacowana cena:</span>
                    <span className="font-bold text-base">{car.price}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Zasięg (Realny / WLTP):</span>
                    <span className="font-semibold">{car.rangeReal} km / <span className="text-gray-400">{car.rangeWLTP} km</span></span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Ładowanie 10-80%:</span>
                    <span className="font-semibold">{car.chargeTime} min</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Koszty serwisu:</span>
                    <span className="font-semibold">{car.serviceCost}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Utrata wartości:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-xs ${car.depreciationColor}`}>
                      {car.depreciation}
                    </span>
                  </div>
                </div>
                
                {/* ZMIANA TUTAJ: <button> zamieniony na <Link> */}
                <Link 
                  href={`/auto/${car.id}`} 
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors mt-auto text-center block"
                >
                  Pełny raport
                </Link>
              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  );
}