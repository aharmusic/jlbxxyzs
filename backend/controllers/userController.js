const User = require('../models/User');
const mongoose = require('mongoose'); // For ObjectId validation
const { getActiveChallenges, getAllBadges } = require('../config/gamification');
const bcrypt = require('bcryptjs');

// @desc    Get current user's profile (incl. transactions, gamification, auto payments)
// @route   GET /api/users/me
// @access  Private
const getUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }
  try {
    const user = req.user;

    const sortedTransactions = user.transactions
      .filter(tx => tx.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const activeChallenges = getActiveChallenges();
    const allBadges = getAllBadges();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      nic: user.nic,
      createdAt: user.createdAt,
      goldBalanceGrams: user.goldBalanceGrams,
      transactions: sortedTransactions,
      automaticPayments: user.automaticPayments || [],
      earnedBadgeIds: user.earnedBadgeIds || [],
      challengeProgress: user.challengeProgress || {},
      gamificationDefs: {
        badges: allBadges,
        challenges: activeChallenges
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server Error getting user profile" });
  }
};

// @desc    Update user profile (subset of fields)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, address, city } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      goldBalanceGrams: updatedUser.goldBalanceGrams,
      nic: updatedUser.nic
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error updating profile' });
  }
};

// @desc    Change user password (when logged in)
// @route   PUT /api/users/change-password
// @access  Private
const changeUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new passwords.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
  }

  try {
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: 'Server Error changing password' });
  }
};

// @desc    Add a new automatic payment setting
// @route   POST /api/users/autopayments
// @access  Private
const addAutoPayment = async (req, res) => {
  const { frequency, amountLKR } = req.body;
  if (!frequency || !amountLKR || !['daily', 'weekly', 'monthly'].includes(frequency) || Number(amountLKR) < 100) {
    return res.status(400).json({ message: 'Invalid frequency or amount (min Rs. 100).' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newPayment = {
      frequency,
      amountLKR: Number(amountLKR)
    };

    user.automaticPayments.push(newPayment);
    await user.save();

    const addedPayment = user.automaticPayments[user.automaticPayments.length - 1];
    res.status(201).json(addedPayment);

  } catch (error) {
    console.error("Error adding auto payment:", error);
    res.status(500).json({ message: 'Server Error adding auto payment' });
  }
};

// @desc    Update an existing automatic payment setting
// @route   PUT /api/users/autopayments/:id
// @access  Private
const updateAutoPayment = async (req, res) => {
  const { id } = req.params;
  const { frequency, amountLKR } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid payment ID format.' });
  }

  if (!frequency || !amountLKR || !['daily', 'weekly', 'monthly'].includes(frequency) || Number(amountLKR) < 100) {
    return res.status(400).json({ message: 'Invalid frequency or amount (min Rs. 100).' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payment = user.automaticPayments.id(id);
    if (!payment) {
      return res.status(404).json({ message: 'Automatic payment setting not found.' });
    }

    payment.frequency = frequency;
    payment.amountLKR = Number(amountLKR);

    await user.save();
    res.json(payment);

  } catch (error) {
    console.error("Error updating auto payment:", error);
    res.status(500).json({ message: 'Server Error updating auto payment' });
  }
};

// @desc    Delete an automatic payment setting
// @route   DELETE /api/users/autopayments/:id
// @access  Private
const deleteAutoPayment = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid payment ID format.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const payment = user.automaticPayments.id(id);
    if (!payment) {
      return res.status(404).json({ message: 'Automatic payment setting not found.' });
    }

    payment.remove();
    await user.save();

    res.json({ message: 'Automatic payment deleted successfully.', deletedId: id });

  } catch (error) {
    console.error("Error deleting auto payment:", error);
    res.status(500).json({ message: 'Server Error deleting auto payment' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  addAutoPayment,
  updateAutoPayment,
  deleteAutoPayment
};
