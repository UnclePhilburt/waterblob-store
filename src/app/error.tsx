'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: 480,
          lineHeight: 1.6,
        }}
      >
        We hit an unexpected issue. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 2rem',
          background: 'var(--accent-blue)',
          color: '#fff',
          border: 'none',
          borderRadius: '100px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
