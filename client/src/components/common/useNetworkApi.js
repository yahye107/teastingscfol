import { useState, useEffect } from "react";
import axios from "axios";

export const useNetworkApi = (apiFunction) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleRetry = () => {
    if (!isOnline) return;
    fetchData();
  };

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFunction();
      setResult(res.data);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (isOnline) fetchData();
  }, [isOnline]);

  return { isOnline, loading, error, result, handleRetry };
};
