import Link from "next/link";
import { Youtube, Instagram } from "lucide-react";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="mb-4 md:mb-0">
            <Logo />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <Link
              href="/about-us"
              className="hover:text-black transition-colors"
            >
              About Us
            </Link>
            <Link href="/terms" className="hover:text-black transition-colors">
              Terms and Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-black transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/refund-policy"
              className="hover:text-black transition-colors"
            >
              Refund Policy
            </Link>
            <Link
              href="/feature-your-brand"
              className="hover:text-black transition-colors"
            >
              Feature Your Brand
            </Link>
            <Link
              href="/contact-us"
              className="hover:text-black transition-colors"
            >
              Contact Us
            </Link>
          </nav>

          {/* Social Links */}
          <div className="flex space-x-4">
            <Link
              href="https://www.youtube.com/@molle.events"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </Link>
            <Link
              href="https://www.instagram.com/molle.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-4 text-center text-sm">
          <p>molle.events@2025. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
