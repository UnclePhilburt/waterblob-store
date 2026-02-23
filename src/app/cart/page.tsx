'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useCart } from '@/components/cart/CartProvider';
import { useAuth } from '@/hooks/useAuth';
import styles from './cart.module.css';

/* ==========================================================================
   Types
   ========================================================================== */

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface SavedAddress {
  id: number;
  label?: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  estimatedDays?: string;
}

type PageView = 'cart' | 'checkout' | 'confirmation';
type DeliveryMethod = 'ship' | 'pickup';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Square?: any;
  }
}

/* ==========================================================================
   Constants
   ========================================================================== */

const EMPTY_ADDRESS: ShippingAddress = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

const CA_PROVINCES = [
  'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT',
];

const MO_TAX_RATE = 0.08;

/* ==========================================================================
   Helpers
   ========================================================================== */

function formatPrice(dollars: number): string {
  return '$' + dollars.toFixed(2);
}

/* ==========================================================================
   SVG Icons (no emoji)
   ========================================================================== */

function CartIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

/* ==========================================================================
   Component
   ========================================================================== */

export default function CartPage() {
  const {
    items,
    itemCount,
    total,
    removeFromCart,
    updateQuantity,
    clearCart,
    maintenanceMode,
  } = useCart();
  const { token, customer, isLoggedIn } = useAuth();

  /* ----- View state ----- */
  const [view, setView] = useState<PageView>('cart');

  /* ----- Checkout form state ----- */
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('ship');
  const [address, setAddress] = useState<ShippingAddress>({ ...EMPTY_ADDRESS });
  const [orderNotes, setOrderNotes] = useState('');

  /* ----- Saved addresses ----- */
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null);
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);

  /* ----- Shipping ----- */
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');

  /* ----- Payment ----- */
  const [squareReady, setSquareReady] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [processing, setProcessing] = useState(false);
  const cardInstanceRef = useRef<any>(null);
  const applePayRef = useRef<any>(null);
  const googlePayRef = useRef<any>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const squareConfigRef = useRef<{ applicationId: string; locationId: string } | null>(null);

  /* ----- Confirmation ----- */
  const [orderNumber, setOrderNumber] = useState('');

  /* ----- General error ----- */
  const [error, setError] = useState('');

  /* ========================================================================
     Load saved addresses when entering checkout
     ======================================================================== */

  const loadSavedAddresses = useCallback(async () => {
    if (!isLoggedIn || !token) return;
    try {
      const res = await fetch('/api/customer/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const addrs: SavedAddress[] = data.addresses || data || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          setSelectedSavedId(addrs[0].id);
          applySavedAddress(addrs[0]);
        }
      }
    } catch {
      // Silently fail — customer can still type manually
    }
  }, [isLoggedIn, token]);

  function applySavedAddress(saved: SavedAddress) {
    setAddress({
      firstName: saved.firstName || '',
      lastName: saved.lastName || '',
      address1: saved.address1 || '',
      address2: saved.address2 || '',
      city: saved.city || '',
      state: saved.state || '',
      zip: saved.zip || '',
      country: saved.country || 'US',
      phone: saved.phone || '',
    });
  }

  /* ========================================================================
     Square SDK initialization
     ======================================================================== */

  const initSquare = useCallback(async () => {
    if (!window.Square) return;
    try {
      // Fetch Square config
      const cfgRes = await fetch('/api/square');
      if (!cfgRes.ok) throw new Error('Failed to load payment config');
      const cfg = await cfgRes.json();
      squareConfigRef.current = cfg;

      const payments = window.Square.payments(cfg.applicationId, cfg.locationId);

      // Card form
      const card = await payments.card();
      await card.attach('#card-container');
      cardInstanceRef.current = card;

      // Apple Pay (try/catch — not available on every device)
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: (total / 100).toFixed(2),
            label: 'Water Blob',
          },
        });
        const applePay = await payments.applePay(paymentRequest);
        applePayRef.current = applePay;
        setApplePayAvailable(true);
      } catch {
        // Apple Pay not available
      }

      // Google Pay (try/catch)
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: (total / 100).toFixed(2),
            label: 'Water Blob',
          },
        });
        const googlePay = await payments.googlePay(paymentRequest);
        await googlePay.attach('#google-pay-button');
        googlePayRef.current = googlePay;
        setGooglePayAvailable(true);
      } catch {
        // Google Pay not available
      }

      setSquareReady(true);
    } catch (err: any) {
      setPaymentError('Unable to load payment form. Please refresh and try again.');
    }
  }, [total]);

  /* ========================================================================
     Proceed to checkout
     ======================================================================== */

  function handleProceedToCheckout() {
    if (items.length === 0) return;
    setView('checkout');
    setError('');
    setPaymentError('');
    setShippingRates([]);
    setSelectedShippingId(null);
    setShippingError('');

    // Pre-fill guest info from customer data
    if (isLoggedIn && customer) {
      setGuestEmail(customer.email);
      setGuestName(customer.name);
    }

    // Load saved addresses
    loadSavedAddresses();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ========================================================================
     Square script load callback
     ======================================================================== */

  function handleSquareLoad() {
    // Slight delay to let SDK register globally
    setTimeout(() => {
      if (view === 'checkout') {
        initSquare();
      }
    }, 200);
  }

  // Also attempt init when entering checkout view (if SDK already loaded)
  useEffect(() => {
    if (view === 'checkout' && window.Square && !cardInstanceRef.current) {
      initSquare();
    }
  }, [view, initSquare]);

  /* ========================================================================
     Calculate shipping
     ======================================================================== */

  async function handleCalculateShipping() {
    if (!address.address1 || !address.city || !address.state || !address.zip) {
      setShippingError('Please fill in the shipping address first.');
      return;
    }

    setShippingLoading(true);
    setShippingError('');

    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          destination: {
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to calculate shipping');
      }

      const data = await res.json();
      const rates: ShippingRate[] = data.rates || [];
      setShippingRates(rates);
      if (rates.length > 0) {
        setSelectedShippingId(rates[0].id);
      }
    } catch (err: any) {
      setShippingError(err.message || 'Failed to calculate shipping');
    } finally {
      setShippingLoading(false);
    }
  }

  /* ========================================================================
     Computed values
     ======================================================================== */

  const selectedRate = shippingRates.find((r) => r.id === selectedShippingId);
  const shippingCost =
    deliveryMethod === 'pickup' ? 0 : selectedRate ? selectedRate.rate : 0;

  // Tax: 8% for Missouri addresses
  const isMissouri =
    address.state === 'MO' && address.country === 'US';
  const taxAmount = isMissouri ? Math.round(total * MO_TAX_RATE) : 0;

  const orderTotal = total + shippingCost + taxAmount;

  /* ========================================================================
     Address field handler
     ======================================================================== */

  function handleAddressChange(field: keyof ShippingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear shipping rates when address changes
    if (['address1', 'city', 'state', 'zip', 'country'].includes(field)) {
      setShippingRates([]);
      setSelectedShippingId(null);
    }
  }

  /* ========================================================================
     Validate checkout
     ======================================================================== */

  function validateCheckout(): string | null {
    if (!isLoggedIn) {
      if (!guestEmail.trim()) return 'Please enter your email address.';
      if (!guestName.trim()) return 'Please enter your name.';
    }

    if (deliveryMethod === 'ship') {
      if (!address.firstName.trim()) return 'Please enter the first name.';
      if (!address.lastName.trim()) return 'Please enter the last name.';
      if (!address.address1.trim()) return 'Please enter the street address.';
      if (!address.city.trim()) return 'Please enter the city.';
      if (!address.state.trim()) return 'Please select a state/province.';
      if (!address.zip.trim()) return 'Please enter the ZIP/postal code.';
      if (!selectedShippingId && shippingRates.length > 0)
        return 'Please select a shipping method.';
      if (shippingRates.length === 0)
        return 'Please calculate shipping before placing your order.';
    }

    return null;
  }

  /* ========================================================================
     Place order
     ======================================================================== */

  async function handlePlaceOrder() {
    setError('');
    setPaymentError('');

    // Validate
    const validationError = validateCheckout();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!cardInstanceRef.current) {
      setPaymentError('Payment form is not ready. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);

    try {
      // 1. Tokenize the card
      const tokenResult = await cardInstanceRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || 'Payment tokenization failed');
      }

      const sourceId = tokenResult.token;

      // 2. Create order
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || null,
          customImage: item.customImage || null,
        })),
        subtotal: total,
        shipping: shippingCost,
        tax: taxAmount,
        total: orderTotal,
        deliveryMethod,
        shippingAddress:
          deliveryMethod === 'ship'
            ? address
            : null,
        shippingMethod: selectedRate
          ? { id: selectedRate.id, name: selectedRate.name, rate: selectedRate.rate }
          : null,
        notes: orderNotes || null,
        customer: isLoggedIn
          ? { id: customer?.id, email: customer?.email, name: customer?.name }
          : { email: guestEmail, name: guestName },
      };

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const orderData = await orderRes.json().catch(() => ({}));
        throw new Error(orderData.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();
      const orderId = orderData.orderId || orderData.id;

      // 3. Process payment via Square
      const payRes = await fetch('/api/square', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceId,
          amount: orderTotal,
          orderId: orderId,
          customerEmail: isLoggedIn ? customer?.email : guestEmail,
          customerName: isLoggedIn ? customer?.name : guestName,
        }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json().catch(() => ({}));
        throw new Error(payData.error || 'Payment processing failed');
      }

      // Success
      setOrderNumber(String(orderId));
      clearCart();
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  /* ========================================================================
     Wallet pay handler (Apple Pay / Google Pay)
     ======================================================================== */

  async function handleWalletPay(walletRef: React.RefObject<any>) {
    if (!walletRef.current) return;

    setError('');
    setPaymentError('');

    const validationError = validateCheckout();
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);

    try {
      const tokenResult = await walletRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || 'Payment tokenization failed');
      }

      const sourceId = tokenResult.token;

      // Create order
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization || null,
          customImage: item.customImage || null,
        })),
        subtotal: total,
        shipping: shippingCost,
        tax: taxAmount,
        total: orderTotal,
        deliveryMethod,
        shippingAddress: deliveryMethod === 'ship' ? address : null,
        shippingMethod: selectedRate
          ? { id: selectedRate.id, name: selectedRate.name, rate: selectedRate.rate }
          : null,
        notes: orderNotes || null,
        customer: isLoggedIn
          ? { id: customer?.id, email: customer?.email, name: customer?.name }
          : { email: guestEmail, name: guestName },
      };

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const orderData = await orderRes.json().catch(() => ({}));
        throw new Error(orderData.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();
      const orderId = orderData.orderId || orderData.id;

      const payRes = await fetch('/api/square', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sourceId,
          amount: orderTotal,
          orderId,
          customerEmail: isLoggedIn ? customer?.email : guestEmail,
          customerName: isLoggedIn ? customer?.name : guestName,
        }),
      });

      if (!payRes.ok) {
        const payData = await payRes.json().catch(() => ({}));
        throw new Error(payData.error || 'Payment processing failed');
      }

      setOrderNumber(String(orderId));
      clearCart();
      setView('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  /* ========================================================================
     RENDER: Cart View
     ======================================================================== */

  function renderCartView() {
    if (items.length === 0) {
      return (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>
            <CartIcon size={64} />
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven&apos;t added anything yet.</p>
          <Link href="/products" className={`${styles.btn} ${styles.btnPrimary}`}>
            Browse Products
          </Link>
        </div>
      );
    }

    return (
      <div className={styles.cartLayout}>
        {/* --- Cart Items --- */}
        <div className={styles.cartItems}>
          {items.map((item) => (
            <div key={`${item.productId}-${item.customization || ''}`} className={styles.cartItem}>
              <img
                src={item.image_url || '/assets/homepage/logo.png'}
                alt={item.name}
                width={100}
                height={100}
              />
              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <div className={styles.itemPrice}>{formatPrice(item.price)}</div>
                {item.customization && (
                  <div className={styles.itemCustom}>Custom: {item.customization}</div>
                )}
              </div>
              <div className={styles.itemQuantity}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <input
                  className={styles.qtyInput}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      updateQuantity(item.productId, val);
                    }
                  }}
                  aria-label="Quantity"
                />
                <button
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </div>
              <button
                className={styles.btnRemove}
                onClick={() => removeFromCart(item.productId)}
                aria-label={`Remove ${item.name}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* --- Summary Sidebar --- */}
        <div className={styles.cartSummary}>
          <div className={styles.summaryCard}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className={styles.summaryRowTotal}>
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull} ${styles.btnLg}`}
              onClick={handleProceedToCheckout}
              disabled={maintenanceMode}
              style={{ marginTop: '1.5rem' }}
            >
              Proceed to Checkout
            </button>
            <div className={styles.secureNote}>
              <LockIcon />
              <span>Secure checkout powered by Square</span>
            </div>
          </div>

          {/* Account status */}
          <div className={`${styles.accountCard} ${isLoggedIn ? styles.accountCardLoggedIn : ''}`}>
            {isLoggedIn && customer ? (
              <div className={styles.accountInfo}>
                <div className={styles.accountAvatar}>
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.accountDetails}>
                  <div className={styles.accountName}>{customer.name}</div>
                  <div className={styles.accountEmail}>{customer.email}</div>
                </div>
              </div>
            ) : (
              <div className={styles.accountPrompt}>
                <p>Have an account? Sign in for faster checkout.</p>
                <Link href="/account" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnFull}`}>
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
     RENDER: Checkout View
     ======================================================================== */

  function renderCheckoutView() {
    const showSavedAddresses =
      isLoggedIn && savedAddresses.length > 0 && !useDifferentAddress;

    return (
      <div className={styles.checkoutSection}>
        {/* Header */}
        <div className={styles.checkoutHeader}>
          <button
            className={styles.btnBack}
            onClick={() => {
              setView('cart');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <ArrowLeftIcon /> Back to Cart
          </button>
          <h2>Checkout</h2>
        </div>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.checkoutLayout}>
          {/* --- Left column: Form sections --- */}
          <div>
            {/* Contact Info */}
            <div className={styles.checkoutCard}>
              <h3>Contact Information</h3>
              {isLoggedIn && customer ? (
                <div className={styles.contactDisplay}>
                  <div>
                    <p>{customer.name}</p>
                    <small>{customer.email}</small>
                  </div>
                </div>
              ) : (
                <div className={styles.guestContact}>
                  <div className={styles.formGroup}>
                    <label htmlFor="guest-email">Email Address</label>
                    <input
                      id="guest-email"
                      type="email"
                      className={styles.formInput}
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="guest-name">Full Name</label>
                    <input
                      id="guest-name"
                      type="text"
                      className={styles.formInput}
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Method */}
            <div className={styles.checkoutCard}>
              <h3>Delivery Method</h3>
              <div className={styles.deliveryToggle}>
                <label className={styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    value="ship"
                    checked={deliveryMethod === 'ship'}
                    onChange={() => setDeliveryMethod('ship')}
                  />
                  <div className={styles.deliveryOptionContent}>
                    <div className={styles.deliveryIcon}>
                      <TruckIcon />
                    </div>
                    <div>
                      <strong>Ship to Address</strong>
                      <p>Standard and expedited shipping options</p>
                    </div>
                  </div>
                </label>
                <label className={styles.deliveryOption}>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                  />
                  <div className={styles.deliveryOptionContent}>
                    <div className={styles.deliveryIcon}>
                      <StoreIcon />
                    </div>
                    <div>
                      <strong>Local Pickup</strong>
                      <p>Springfield, MO - FREE</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Shipping Address (only if ship) */}
            {deliveryMethod === 'ship' && (
              <div className={styles.checkoutCard}>
                <h3>Shipping Address</h3>

                {/* Saved addresses */}
                {showSavedAddresses && (
                  <>
                    <div className={styles.addressRadioList}>
                      {savedAddresses.map((sa) => (
                        <label
                          key={sa.id}
                          className={`${styles.addressRadioItem} ${
                            selectedSavedId === sa.id ? styles.addressRadioItemSelected : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedSavedId === sa.id}
                            onChange={() => {
                              setSelectedSavedId(sa.id);
                              applySavedAddress(sa);
                              setShippingRates([]);
                              setSelectedShippingId(null);
                            }}
                          />
                          <div className={styles.addressRadioContent}>
                            <div className={styles.addressRadioLabel}>
                              {sa.label || `${sa.firstName} ${sa.lastName}`}
                            </div>
                            <div className={styles.addressRadioDetails}>
                              {sa.address1}
                              {sa.address2 ? `, ${sa.address2}` : ''}
                              <br />
                              {sa.city}, {sa.state} {sa.zip}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <button
                      className={styles.btnText}
                      onClick={() => {
                        setUseDifferentAddress(true);
                        setSelectedSavedId(null);
                        setAddress({ ...EMPTY_ADDRESS });
                        setShippingRates([]);
                        setSelectedShippingId(null);
                      }}
                    >
                      Use a different address
                    </button>
                  </>
                )}

                {/* Manual address form */}
                {(!showSavedAddresses || useDifferentAddress) && (
                  <div className={styles.addressForm}>
                    {useDifferentAddress && savedAddresses.length > 0 && (
                      <button
                        className={styles.btnText}
                        onClick={() => {
                          setUseDifferentAddress(false);
                          if (savedAddresses.length > 0) {
                            setSelectedSavedId(savedAddresses[0].id);
                            applySavedAddress(savedAddresses[0]);
                          }
                          setShippingRates([]);
                          setSelectedShippingId(null);
                        }}
                      >
                        Use a saved address
                      </button>
                    )}

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-first">First Name</label>
                        <input
                          id="ship-first"
                          type="text"
                          className={styles.formInput}
                          value={address.firstName}
                          onChange={(e) => handleAddressChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-last">Last Name</label>
                        <input
                          id="ship-last"
                          type="text"
                          className={styles.formInput}
                          value={address.lastName}
                          onChange={(e) => handleAddressChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="ship-addr1">Address Line 1</label>
                      <input
                        id="ship-addr1"
                        type="text"
                        className={styles.formInput}
                        value={address.address1}
                        onChange={(e) => handleAddressChange('address1', e.target.value)}
                        placeholder="Street address"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="ship-addr2">Address Line 2 (optional)</label>
                      <input
                        id="ship-addr2"
                        type="text"
                        className={styles.formInput}
                        value={address.address2}
                        onChange={(e) => handleAddressChange('address2', e.target.value)}
                        placeholder="Apt, Suite, etc."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="ship-city">City</label>
                      <input
                        id="ship-city"
                        type="text"
                        className={styles.formInput}
                        value={address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-country">Country</label>
                        <select
                          id="ship-country"
                          className={styles.formInput}
                          value={address.country}
                          onChange={(e) => {
                            handleAddressChange('country', e.target.value);
                            handleAddressChange('state', '');
                          }}
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-state">
                          {address.country === 'CA' ? 'Province' : 'State'}
                        </label>
                        <select
                          id="ship-state"
                          className={styles.formInput}
                          value={address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          required
                        >
                          <option value="">Select...</option>
                          {(address.country === 'CA' ? CA_PROVINCES : US_STATES).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-zip">
                          {address.country === 'CA' ? 'Postal Code' : 'ZIP Code'}
                        </label>
                        <input
                          id="ship-zip"
                          type="text"
                          className={styles.formInput}
                          value={address.zip}
                          onChange={(e) => handleAddressChange('zip', e.target.value)}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="ship-phone">Phone (optional)</label>
                        <input
                          id="ship-phone"
                          type="tel"
                          className={styles.formInput}
                          value={address.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Notes */}
            <div className={styles.checkoutCard}>
              <h3>Order Notes (optional)</h3>
              <textarea
                className={styles.formTextarea}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Special instructions for your order..."
                rows={3}
              />
            </div>

            {/* Shipping Method (only if ship) */}
            {deliveryMethod === 'ship' && (
              <div className={styles.checkoutCard}>
                <h3>Shipping Method</h3>

                {shippingRates.length === 0 && !shippingLoading && (
                  <>
                    {shippingError && (
                      <div className={styles.formError}>{shippingError}</div>
                    )}
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnFull}`}
                      onClick={handleCalculateShipping}
                      disabled={shippingLoading}
                    >
                      Calculate Shipping
                    </button>
                  </>
                )}

                {shippingLoading && (
                  <div className={styles.shippingLoading}>
                    <div className={`${styles.spinner} ${styles.spinnerDark}`} />
                    <p style={{ marginTop: '0.5rem' }}>Calculating shipping rates...</p>
                  </div>
                )}

                {shippingRates.length > 0 && (
                  <div className={styles.shippingOptionsList}>
                    {shippingRates.map((rate) => (
                      <label
                        key={rate.id}
                        className={`${styles.shippingOption} ${
                          selectedShippingId === rate.id ? styles.shippingOptionSelected : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping-rate"
                          checked={selectedShippingId === rate.id}
                          onChange={() => setSelectedShippingId(rate.id)}
                        />
                        <div className={styles.shippingOptionContent}>
                          <div className={styles.shippingOptionName}>{rate.name}</div>
                          {rate.estimatedDays && (
                            <div className={styles.shippingOptionDetails}>
                              {rate.estimatedDays}
                            </div>
                          )}
                        </div>
                        <div className={styles.shippingOptionPrice}>
                          {formatPrice(rate.rate)}
                        </div>
                      </label>
                    ))}
                    <button
                      className={styles.btnText}
                      onClick={() => {
                        setShippingRates([]);
                        setSelectedShippingId(null);
                      }}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Recalculate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment */}
            <div className={styles.checkoutCard}>
              <h3>Payment</h3>

              {paymentError && (
                <div className={styles.formError}>{paymentError}</div>
              )}

              <div className={styles.paymentSection}>
                {/* Express checkout (Apple Pay / Google Pay) */}
                {(applePayAvailable || googlePayAvailable) && (
                  <>
                    <div className={styles.expressCheckout}>
                      {applePayAvailable && (
                        <div
                          className={styles.walletButton}
                          id="apple-pay-button"
                          onClick={() => handleWalletPay(applePayRef)}
                        />
                      )}
                      {googlePayAvailable && (
                        <div
                          className={styles.walletButton}
                          id="google-pay-button"
                          onClick={() => handleWalletPay(googlePayRef)}
                        />
                      )}
                    </div>
                    <div className={styles.paymentDivider}>
                      <span className={styles.paymentDividerText}>or pay with card</span>
                    </div>
                  </>
                )}

                <h4>Credit or Debit Card</h4>
                <div className={styles.cardContainer} id="card-container" />

                {!squareReady && !paymentError && (
                  <div className={styles.paymentStatus}>
                    <div className={`${styles.spinner} ${styles.spinnerDark}`} style={{ marginRight: '0.5rem' }} />
                    Loading payment form...
                  </div>
                )}
              </div>

              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull} ${styles.btnLg}`}
                onClick={handlePlaceOrder}
                disabled={processing || !squareReady}
                style={{ marginTop: '1rem' }}
              >
                {processing ? (
                  <>
                    <span className={styles.spinner} /> Processing...
                  </>
                ) : (
                  <>
                    <LockIcon /> Pay {formatPrice(orderTotal)}
                  </>
                )}
              </button>

              <div className={styles.termsNote}>
                By placing this order you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
          </div>

          {/* --- Right column: Order review --- */}
          <div className={styles.checkoutSummaryColumn}>
            <div className={styles.orderReview}>
              <h3>Order Review</h3>

              <div className={styles.checkoutItems}>
                {items.map((item) => (
                  <div key={`${item.productId}-${item.customization || ''}`} className={styles.checkoutItem}>
                    <img
                      className={styles.checkoutItemImage}
                      src={item.image_url || '/assets/homepage/logo.png'}
                      alt={item.name}
                      width={60}
                      height={60}
                    />
                    <div className={styles.checkoutItemDetails}>
                      <div className={styles.checkoutItemName}>{item.name}</div>
                      <div className={styles.checkoutItemQty}>Qty: {item.quantity}</div>
                    </div>
                    <div className={styles.checkoutItemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.checkoutTotals}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>
                    {deliveryMethod === 'pickup'
                      ? 'FREE'
                      : selectedRate
                      ? formatPrice(shippingCost)
                      : '--'}
                  </span>
                </div>
                {taxAmount > 0 && (
                  <div className={styles.summaryRow}>
                    <span>Tax (MO 8%)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                )}
                <div className={styles.summaryRowTotal}>
                  <span>Total</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
     RENDER: Confirmation View
     ======================================================================== */

  function renderConfirmationView() {
    return (
      <div className={styles.confirmationSection}>
        <div className={styles.confirmationCard}>
          <div className={styles.successIcon}>
            <CheckIcon />
          </div>
          <h2>Order Placed Successfully!</h2>
          <div className={styles.orderNumber}>Order #{orderNumber}</div>
          <p>
            Thank you for your order. You will receive a confirmation email shortly.
          </p>

          <div className={styles.confirmationDetails}>
            <h4>What&apos;s Next?</h4>
            <ul>
              <li>You&apos;ll receive an email confirmation with your order details</li>
              <li>We&apos;ll send you tracking information once your order ships</li>
              <li>
                Questions? <Link href="/contact">Contact our team</Link>
              </li>
            </ul>
          </div>

          <div className={styles.confirmationActions}>
            {isLoggedIn && (
              <Link href="/account" className={`${styles.btn} ${styles.btnSecondary}`}>
                View Order
              </Link>
            )}
            <Link href="/products" className={`${styles.btn} ${styles.btnPrimary}`}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
     MAIN RENDER
     ======================================================================== */

  return (
    <>
      <Script
        src="https://web.squarecdn.com/v1/square.js"
        strategy="lazyOnload"
        onLoad={handleSquareLoad}
      />

      <main className={styles.cartPage}>
        {maintenanceMode && (
          <div className={styles.maintenanceBanner}>
            Our store is currently undergoing maintenance. Checkout is temporarily unavailable.
          </div>
        )}

        {view === 'cart' && (
          <>
            <h1>Shopping Cart</h1>
            {renderCartView()}
          </>
        )}

        {view === 'checkout' && renderCheckoutView()}

        {view === 'confirmation' && renderConfirmationView()}
      </main>
    </>
  );
}
