/**
 * Logger con niveles, timestamps y colores en consola.
 * Uso:
 *   logger.info("Servidor arrancado", { port: 3001 });
 *   logger.warn("Petición lenta", { ms: 5234 });
 *   logger.error("Error de BD", err);
 *   logger.debug("Variable interna", { value });   // solo si LOG_LEVEL=debug
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
    error: "\x1b[31m",   // rojo
    warn:  "\x1b[33m",   // amarillo
    info:  "\x1b[36m",   // cyan
    debug: "\x1b[90m",   // gris
    reset: "\x1b[0m"
};

const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const formatTime = () => {
    const d = new Date();
    return d.toISOString().replace("T", " ").substring(0, 19);
};

const formatMeta = (meta) => {
    if (!meta) return "";
    if (meta instanceof Error) {
        return `\n  ${COLORS.error}${meta.stack || meta.message}${COLORS.reset}`;
    }
    if (typeof meta === "object") {
        try {
            return ` ${JSON.stringify(meta)}`;
        } catch {
            return ` [object]`;
        }
    }
    return ` ${meta}`;
};

const log = (level, message, meta) => {
    if (LEVELS[level] > currentLevel) return;
    const time = formatTime();
    const color = COLORS[level] || "";
    const tag = `[${level.toUpperCase()}]`.padEnd(7);
    console.log(`${color}${time} ${tag}${COLORS.reset} ${message}${formatMeta(meta)}`);
};

export const logger = {
    error: (msg, meta) => log("error", msg, meta),
    warn:  (msg, meta) => log("warn",  msg, meta),
    info:  (msg, meta) => log("info",  msg, meta),
    debug: (msg, meta) => log("debug", msg, meta)
};

export default logger;
