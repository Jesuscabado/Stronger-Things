import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="app-footer__inner">
                <p className="app-footer__copy">
                    &copy; {new Date().getFullYear()} StrongerThings.{" "}
                    Contenido SRD bajo{" "}
                    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                        CC BY 4.0
                    </a>
                    {" "}de Wizards of the Coast LLC.
                </p>
                <nav className="app-footer__links" aria-label="Legal">
                    <Link to="/licenses">Licencias</Link>
                    <Link to="/privacy">Privacidad</Link>
                    <Link to="/terms">Términos</Link>
                </nav>
            </div>
        </footer>
    );
}
