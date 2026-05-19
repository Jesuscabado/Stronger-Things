import { useState, useEffect, useRef } from "react";

export function useNameCheck(checkFn, name, excludeId = null) {
    const [nameError, setNameError] = useState("");
    const [nameChecking, setNameChecking] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!name || !name.trim()) {
            setNameError("");
            setNameChecking(false);
            return;
        }
        clearTimeout(timerRef.current);
        setNameChecking(true);
        timerRef.current = setTimeout(async () => {
            try {
                const { exists } = await checkFn(name.trim(), excludeId);
                setNameError(exists ? "Este nombre ya existe en la base de datos" : "");
            } catch {
                setNameError("");
            } finally {
                setNameChecking(false);
            }
        }, 500);

        return () => clearTimeout(timerRef.current);
    }, [name, excludeId]);

    return { nameError, nameChecking };
}
