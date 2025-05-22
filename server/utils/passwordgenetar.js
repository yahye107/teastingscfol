// utils/passwordgenerator.js
const generateEasyPassword = () => {
  // Curated lists of simple words and numbers
  const words = ["sun", "moon", "tree", "book", "fish", "bird", "rain", "snow"];
  const numbers = "123456789"; // Excludes 0 to avoid confusion

  // Generate 2 random words and 2 random digits
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const num1 = numbers[Math.floor(Math.random() * numbers.length)];
  const num2 = numbers[Math.floor(Math.random() * numbers.length)];

  // Combine with 50% chance of separator
  const separator = Math.random() > 0.5 ? "" : "-";
  return `${word1}${separator}${word2}${num1}${num2}`.toLowerCase();
};

module.exports = { generateEasyPassword };
