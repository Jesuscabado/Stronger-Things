import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="app-header">
            <div className="app-header__inner">
                <div className="app-header__brand">
                    <Link to={user ? "/characters" : "/login"}>⚔ StrongerThings</Link>
                </div>
                <nav>
                    {user ? (
                        <>
                            <Link to="/characters">Personajes</Link>
                            <Link to="/objects">Catálogo</Link>
                             <Link to="/spells">conjuros</Link>
                            {user.role === "admin" && <Link to="/admin">⚜ Admin</Link>}
                            <span style={{ opacity: 0.7 }}>{user.username}</span>
                            <button className="btn btn-small" onClick={handleLogout}>Salir</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Entrar</Link>
                            <Link to="/register">Registrarse</Link>
                        </>
                    )}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    );
}
