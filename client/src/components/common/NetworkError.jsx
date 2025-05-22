// components/NetworkError.jsx
import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const NetworkError = ({ message = "Oops! Something went wrong.", onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
      <WifiOff size={60} className="text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-destructive mb-2">
        No Internet Connection
      </h2>
      <p className="text-gray-500 mb-6">
        {message ||
          "An unexpected error occurred. Please check your connection."}
      </p>
      <Button variant="destructive" onClick={onRetry}>
        Retry
      </Button>
      <p className="text-sm mt-4 text-muted-foreground">
        If the issue persists, please contact support.
      </p>
    </div>
  );
};

export default NetworkError;
