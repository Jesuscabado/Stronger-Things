// ─── Paleta de campañas ───────────────────────────────────────────────────────
// 8 colores que rotan por orden de creación (0 = campaña más antigua).

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

export function campaignColor(index) {
    const n = typeof index === "number" ? index : 0;
    return CAMPAIGN_PALETTE[n % CAMPAIGN_PALETTE.length];
}

// ─── Tipos de monstruo ────────────────────────────────────────────────────────
// Colores temáticos: el tipo evoca visualmente a la criatura.

export const MONSTER_TYPE_COLORS = {
    "Aberración":      { color: "#7b2d8b", bg: "rgba(123,45,139,0.10)"  }, // Púrpura oscuro — horror eldritch
    "Bestia":          { color: "#8b5a2b", bg: "rgba(139,90,43,0.10)"   }, // Marrón tierra — animal natural
    "Celestial":       { color: "#c9920a", bg: "rgba(201,146,10,0.10)"  }, // Dorado — luz divina
    "Constructo":      { color: "#4a7a9a", bg: "rgba(74,122,154,0.10)"  }, // Azul acero — mecánico
    "Dragón":          { color: "#c0362a", bg: "rgba(192,54,42,0.10)"   }, // Rojo — fuego y poder
    "Elemental":       { color: "#1eb7b7", bg: "rgba(30,183,183,0.10)"  }, // Turquesa — energía elemental
    "Hada":            { color: "#c4479a", bg: "rgba(196,71,154,0.10)"  }, // Rosa — magia feérica
    "Gigante":         { color: "#b05e00", bg: "rgba(176,94,0,0.10)"    }, // Naranja oscuro — fuerza bruta
    "Humanoide":       { color: "#3b6dff", bg: "rgba(59,109,255,0.10)"  }, // Azul — civilizado
    "Monstruosidad":   { color: "#8a1a2a", bg: "rgba(138,26,42,0.10)"   }, // Granate — criatura corrompida
    "Cieno":           { color: "#5a8a3a", bg: "rgba(90,138,58,0.10)"   }, // Verde oliva — légamo
    "Planta":          { color: "#2d8a3e", bg: "rgba(45,138,62,0.10)"   }, // Verde vivo — naturaleza
    "Muerto viviente": { color: "#4a3d6a", bg: "rgba(74,61,106,0.10)"   }, // Gris morado — nigromancia
};

export function monsterTypeColor(type) {
    return MONSTER_TYPE_COLORS[type] ?? { color: "#888888", bg: "rgba(136,136,136,0.10)" };
}

// ─── Colegios de magia ────────────────────────────────────────────────────────
// Los 8 colegios se alinean 1:1 con la paleta de campaña.

export const SPELL_SCHOOL_COLORS = {
    "Evocación":      { color: "#c0362a", bg: "rgba(192,54,42,0.10)"   },
    "Abjuración":     { color: "#3b6dff", bg: "rgba(59,109,255,0.10)"  },
    "Conjuración":    { color: "#1eb7b7", bg: "rgba(30,183,183,0.10)"  },
    "Adivinación":    { color: "#a347c4", bg: "rgba(163,71,196,0.10)"  },
    "Encantamiento":  { color: "#d47700", bg: "rgba(212,119,0,0.10)"   },
    "Transmutación":  { color: "#2d8a3e", bg: "rgba(45,138,62,0.10)"   },
    "Ilusión":        { color: "#6655aa", bg: "rgba(102,85,170,0.10)"  },
    "Nigromancia":    { color: "#8b5a2b", bg: "rgba(139,90,43,0.10)"   },
};

export function spellSchoolColor(school) {
    return SPELL_SCHOOL_COLORS[school] ?? { color: "#888888", bg: "rgba(136,136,136,0.10)" };
}

// ─── Rarezas de objetos ───────────────────────────────────────────────────────
// Colores estándar de D&D 5e, alineados con la paleta de campaña donde encajan.

export const RARITY_COLORS = {
    common:      { color: "#888888", bg: "rgba(136,136,136,0.10)" },
    uncommon:    { color: "#2d8a3e", bg: "rgba(45,138,62,0.10)"   },
    rare:        { color: "#3b6dff", bg: "rgba(59,109,255,0.10)"  },
    "very rare": { color: "#9106c4", bg: "rgba(163,71,196,0.10)"  },
    legendary:   { color: "#fc8803", bg: "rgba(212,119,0,0.10)"   },
    artifact:    { color: "#f01400", bg: "rgba(192,54,42,0.10)"   },
};

export function rarityColor(rarity) {
    return RARITY_COLORS[rarity?.toLowerCase()] ?? RARITY_COLORS.common;
}
