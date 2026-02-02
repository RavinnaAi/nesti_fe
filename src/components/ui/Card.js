export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-background border border-border rounded-md shadow-sm p-6 ${className}`}>
      {children}
    </div>
  )
}
