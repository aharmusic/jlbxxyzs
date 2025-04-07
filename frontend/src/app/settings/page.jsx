// src/app/settings/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../dashboard/layout'; // Use the Dashboard layout

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // Default tab
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch initial user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const { data } = await axios.get(`${backendUrl}/api/users/me`, config);
        setUserData(data);
      } catch (err) {
        console.error("Error fetching settings data:", err);
        setError(err.response?.data?.message || "Failed to load user data.");
        if (err.response?.status === 401 || err.response?.status === 404) {
          localStorage.clear();
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router]);

  const handleUserDataUpdate = (updatedData) => {
    setUserData(prevData => ({ ...prevData, ...updatedData }));
    const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const newUserInfo = { ...currentUserInfo, ...updatedData };
    localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
  };

  if (loading) return <DashboardLayout><div className="p-10 text-center">Loading Settings...</div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="p-10 text-center text-red-500">Error: {error}</div></DashboardLayout>;
  if (!userData) return <DashboardLayout><div className="p-10 text-center">Could not load settings.</div></DashboardLayout>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings initialData={userData} onUpdate={handleUserDataUpdate} />;
      case 'payment':
        return <PaymentSettings initialAutoPayments={userData?.automaticPayments || []} onUpdate={handleUserDataUpdate} />;
      case 'security':
        return <SecuritySettings initialData={userData} />;
      case 'account':
        return <AccountSettings />;
      case 'help':
        return <HelpSettings />;
      default:
        return <GeneralSettings initialData={userData} onUpdate={handleUserDataUpdate} />;
    }
  };

  const SettingsTab = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none
                  ${activeTab === id ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      {label}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="settings-container bg-white p-6 md:p-8 rounded-lg shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Settings</h1>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
            <nav className="space-y-2">
              <SettingsTab id="general" label="General Settings" />
              <SettingsTab id="payment" label="Payment Settings" />
              <SettingsTab id="security" label="Security Settings" />
              <SettingsTab id="account" label="Account" />
              <SettingsTab id="help" label="Help" />
            </nav>
          </aside>
          <main className="flex-grow">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

// General Settings Component
const GeneralSettings = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    language: 'English (United States)',
    theme: 'White'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('userToken');
    if (!token) {
      setError('Authentication error.');
      setLoading(false);
      return;
    }

    try {
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const { name, phone, address, city } = formData;
      const { data } = await axios.put(`${backendUrl}/api/users/profile`, { name, phone, address, city }, config);

      setSuccess('Profile updated successfully!');
      onUpdate(data);
      setIsEditing(false);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, name, value, editable = true, type = "text") => (
    <div className="mb-4 grid grid-cols-3 gap-4 items-center">
      <label htmlFor={name} className="text-sm font-medium text-gray-600 col-span-1">{label}</label>
      {isEditing && editable ? (
        <input
          type={type}
          id={name}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="col-span-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
        />
      ) : (
        <p className="col-span-2 text-sm text-gray-800">{value || 'N/A'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-3 mb-5">
        <h2 className="text-xl font-semibold">General Settings</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-sm text-yellow-600 hover:underline">Edit</button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      {renderField('Name', 'name', formData.name, true)}
      {renderField('Email', 'email', formData.email, false)}
      {renderField('Mobile Number', 'phone', formData.phone, true, 'tel')}
      {renderField('Address', 'address', formData.address, true)}
      {renderField('City', 'city', formData.city, true)}
      {renderField('Language', 'language', formData.language, false)}
      {renderField('Theme', 'theme', formData.theme, false)}

      {isEditing && (
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={() => { setIsEditing(false); setError(''); setSuccess(''); }} type="button" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
            Cancel
          </button>
          <button onClick={handleSave} type="button" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

// AutoPaymentForm Component
const AutoPaymentForm = ({ payment, onSave, onCancel, loading }) => {
  const [frequency, setFrequency] = useState(payment?.frequency || 'daily');
  const [amountLKR, setAmountLKR] = useState(payment?.amountLKR || 100);
  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (amountLKR < 100) {
      setFormError('Amount must be at least Rs. 100.');
      return;
    }
    onSave({ _id: payment?._id, frequency, amountLKR });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">{payment ? 'Edit' : 'Add'} Automatic Payment</h3>
        {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label htmlFor="amountLKR" className="block text-sm font-medium text-gray-700">Amount (LKR)</label>
            <input
              type="number"
              id="amountLKR"
              min="100"
              value={amountLKR}
              onChange={(e) => setAmountLKR(Number(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Updated PaymentSettings Component
const PaymentSettings = ({ initialAutoPayments = [], onUpdate }) => {
  const [payments, setPayments] = useState(initialAutoPayments);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSavePayment = async (paymentData) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('userToken');
    if (!token) {
      setError('Auth error.');
      setLoading(false);
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };

    try {
      let updatedPayments;
      if (paymentData._id) {
        const { data: updated } = await axios.put(`${backendUrl}/api/users/autopayments/${paymentData._id}`, paymentData, config);
        updatedPayments = payments.map(p => p._id === updated._id ? updated : p);
      } else {
        const { data: added } = await axios.post(`${backendUrl}/api/users/autopayments`, paymentData, config);
        updatedPayments = [...payments, added];
      }
      setPayments(updatedPayments);
      onUpdate({ automaticPayments: updatedPayments });
      setShowForm(false);
      setEditingPayment(null);
    } catch (err) {
      console.error("Save auto payment error:", err);
      setError(err.response?.data?.message || 'Failed to save payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this automatic payment?")) return;

    setLoading(true);
    setError('');
    const token = localStorage.getItem('userToken');
    if (!token) {
      setError('Auth error.');
      setLoading(false);
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.delete(`${backendUrl}/api/users/autopayments/${id}`, config);
      const updatedPayments = payments.filter(p => p._id !== id);
      setPayments(updatedPayments);
      onUpdate({ automaticPayments: updatedPayments });
    } catch (err) {
      console.error("Delete auto payment error:", err);
      setError(err.response?.data?.message || 'Failed to delete payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPayment(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3 mb-5">Payment Settings</h2>
      <h3 className="text-lg font-medium">Automatic Payments</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <div className="space-y-3 text-sm text-gray-700">
        {payments.length > 0 ? (
          payments.map(p => (
            <div key={p._id} className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="font-medium capitalize">{p.frequency}</p>
                <p className="text-xs text-gray-500">Rs. {p.amountLKR} / {p.frequency.replace('ly', '')}</p>
              </div>
              <div>
                <button onClick={() => handleEditClick(p)} className="text-xs text-blue-600 hover:underline mr-2">Edit</button>
                <button onClick={() => handleDeletePayment(p._id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No automatic payments set up yet.</p>
        )}
      </div>

      <button onClick={handleAddClick} className="text-sm text-yellow-600 hover:underline mt-4">+ Add New Automatic Payment</button>

      {showForm && (
        <AutoPaymentForm
          payment={editingPayment}
          onSave={handleSavePayment}
          onCancel={handleCancelForm}
          loading={loading}
        />
      )}
    </div>
  );
};

// Updated SecuritySettings Component
const SecuritySettings = ({ initialData }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdSuccess, setChangePwdSuccess] = useState('');
  const [is2faOn, setIs2faOn] = useState(false);
  const [isPinOn, setIsPinOn] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwdError('');
    setChangePwdSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePwdError('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setChangePwdError('New password must be at least 8 characters.');
      return;
    }

    setChangePwdLoading(true);
    const token = localStorage.getItem('userToken');
    if (!token) {
      setChangePwdError('Authentication error.');
      setChangePwdLoading(false);
      return;
    }

    try {
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const { data } = await axios.put(
        `${backendUrl}/api/users/change-password`,
        { currentPassword, newPassword },
        config
      );
      setChangePwdSuccess(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error("Change password error:", err);
      setChangePwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleToggle2FA = () => {
    setIs2faOn(!is2faOn);
    alert("2FA setting is simulated for this demo.");
  };

  const handleTogglePIN = () => {
    setIsPinOn(!isPinOn);
    alert("PIN setting is simulated for this demo.");
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold border-b pb-3 mb-5">Security Settings</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="font-medium">Two Step Verification</span>
          <button onClick={handleToggle2FA} className="text-yellow-600 hover:underline">
            {is2faOn ? 'Turn it off' : 'Turn it on'} (Simulated)
          </button>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">PIN Verify</span>
          <button onClick={handleTogglePIN} className="text-yellow-600 hover:underline">
            {isPinOn ? 'Turn it off' : 'Turn it on'} (Simulated)
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Change Password</h3>
        {changePwdError && <p className="text-red-500 text-sm mb-3">{changePwdError}</p>}
        {changePwdSuccess && <p className="text-green-600 text-sm mb-3">{changePwdSuccess}</p>}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newPassword">New Password</label>
            <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
          </div>
          <div className="text-right">
            <button type="submit" disabled={changePwdLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50">
              {changePwdLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Manage Sessions</h3>
        <button className="text-sm text-gray-700 hover:underline block mb-2">Logged in Devices (Simulated)</button>
        <button className="text-sm text-red-600 hover:underline block">Sign out from All Devices (Simulated)</button>
      </div>
    </div>
  );
};

// Account Settings Component
const AccountSettings = () => {
  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone and involves redeeming/liquidating all assets.")) {
      alert("Account deletion initiated (Simulated). In a real app, this would proceed.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3 mb-5">Account Settings</h2>
      <p className="text-sm text-gray-600">Manage your account status.</p>
      <button onClick={handleDeleteAccount} className="px-4 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
        Redeem all the golds and Permanently delete account
      </button>
      <p className="text-xs text-gray-500 mt-2">Note: Account deletion is simulated for this demo.</p>
    </div>
  );
};

// Help Settings Component
const HelpSettings = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold border-b pb-3 mb-5">Help & Support</h2>
    <p className="text-sm text-gray-600">Need assistance? Contact our support team.</p>
    <a href="mailto:support@goldnest.com" className="text-yellow-600 hover:underline">Contact us</a>
  </div>
);