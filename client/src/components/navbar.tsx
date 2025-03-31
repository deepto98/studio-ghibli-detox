import { Link, useLocation } from "wouter";
import {
  Pill,
  Menu,
  X,
  Images,
  BookOpen,
  Heart,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set a class on body when menu is open to prevent scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    {
      path: "/how-it-works",
      label: "How It Works",
      type: "regular",
      icon: <BookOpen className="h-5 w-5 mr-2" />,
    },
    {
      path: "/gallery",
      label: "Gallery",
      type: "regular",
      icon: <Images className="h-5 w-5 mr-2" />,
    },
    {
      path: "/relapse-prevention",
      label: "Relapse Prevention",
      type: "regular",
      icon: <Heart className="h-5 w-5 mr-2" />,
    },
    {
      path: "/",
      label: "Emergency Detox",
      type: "cta",
      icon: <AlertCircle className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand name */}
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center bg-blue-50 p-1 rounded-md">
                <img
                  src="/favicon.svg"
                  alt="Studio Ghibli Detox"
                  className="h-10 w-10 mr-2"
                />{" "}
                <Link
                  href="/"
                  className="font-bold text-xl text-blue-800 tracking-tight"
                >
                  Studio Ghibli Detox
                </Link>
              </div>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    ${
                      item.type === "cta"
                        ? "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors duration-200"
                        : `px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            location === item.path
                              ? "bg-blue-100 text-blue-800"
                              : "hover:bg-gray-100 text-gray-700"
                          }`
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Link
                href="/gallery"
                className={`p-2 mr-1 rounded-md ${
                  location === "/gallery"
                    ? "bg-blue-100 text-blue-800"
                    : "text-blue-600 hover:bg-blue-50"
                } focus:outline-none`}
              >
                <Images className="h-6 w-6" />
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg pt-2 pb-3 px-4 space-y-1 border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    item.type === "cta"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : location === item.path
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
