// src/components/LoginModal.jsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext'; // Import modal context hook

// Assume icons are in public
const logoSrc = "/GoldNest.png";
const googleIconSrc = "/google-icon.png"; // Ensure these exist
const appleIconSrc = "/apple-icon.png";   // Ensure these exist

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useModal(); // Get state and close function
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const { data } = await axios.post(`${backendUrl}/api/auth/login`, { email, password }, config);

      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('userToken', data.token);
      setLoading(false);
      closeLoginModal(); // Close modal on success
      router.push('/dashboard'); // Redirect to dashboard

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
      setLoading(false);
    }
  };

  // Placeholder Social Logins
  const handleGoogleSignIn = () => alert("Google Sign-In not implemented yet.");
  const handleAppleSignIn = () => alert("Apple Sign-In not implemented yet.");

  // Prevent rendering if modal is not open
  if (!isLoginModalOpen) {
    return null;
  }

  return (
    // Use classes from styles.css for overlay and modal
    <div id="login-modal" className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={closeLoginModal}>×</button> {/* Close button */}
        <div className="logo">
          <Image src={logoSrc} alt="GoldNest Logo" width={120} height={35} />
        </div>
        <h2>Welcome to GoldNest</h2>
        {error && <p id="login-error" className="error">{error}</p>} {/* Display errors */}

        <form id="login-form" className="form" onSubmit={handleLogin}>
          <label htmlFor="email-or-phone">Email or Phone number</label>
          <input
            type="email" // Changed to email for consistency with backend
            id="email-or-phone"
            name="emailOrPhone"
            placeholder="Email" // Changed placeholder
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="login-password">Password</label>
          <input
            type="password"
            id="login-password"
            name="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
             {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="divider">or</div>
        <button className="social-btn" onClick={handleGoogleSignIn}>
          <Image src={googleIconSrc} alt="Google" width={20} height={20} /> Continue with Google
        </button>
        <button className="social-btn" onClick={handleAppleSignIn}>
          <Image src={appleIconSrc} alt="Apple" width={20} height={20} /> Continue with Apple
        </button>

        <p className="switch-auth">
            {/* Close current modal before navigating */}
            <Link href="/forgot-password" onClick={closeLoginModal}>Forgot password?</Link>
        </p>
        <p className="switch-auth">
          Don’t have an account?{' '}
          {/* Close current modal before navigating */}
           <Link href="/signup" onClick={closeLoginModal}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}