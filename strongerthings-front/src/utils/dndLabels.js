/**
 * Mapeos de traducción inglés → castellano para los enums de D&D 5e.
 *
 * La BD guarda los valores en inglés (Wizard, Elf, etc.) por compatibilidad
 * con la API D&D 5e. Las funciones de esta utilidad traducen al castellano
 * sólo para mostrar.
 */

export const CLASS_LABELS = {
    Barbarian:  "Bárbaro",
    Bard:       "Bardo",
    Cleric:     "Clérigo",
    Druid:      "Druida",
    Fighter:    "Guerrero",
    Monk:       "Monje",
    Paladin:    "Paladín",
    Ranger:     "Explorador",
    Rogue:      "Pícaro",
    Sorcerer:   "Hechicero",
    Warlock:    "Brujo",
    Wizard:     "Mago",
    Artificer:  "Artífice"
};

export const RACE_LABELS = {
    Human:      "Humano",
    Elf:        "Elfo",
    Dwarf:      "Enano",
    Halfling:   "Mediano",
    Gnome:      "Gnomo",
    "Half-Elf": "Semielfo",
    "Half-Orc": "Semiorco",
    Tiefling:   "Tiflin",
    Dragonborn: "Dracónido",
    Aasimar:    "Aasimar",
    Goliath:    "Goliat"
};

export const ALIGNMENT_LABELS = {
    "Lawful Good":      "Legal Bueno",
    "Neutral Good":     "Neutral Bueno",
    "Chaotic Good":     "Caótico Bueno",
    "Lawful Neutral":   "Legal Neutral",
    "True Neutral":     "Neutral Verdadero",
    "Chaotic Neutral":  "Caótico Neutral",
    "Lawful Evil":      "Legal Malvado",
    "Neutral Evil":     "Neutral Malvado",
    "Chaotic Evil":     "Caótico Malvado",
    "Unaligned":        "Sin Alineamiento"
};

/* Helpers */
export const translateClass = (en) => CLASS_LABELS[en] || en || "";
export const translateRace = (en) => RACE_LABELS[en] || en || "";
export const translateAlignment = (en) => ALIGNMENT_LABELS[en] || en || "";

/* Listas para selects (value en inglés, label en castellano) */
export const CLASS_OPTIONS = Object.entries(CLASS_LABELS).map(([value, label]) => ({ value, label }));
export const RACE_OPTIONS = Object.entries(RACE_LABELS).map(([value, label]) => ({ value, label }));
export const ALIGNMENT_OPTIONS = Object.entries(ALIGNMENT_LABELS).map(([value, label]) => ({ value, label }));