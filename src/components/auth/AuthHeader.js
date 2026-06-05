export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="space-y-1 text-left">
      <h1 className="text-xl font-bold leading-tight tracking-tight text-text-heading sm:text-[1.35rem]">
        {title}
      </h1>
      <p className="text-xs leading-4 text-text-muted sm:text-[13px] sm:leading-5">
        {subtitle}
      </p>
    </div>
  );
}
