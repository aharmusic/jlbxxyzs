// src/app/dashboard/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import DashboardLayout from './layout'; // Use the layout from the same directory

// --- Helper Functions ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(value || 0);
};
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    try {
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        return 'Invalid Date';
    }
};

// --- Configuration & Simulation Data ---
const SIMULATED_GOLD_PRICE_PER_GRAM_LKR = 11500; // Slightly different price for demo variation
const SIMULATED_GROWTH_NEXT_MONTH = 2.1;
const LIVE_PRICE_TODAY = 323212.22; // Per 10g for display? Needs clarification. Assuming per 10g.
const LIVE_PRICE_PREVIOUS_DAYS = 323212.22; // Keep same for simplicity
const LIVE_PRICE_DATE = "20th March 2025"; // Static date from UI
const LIVE_PRICE_PERCENT_CHANGE = 2.4;

// Simulated Alerts (Match UI Page 25)
const simulatedAlerts = [
    { id: 1, type: 'auto_invest', title: 'Auto Invest is OFF', text: 'Turn it ON to save Rs. 100 daily in gold!', action: 'Enable Auto-Invest' },
    { id: 2, type: 'sign_in', title: 'Sign in notifications', text: 'We have detected a sign in from new device..', action: 'Review' },
];

// Simulated Gamification (Match UI Page 25 - structure)
// In real app, fetch challenge definitions and user progress
const simulatedChallenges = [
    { id: 'c1', name: 'Invest a total of Rs 5,000', goal: 5000, unit: 'Rs' },
    { id: 'c2', name: 'Invest a total of Rs 10,000', goal: 10000, unit: 'Rs' },
    { id: 'c3', name: 'Invest Daily 500 for 10 consecutive days', goal: 10, unit: 'days' },
    { id: 'c4', name: 'Invest a total of Rs 50,000 in 1 month', goal: 50000, unit: 'Rs' },
];


export default function DashboardPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/'); return; // Redirect home if not logged in
      }
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        // Fetch user data (includes balance, transactions etc needed)
        const { data } = await axios.get(`${backendUrl}/api/users/me`, config);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data.");
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.clear(); router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  // --- Calculate Derived Data ---
  const goldBalanceGrams = userData?.goldBalanceGrams ?? 0;
  const transactions = userData?.transactions || [];

  // Calculate Investment Stats
  const investmentTxns = transactions.filter(tx => tx.type === 'investment');
  const totalInvestedLKR = investmentTxns.reduce((sum, tx) => sum + tx.amountLKR, 0);
  const totalInvestedGrams = investmentTxns.reduce((sum, tx) => sum + tx.amountGrams, 0);

  const goldValueLKR = goldBalanceGrams * SIMULATED_GOLD_PRICE_PER_GRAM_LKR;
  const earningsLKR = goldValueLKR - totalInvestedLKR; // Simple calculation based on current value vs total paid
  const profitPercentage = totalInvestedLKR > 0 ? (earningsLKR / totalInvestedLKR) * 100 : 0;
  const avgPurchasePrice = totalInvestedGrams > 0 ? totalInvestedLKR / totalInvestedGrams : 0;

  // Get Last Purchase
  const lastPurchase = investmentTxns?.[0]; // Assuming sorted newest first from backend

  // Calculate Gamification Progress (Simulated - replace with real logic if time)
  const calculateSimulatedProgress = (challenge) => {
      if (challenge.unit === 'Rs') {
          // Simulate progress based on total invested LKR for relevant challenges
          if (challenge.goal <= 50000) { // Match UI example
              return Math.min(totalInvestedLKR, challenge.goal);
          }
      } else if (challenge.unit === 'days') {
          // Simulate based on consecutive days - very hard, use placeholder
          return 3; // Example: 3 out of 10 days done
      }
      return 0; // Default progress
  };

   // Calculate Redemption Progress
   const redemptionProgress10g = Math.min(100, (goldBalanceGrams / 10) * 100);
   const canRedeem5g = (goldBalanceGrams >= 5);


  // --- Render Logic ---
  if (loading) return <DashboardLayout><div className="p-10 text-center">Loading Dashboard...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-10 text-center text-red-500">Error: {error}</div></DashboardLayout>;
  if (!userData) return <DashboardLayout><div className="p-10 text-center">Could not load user data.</div></DashboardLayout>;


  return (
    <DashboardLayout>
      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Row 1: Holdings & Live Price --- */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Your Gold Holdings Card */}
          <section className="bg-white p-5 rounded-xl shadow-md flex flex-col justify-between">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Gold Holdings</h2>
              <div className="flex items-center mb-3">
                 {/* Gold Icon Placeholder */}
                 <span className="text-4xl mr-3 text-yellow-400"><i className="fas fa-coins"></i></span>
                  <div>
                      <p className="text-2xl font-bold text-gray-900">{goldBalanceGrams.toFixed(3)} g</p>
                      <p className="text-sm text-gray-600">{formatCurrency(goldValueLKR)}</p>
                  </div>
              </div>
              <div className="text-sm space-y-1 mb-4">
                  <div className="flex justify-between">
                      <span className="text-gray-500">Overall Profit</span>
                      <span className={`font-medium ${profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(earningsLKR)} ({profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%)
                      </span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500">Avg. Purchase Price</span>
                      <span className="font-medium text-gray-700">{formatCurrency(avgPurchasePrice)} / gram</span>
                  </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs mb-4">
                 <h3 className="font-semibold mb-1 text-gray-700">Overview</h3>
                 <p className="text-gray-600 mb-2">
                      A significance improvement from the past month which helped to maintain your average price. Keep buying at the lowest price to maintain your average price lower. {/* Text from UI */}
                  </p>
                 {lastPurchase && (
                      <p className="text-gray-500">
                          Your last purchase ({formatDate(lastPurchase.date)}): {lastPurchase.amountGrams.toFixed(3)}g ({formatCurrency(lastPurchase.amountLKR)})
                      </p>
                 )}
              </div>
              <Link href="/wallet" className="text-sm font-medium text-yellow-600 hover:underline text-right">
                  Go to Wallet →
              </Link>
          </section>

          {/* Gold Live Price Card */}
          <section className="bg-white p-5 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Gold Live Price</h2>
                   <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">24 Carats</span>
              </div>
              <div className="text-center bg-yellow-400 text-black p-3 rounded-lg mb-4">
                   <p className="text-xs font-medium">Today, {LIVE_PRICE_DATE}</p>
                   <p className="text-2xl font-bold">{formatCurrency(LIVE_PRICE_TODAY)}</p>
                   <p className="text-xs">/ 10g (Example)</p>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-4 px-2">
                   {/* Static previous days */}
                   <span>19th Mar: {formatCurrency(LIVE_PRICE_PREVIOUS_DAYS)}</span>
                   <span>18th Mar: {formatCurrency(LIVE_PRICE_PREVIOUS_DAYS)}</span>
                   <span>17th Mar: {formatCurrency(LIVE_PRICE_PREVIOUS_DAYS)}</span>
              </div>
              <div className="flex items-center justify-center text-sm text-center border-t pt-4">
                 <span className="text-green-600 font-bold mr-2">+{LIVE_PRICE_PERCENT_CHANGE}%</span>
                 <i className="fas fa-arrow-up text-green-600 mr-1"></i>
                 <p className="text-gray-600">Gold prices are rising. Trends suggest a possible increase tomorrow.</p>
              </div>
               <Link href="/market" className="block text-sm font-medium text-yellow-600 hover:underline text-center mt-4">
                   See full history →
               </Link>
          </section>
        </div>

         {/* --- Row 1 Cont'd (Mobile): Call-to-Action Banner --- */}
         {/* Adjusted to fit better in the flow, can be full width below row 1 on large screens */}
         <section className="lg:col-span-3 bg-gradient-to-r from-yellow-400 to-amber-500 p-6 rounded-xl shadow-lg text-center my-6 lg:my-0">
             <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow">
                 Buy your gold now with just 2 clicks!
             </h2>
             <p className="text-sm text-white mb-4 drop-shadow">
                 Trend shows potential growth according to this month. Estimated growth in next month:
                 <span className="font-bold bg-black bg-opacity-20 px-1.5 py-0.5 rounded ml-1">{SIMULATED_GROWTH_NEXT_MONTH}%</span>
             </p>
             <Link href="/invest">
                 <button className="bg-white text-yellow-600 font-bold py-3 px-8 rounded-lg shadow-md hover:bg-gray-100 transition duration-200">
                     Buy Gold
                 </button>
             </Link>
         </section>


        {/* --- Row 2: Gamification, Alerts, Redeem --- */}
        {/* Gamification Progress Card */}
        <section className="bg-white p-5 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Gamification Progress</h2>
            <div className="space-y-4">
                {simulatedChallenges.map(challenge => {
                    const currentProgress = calculateSimulatedProgress(challenge);
                    const progressPercent = Math.min(100, (currentProgress / challenge.goal) * 100);
                    const needed = Math.max(0, challenge.goal - currentProgress);

                    return (
                        <div key={challenge.id}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-700 font-medium">{challenge.name}</span>
                                <span className="text-gray-500">
                                    {needed > 0 ? `${challenge.unit === 'Rs' ? formatCurrency(needed) : needed.toFixed(0)} more` : 'Completed!'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Link href="#rewards" className="block text-sm font-medium text-yellow-600 hover:underline text-right mt-4">
                Go to Rewards → {/* Link target placeholder */}
            </Link>
        </section>

        {/* Alerts Card */}
        <section className="bg-white p-5 rounded-xl shadow-md">
             <h2 className="text-lg font-semibold mb-4 text-gray-800">Alerts</h2>
             <div className="space-y-3">
                 {simulatedAlerts.map(alert => (
                      <div key={alert.id} className="bg-red-50 border border-red-200 p-3 rounded-lg flex justify-between items-center">
                          <div>
                              <p className="text-sm font-semibold text-red-800">{alert.title}</p>
                              <p className="text-xs text-red-700">{alert.text}</p>
                          </div>
                          <button className="text-xs bg-red-200 hover:bg-red-300 text-red-800 font-semibold py-1 px-3 rounded-md whitespace-nowrap">
                              {alert.action}
                          </button>
                      </div>
                 ))}
                 {/* Add sign-in alert styling if needed */}
                  {/* <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex justify-between items-center"> ... </div> */}

             </div>
        </section>

        {/* Redeem Gold Coin Card */}
        <section className="bg-white p-5 rounded-xl shadow-md text-center">
             <h2 className="text-lg font-semibold mb-4 text-gray-800">Redeem Gold Coin</h2>
             {/* Gold Coin Icon */}
             <div className="flex justify-center mb-3">
                  <span className="text-6xl text-yellow-400"><i className="fas fa-coins"></i></span> {/* Larger icon */}
             </div>
              {/* Use progress towards 10g as per text */}
             <p className="text-2xl font-bold text-yellow-600 mb-1">{redemptionProgress10g.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mb-4">
                 You are {(100 - redemptionProgress10g).toFixed(1)}% more to grab a 10g coin
             </p>
              <button disabled={!canRedeem5g} className={`w-full py-2 px-4 rounded font-medium ${!canRedeem5g ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>
                 Redeem 5g Coin {/* Button action depends on 5g availability */}
             </button>
        </section>

      </div>
    </DashboardLayout>
  );
}