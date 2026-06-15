import Link from "next/link";
import Image from "next/image";

export default function AuthBrandLink() {
  return (
    <Link
      href="/"
      prefetch={false}
      className="group mb-1 flex w-fit items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      aria-label="Go to Nesti AI home"
    >
      <span className="grid h-9 w-9 place-items-center transition-transform group-hover:scale-105">
        <Image
          src="/logo/logo.png"
          alt="Nesti AI logo"
          width={36}
          height={36}
          className="h-9 w-9 object-cover"
        />
      </span>
      <span className="flex flex-col">
        <span className="text-base font-black leading-tight tracking-tight text-text-heading">
          Nesti AI
        </span>
        <span className="-mt-0.5 text-[11px] font-medium leading-tight text-text-muted">
          Real Estate Intelligence
        </span>
      </span>
    </Link>
  );
}
