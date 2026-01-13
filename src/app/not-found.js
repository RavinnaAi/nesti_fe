export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4 text-text-heading">Not Found</h2>
      <p className="text-text-body mb-4">Could not find requested resource</p>
      <a href="/" className="text-primary hover:underline transition-colors">
        Return Home
      </a>
    </div>
  )
}
