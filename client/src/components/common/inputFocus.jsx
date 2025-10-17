import { useEffect } from "react";

const useInputFocusScroll = () => {
  useEffect(() => {
    const handleFocus = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    };

    window.addEventListener("focusin", handleFocus);
    return () => window.removeEventListener("focusin", handleFocus);
  }, []);
};

export default useInputFocusScroll;
