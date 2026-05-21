import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { authApi } from "../../api/auth.js";

/**
 * Botón "Continuar con Google" reutilizable.
 *
 * Pintado por la propia librería oficial de Google (botón gris con
 * el logo de Google). Cuando el usuario completa el flujo, recibe un
 * "credential" (un JWT firmado por Google) que enviamos al backend
 * para verificar y completar el login.
 *
 * Props:
 *   - onError: callback opcional para errores (errores se muestran solos
 *              vía toast si no se provee).
 */
export default function GoogleLoginButton({ onError }) {
    const { loginWithCredentials } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSuccess = async (credentialResponse) => {
        const credential = credentialResponse?.credential;
        if (!credential) {
            onError?.("No se recibió credencial de Google");
            return;
        }

        try {
            setLoading(true);
            const { user, token } = await authApi.loginWithGoogle(credential);
            loginWithCredentials({ user, token });
            navigate("/characters");
        } catch (err) {
            console.error("Google login error:", err);
            onError?.(err.message || "Error al entrar con Google");
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        onError?.("El flujo de Google fue cancelado o falló");
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}>
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={false}
                text="continue_with"
                locale="es"
                shape="rectangular"
                theme="outline"
                size="large"
                itp_support={true}
                context="use"
            />
        </div>
    );
}