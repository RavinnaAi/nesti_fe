import Link from "next/link";

export default function AuthFooter({ text, linkText, href }) {
  return (
    <div className="pt-1 text-center text-sm text-text-body">
      {text}{" "}
      <Link
        href={href}
        prefetch={false}
        className="text-primary font-semibold hover:text-primary-dark hover:underline cursor-pointer transition-all duration-200"
      >
        {linkText}
      </Link>
    </div>
  );
}
