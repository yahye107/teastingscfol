import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="h-1 bg-indigo-500 fixed top-0 left-0 z-[999]"
      style={{ width: `${progress}%` }}
      initial={{ width: "0%" }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        if (progress >= 95) {
          setShow(false);
        }
      }}
    />
  );
};

export default ProgressBar;
