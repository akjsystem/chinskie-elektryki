import Link from 'next/link';

// Funkcja symulująca bazę danych
function getCarData(id: string) {
  const allCars = [
    {
      id: 1,
      brand: "BYD",
      model: "Seal Excellence",
      priceRaw: 207000,
      priceFormatted: "207 000 PLN",
      rangeReal: 480,
      rangeWLTP: 520,
      chargeTime: 26,
      serviceCostRaw: 1200,
      serviceCostFormatted: "1 200 PLN",
      depreciation: "Niskie Ryzyko",
      depreciationColor: "text-emerald-700 bg-emerald-100",
      depreciationDesc: "Oczekiwana wysoka wartość rezydualna dzięki gwarancji na baterię (8 lat) i technologii Blade.",
      score: 8.5,
      drive: "AWD (4x4)",
      power: "530 KM (390 kW)",
      torque: "670 Nm",
      accel: "3.8 s (0-100 km/h)",
      battery: "82.5 kWh (Netto, LFP Blade)",
      chargingMax: "150 kW DC / 11 kW AC",
      v2l: "Tak (3.3 kW)",
      boot: "400 litrów + 53 litry (Frunk)",
      warranty: "6 lat / 150k km (Pojazd), 8 lat / 200k km (Bateria)"
    }
  ];

  return allCars.find(c => c.id.toString() === id);
}

// ZMIANA: Dodano 'async' i 'Promise', aby współpracowało z Next.js 15
export default async function CarReportPage({ params }: { params: Promise<{ id: string }> }) {
  
  // ZMIANA: Zatrzymujemy kod na ułamek sekundy, aż URL zostanie wczytany ('await')
  const resolvedParams = await params;
  const car = getCarData(resolvedParams.id);

  if (!car) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Nie znaleziono takiego pojazdu.</h1>
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold underline">Wróć do katalogu</Link>
      </main>
    );
  }

  // Obliczenia symulujące algorytmy
  const estDepreciation5Years = Math.round(car.priceRaw * (car.id === 1 ? 0.35 : 0.45));
  const totalService5Years = car.serviceCostRaw * 5;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* Pasek Tytułowy */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-bold">
              ← Wróć
            </Link>
            <div>
              <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">{car.brand}</p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{car.model}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-gray-500 text-xs uppercase font-semibold">Cena katalogowa od</p>
              <p className="text-2xl font-bold text-gray-950">{car.priceFormatted}</p>
            </div>
            <div className="bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl font-black text-xl md:text-2xl shadow-inner border border-emerald-200">
              {car.score}
            </div>
          </div>
        </div>
      </header>

      {/* Główna zawartość raportu */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Lewa kolumna: Zdjęcie */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-200 rounded-3xl h-80 flex items-center justify-center border border-gray-200 shadow-inner">
            <span className="text-slate-500 font-medium">Zdjęcie z API: {car.brand}</span>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Gwarancja fabryczna</h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{car.warranty}</p>
          </div>
        </div>

        {/* Prawa kolumna: Szczegóły */}
        <div className="lg:col-span-2 space-y-10">
          
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-8 tracking-tight">Specyfikacja Techniczna</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
              {[
                { label: "Napęd", value: car.drive },
                { label: "Moc", value: car.power },
                { label: "Przyspieszenie", value: car.accel },
                { label: "Bateria", value: car.battery },
                { label: "Zasięg Prawdziwy", value: `${car.rangeReal} km` },
                { label: "Zasięg WLTP", value: `${car.rangeWLTP} km` },
                { label: "Ładowanie", value: car.chargingMax },
                { label: "Ładowanie 10-80%", value: `${car.chargeTime} minut` },
                { label: "Bagażnik", value: car.boot },
              ].map(item => (
                <div key={item.label} className="border-b border-gray-100 pb-4">
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{item.label}</p>
                  <p className="text-base font-semibold text-gray-950">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-8">
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Algorytmiczna Prognoza TCO (5 lat)</h2>
                <span className={`font-bold px-3 py-1 rounded-full text-xs hidden sm:block ${car.depreciationColor}`}>{car.depreciation}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Przewidywana utrata wartości</p>
                    <p className="text-3xl font-extrabold text-emerald-400">~ {estDepreciation5Years.toLocaleString('pl-PL')} PLN</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{car.depreciationDesc}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Szacunkowy koszt serwisu (5 lat)</p>
                    <p className="text-3xl font-extrabold text-slate-100">~ {totalService5Years.toLocaleString('pl-PL')} PLN</p>
                    <p className="text-xs text-slate-500 mt-2">Przeglądy okresowe wg zaleceń producenta.</p>
                </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}