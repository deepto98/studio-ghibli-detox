import { Link, useLocation } from "wouter";
import { Pill, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand name */}
          <div className="flex-shrink-0 flex items-center">
            <Pill className="text-clinic-blue-dark h-6 w-6 mr-2" />
            <Link href="/" className="font-bold text-xl">
              Ghibli Detox Clinic
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/how-it-works"
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                location === "/how-it-works"
                  ? "bg-gray-100"
                  : "hover:bg-gray-100"
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/gallery"
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                location === "/gallery" ? "bg-gray-100" : "hover:bg-gray-100"
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/relapse-prevention"
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                location === "/relapse-prevention"
                  ? "bg-gray-100"
                  : "hover:bg-gray-100"
              }`}
            >
              Relapse Prevention
            </Link>
            <Link
              href="/"
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Emergency Detox
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="flex flex-col space-y-2">
              <Link
                href="/how-it-works"
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  location === "/how-it-works"
                    ? "bg-gray-100"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/gallery"
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  location === "/gallery" ? "bg-gray-100" : "hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Gallery
              </Link>
              <Link
                href="/relapse-prevention"
                className={`block px-3 py-2 text-sm font-medium rounded-md ${
                  location === "/relapse-prevention"
                    ? "bg-gray-100"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Relapse Prevention
              </Link>
              <Link
                href="/"
                className="block px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Emergency Detox
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
