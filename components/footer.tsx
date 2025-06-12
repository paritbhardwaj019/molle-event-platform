import Link from "next/link"
import { Youtube, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-lg">🍀</span>
            </div>
            <span className="text-xl font-bold">Molle</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
            <Link href="/" className="hover:text-secondary transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-secondary transition-colors">
              About Us
            </Link>
            <Link href="/services" className="hover:text-secondary transition-colors">
              Services
            </Link>
            <Link href="/merchandise" className="hover:text-secondary transition-colors">
              Merchandise
            </Link>
            <Link href="/reviews" className="hover:text-secondary transition-colors">
              Reviews
            </Link>
          </nav>

          {/* Social Links */}
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-secondary transition-colors">
              <Youtube className="w-5 h-5" />
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors">
              <Facebook className="w-5 h-5" />
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors">
              <Instagram className="w-5 h-5" />
            </Link>
            <Link href="#" className="hover:text-secondary transition-colors">
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-4 text-center text-sm">
          <p>Molleapp@202X. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
