import React from "react";

const Hero = () => {
  return (
    <section className="pt-28 pb-20 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Shaping Future Leaders Through Excellence in Education
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-lg">
            Our innovative learning approach prepares students for success in a
            rapidly changing world.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition shadow-lg">
              Explore Programs
            </button>
            <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition">
              Virtual Tour
            </button>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96" />
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
              <div className="text-3xl font-bold text-indigo-600">98%</div>
              <div className="text-gray-600">Graduation Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
