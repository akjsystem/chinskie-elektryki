import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model } = body;

    if (!model || !model.includes('ev-database.org')) {
      return NextResponse.json({ error: 'Wklej pełny link do auta z ev-database.org' }, { status: 400 });
    }

    const response = await fetch(model, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!response.ok) throw new Error('Nie udało się załadować strony');

    const html = await response.text();
    const $ = cheerio.load(html);

    // Pobieramy tylko GŁÓWNE zdjęcie
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';

    $('script, style, nav, footer, img, svg').remove(); 
    let cleanText = $('body').text().replace(/\s+/g, ' ').trim();
    cleanText = cleanText.substring(0, 6000);

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Jesteś precyzyjnym asystentem do wyciągania danych motoryzacyjnych. 
            Przeanalizuj podany tekst ze strony o aucie elektrycznym i zwróć DOKŁADNIE TEN obiekt JSON z wyciągniętymi danymi:
            {
              "model": "czysta nazwa auta, bez zbędnych opisów np. BYD Seal AWD",
              "battery_kwh": "tylko pojemność netto/useable w kWh (same cyfry, kropka zamiast przecinka np. 82.5)",
              "range_real_km": "tylko cyfry, np. 450",
              "range_wltp_km": "tylko cyfry, np. 520",
              "charge_time_min": "czas szybkiego ładowania DC, tylko minuty jako cyfra, np. 26",
              "power_km": "tylko cyfry. Przelicz kW na KM (pomnóż przez 1.36 i zaokrąglij) lub znajdź PS/KM.",
              "drive_type": "Dopasuj do jednej z trzech opcji: 'RWD (Na tył)', 'AWD (4x4)' lub 'FWD (Na przód)'",
              "price_katalog_eur": "Cena katalogowa bazowa dla rynku niemieckiego w EUR. Zwróć same cyfry, np. 45000",
              "architecture": "Architektura napięciowa instalacji auta. Zwróć tekst, np. 400 V lub 800 V",
              "warranty_years": "Okres gwarancji na baterię w latach. Zwróć samą cyfrę, np. 8",
              "warranty_km": "Limit kilometrów dla gwarancji na baterię. Zwróć same cyfry, np. 250000"
            }
            Jeśli nie potrafisz znaleźć jakiejś danej, zostaw puste "". Nie wymyślaj danych.`
          },
          { role: "user", content: cleanText }
        ]
      })
    });

    if (!openAiResponse.ok) throw new Error('Błąd autoryzacji OpenAI API.');

    const aiData = await openAiResponse.json();
    const finalScrapedData = JSON.parse(aiData.choices[0].message.content);
    
    // Dodajemy tylko zdjęcie główne
    finalScrapedData.image_url = imageUrl;

    return NextResponse.json(finalScrapedData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Awaria bota.' }, { status: 500 });
  }
}