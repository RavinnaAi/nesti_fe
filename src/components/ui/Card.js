export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-background border border-border rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}
