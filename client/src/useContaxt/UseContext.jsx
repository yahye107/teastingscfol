import GlobalLoader from "@/components/common/GlobalLoader";
import { callAuthApi } from "@/service/service";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const roleRoutes = {
    admin: "/admin/dashboard",
    teacher: "/teacher",
    student: "/student",
    parent: "/parent/dashboard",
  };

  // Define route categories
  const publicRoutes = ["/auth", "/auth/login", "/auth/register"];
  const protectedRoutes = Object.values(roleRoutes);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const data = await callAuthApi();

        if (data?.success) {
          const userRole = data.user.role.toLowerCase();
          const allowedPath = roleRoutes[userRole] || "/auth";

          const fullUser = {
            ...data.user,
            studentProfile: data.student || null,
            teacherProfile: data.teacher || null,
            parentProfile: data.parent || null, // ✅ ADD THIS
          };

          setUser(fullUser);

          // Handle route restrictions
          if (publicRoutes.includes(location.pathname)) {
            // Redirect authenticated users away from public routes
            navigate(allowedPath);
          } else if (!location.pathname.startsWith(allowedPath)) {
            // Redirect to role-specific route if accessing wrong protected route
            navigate(allowedPath);
          }
        } else {
          setUser(null);
          // Redirect to auth if trying to access protected routes unauthenticated
          if (
            protectedRoutes.some((route) => location.pathname.startsWith(route))
          ) {
            navigate("/auth");
          }
        }
      } catch (error) {
        setUser(null);
        if (
          protectedRoutes.some((route) => location.pathname.startsWith(route))
        ) {
          navigate("/auth");
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [location.pathname, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-black flex items-center justify-center">
        <div className="h-14 w-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
          Checking session...
        </span>
      </div>
    );
  }
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
