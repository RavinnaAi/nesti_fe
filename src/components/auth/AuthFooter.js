import Link from "next/link";

export default function AuthFooter({ text, linkText, href }) {
  return (
    <div className="text-center text-sm text-text-body pt-2">
      {text}{" "}
      <Link
        href={href}
        className="text-primary font-semibold hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200"
      >
        {linkText}
      </Link>
    </div>
  );
}
