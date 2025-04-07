// src/app/forgot-password/page.jsx
'use client'; // Required for hooks

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Use Link for navigation
import axios from 'axios';
import Navbar from '@/components/Navbar'; // Import shared component
import Footer from '@/components/Footer'; // Import shared component
import { useModal } from '@/contexts/ModalContext'; // Import modal hook for login link

export default function ForgotPasswordPage() {
  const { openLoginModal } = useModal(); // Get modal function
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Add state for phone
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(''); // State to hold the token for demo

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form action
    setMessage('');
    setError('');
    setShowToken('');
    setLoading(true);

    // Validation: Check if at least one field is filled
    if (!email.trim() && !phone.trim()) {
      setError('Please enter your email or phone number.');
      setLoading(false);
      return; // Stop submission if both are empty
    }

    // Hide error instantly if validation passes
    setError('');

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

      // Prepare payload - backend needs updating to accept email OR phone
      const payload = {};
      if (email.trim()) payload.email = email.trim();
      // **Backend needs modification** if you want to use phone number for lookup too.
      // For now, we'll primarily send email if present.
      // You might want to decide on the backend logic:
      // 1. Find by email IF email is provided.
      // 2. Find by phone IF phone is provided AND email is NOT.
      // 3. Handle case where both are provided (prioritize email?).

      // Assuming backend currently only uses email for forgot password:
      if (!payload.email) {
          setError('Email is required for password reset in this demo.'); // Adjust if backend supports phone
          setLoading(false);
          return;
      }


      const { data } = await axios.post(
        `${backendUrl}/api/auth/forgot-password`,
        payload, // Send email (and potentially phone if backend supports)
        config
      );

      setMessage(data.message || 'If an account exists, instructions have been sent.');
      // **** FOR DEMO ONLY: Display the token ****
      if (data.resetToken) {
        setShowToken(data.resetToken);
      }
      // **** END DEMO ONLY ****
      setLoading(false);

    } catch (err) {
      console.error('Forgot Password request error:', err);
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
      setLoading(false);
    }
  };

  // Function to hide error when user types
  const handleInput = (setter) => (e) => {
      setter(e.target.value);
      if (error) {
          setError(''); // Clear error on input
      }
  };

  return (
    <>
      <Navbar /> {/* Use shared Navbar */}

      {/* Main Forgot Password Section - Adapt classes from HTML */}
      <main className="forgot-password-section py-12 md:py-20 bg-gray-50"> {/* Added padding/bg */}
        <div className="forgot-password-container max-w-md mx-auto bg-white p-8 rounded shadow-lg"> {/* Added centering/styling */}
          <h2 className="text-xl md:text-2xl font-bold text-center mb-4">Forgot Password?</h2>
          <p className="instruction-text text-sm text-gray-600 text-center mb-6">
            No worries! Enter your registered email address below. We'll send instructions if we find a matching account.
            {/* Updated text to focus on email based on current backend */}
          </p>

          {/* Display success/token message */}
          {message && <p className="text-green-600 text-center mb-4 text-sm">{message}</p>}
          {showToken && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Demo Reset Token:</strong>
              <span className="block sm:inline break-all ml-2">{showToken}</span>
              <p className="text-xs mt-1">Copy this token and use it in the reset password link/page.</p>
              <p className="text-xs mt-1">
                Example Reset Link: <Link href={`/reset-password/${showToken}`} className="font-medium hover:underline">{`/reset-password/${showToken}`}</Link>
              </p>
            </div>
          )}

          {/* Display error message */}
          {error && <p id="fp-error" className="form-error text-red-500 text-center mb-4 text-sm">{error}</p>}

          {/* Display form only if no success message/token */}
          {!showToken && !message && (
            <form id="forgotPasswordForm" noValidate onSubmit={handleSubmit}>
               {/* Use input-group-fp class if defined in CSS, else default form styling */}
              <div className="input-group-fp space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleInput(setEmail)} // Use React onChange
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    />
                 </div>

                {/* Phone number input (optional based on backend capability) */}
                {/*
                <div>
                    <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700 mb-1">Phone number (Optional)</label>
                    <input
                        type="tel" // Use type 'tel' for phone numbers
                        id="phone-number"
                        name="phoneNumber"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={handleInput(setPhone)} // Use React onChange
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    />
                </div>
                */}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cta-btn forgot-submit-btn w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50" // Added Tailwind classes
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="back-link text-center mt-6 text-sm">
            <span className="text-gray-600">Remembered your password? </span>
            {/* Use button styled as link to trigger modal */}
            <button
              onClick={openLoginModal}
              className="login-btn-link font-bold text-yellow-600 hover:text-yellow-800 focus:outline-none"
            >
              Login
            </button>
          </div>
        </div>
      </main>

      <Footer /> {/* Use shared Footer */}
    </>
  );
}