// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// --- Transaction Sub-Schema ---
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['investment', 'redemption', 'bonus', 'fee'],
    required: true
  },
  amountGrams: { type: Number, required: true },
  amountLKR: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
  relatedRedemptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Redemption' }
});

// --- Auto Payment Sub-Schema ---
const autoPaymentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'], // Add yearly
    required: true 
  },
  amountLKR: { type: Number, required: true, min: 100 }
});

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String },
  nic: { type: String },
  address: { type: String },
  city: { type: String },
  goldBalanceGrams: { type: Number, required: true, default: 0.0 },
  transactions: [transactionSchema],

  // New automatic payments field
  automaticPayments: {
    type: [autoPaymentSchema],
    default: []
  },

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Gamification
  earnedBadgeIds: {
    type: [String],
    default: []
  },
  challengeProgress: {
    type: Map,
    of: Number,
    default: {}
  }

}, { timestamps: true });

// --- Password Hashing Middleware ---
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Compare Entered Password ---
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- Generate Reset Token ---
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
