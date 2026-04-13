import Link from 'next/link';

// Ta funkcja symuluje pobieranie jednego konkretnego auta z bazy Supabase na podstawie ID z adresu URL
function getCarData(id: string) {
  // Rozbudowana symulacja bazy danych dla strony raportu
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
      depreciationDesc: "Oczekiwana wysoka wartość rezydualna dzięki gwarancji na baterię (8 lat) i technologii Blade Battery.",
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
    },
    // Możesz dodać więcej aut tutaj w przyszłości
  ];

  // Szukamy auta o pasującym ID
  const car = allCars.find(c => c.id.toString() === id);
  return car;
}

// Główny komponent strony raportu
export default function CarReportPage({ params }: { params: { id: string } }) {
  // Pobieramy dane dla konkretnego ID z adresu URL (np. /auto/1)
  const car = getCarData(params.id);

  // Jeśli nie znaleźliśmy auta o takim ID
  if (!car) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Nie znaleziono takiego pojazdu.</h1>
        <Link href="/" className="text-blue-600 hover:underline">Wróć do katalogu</Link>
      </main>
    );
  }

  // Obliczenia symulujące automatyzację
  const estDepreciation5Years = Math.round(car.priceRaw * (car.id === 1 ? 0.35 : 0.45)); // Symulacja: BYD traci 35%, inne 45%
  const totalService5Years = car.serviceCostRaw * 5;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* Górny pasek nawigacyjny i tytułowy */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition p-2 bg-gray-100 rounded-full">
              ←
            </Link>
            <div>
              <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">{car.brand}</p>
              <h1 className="text-3xl font-black tracking-tight">{car.model}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-gray-500 text-sm">Cena katalogowa od:</p>
              <p className="text-2xl font-bold text-gray-950">{car.priceFormatted}</p>
            </div>
            <div className="bg-emerald-100 text-emerald-900 flex flex-col items-center justify-center w-16 h-16 rounded-2xl font-black text-2xl shadow-inner border border-emerald-200">
              {car.score}
            </div>
          </div>
        </div>
      </header>

      {/* Główna zawartość raportu */}
      <div className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Lewa kolumna: Zdjęcie i Podstawowe Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-100 rounded-3xl h-80 flex items-center justify-center border border-gray-100 shadow-inner">
            <span className="text-slate-400 font-medium">Zdjęcie z API: {car.brand} {car.model}</span>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-xl font-bold mb-4">Gwarancja fabryczna</h3>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{car.warranty}</p>
          </div>
        </div>

        {/* Prawa kolumna: Szczegółowe dane i Analiza */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Sekcja 1: Dane Techniczne (Pobrane z API) */}
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-8 tracking-tight">Specyfikacja Techniczna z API</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
              {[
                { label: "Napęd", value: car.drive },
                { label: "Moc systemowa", value: car.power },
                { label: "Przyspieszenie", value: car.accel },
                { label: "Bateria (Pojemność/Typ)", value: car.battery },
                { label: "Zasięg Prawdziwy (Test)", value: `${car.rangeReal} km` },
                { label: "Zasięg WLTP (Katalog)", value: `${car.rangeWLTP} km` },
                { label: "Ładowanie (Max DC/AC)", value: car.chargingMax },
                { label: "Ładowanie 10-80% (DC)", value: `${car.chargeTime} minut` },
                { label: "Bagażnik (Tył/Przód)", value: car.boot },
              ].map(item => (
                <div key={item.label} className="border-b border-gray-100 pb-4">
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{item.label}</p>
                  <p className="text-base font-semibold text-gray-950">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sekcja 2: Zautomatyzowana Analiza Kosztów (Nasze Algorytmy) */}
          <section className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl">
            <div className="flex justify-between items-start mb-8">
                <h2 className="text-2xl font-black tracking-tight">Algorytmiczna Prognoza TCO (5 lat)</h2>
                <span className={`font-bold px-3 py-1 rounded-full text-xs ${car.depreciationColor}`}>{car.depreciation}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Przewidywana utrata wartości</p>
                    <p className="text-3xl font-extrabold text-emerald-400">~ {estDepreciation5Years.toLocaleString('pl-PL')} PLN</p>
                    <p className="text-xs text-slate-500 mt-2leading-relaxed">{car.depreciationDesc}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Szacunkowy koszt serwisu (5 lat)</p>
                    <p className="text-3xl font-extrabold text-slate-100">~ {totalService5Years.toLocaleString('pl-PL')} PLN</p>
                    <p className="text-xs text-slate-500 mt-2">Zakłada standardowe przeglądy co 1-2 lata/30k km wg. danych producenta.</p>
                </div>
            </div>

            <p className="text-xs text-slate-500 text-center">TCO = Total Cost of Ownership. Powyższe dane są szacunkowe i wyliczane na podstawie algorytmu porównującego parametry techniczne i warunki gwarancji.</p>
          </section>

          {/* Sekcja 3: Zautomatyzowane Podsumowanie (AI Review) */}
          <section className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-6 tracking-tight">Automatyczna Recenzja (Werdykt AI)</h2>
            <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-4">
              <p>
                <strong>{car.brand} {car.model}</strong> w wersji Excellence to obecnie jedna z najciekawszych propozycji w segmencie sportowych sedanów elektrycznych. 
                Jego kluczowym atutem jest rewelacyjny stosunek ceny do oferowanych osiągów ({car.power}).
              </p>
              <p>
                Analiza danych technicznych wykazuje, że zastosowana bateria {car.battery} oferuje solidny prawdziwy zasięg na poziomie {car.rangeReal} km, co czyni go użytecznym autem na co dzień. 
                Również krzywa ładowania (max {car.chargingMax}) pozwala na sprawne podróżowanie.
              </p>
              <p className='bg-blue-50 p-5 rounded-xl border border-blue-100 text-blue-950 font-medium'>
                <strong>Werdykt końcowy:</strong> Ze względu na niskie koszty serwisu ({car.serviceCostFormatted} rocznie) oraz niskie ryzyko utraty wartości, model ten otrzymuje wysoką rekomendację dla osób szukających nowoczesnego elektryka z kompletnym wyposażeniem.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}