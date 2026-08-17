import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DynamicPricingDisplay({ showId }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { apiClient } = useApp();

  useEffect(() => {
    if (!showId) return;
    fetchPricing();

    // Refresh pricing every 30 seconds as demand changes
    const interval = setInterval(fetchPricing, 30000);
    return () => clearInterval(interval);
  }, [showId]);

  const fetchPricing = async () => {
    try {
      const response = await apiClient.get(`/api/pricing/show/${showId}`);
      if (response.data.success) {
        setPricing(response.data.data);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError(null); // Silently fail - don't disrupt UX
    } finally {
      setLoading(false);
    }
  };

  if (loading || !pricing) {
    return null;
  }

  if (error) {
    return null;
  }

  const priceIncrease = pricing.recommendedPrice - pricing.basePrice;
  const percentageIncrease = pricing.basePrice > 0 ? ((priceIncrease / pricing.basePrice) * 100).toFixed(0) : 0;

  const getDemandColor = (level) => {
    switch (level) {
      case 'VERY_HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'NORMAL':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getDemandLabel = (level) => {
    switch (level) {
      case 'VERY_HIGH':
        return '🔥 Very High';
      case 'HIGH':
        return '🔥 High';
      case 'NORMAL':
        return '✓ Normal';
      case 'LOW':
        return '✓ Low';
      default:
        return level;
    }
  };

  // Only show if there's price variation
  if (priceIncrease === 0) {
    return null;
  }

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${getDemandColor(pricing.demandLevel)}`}>
      {/* Price Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Dynamic Pricing Active</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">₹{pricing.recommendedPrice}</span>
            <span className="text-xs font-semibold px-2 py-1 bg-white/70 rounded">
              {percentageIncrease > 0 ? '+' : ''}{percentageIncrease}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={18} />
        </div>
      </div>

      {/* Demand Level */}
      <div className="text-xs space-y-1">
        <p className="font-semibold">{getDemandLabel(pricing.demandLevel)} Demand</p>
        <p className="opacity-90">{pricing.reason}</p>
      </div>

      {/* Occupancy Info */}
      <div className="text-xs space-y-1 border-t border-current/20 pt-2">
        <div className="flex justify-between">
          <span>Occupancy:</span>
          <span className="font-semibold">{pricing.occupancy}%</span>
        </div>
        <div className="flex justify-between">
          <span>Seats Available:</span>
          <span className="font-semibold">{pricing.remainingSeats}</span>
        </div>
      </div>
    </div>
  );
}
