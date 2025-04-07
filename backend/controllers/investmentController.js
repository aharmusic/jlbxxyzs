// backend/controllers/investmentController.js
const User = require('../models/User');
const mongoose = require('mongoose');

// --- Configuration (Simulated) ---
const SIMULATED_GOLD_PRICE_PER_GRAM_LKR = 11000; // Example: Rs. 11,000 per gram

// @desc    Make a new investment (with optional auto-payment setup)
// @route   POST /api/investments/invest
// @access  Private (Requires authentication)
const makeInvestment = async (req, res) => {
    const { amountLKR, saveAsAuto, frequency } = req.body;
    const userId = req.user._id;

    // --- Basic Validation ---
    if (!amountLKR || isNaN(amountLKR) || Number(amountLKR) <= 0 || Number(amountLKR) < 100) {
        return res.status(400).json({ message: 'Invalid investment amount (min Rs. 100).' });
    }

    // --- Auto Payment Frequency Validation ---
    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    if (saveAsAuto && (!frequency || !validFrequencies.includes(frequency))) {
        return res.status(400).json({ message: 'Invalid frequency selected for automatic payment.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- Calculation ---
        const amountGrams = Number(amountLKR) / SIMULATED_GOLD_PRICE_PER_GRAM_LKR;

        // --- Update User Document ---
        // 1. Update Gold Balance
        user.goldBalanceGrams += amountGrams;

        // 2. Add Transaction Record
        user.transactions.push({
            type: 'investment',
            amountGrams: amountGrams,
            amountLKR: Number(amountLKR),
            description: `Invested Rs. ${Number(amountLKR).toFixed(2)}`,
        });

        // 3. Save Automatic Payment (if requested and not already existing)
        if (saveAsAuto === true && frequency) {
            const existingAutoPayment = user.automaticPayments.find(
                p => p.frequency === frequency && p.amountLKR === Number(amountLKR)
            );

            if (!existingAutoPayment) {
                user.automaticPayments.push({
                    frequency: frequency,
                    amountLKR: Number(amountLKR)
                });
                console.log(`Auto payment added: ${frequency}, ${amountLKR}`);
            } else {
                console.log(`Auto payment already exists, skipping add: ${frequency}, ${amountLKR}`);
            }
        }

        const updatedUser = await user.save();

        // --- Success Response ---
        res.status(200).json({
            message: `Investment successful! ${saveAsAuto ? `Automatic ${frequency} payment saved.` : ''}`,
            newGoldBalanceGrams: updatedUser.goldBalanceGrams,
            transaction: updatedUser.transactions[updatedUser.transactions.length - 1],
            updatedUserInfo: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                nic: updatedUser.nic,
                address: updatedUser.address,
                city: updatedUser.city,
                goldBalanceGrams: updatedUser.goldBalanceGrams,
                automaticPayments: updatedUser.automaticPayments,
                earnedBadgeIds: updatedUser.earnedBadgeIds,
                challengeProgress: updatedUser.challengeProgress
            }
        });

    } catch (error) {
        console.error('Investment processing error:', error);
        res.status(500).json({ message: 'Server error during investment process.' });
    }
};

module.exports = { makeInvestment };
