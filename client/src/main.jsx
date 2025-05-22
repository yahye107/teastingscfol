import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { UserProvider } from "./useContaxt/UseContext";
import { Suspense } from "react";
import Loading from "./components/Admin/componeets/common/Loading";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <UserProvider>
      <App />
      <Toaster />
    </UserProvider>
  </BrowserRouter>
);
