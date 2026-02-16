import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    // Step 1: Geocode the address
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
    }

    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const location = geocodeData.results[0].geometry.location;
    const formattedAddress = geocodeData.results[0].formatted_address;
    const lat = location.lat;
    const lng = location.lng;

    // Step 2: Get solar data using Google Solar API
    const solarUrl = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`;

    const solarResponse = await fetch(solarUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!solarResponse.ok) {
      const errorText = await solarResponse.text();
      console.error('[Solar] Error:', errorText);
      return NextResponse.json({ 
        error: 'Solar data not available for this location',
        details: errorText.substring(0, 500) 
      }, { status: solarResponse.status });
    }

    const solarData = await solarResponse.json();

    // Generate Google Maps Static API URL for satellite imagery
    const satelliteImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=600x400&maptype=satellite&key=${apiKey}`;

    return NextResponse.json({
      address: formattedAddress,
      lat,
      lng,
      solarData,
      satelliteImageUrl,
    });

  } catch (error: any) {
    console.error('[Solar] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
