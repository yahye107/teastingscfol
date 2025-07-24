import React, { useState } from "react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-md fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 font-bold text-2xl text-indigo-600">
              EduFuture
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-8">
            {["Home", "Programs", "Faculty", "Campus", "Admissions"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
                >
                  {item}
                </a>
              )
            )}
          </nav>

          <button className="hidden md:block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
            Apply Now
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white py-4 px-2">
          {["Home", "Programs", "Faculty", "Campus", "Admissions"].map(
            (item) => (
              <a
                key={item}
                href="#"
                className="block py-2 px-4 text-gray-700 hover:bg-gray-100 rounded"
              >
                {item}
              </a>
            )
          )}
          <button className="mt-2 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            Apply Now
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
