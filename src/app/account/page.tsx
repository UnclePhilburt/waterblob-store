'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import styles from './account.module.css';

/* ==========================================================================
   Types
   ========================================================================== */

interface Order {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

interface Address {
  id: number;
  label: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface ProfileData {
  name: string;
  phone: string;
  organization: string;
  email: string;
}

interface AccountStats {
  ordersCount: number;
  totalSpent: number;
  memberSince: string;
}

const EMPTY_ADDRESS: Omit<Address, 'id'> = {
  label: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  isDefault: false,
};

/* ==========================================================================
   Helpers
   ========================================================================== */

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || '?';
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'paid') return styles.orderStatusPaid;
  if (s === 'pending') return styles.orderStatusPending;
  if (s === 'shipped') return styles.orderStatusShipped;
  if (s === 'delivered') return styles.orderStatusDelivered;
  if (s === 'cancelled') return styles.orderStatusCancelled;
  if (s === 'refunded') return styles.orderStatusRefunded;
  return styles.orderStatusDefault;
}

/* ==========================================================================
   Account Page
   ========================================================================== */

export default function AccountPage() {
  const { token, customer, isLoggedIn, login, logout } = useAuth();

  /* ----- Auth state ----- */
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  /* ----- Dashboard state ----- */
  const [dashTab, setDashTab] = useState<'profile' | 'orders' | 'addresses'>('profile');
  const [verifying, setVerifying] = useState(true);

  /* Profile */
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    phone: '',
    organization: '',
    email: '',
  });
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  /* Password */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* Stats */
  const [stats, setStats] = useState<AccountStats>({
    ordersCount: 0,
    totalSpent: 0,
    memberSince: '',
  });

  /* Orders */
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  /* Addresses */
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressError, setAddressError] = useState('');
  const [addressSaving, setAddressSaving] = useState(false);

  /* ----- Session verification on mount ----- */
  useEffect(() => {
    async function verifySession() {
      const storedToken = localStorage.getItem('customerToken');
      if (!storedToken) {
        setVerifying(false);
        return;
      }
      try {
        const res = await fetch('/api/customer/verify', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!res.ok) {
          localStorage.removeItem('customerToken');
          localStorage.removeItem('customerData');
        }
      } catch {
        // network error — keep existing state
      } finally {
        setVerifying(false);
      }
    }
    verifySession();
  }, []);

  /* ----- Load profile data when logged in ----- */
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setProfile({
      name: customer?.name || '',
      phone: '',
      organization: '',
      email: customer?.email || '',
    });

    async function fetchProfile() {
      try {
        const res = await fetch('/api/customer/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || customer?.name || '',
            phone: data.phone || '',
            organization: data.organization || '',
            email: data.email || customer?.email || '',
          });
          setStats({
            ordersCount: data.ordersCount ?? 0,
            totalSpent: data.totalSpent ?? 0,
            memberSince: data.memberSince || data.createdAt || '',
          });
        }
      } catch {
        // use what we have from customer object
      }
    }
    fetchProfile();
  }, [isLoggedIn, token, customer]);

  /* ----- Fetch orders ----- */
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/customer/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  /* ----- Fetch addresses ----- */
  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    setAddressesLoading(true);
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.addresses || []);
      }
    } catch {
      // silently fail
    } finally {
      setAddressesLoading(false);
    }
  }, [token]);

  /* Load tab data on switch */
  useEffect(() => {
    if (!isLoggedIn) return;
    if (dashTab === 'orders') fetchOrders();
    if (dashTab === 'addresses') fetchAddresses();
  }, [dashTab, isLoggedIn, fetchOrders, fetchAddresses]);

  /* ====================================================================
     Auth Handlers
     ==================================================================== */

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      login(data.token, data.customer);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError('');
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    setRegLoading(true);
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
          phone: regPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      login(data.token, data.customer);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  }

  /* ====================================================================
     Profile Handlers
     ==================================================================== */

  async function handleProfileUpdate(e: FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          organization: profile.organization,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/customer/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  /* ====================================================================
     Address Handlers
     ==================================================================== */

  function openAddressModal(address?: Address) {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label,
        firstName: address.firstName,
        lastName: address.lastName,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone || '',
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ ...EMPTY_ADDRESS });
    }
    setAddressError('');
    setAddressModalOpen(true);
  }

  function closeAddressModal() {
    setAddressModalOpen(false);
    setEditingAddress(null);
    setAddressError('');
  }

  async function handleAddressSave(e: FormEvent) {
    e.preventDefault();
    setAddressError('');
    setAddressSaving(true);
    try {
      const url = editingAddress
        ? `/api/customer/addresses/${editingAddress.id}`
        : '/api/customer/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save address.');
      }
      closeAddressModal();
      fetchAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleAddressDelete(id: number) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete address.');
      }
      fetchAddresses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete address.');
    }
  }

  /* ====================================================================
     Render
     ==================================================================== */

  if (verifying) {
    return (
      <main className={styles.accountPage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.accountPage}>
      <div className={styles.accountContainer}>
        {!isLoggedIn ? (
          /* ============================================================
             Auth Section
             ============================================================ */
          <div className={styles.authSection}>
            <div className={styles.authContainer}>
              <div className={styles.authHeader}>
                <h1 className={styles.authTitle}>My Account</h1>
                <p className={styles.authSubtitle}>
                  Sign in to manage your orders, profile, and addresses.
                </p>
              </div>

              {/* Auth Tabs */}
              <div className={styles.authTabs}>
                <button
                  className={`${styles.authTab} ${authTab === 'login' ? styles.authTabActive : ''}`}
                  onClick={() => {
                    setAuthTab('login');
                    setRegError('');
                  }}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  className={`${styles.authTab} ${authTab === 'register' ? styles.authTabActive : ''}`}
                  onClick={() => {
                    setAuthTab('register');
                    setLoginError('');
                  }}
                  type="button"
                >
                  Create Account
                </button>
              </div>

              {/* Login Form */}
              <div
                className={`${styles.authForm} ${authTab === 'login' ? styles.authFormActive : ''}`}
              >
                <div className={styles.authFormCard}>
                  {loginError && (
                    <div className={styles.errorMessage} role="alert">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {loginError}
                    </div>
                  )}
                  <form onSubmit={handleLogin} noValidate>
                    <div className={styles.formGroup}>
                      <label htmlFor="login-email" className={styles.formLabel}>
                        Email<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        className={styles.formInput}
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="login-password" className={styles.formLabel}>
                        Password<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        className={styles.formInput}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={loginLoading}
                    >
                      {loginLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Register Form */}
              <div
                className={`${styles.authForm} ${authTab === 'register' ? styles.authFormActive : ''}`}
              >
                <div className={styles.authFormCard}>
                  {regError && (
                    <div className={styles.errorMessage} role="alert">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {regError}
                    </div>
                  )}
                  <form onSubmit={handleRegister} noValidate>
                    <div className={styles.formGroup}>
                      <label htmlFor="reg-name" className={styles.formLabel}>
                        Full Name
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        className={styles.formInput}
                        placeholder="John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="reg-phone" className={styles.formLabel}>
                        Phone
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        className={styles.formInput}
                        placeholder="(555) 555-5555"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="reg-email" className={styles.formLabel}>
                        Email<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        className={styles.formInput}
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="reg-password" className={styles.formLabel}>
                        Password<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        className={styles.formInput}
                        placeholder="Min. 8 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <p className={styles.formHint}>Must be at least 8 characters</p>
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="reg-confirm" className={styles.formLabel}>
                        Confirm Password<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="reg-confirm"
                        type="password"
                        className={styles.formInput}
                        placeholder="Confirm your password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <button
                      type="submit"
                      className={styles.submitBtn}
                      disabled={regLoading}
                    >
                      {regLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             Dashboard Section
             ============================================================ */
          <div className={styles.dashboardSection}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                <span className={styles.profileInitials}>
                  {getInitials(customer?.name)}
                </span>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>
                  {customer?.name || 'Customer'}
                </div>
                <div className={styles.profileEmail}>
                  {customer?.email || ''}
                </div>
              </div>
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={logout}
              >
                Sign Out
              </button>
            </div>

            {/* Dashboard Nav */}
            <div className={styles.dashboardNav}>
              <button
                type="button"
                className={`${styles.dashTab} ${dashTab === 'profile' ? styles.dashTabActive : ''}`}
                onClick={() => setDashTab('profile')}
              >
                Profile
              </button>
              <button
                type="button"
                className={`${styles.dashTab} ${dashTab === 'orders' ? styles.dashTabActive : ''}`}
                onClick={() => setDashTab('orders')}
              >
                Orders
              </button>
              <button
                type="button"
                className={`${styles.dashTab} ${dashTab === 'addresses' ? styles.dashTabActive : ''}`}
                onClick={() => setDashTab('addresses')}
              >
                Addresses
              </button>
            </div>

            {/* ── Profile Tab ── */}
            <div
              className={`${styles.dashContent} ${dashTab === 'profile' ? styles.dashContentActive : ''}`}
            >
              {/* Profile Form */}
              <div className={styles.contentCard}>
                <h2 className={styles.contentCardTitle}>Profile Information</h2>
                {profileSuccess && (
                  <div className={styles.successMessage} role="status">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className={styles.errorMessage} role="alert">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {profileError}
                  </div>
                )}
                <form onSubmit={handleProfileUpdate} noValidate>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="profile-name" className={styles.formLabel}>
                        Full Name
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        className={styles.formInput}
                        value={profile.name}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, name: e.target.value }))
                        }
                        autoComplete="name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="profile-phone" className={styles.formLabel}>
                        Phone
                      </label>
                      <input
                        id="profile-phone"
                        type="tel"
                        className={styles.formInput}
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, phone: e.target.value }))
                        }
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-org" className={styles.formLabel}>
                      Organization
                    </label>
                    <input
                      id="profile-org"
                      type="text"
                      className={styles.formInput}
                      placeholder="Camp, resort, company, etc."
                      value={profile.organization}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, organization: e.target.value }))
                      }
                      autoComplete="organization"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="profile-email" className={styles.formLabel}>
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      className={styles.formInput}
                      value={profile.email}
                      disabled
                    />
                    <p className={styles.formHint}>
                      Contact support to change your email address.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={profileLoading}
                  >
                    {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className={`${styles.contentCard} ${styles.passwordSection}`}>
                <h2 className={styles.contentCardTitle}>Change Password</h2>
                {passwordSuccess && (
                  <div className={styles.successMessage} role="status">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className={styles.errorMessage} role="alert">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {passwordError}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} noValidate>
                  <div className={styles.formGroup}>
                    <label htmlFor="current-password" className={styles.formLabel}>
                      Current Password<span className={styles.formRequired}>*</span>
                    </label>
                    <input
                      id="current-password"
                      type="password"
                      className={styles.formInput}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="new-password" className={styles.formLabel}>
                        New Password<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        className={styles.formInput}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="confirm-new-password" className={styles.formLabel}>
                        Confirm New Password<span className={styles.formRequired}>*</span>
                      </label>
                      <input
                        id="confirm-new-password"
                        type="password"
                        className={styles.formInput}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Account Overview */}
              <div className={styles.contentCard}>
                <h2 className={styles.contentCardTitle}>Account Overview</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>{stats.ordersCount}</div>
                    <div className={styles.statLabel}>Orders</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {formatCurrency(stats.totalSpent)}
                    </div>
                    <div className={styles.statLabel}>Total Spent</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statValue}>
                      {stats.memberSince ? formatDate(stats.memberSince) : '--'}
                    </div>
                    <div className={styles.statLabel}>Member Since</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Orders Tab ── */}
            <div
              className={`${styles.dashContent} ${dashTab === 'orders' ? styles.dashContentActive : ''}`}
            >
              {ordersLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg
                    className={styles.emptyIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <h3 className={styles.emptyTitle}>No orders yet</h3>
                  <p className={styles.emptyText}>
                    When you place your first order, it will appear here. Browse
                    our products to get started.
                  </p>
                  <Link href="/products" className={styles.emptyLink}>
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {orders.map((order) => (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div className={styles.orderMeta}>
                          <span className={styles.orderNumber}>
                            Order #{order.orderNumber}
                          </span>
                          <span className={styles.orderDate}>
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <span
                          className={`${styles.orderStatus} ${getStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className={styles.orderBody}>
                        <ul className={styles.orderItems}>
                          {order.items.map((item) => (
                            <li key={item.id} className={styles.orderItem}>
                              <span>
                                <span className={styles.orderItemName}>
                                  {item.name}
                                </span>
                                <span className={styles.orderItemQty}>
                                  {' '}
                                  x{item.quantity}
                                </span>
                              </span>
                              <span className={styles.orderItemPrice}>
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className={styles.orderTotal}>
                          <span className={styles.orderTotalLabel}>Total</span>
                          <span className={styles.orderTotalValue}>
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Addresses Tab ── */}
            <div
              className={`${styles.dashContent} ${dashTab === 'addresses' ? styles.dashContentActive : ''}`}
            >
              <div className={styles.addressesHeader}>
                <h2 className={styles.addressesTitle}>Saved Addresses</h2>
                <button
                  type="button"
                  className={styles.addAddressBtn}
                  onClick={() => openAddressModal()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Address
                </button>
              </div>

              {addressesLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                </div>
              ) : addresses.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg
                    className={styles.emptyIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <h3 className={styles.emptyTitle}>No saved addresses</h3>
                  <p className={styles.emptyText}>
                    Add a shipping address for faster checkout.
                  </p>
                </div>
              ) : (
                <div className={styles.addressesGrid}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className={styles.addressCard}>
                      <div className={styles.addressCardHeader}>
                        <span className={styles.addressLabel}>
                          {addr.label || 'Address'}
                        </span>
                        {addr.isDefault && (
                          <span className={styles.defaultBadge}>Default</span>
                        )}
                      </div>
                      <div className={styles.addressName}>
                        {addr.firstName} {addr.lastName}
                      </div>
                      <div className={styles.addressLine}>
                        {addr.addressLine1}
                        {addr.addressLine2 && <br />}
                        {addr.addressLine2}
                      </div>
                      <div className={styles.addressLine}>
                        {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                      <div className={styles.addressLine}>{addr.country}</div>
                      {addr.phone && (
                        <div className={styles.addressPhone}>{addr.phone}</div>
                      )}
                      <div className={styles.addressActions}>
                        <button
                          type="button"
                          className={styles.addressEditBtn}
                          onClick={() => openAddressModal(addr)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.addressDeleteBtn}
                          onClick={() => handleAddressDelete(addr.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
         Address Modal
         ============================================================ */}
      {addressModalOpen && (
        <div className={styles.modal} onClick={closeAddressModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={closeAddressModal}
                aria-label="Close modal"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {addressError && (
              <div className={styles.errorMessage} role="alert">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {addressError}
              </div>
            )}

            <form onSubmit={handleAddressSave} noValidate>
              <div className={styles.formGroup}>
                <label htmlFor="addr-label" className={styles.formLabel}>
                  Label
                </label>
                <input
                  id="addr-label"
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Home, Office, Camp"
                  value={addressForm.label}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, label: e.target.value }))
                  }
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-first" className={styles.formLabel}>
                    First Name<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-first"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.firstName}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-last" className={styles.formLabel}>
                    Last Name<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-last"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.lastName}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="addr-line1" className={styles.formLabel}>
                  Address Line 1<span className={styles.formRequired}>*</span>
                </label>
                <input
                  id="addr-line1"
                  type="text"
                  className={styles.formInput}
                  placeholder="Street address"
                  value={addressForm.addressLine1}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, addressLine1: e.target.value }))
                  }
                  required
                  autoComplete="address-line1"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="addr-line2" className={styles.formLabel}>
                  Address Line 2
                </label>
                <input
                  id="addr-line2"
                  type="text"
                  className={styles.formInput}
                  placeholder="Apt, suite, unit, etc."
                  value={addressForm.addressLine2}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, addressLine2: e.target.value }))
                  }
                  autoComplete="address-line2"
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-city" className={styles.formLabel}>
                    City<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-city"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, city: e.target.value }))
                    }
                    required
                    autoComplete="address-level2"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-state" className={styles.formLabel}>
                    State<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-state"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, state: e.target.value }))
                    }
                    required
                    autoComplete="address-level1"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-zip" className={styles.formLabel}>
                    Postal Code<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-zip"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, postalCode: e.target.value }))
                    }
                    required
                    autoComplete="postal-code"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="addr-country" className={styles.formLabel}>
                    Country<span className={styles.formRequired}>*</span>
                  </label>
                  <input
                    id="addr-country"
                    type="text"
                    className={styles.formInput}
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm((f) => ({ ...f, country: e.target.value }))
                    }
                    required
                    autoComplete="country-name"
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="addr-phone" className={styles.formLabel}>
                  Phone
                </label>
                <input
                  id="addr-phone"
                  type="tel"
                  className={styles.formInput}
                  placeholder="(555) 555-5555"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  autoComplete="tel"
                />
              </div>
              <div className={styles.checkboxRow}>
                <input
                  id="addr-default"
                  type="checkbox"
                  className={styles.checkbox}
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
                <label htmlFor="addr-default" className={styles.checkboxLabel}>
                  Set as default address
                </label>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={closeAddressModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSaveBtn}
                  disabled={addressSaving}
                >
                  {addressSaving
                    ? 'Saving...'
                    : editingAddress
                      ? 'Update Address'
                      : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
