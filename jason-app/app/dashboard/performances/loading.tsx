export default function Loading() {
  return (
    <div style={{
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      color: 'var(--text-2)',
    }}>
      <div style={{
        height: 28,
        width: 220,
        borderRadius: 8,
        background: 'var(--surface)',
      }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 110,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
          }} />
        ))}
      </div>
      <div style={{
        height: 320,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
      }} />
    </div>
  )
}
