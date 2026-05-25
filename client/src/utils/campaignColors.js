export const CAMPAIGN_PALETTE = [
    { color: "#c0362a", bg: "rgba(192,54,42,0.10)"   },
    { color: "#3b6dff", bg: "rgba(59,109,255,0.10)"  },
    { color: "#1eb7b7", bg: "rgba(30,183,183,0.10)"  },
    { color: "#a347c4", bg: "rgba(163,71,196,0.10)"  },
    { color: "#d47700", bg: "rgba(212,119,0,0.10)"   },
    { color: "#2d8a3e", bg: "rgba(45,138,62,0.10)"   },
    { color: "#6655aa", bg: "rgba(102,85,170,0.10)"  },
    { color: "#8b5a2b", bg: "rgba(139,90,43,0.10)"   },
];

/** Devuelve { color, bg } para el índice de creación de la campaña (0 = más antigua). */
export function campaignColor(index) {
    const n = typeof index === "number" ? index : 0;
    return CAMPAIGN_PALETTE[n % CAMPAIGN_PALETTE.length];
}
