import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CharactersPage from "./pages/CharactersPage.jsx";
import CharacterDetailPage from "./pages/CharacterDetailPage.jsx";
import ObjectsPage from "./pages/ObjectsPage.jsx";
import SpellsPage from "./pages/SpellsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import CharacterSheetPrint from "./pages/CharacterSheetPrint.jsx";
import DiaryPage from "./pages/DiaryPage.jsx";

export default function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<Navigate to="/characters" replace />} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/characters" element={
                    <ProtectedRoute><CharactersPage /></ProtectedRoute>
                } />
                <Route path="/characters/:id" element={
                    <ProtectedRoute><CharacterDetailPage /></ProtectedRoute>
                } />
                <Route path="/characters/:id/print" element={
                    <ProtectedRoute><CharacterSheetPrint /></ProtectedRoute>
                } />
                <Route path="/objects" element={
                    <ProtectedRoute><ObjectsPage /></ProtectedRoute>
                } />
                <Route path="/diary" element={
    <ProtectedRoute><DiaryPage /></ProtectedRoute>
} />
                <Route path="/spells" element={
                    <ProtectedRoute><SpellsPage /></ProtectedRoute>
                } />
                <Route path="*" element={<div className="container"><h1>Aquí no hay nada</h1></div>} />
            </Routes>
        </>
    );
}