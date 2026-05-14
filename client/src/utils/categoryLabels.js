/**
 * Traducciones de las categorías del catálogo de objetos.
 * Las categorías se guardan en inglés en BD (weapon, armor, potion...) porque
 * vienen así de la API D&D 5e, pero las mostramos en castellano en la UI.
 */

export const CATEGORY_LABELS = {
    weapon:     "Arma",
    armor:      "Armadura",
    shield:     "Escudo",
    potion:     "Poción",
    scroll:     "Pergamino",
    wondrous:   "Maravilloso",
    tool:       "Herramienta",
    ammunition: "Munición",
    gear:       "Equipo",
    consumable: "Consumible",
    ring:       "Anillo",
    rod:        "Báculo",
    staff:      "Bastón",
    wand:       "Varita",
    other:      "Otro"
};

export const translateCategory = (en) => CATEGORY_LABELS[en?.toLowerCase()] || en || "Otro";

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
