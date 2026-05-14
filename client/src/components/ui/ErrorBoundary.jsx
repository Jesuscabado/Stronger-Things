import { Component } from "react";

/**
 * Error Boundary global. Atrapa errores de renderizado en componentes hijos
 * y muestra una pantalla de error con detalles en lugar de una pantalla en blanco.
 *
 * Uso en main.jsx o App.jsx:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Crash atrapado:", error);
        console.error("[ErrorBoundary] Stack:", errorInfo.componentStack);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = "/";
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="error-boundary">
                <div className="error-boundary__content">
                    <div className="error-boundary__icon">💥</div>
                    <h1 className="error-boundary__title">Algo ha salido mal</h1>
                    <p className="error-boundary__subtitle">
                        La aplicación ha encontrado un error inesperado.
                    </p>

                    <div className="error-boundary__details">
                        <strong>Error:</strong> {this.state.error?.message || "Desconocido"}
                    </div>

                    {import.meta.env.DEV && this.state.errorInfo && (
                        <details className="error-boundary__stack">
                            <summary>Ver stack trace (solo en desarrollo)</summary>
                            <pre>{this.state.errorInfo.componentStack}</pre>
                        </details>
                    )}

                    <div className="error-boundary__actions">
                        <button className="btn btn-primary" onClick={this.handleReset}>
                            🏠 Volver al inicio
                        </button>
                        <button className="btn" onClick={() => window.location.reload()}>
                            🔄 Recargar página
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
