import Image from "next/image";
import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image src="/logo.png" alt="Molle" width={84} height={84} />
    </Link>
  );
}
