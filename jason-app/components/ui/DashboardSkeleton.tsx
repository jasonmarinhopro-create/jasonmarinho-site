const s: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '320px',
  width: '100%',
}

const ring: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '2px solid var(--border)',
  borderTopColor: 'var(--text-3)',
  animation: 'spin 0.7s linear infinite',
}

export default function DashboardSkeleton() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s}>
        <div style={ring} />
      </div>
    </>
  )
}
