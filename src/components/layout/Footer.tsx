import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '1rem',
          }}
        >
          <a
            href="tel:+14178648461"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📞</span> (417) 864-8461
          </a>
          <a
            href="mailto:lorie@thewaterblob.com"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📧</span> lorie@thewaterblob.com
          </a>
          <Link
            href="/contact"
            style={{
              color: 'inherit',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>💬</span> Contact Us
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Water Blob®. The original since 1984.</p>
      </div>
    </footer>
  );
}
