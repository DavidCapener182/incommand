'use client';

import React, { useState, useEffect } from 'react';

interface PricingTier {
  name: string;
  multiplier: number;
  minimum: number;
  capacityRange: string;
}

interface CalculationBreakdown {
  capacity: number;
  tier: PricingTier;
  basePrice: number;
  tierPrice: number;
  durationMultiplier: number;
  durationPrice: number;
  days: number;
  perEventPrice: number;
  eventsPerMonth: number;
  monthlyPrice: number;
  annualPrice: number;
}

const EventPricingCalculator: React.FC = () => {
  // User inputs
  const [capacity, setCapacity] = useState<number>(1000);
  const [duration, setDuration] = useState<string>('≤6hr');
  const [days, setDays] = useState<number>(1);
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(2);
  const [basePrice, setBasePrice] = useState<number>(75);
  const [yearlySubscription, setYearlySubscription] = useState<number>(5000);
  const [showSubscription, setShowSubscription] = useState<boolean>(true);

  // Pricing tiers
  const pricingTiers: PricingTier[] = [
    { name: 'Small', multiplier: 1, minimum: 75, capacityRange: '1-999' },
    { name: 'Medium', multiplier: 1.5, minimum: 112.50, capacityRange: '1,000-4,999' },
    { name: 'Large', multiplier: 2.5, minimum: 200, capacityRange: '5,000-19,999' },
    { name: 'Major', multiplier: 7, minimum: 525, capacityRange: '20,000-49,999' },
    { name: 'Mega', multiplier: 15, minimum: 1000, capacityRange: '50,000+' }
  ];

  // Duration multipliers
  const durationMultipliers: { [key: string]: number } = {
    '≤6hr': 1,
    '6–12hr': 1.5,
    '24hr': 2
  };

  // Calculate tier based on capacity
  const getTier = (capacity: number): PricingTier => {
    if (capacity <= 999) return pricingTiers[0];
    if (capacity <= 4999) return pricingTiers[1];
    if (capacity <= 19999) return pricingTiers[2];
    if (capacity <= 49999) return pricingTiers[3];
    return pricingTiers[4];
  };

  // Calculate pricing breakdown
  const calculatePricing = (): CalculationBreakdown => {
    const tier = getTier(capacity);
    const tierPrice = Math.max(basePrice * tier.multiplier, tier.minimum);
    const durationMultiplier = durationMultipliers[duration];
    const durationPrice = tierPrice * durationMultiplier;
    const perEventPrice = durationPrice * days;
    const monthlyPrice = perEventPrice * eventsPerMonth;
    const annualPrice = monthlyPrice * 12;

    return {
      capacity,
      tier,
      basePrice,
      tierPrice,
      durationMultiplier,
      durationPrice,
      days,
      perEventPrice,
      eventsPerMonth,
      monthlyPrice,
      annualPrice
    };
  };

  const breakdown = calculatePricing();
  const monthlySubscriptionPrice = (yearlySubscription / 12) * 1.2;

  const printQuote = () => {
    window.print();
  };

  const exportQuote = () => {
    const data = {
      inputs: {
        capacity,
        duration,
        days,
        eventsPerMonth,
        basePrice
      },
      breakdown,
      subscription: showSubscription ? {
        yearly: yearlySubscription,
        monthly: monthlySubscriptionPrice
      } : null,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incommand-pricing-quote-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white dark:bg-gray-900 print:bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          inCommand Event Pricing Calculator
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Calculate pricing for your events based on capacity, duration, and frequency
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 print:bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Event Details
            </h2>
            
            <div className="space-y-4">
              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter capacity"
                  min="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of attendees
                </p>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="≤6hr">Short Event: ≤6 hours (×1.0)</option>
                  <option value="6–12hr">Half Day: 6-12 hours (×1.5)</option>
                  <option value="24hr">24 Hours: Day + Night Shifts (×2.0)</option>
                </select>
              </div>

              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Multi-day events multiply the daily rate
                </p>
              </div>

              {/* Events per month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Events per Month
                </label>
                <input
                  type="number"
                  value={eventsPerMonth}
                  onChange={(e) => setEventsPerMonth(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>

              {/* Base price (admin configurable) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base Event Price (£)
                </label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(parseFloat(e.target.value) || 75)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Admin configurable base rate
                </p>
              </div>

              {/* Subscription pricing toggle */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showSubscription}
                    onChange={(e) => setShowSubscription(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Subscription Pricing
                  </span>
                </label>
                
                {showSubscription && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Yearly Subscription (£)
                    </label>
                    <input
                      type="number"
                      value={yearlySubscription}
                      onChange={(e) => setYearlySubscription(parseFloat(e.target.value) || 5000)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      min="1"
                      step="0.01"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Per Event Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Per Event
              </h3>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                £{breakdown.perEventPrice.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                {days > 1 ? `£${breakdown.durationPrice.toLocaleString()} × ${days} days` : 'Single day event'}
              </p>
            </div>

            {/* Monthly Card */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Monthly Cost
              </h3>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                £{breakdown.monthlyPrice.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                {eventsPerMonth} events per month
              </p>
            </div>

            {/* Annual Card */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Annual Cost
              </h3>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                £{breakdown.annualPrice.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-300 mt-2">
                {eventsPerMonth * 12} events per year
              </p>
            </div>
          </div>

          {/* Subscription Comparison */}
          {showSubscription && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-4">
                Subscription Alternative
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-300">Yearly Subscription</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    £{yearlySubscription.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 dark:text-orange-400">
                    Save £{(breakdown.annualPrice - yearlySubscription).toLocaleString()} vs per-event
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-300">Monthly Subscription</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    £{monthlySubscriptionPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-500 dark:text-orange-400">
                    Save £{(breakdown.monthlyPrice - monthlySubscriptionPrice).toLocaleString()} vs per-event
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Breakdown Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Calculation Breakdown
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Capacity Tier
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {breakdown.tier.name} ({breakdown.tier.capacityRange})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      ×{breakdown.tier.multiplier} multiplier
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Base Price
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      £{breakdown.basePrice} × {breakdown.tier.multiplier}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      £{breakdown.tierPrice.toLocaleString()} (min £{breakdown.tier.minimum})
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Duration
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {duration === '≤6hr' ? 'Short Event (≤6hr)' : 
                       duration === '6–12hr' ? 'Half Day (6-12hr)' : 
                       'Day + Night Shifts (24hr)'} (×{breakdown.durationMultiplier})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      £{breakdown.durationPrice.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Multi-day
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {breakdown.days} {breakdown.days === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      £{breakdown.perEventPrice.toLocaleString()} per event
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Monthly Total
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {breakdown.eventsPerMonth} events × £{breakdown.perEventPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      £{breakdown.monthlyPrice.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tier Reference */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pricing Tier Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-lg border-2 ${
                    breakdown.tier.name === tier.name
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {tier.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {tier.capacityRange} capacity
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    ×{tier.multiplier} multiplier
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Min: £{tier.minimum}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 print:hidden">
            <button
              onClick={printQuote}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Print Quote
            </button>
            <button
              onClick={exportQuote}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Export Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPricingCalculator; 