import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/useContaxt/UseContext";
import { calllogoutUserApi } from "@/service/service";

const Logout = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const response = await calllogoutUserApi();
        if (response.success) {
          setUser(null);
          navigate("/auth");
          toast.success("User logged out successfully!");
        }
      } catch (error) {
        toast.error("Logout failed. Please try again.");
      }
    };

    handleLogout(); // Trigger logout immediately on mount
  }, [navigate, setUser]);

  return <div>Logging out...</div>;
};

export default Logout;
