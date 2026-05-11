import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <ErrorBoundary>
    <ToastProvider>
        <AuthProvider>
            <App />
        </AuthProvider>
    </ToastProvider>
</ErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>
);
