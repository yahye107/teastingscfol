import { motion } from "framer-motion";

const Loading = () => {
  // Colors for the gradient trail
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main spinning orb with gradient trail */}
        <div className="relative h-24 w-24">
          {colors.map((color, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                border: `3px solid ${color}`,
                borderTopColor: "transparent",
                filter: `blur(${i === 0 ? 0 : 1}px)`,
              }}
              animate={{
                rotate: 360,
                scale: [1, 0.9, 1],
              }}
              transition={{
                rotate: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * -0.1,
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                },
              }}
            />
          ))}

          {/* Pulsing core */}
          <motion.div
            className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          />
        </div>

        {/* Animated text */}
        <motion.div
          className="mt-6 flex space-x-1 text-xl font-bold"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {"Loading...".split("").map((char, i) => (
            <motion.span
              key={i}
              className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
              animate={{ y: [0, -10, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                delay: i * 0.1,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Loading;
