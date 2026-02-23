export default function ProductsLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
      <div
        style={{
          width: 200,
          height: 32,
          background: 'var(--border-subtle)',
          borderRadius: 8,
          marginBottom: '2rem',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: '1rem',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                height: 220,
                background: 'var(--bg-elevated)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div style={{ padding: '1.25rem' }}>
              <div
                style={{
                  width: '70%',
                  height: 18,
                  background: 'var(--border-subtle)',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 16,
                  background: 'var(--border-subtle)',
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
