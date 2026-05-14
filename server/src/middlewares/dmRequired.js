/* =========================================================================
   server/src/middlewares/dmRequired.js
   -------------------------------------------------------------------------
   Comprueba que el usuario autenticado tiene activada la capacidad de
   Director de Juego (isDM === true). Debe usarse SIEMPRE después de
   authRequired, porque depende de que req.user exista.
   ========================================================================= */

export const dmRequired = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "No autenticado" });
    }
    if (!req.user.isDM) {
        return res.status(403).json({
            message: "Esta acción requiere el modo Director de Juego activado"
        });
    }
    next();
};
