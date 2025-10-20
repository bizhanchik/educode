import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background with slow animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#edf9f5] via-[#f4f8ff] to-[#eaf3ff] bg-[length:400%_400%] animate-slowShift"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-subtle-pattern opacity-[0.05]"></div>
      
      {/* Animated gradient blobs */}
      <motion.div 
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-accent-blue/10 to-accent-green/5 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      <motion.div 
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-to-l from-accent-green/10 to-accent-blue/5 blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />
      
      {/* Subtle floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30 blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;