const User = require('../models/User');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, phone, nic, address, city } = req.body; // Get all fields from body

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (password will be hashed by the pre-save hook in User.js)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone, // Save optional fields too
      nic,
      address,
      city,
      goldBalanceGrams: 0, // Initialize gold balance
    });

    if (user) {
      // Send back user info and token (don't send password back)
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nic: user.nic,
        address: user.address,
        city: user.city,
        goldBalanceGrams: user.goldBalanceGrams,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Server Error during registration' });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nic: user.nic,
        address: user.address,
        city: user.city,
        goldBalanceGrams: user.goldBalanceGrams,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' }); // 401 Unauthorized
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server Error during login' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`User NOT found with hashed token or token expired.`);
      // Send a generic message even if user not found for security
      // In a real app, you wouldn't reveal if the email exists or not
      // For demo, we can be more explicit if needed, but generic is better practice.
      res.setHeader('Content-Type', 'application/json'); // Set header explicitly
      res.status(400).json({ message: 'Invalid or expired reset token.' });       // Alternative for easier demo debugging:
      return;
       // return res.status(404).json({ message: 'User not found' });
    }

    // Get reset token (the unhashed version)
    const resetToken = user.getResetPasswordToken();

    // Save the user document with the hashed token and expiry date
    await user.save({ validateBeforeSave: false }); // Skip validation for this update if needed

    // --- IMPORTANT (DEMO vs REALITY) ---
    // In a real app: Send email with resetToken link: `YOUR_FRONTEND_URL/reset-password/${resetToken}`
    // For this competition demo: Return the token in the response so you can manually use it.
    // **** DO NOT DO THIS IN A PRODUCTION APP ****
    res.status(200).json({
      message: 'Password reset token generated successfully (for demo purposes).',
      resetToken: resetToken, // Sending token back ONLY for demo/testing
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
     // Clear potentially saved token fields if error occurred after generation but before success response
     // This requires finding the user again, which might be complex. Simpler to potentially leave stale data on error.
     // const userWithError = await User.findOne({ email: email.toLowerCase() });
     // if (userWithError) {
     //    userWithError.resetPasswordToken = undefined;
     //    userWithError.resetPasswordExpire = undefined;
     //    await userWithError.save({ validateBeforeSave: false });
     // }
    res.status(500).json({ message: 'Server error during forgot password process.' });
  }
};

// @desc    Handle reset password action
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  const resetToken = req.params.resettoken;
  const { password } = req.body;

  console.log(`--- Reset Password Request Received ---`); // Log start
  console.log(`Received reset token from URL: ${resetToken}`);
  console.log(`Received new password (length): ${password?.length}`); // Check password presence

  if (!password || password.length < 8) {
       console.log("Password validation failed.");
       // **** FIX: ADD JSON RESPONSE HERE ****
       return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
      // Hash the token from the URL *exactly* as it's done in the User model
      const hashedToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');
      console.log(`Hashed token for searching: ${hashedToken}`);

      // Find user by the hashed token & check expiry
      console.log(`Searching for user with token and expiry > ${new Date(Date.now()).toISOString()}`);
      const user = await User.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
          console.log(`User NOT found with hashed token or token expired.`);
          // **** FIX: Ensure JSON is sent ****
          return res.status(400).json({ message: 'Invalid or expired reset token.' });
      }

      // --- User Found ---
      console.log(`User found: ${user.email}`);

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      console.log(`Attempting to save updated user: ${user.email}`);
      await user.save();
      console.log(`User saved successfully: ${user.email}`);

      // **** FIX: Ensure JSON is sent ****
      res.status(200).json({ message: 'Password reset successful.' });

  } catch (error) {
      console.error('!!! Reset Password Controller Error !!!:', error);
      // **** FIX: Ensure JSON is sent ****
      // Send a generic server error message in JSON format
      res.status(500).json({ message: 'Server error during password reset.' });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword }; 