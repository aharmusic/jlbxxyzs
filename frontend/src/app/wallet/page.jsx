// src/app/wallet/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../dashboard/layout'; // Assuming Wallet uses the same layout

// --- Configuration & Simulation Data ---
const SIMULATED_GOLD_PRICE_PER_GRAM_LKR = 11000; // Use this for display consistency
const SIMULATED_GROWTH = 2.1; // %

// Helper Functions (keep formatCurrency, formatDate)
const formatCurrency = (value) => {/* ... */};
const formatDate = (date) => {/* ... */};

export default function WalletPage() {
  // State for fetched data
  const [walletData, setWalletData] = useState(null); // Store all fetched data here
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/'); // Redirect home if not logged in
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const { data } = await axios.get(`${backendUrl}/api/users/me`, config);
        setWalletData(data); // Store the whole response

      } catch (err) {
        console.error("Error fetching wallet data:", err);
        setError(err.response?.data?.message || "Failed to load wallet data.");
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.clear();
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [router]);

  // --- Derived Data Calculations ---
  const userInfo = walletData; // Main user data object
  const transactions = walletData?.transactions || [];
  const allBadges = walletData?.gamificationDefs?.badges || [];
  const activeChallenges = walletData?.gamificationDefs?.challenges || [];
  const earnedBadgeIds = walletData?.earnedBadgeIds || [];
  const challengeProgressMap = walletData?.challengeProgress || {}; // { challengeId: value }

  // Calculate derived values only if userInfo exists
  const goldBalanceGrams = userInfo?.goldBalanceGrams ?? 0;
  const goldValueLKR = goldBalanceGrams * SIMULATED_GOLD_PRICE_PER_GRAM_LKR;
  // Simple placeholder earnings - refine if needed
  const earningsLKR = goldValueLKR * 0.1; // Placeholder

  // Filter transactions for display
  const investmentHistory = transactions.filter(tx => tx.type === 'investment');
  const redemptionHistory = transactions.filter(tx => tx.type === 'redemption'); // Will be empty until redeem implemented

  // Calculate Redemption Progress
  const getRedemptionProgress = (targetGrams) => {
      if (goldBalanceGrams <= 0 || targetGrams <= 0) return 0;
      return Math.min(100, (goldBalanceGrams / targetGrams) * 100);
  };
  const progress10g = getRedemptionProgress(10);
  const progress5g = getRedemptionProgress(5);
  const progress1g = getRedemptionProgress(1);

  // Find earned badges from definitions
   const earnedBadgesDetails = allBadges.filter(badge => earnedBadgeIds.includes(badge.id));

  // --- Render Logic ---
  if (loading) return <DashboardLayout><div className="text-center p-10">Loading Wallet...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="text-center p-10 text-red-500">Error: {error}</div></DashboardLayout>;
  if (!userInfo) return <DashboardLayout><div className="text-center p-10">Could not load user data.</div></DashboardLayout>;


  return (
    <DashboardLayout>
      <div className="wallet-container space-y-8">

        {/* --- Top Overview Section (Uses state variables) --- */}
        <section className="bg-white p-6 rounded-lg shadow-md grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
             <div className="col-span-2 md:col-span-1 border-r pr-4">
                  <h3 className="text-sm text-gray-500 mb-1">Gold Owned</h3>
                  <p className="text-xl font-bold">{goldBalanceGrams.toFixed(3)} grams</p>
                  <p className="text-md text-gray-700">{formatCurrency(goldValueLKR)}</p>
              </div>
              {/* Other overview items... using earningsLKR, SIMULATED_GROWTH */}
              <div className="border-r pr-4 hidden md:block"> {/* Est. Earnings */}
                   <h3 className="text-sm text-gray-500 mb-1">Est. Earnings</h3>
                   <p className="text-xl font-bold text-green-600">{formatCurrency(earningsLKR)}</p>
               </div>
               <div className="border-r pr-4"> {/* Est. Growth */}
                  <h3 className="text-sm text-gray-500 mb-1">Est. Growth (Next Month)</h3>
                   <p className="text-xl font-bold">{SIMULATED_GROWTH}%</p>
               </div>
               <div> {/* Invest Button */}
                 <Link href="/invest" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded text-center block">
                     Invest in GOLD
                  </Link>
               </div>
        </section>

        {/* --- Transaction History (Uses REAL Investment History) --- */}
        <section className="bg-white p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200 text-sm">
                     <thead className="bg-gray-50">
                         <tr>
                            {/* Columns as before */}
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Date</th>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Type</th>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Grams</th>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Value (LKR)</th>
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                         {transactions.length > 0 ? (
                              // Display ALL transactions for now, or filter if needed
                             transactions.map((tx, index) => (
                                 <tr key={tx._id || index}> {/* Use tx._id if available */}
                                     <td className="px-4 py-2 whitespace-nowrap">{formatDate(tx.date)}</td>
                                      <td className="px-4 py-2 whitespace-nowrap capitalize">{tx.type}</td>
                                     <td className={`px-4 py-2 whitespace-nowrap ${tx.type === 'investment' ? 'text-green-600' : 'text-red-600'}`}>
                                         {tx.type === 'investment' ? '+' : '-'}{tx.amountGrams?.toFixed(4)} g
                                     </td>
                                     <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(tx.amountLKR)}</td>
                                 </tr>
                             ))
                         ) : (
                             <tr><td colSpan="4" className="text-center py-4 text-gray-500">No transactions yet.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
        </section>

        {/* --- Redeem Gold Coin (Uses real balance for progress) --- */}
         <section className="bg-white p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold mb-4">Redeem Gold Coin</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {/* 10g Coin Progress */}
                  <div>
                     <h3 className="font-medium mb-2">Progress for 10g Coin</h3>
                     <div className="relative w-24 h-24 mx-auto mb-2 rounded-full border-4 border-gray-200 flex items-center justify-center" style={{background: `conic-gradient(#fbbf24 ${progress10g}%, #e5e7eb ${progress10g}%)`}}>
                         <span className="text-lg font-bold">{progress10g.toFixed(1)}%</span>
                     </div>
                     <button disabled={progress10g < 100} className={`w-full py-2 px-4 rounded text-sm font-medium ${progress10g < 100 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>Redeem 10g</button>
                  </div>
                  {/* 5g Coin Progress */}
                   <div>
                     <h3 className="font-medium mb-2">Progress for 5g Coin</h3>
                     <div className="relative w-24 h-24 mx-auto mb-2 rounded-full border-4 border-gray-200 flex items-center justify-center" style={{background: `conic-gradient(#fbbf24 ${progress5g}%, #e5e7eb ${progress5g}%)`}}>
                         <span className="text-lg font-bold">{progress5g.toFixed(1)}%</span>
                     </div>
                     <button disabled={progress5g < 100} className={`w-full py-2 px-4 rounded text-sm font-medium ${progress5g < 100 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>Redeem 5g</button>
                  </div>
                  {/* 1g Coin Progress */}
                  <div>
                     <h3 className="font-medium mb-2">Progress for 1g Coin</h3>
                     <div className="relative w-24 h-24 mx-auto mb-2 rounded-full border-4 border-gray-200 flex items-center justify-center" style={{background: `conic-gradient(#fbbf24 ${progress1g}%, #e5e7eb ${progress1g}%)`}}>
                         <span className="text-lg font-bold">{progress1g.toFixed(1)}%</span>
                     </div>
                      <button disabled={progress1g < 100} className={`w-full py-2 px-4 rounded text-sm font-medium ${progress1g < 100 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>Redeem 1g</button>
                  </div>
             </div>
         </section>


        {/* --- Redeem History (Uses REAL Redemption History - filtering transactions) --- */}
         <section className="bg-white p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold mb-4">Redeem History</h2>
             <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200 text-sm">
                      {/* ... table head ... */}
                     <thead className="bg-gray-50">
                         <tr>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Date</th>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Grams Redeemed</th>
                             <th className="px-4 py-2 text-left font-medium text-gray-500 tracking-wider">Fees/Charges (LKR)</th>
                             {/* Add other relevant columns */}
                         </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                         {redemptionHistory.length > 0 ? (
                             redemptionHistory.map((tx, index) => (
                                 <tr key={tx._id || index}>
                                     <td className="px-4 py-2 whitespace-nowrap">{formatDate(tx.date)}</td>
                                     <td className="px-4 py-2 whitespace-nowrap">{tx.amountGrams?.toFixed(4)} g</td>
                                     <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(tx.amountLKR - (tx.amountGrams * SIMULATED_GOLD_PRICE_PER_GRAM_LKR))} {/* Estimate fees */}</td>
                                     {/* Add other cells */}
                                 </tr>
                             ))
                         ) : (
                             <tr><td colSpan="3" className="text-center py-4 text-gray-500">No redemption history yet.</td></tr>
                         )}
                     </tbody>
                 </table>
             </div>
         </section>

        {/* --- Gamifications & Rewards (Display based on definitions, simulate progress) --- */}
        <section className="bg-white p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold mb-4">Gamifications & Rewards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Your Stars/Badges */}
                   <div>
                       <h3 className="font-medium mb-3 text-lg">Your Badges</h3>
                       {earnedBadgesDetails.length > 0 ? (
                            <div className="flex flex-wrap gap-4 items-center text-center">
                                 {earnedBadgesDetails.map((badge, index) => (
                                    <div key={index} className="flex flex-col items-center p-2 border rounded-md w-24">
                                         <span className={`text-3xl mb-1 text-yellow-500`}> {/* Basic color */}
                                             <i className={badge.icon || 'fas fa-certificate'}></i> {/* Use badge icon */}
                                         </span>
                                         <p className="text-xs font-semibold">{badge.name}</p>
                                         <p className="text-xs text-gray-500" title={badge.description}>Earned!</p> {/* Simple indicator */}
                                    </div>
                                ))}
                            </div>
                       ) : (
                            <p className="text-sm text-gray-500">Start investing to earn badges!</p>
                       )}
                   </div>
                   {/* Challenges */}
                   <div>
                       <h3 className="font-medium mb-3 text-lg">Active Challenges</h3>
                        {activeChallenges.length > 0 ? (
                           <div className="space-y-4">
                                {activeChallenges.map((challenge, index) => {
                                    // *** SIMULATE progress based on fetched data ***
                                    let currentProgressValue = challengeProgressMap[challenge.id] || 0; // Get saved progress or 0
                                    // OR, for demo, calculate based on current data:
                                    if (challenge.type === 'investment_amount_monthly') { // Example simulation
                                        // Note: This requires more complex backend logic for real tracking
                                        currentProgressValue = transactions
                                            .filter(t => t.type === 'investment' /* && t.date is in current month */)
                                            .reduce((sum, t) => sum + t.amountLKR, 0);
                                    } else if (challenge.type === 'investment_count_weekly') {
                                        currentProgressValue = transactions
                                             .filter(t => t.type === 'investment' /* && t.date is in current week */).length;
                                    }
                                     // Use the LARGER of the stored progress or the simulation for display
                                     currentProgressValue = Math.max(challengeProgressMap[challenge.id] || 0, currentProgressValue);


                                    const goal = challenge.goal;
                                    const progressPercent = Math.min(100, (currentProgressValue / goal) * 100);
                                    const needed = Math.max(0, goal - currentProgressValue);

                                   return (
                                   <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                           <span className="font-medium">{challenge.name}</span>
                                           <span className="text-gray-500">
                                                {needed > 0 ? `${challenge.unit === 'LKR' ? formatCurrency(needed) : needed.toFixed(0)} more` : 'Completed!'}
                                           </span>
                                       </div>
                                       {/* Progress Bar */}
                                       <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1" title={challenge.description}>Reward: {challenge.reward}</p>
                                   </div>
                                   );
                               })}
                           </div>
                        ) : (
                            <p className="text-sm text-gray-500">No active challenges right now.</p>
                        )}
                   </div>
               </div>
        </section>

      </div>
    </DashboardLayout>
  );
}