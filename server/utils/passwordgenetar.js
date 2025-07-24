// utils/passwordgenerator.js
const generateEasyPassword = (username) => {
  const getRandomDigits = (length = 3) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10); // 0–9 allowed
    }
    return result;
  };

  const digits = getRandomDigits(3);
  return `${username}${digits}`;
};

module.exports = { generateEasyPassword };
