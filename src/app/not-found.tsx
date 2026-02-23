import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(4rem, 10vw, 7rem)',
          fontWeight: 800,
          color: 'var(--accent-blue)',
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: 440,
          lineHeight: 1.6,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 2rem',
          background: 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          borderRadius: '100px',
          fontSize: '1rem',
          fontWeight: 700,
          textDecoration: 'none',
          fontFamily: 'inherit',
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
