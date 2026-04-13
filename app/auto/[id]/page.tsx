import Link from 'next/link';

function getCarData(id: string) {
  const allCars = [
    {
      id: 1, brand: "BYD", model: "Seal Excellence", priceRaw: 207000, priceFormatted: "207 000 PLN", rangeReal: 480, rangeWLTP: 520, chargeTime: 26, serviceCostRaw: 1200, serviceCostFormatted: "1 200 PLN", depreciation: "Niskie Ryzyko", depreciationColor: "text-emerald-700 bg-emerald-100", depreciationDesc: "Wysoka wartość rezydualna (bateria Blade).", score: 8.5, drive: "AWD (4x4)", power: "530 KM", accel: "3.8 s", battery: "82.5 kWh", chargingMax: "150 kW DC", boot: "400 l + 53 l Frunk", warranty: "8 lat / 200k km"
    }
  ];
  return allCars.find(c => c.id.toString() === id);
}

export default async function CarReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const car = getCarData(resolvedParams.id);

  if (!car) {
    return (
      <main className="min-h-screen bg-gray-50 p-10 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-4">Nie znaleziono takiego pojazdu.</h1>
        <Link href="/" className="text-blue-600 font-semibold underline">Wróć do katalogu</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-gray-500 font-bold hover:text-gray-900">← Wróć do katalogu</Link>
        <h1 className="text-2xl font-black">{car.brand} {car.model}</h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
           <h2 className="text-2xl font-black mb-8">Specyfikacja Techniczna</h2>
           <p className="font-semibold text-lg text-blue-600">Moc: {car.power} | Zasięg: {car.rangeReal} km | Bateria: {car.battery}</p>
        </div>
      </div>
    </main>
  );
}