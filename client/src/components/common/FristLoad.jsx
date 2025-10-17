import { useState, useEffect } from "react";

const UseDelayedLoading = (delay = 1000) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
};

export default UseDelayedLoading;
