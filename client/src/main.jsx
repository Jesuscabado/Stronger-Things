import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ErrorBoundary from "./components/ui/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <ErrorBoundary>
                <ThemeProvider>
                    <ToastProvider>
                        <AuthProvider>
                            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                            <App />
                            </GoogleOAuthProvider>
                        </AuthProvider>
                    </ToastProvider>
                </ThemeProvider>
            </ErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>
);