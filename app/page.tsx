'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SolarData {
  maxSunshineHoursPerYear: number;
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  roofSegmentStats?: {
    pitchDegrees: number;
    azimuthDegrees: number;
    areaMeters2: number;
  }[];
}

interface PreviewData {
  address: string;
  lat: number;
  lng: number;
  solarData: {
    solarPotential: SolarData;
  };
  satelliteImageUrl: string;
}

function SolarPreviewContent() {
  const searchParams = useSearchParams();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Check if address is in URL params
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (urlAddress) {
      setAddress(urlAddress);
      fetchSolarData(urlAddress);
    }
  }, [searchParams]);

  const fetchSolarData = async (addr: string) => {
    setLoading(true);
    setError('');
    setPreviewData(null);

    try {
      const response = await fetch('/api/solar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addr }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch solar data');
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      fetchSolarData(address);
    }
  };

  const calculateSavings = (solarData: SolarData) => {
    const sunshineHours = solarData.maxSunshineHoursPerYear;
    const maxPanels = solarData.maxArrayPanelsCount;
    
    // Rough calculations for excitement
    const estimatedSystemSize = (maxPanels * 0.4); // 400W panels = 0.4 kW each
    const annualProduction = estimatedSystemSize * sunshineHours * 0.85; // 85% efficiency
    const monthlySavings = Math.round((annualProduction / 12) * 0.12); // $0.12/kWh
    const annualSavings = monthlySavings * 12;
    const savings25Year = Math.round(annualSavings * 25 * 1.03); // 3% escalation
    
    return {
      monthlySavings,
      annualSavings,
      savings25Year,
      systemSize: estimatedSystemSize.toFixed(1),
      co2Offset: Math.round(estimatedSystemSize * 1.5), // tons/year
    };
  };

  // If no data yet, show address input form
  if (!previewData && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              Your Solar Future
            </h1>
            <p className="text-secondary text-lg">
              See what solar can do for your home
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <label htmlFor="address" className="block text-sm font-medium mb-2">
                Enter Your Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Phoenix, AZ"
                className="w-full bg-transparent border border-border rounded-lg p-4 text-white"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full text-xl py-6"
            >
              ☀️ See Your Solar Potential
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl text-secondary">Analyzing your roof...</p>
        </div>
      </div>
    );
  }

  // Preview data loaded - show solar preview
  if (previewData) {
    const solarPotential = previewData.solarData.solarPotential;
    const savings = calculateSavings(solarPotential);
    const sunshineHours = solarPotential.maxSunshineHoursPerYear;
    
    // Determine quality category
    let quality = 'good';
    let qualityEmoji = '✅';
    let qualityColor = '#3b82f6';
    
    if (sunshineHours >= 1400) {
      quality = 'excellent';
      qualityEmoji = '⭐';
      qualityColor = '#10b981';
    } else if (sunshineHours >= 1350) {
      quality = 'great';
      qualityEmoji = '🌟';
      qualityColor = '#10b981';
    } else if (sunshineHours >= 1300) {
      quality = 'good';
      qualityEmoji = '✅';
      qualityColor = '#3b82f6';
    } else {
      quality = 'solid';
      qualityEmoji = '⚠️';
      qualityColor = '#f59e0b';
    }

    return (
      <div className="min-h-screen p-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-3xl font-bold mb-2 gradient-text">
              Your Solar Preview
            </h1>
            <p className="text-secondary">{previewData.address}</p>
          </div>

          {/* Satellite Image */}
          <div className="card overflow-hidden">
            <img 
              src={previewData.satelliteImageUrl} 
              alt="Your Roof" 
              className="w-full rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-accent font-bold text-lg">📍 Your Roof from Space</p>
              <p className="text-sm text-secondary mt-1">This is where your solar panels will go!</p>
            </div>
          </div>

          {/* Solar Quality Badge */}
          <div className="stat-card text-center">
            <div className="text-6xl mb-3">{qualityEmoji}</div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: qualityColor }}>
              {quality.toUpperCase()} Solar Location
            </h2>
            <p className="text-secondary text-lg">
              {sunshineHours.toLocaleString()} sunshine hours per year
            </p>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <div className="text-3xl mb-2">☀️</div>
              <div className="text-2xl font-bold text-accent">{savings.systemSize} kW</div>
              <div className="text-sm text-secondary mt-1">System Size</div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-accent">{solarPotential.maxArrayPanelsCount}</div>
              <div className="text-sm text-secondary mt-1">Solar Panels</div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-green-500">${savings.monthlySavings}</div>
              <div className="text-sm text-secondary mt-1">Monthly Savings</div>
            </div>
            
            <div className="card text-center">
              <div className="text-3xl mb-2">🌲</div>
              <div className="text-2xl font-bold text-green-500">{savings.co2Offset}</div>
              <div className="text-sm text-secondary mt-1">Tons CO₂ Saved/Year</div>
            </div>
          </div>

          {/* 25-Year Savings Highlight */}
          <div className="stat-card text-center py-8">
            <p className="text-sm text-secondary uppercase tracking-wide mb-3">25-Year Savings</p>
            <h3 className="text-5xl font-bold gradient-text mb-3">
              ${savings.savings25Year.toLocaleString()}
            </h3>
            <p className="text-secondary text-lg">
              That's like getting a new car... for free!
            </p>
          </div>

          {/* Fun Facts */}
          <div className="card">
            <h3 className="text-xl font-bold mb-4 text-accent">🌍 Environmental Impact</h3>
            <div className="space-y-3 text-secondary">
              <p>✨ Your solar system will offset <span className="text-white font-bold">{savings.co2Offset} tons of CO₂</span> every year</p>
              <p>🌳 That's like planting <span className="text-white font-bold">{savings.co2Offset * 50} trees</span></p>
              <p>🚗 Or taking <span className="text-white font-bold">{Math.round(savings.co2Offset / 4.6)} cars</span> off the road</p>
            </div>
          </div>

          {/* CTA */}
          <div className="card text-center py-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Go Solar?</h3>
            <p className="text-secondary mb-6">
              Your appointment is coming up soon.<br />
              We'll show you exactly how this works!
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:4805551234" className="btn-primary w-full">
                📞 Call Us Now
              </a>
              <p className="text-sm text-secondary">(480) 555-1234</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-secondary pt-6">
            <p>Powered by Happy Solar</p>
            <p className="mt-1">Data from Google Solar API</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SolarPreview() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <SolarPreviewContent />
    </Suspense>
  );
}
