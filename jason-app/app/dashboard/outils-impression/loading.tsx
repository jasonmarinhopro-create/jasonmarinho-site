export default function Loading() {
  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ height: '24px', width: '160px', borderRadius: '999px', background: 'var(--border-2)', marginBottom: '16px', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ height: '40px', width: '320px', borderRadius: '10px', background: 'var(--border-2)', marginBottom: '12px', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ height: '20px', width: '480px', maxWidth: '100%', borderRadius: '8px', background: 'var(--border-2)', animation: 'pulse 1.5s ease infinite' }} />
    </div>
  )
}
