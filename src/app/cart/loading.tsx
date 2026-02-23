export default function CartLoading() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem' }}>
      <div
        style={{
          width: 120,
          height: 28,
          background: 'var(--border-subtle)',
          borderRadius: 8,
          marginBottom: '2rem',
        }}
      />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '1.5rem',
            marginBottom: '1rem',
            borderRadius: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '60%',
                height: 16,
                background: 'var(--border-subtle)',
                borderRadius: 6,
                marginBottom: 10,
              }}
            />
            <div
              style={{
                width: '30%',
                height: 14,
                background: 'var(--border-subtle)',
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
