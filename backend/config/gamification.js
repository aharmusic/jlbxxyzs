// backend/config/gamification.js

const BADGES = {
    FIRST_INVESTMENT: {
      id: 'FIRST_INVESTMENT',
      name: 'First Nugget',
      description: 'Made your first investment!',
      icon: 'fas fa-medal', // Font Awesome class
      criteria: { type: 'transaction_count', transactionType: 'investment', count: 1 }
    },
    FIVE_TRANSACTIONS: {
      id: 'FIVE_TRANSACTIONS',
      name: 'Gold Starter',
      description: 'Completed 5 transactions.',
      icon: 'fas fa-star',
      criteria: { type: 'transaction_count', count: 5 } // Any type of transaction
    },
    PROSPECTOR_50K: {
       id: 'PROSPECTOR_50K',
       name: 'Gold Prospector',
       description: 'Invested over Rs. 50,000 total.',
       icon: 'fas fa-trophy',
       criteria: { type: 'total_investment_amount', amount: 50000 }
    }
    // Add more badges as needed
  };
  
  const CHALLENGES = {
    INVEST_10K_MONTH: {
      id: 'INVEST_10K_MONTH',
      name: 'Monthly Saver',
      description: 'Invest Rs. 10,000 within this calendar month.',
      goal: 10000,
      unit: 'LKR', // 'LKR' or 'grams' or 'count'
      type: 'investment_amount_monthly', // Used to track progress
      reward: '50 Gram Bonus Draw Entry', // Example reward
      duration: 'monthly' // Or 'weekly', 'total'
    },
    INVEST_3_TIMES_WEEK: {
      id: 'INVEST_3_TIMES_WEEK',
      name: 'Weekly Investor',
      description: 'Make 3 investments this week.',
      goal: 3,
      unit: 'count',
      type: 'investment_count_weekly',
      reward: '0.5% Fee Rebate on next investment',
      duration: 'weekly'
    }
    // Add more challenges
  };
  
  // Function to get *currently active* challenges (can be expanded later)
  const getActiveChallenges = () => {
      // For now, return all defined challenges. Later, this could filter by date/season.
      return Object.values(CHALLENGES);
  }
  
  // Function to get all defined badges
  const getAllBadges = () => {
      return Object.values(BADGES);
  }
  
  
  module.exports = { BADGES, CHALLENGES, getActiveChallenges, getAllBadges };