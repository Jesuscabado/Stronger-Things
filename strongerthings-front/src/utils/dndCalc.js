/**
 * Helpers de cálculo de D&D 5e.
 */

/** Modificador a partir de la puntuación de atributo (1-30). */
export const abilityMod = (score) => Math.floor(((score ?? 10) - 10) / 2);

/** Formato del modificador con signo (+3, -1, +0). */
export const formatMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** Bonificador por competencia según el nivel del personaje. */
export const proficiencyBonus = (level) => Math.ceil((level || 1) / 4) + 1;

/**
 * Lista de las 18 habilidades de D&D 5e en español + atributo asociado + clave del modelo.
 */
export const SKILL_LIST = [
    { key: "acrobatics",      label: "Acrobacias",       ability: "dexterity",    abbr: "Des" },
    { key: "animalHandling",  label: "T. con Animales",  ability: "wisdom",       abbr: "Sab" },
    { key: "arcana",          label: "C. Arcano",        ability: "intelligence", abbr: "Int" },
    { key: "athletics",       label: "Atletismo",        ability: "strength",     abbr: "Fue" },
    { key: "deception",       label: "Engaño",           ability: "charisma",     abbr: "Car" },
    { key: "history",         label: "Historia",         ability: "intelligence", abbr: "Int" },
    { key: "insight",         label: "Perspicacia",      ability: "wisdom",       abbr: "Sab" },
    { key: "intimidation",    label: "Intimidación",     ability: "charisma",     abbr: "Car" },
    { key: "investigation",   label: "Investigación",    ability: "intelligence", abbr: "Int" },
    { key: "medicine",        label: "Medicina",         ability: "wisdom",       abbr: "Sab" },
    { key: "nature",          label: "Naturaleza",       ability: "intelligence", abbr: "Int" },
    { key: "perception",      label: "Percepción",       ability: "wisdom",       abbr: "Sab" },
    { key: "performance",     label: "Interpretación",   ability: "charisma",     abbr: "Car" },
    { key: "persuasion",      label: "Persuasión",       ability: "charisma",     abbr: "Car" },
    { key: "religion",        label: "Religión",         ability: "intelligence", abbr: "Int" },
    { key: "sleightOfHand",   label: "Juego de Manos",   ability: "dexterity",    abbr: "Des" },
    { key: "stealth",         label: "Sigilo",           ability: "dexterity",    abbr: "Des" },
    { key: "survival",        label: "Supervivencia",    ability: "wisdom",       abbr: "Sab" }
];

export const ABILITY_LIST = [
    { key: "strength",     label: "Fuerza",       short: "FUE" },
    { key: "dexterity",    label: "Destreza",     short: "DES" },
    { key: "constitution", label: "Constitución", short: "CON" },
    { key: "intelligence", label: "Inteligencia", short: "INT" },
    { key: "wisdom",       label: "Sabiduría",    short: "SAB" },
    { key: "charisma",     label: "Carisma",      short: "CAR" }
];

/**
 * Calcula el bonificador final de una salvación.
 * Es: modificador del atributo + (bonus por competencia si tiene proficiencia).
 */
export const savingThrowMod = (character, abilityKey) => {
    const score = character.abilityScores?.[abilityKey] ?? 10;
    const isProf = character.proficiencies?.savingThrows?.[abilityKey];
    const pb = proficiencyBonus(character.level);
    return abilityMod(score) + (isProf ? pb : 0);
};

/**
 * Calcula el bonificador final de una habilidad.
 */
export const skillMod = (character, skill) => {
    const score = character.abilityScores?.[skill.ability] ?? 10;
    const isProf = character.proficiencies?.skills?.[skill.key];
    const pb = proficiencyBonus(character.level);
    return abilityMod(score) + (isProf ? pb : 0);
};

/**
 * Percepción pasiva = 10 + bonificador de Percepción.
 */
export const passivePerception = (character) => {
    const perception = SKILL_LIST.find(s => s.key === "perception");
    return 10 + skillMod(character, perception);
};
