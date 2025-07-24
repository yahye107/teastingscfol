import React from "react";

const features = [
  {
    title: "Innovative Curriculum",
    description: "STEM-focused programs with project-based learning",
    icon: "🔬",
  },
  {
    title: "Global Perspective",
    description: "International exchange programs with 20+ countries",
    icon: "🌎",
  },
  {
    title: "Modern Facilities",
    description: "State-of-the-art labs and learning spaces",
    icon: "🏫",
  },
  {
    title: "Personalized Support",
    description: "1:1 mentorship and college counseling",
    icon: "👩‍🏫",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">
            Why Choose Our School
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            We provide an exceptional educational experience designed for the
            leaders of tomorrow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
