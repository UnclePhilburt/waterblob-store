export default function AccountLoading() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem' }}>
      <div
        style={{
          width: 180,
          height: 28,
          background: 'var(--border-subtle)',
          borderRadius: 8,
          marginBottom: '2rem',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 100,
              borderRadius: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 300,
          borderRadius: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
