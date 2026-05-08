'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          <img
            src="/assets/homepage/logo.png"
            alt="Water Blob®"
            className="logo-img"
            loading="eager"
          />
        </Link>

        <button
          className={`mobile-menu-toggle${mobileOpen ? ' active' : ''}`}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

        <ul className={`nav-links${mobileOpen ? ' mobile-open' : ''}`}>
          <li>
            <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
          </li>
          <li className="nav-dropdown">
            <Link href="/products" className="nav-dropdown-toggle">Products</Link>
            <div className="nav-dropdown-menu">
              <Link href="/products">Water Blob®s</Link>
              <Link href="/waterslides">Water Slides</Link>
              <Link href="/skitubes">Ski Tubes</Link>
            </div>
          </li>
          <li className="nav-dropdown">
            <Link href="/about" className="nav-dropdown-toggle">Info</Link>
            <div className="nav-dropdown-menu">
              <Link href="/about">About Us</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/guidelines">Safety & Guidelines</Link>
              <Link href="/anchor-points">Anchor Points</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </li>
          <li>
            <Link href="/blog" onClick={() => setMobileOpen(false)}>Blog</Link>
          </li>
          <li>
            <Link href="/account" onClick={() => setMobileOpen(false)}>Account</Link>
          </li>
          <li className="theme-toggle-li">
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}
