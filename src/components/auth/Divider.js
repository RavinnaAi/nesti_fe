export default function Divider({ text = "Or continue with" }) {
  return (
    <div className="relative flex items-center justify-center py-0.5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative bg-background px-3">
        <span className="text-xs font-medium text-text-muted">{text}</span>
      </div>
    </div>
  );
}
