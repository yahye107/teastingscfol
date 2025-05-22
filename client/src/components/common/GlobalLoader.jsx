import React, { useState } from "react";
import { BarLoader, ClipLoader } from "react-spinners";

const GlobalLoader = ({}) => {
  const [loading, setLoading] = useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="p-6 rounded-2xl  bg-white/10 backdrop-blur-lg border border-white/20">
        <ClipLoader color="#38bdf8" size={50} />
      </div>
    </div>
  );
};

export default GlobalLoader;
