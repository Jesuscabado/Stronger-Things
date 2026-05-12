import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            title={isDark ? "Modo claro" : "Modo oscuro"}
        >
            <span className="theme-toggle__icon">
                {isDark ? "☀" : "🌙"}
            </span>
        </button>
    );
}
