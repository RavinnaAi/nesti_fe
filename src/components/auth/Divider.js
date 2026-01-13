export default function Divider({ text = "Or continue with" }) {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative bg-background px-4">
        <span className="text-sm text-text-muted">{text}</span>
      </div>
    </div>
  );
}
