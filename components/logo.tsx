import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="flex items-center space-x-2 mb-4 md:mb-0">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-primary font-bold text-lg">🍀</span>
        </div>
        <span className="text-xl font-bold">Molle</span>
      </div>
    </Link>
  );
}
