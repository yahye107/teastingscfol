import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">EduFuture Academy</h3>
            <p className="text-gray-400 mb-4">
              Preparing students for success in college, career, and life since
              1998.
            </p>
            <div className="flex space-x-4">
              {["fb", "tw", "ig", "in"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="bg-gray-800 p-2 rounded-full hover:bg-indigo-600 transition"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-5 h-5 bg-gray-200 border-2 border-dashed rounded-full" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                "About Us",
                "Academic Programs",
                "Student Life",
                "Admissions",
                "Contact",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Programs</h4>
            <ul className="space-y-2">
              {[
                "STEM Academy",
                "Arts Program",
                "Athletics",
                "IB Diploma",
                "Summer School",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="text-gray-400 not-italic">
              <p className="mb-2">123 Education Lane</p>
              <p className="mb-2">Boston, MA 02101</p>
              <p className="mb-2">Phone: (555) 123-4567</p>
              <p className="mb-2">Email: info@edufuture.edu</p>
            </address>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500">
          <p>© 2023 EduFuture Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
