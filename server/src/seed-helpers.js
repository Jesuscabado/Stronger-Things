/**
 * Utilidades compartidas por los scripts de seed.
 * sleep, fetchWithRetry y los helpers HTTP (post/put/get).
 */

export const PORT = process.env.APP_PORT || 3001;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const fetchWithRetry = async (url, options = {}, retries = 5, baseDelay = 2000) => {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (res.status === 429 || res.status >= 500) {
                if (attempt < retries) {
                    const wait = baseDelay * attempt;
                    process.stdout.write(`\n   ⏳ ${res.status} en ${url.split("/").pop()}, esperando ${wait}ms...`);
                    await sleep(wait);
                    continue;
                }
            }
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < retries) {
                const wait = baseDelay * attempt;
                process.stdout.write(`\n   ⏳ ${err.message} en ${url.split("/").pop()}, reintentando en ${wait}ms...`);
                await sleep(wait);
                continue;
            }
        }
    }
    throw lastError || new Error("Retries exhausted");
};

export const post = async (path, body, token) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        return { res, json };
    } catch (err) {
        return { res: { ok: false, status: 0 }, json: { message: err.message } };
    }
};

export const put = async (path, body, token) => {
    try {
        const res = await fetchWithRetry(`${BASE_URL}${path}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(body)
        });
        const json = await res.json().catch(() => ({}));
        return { res, json };
    } catch (err) {
        return { res: { ok: false, status: 0 }, json: { message: err.message } };
    }
};

export const get = async (path, token) => {
    const res = await fetchWithRetry(
        `${BASE_URL}${path}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    );
    return res.json();
};
