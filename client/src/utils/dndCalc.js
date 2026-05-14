/**
 * Helpers de cálculo de D&D 5e con soporte para overrides manuales.
 */

export const abilityMod = (score) => Math.floor(((score ?? 10) - 10) / 2);

export const formatMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

/**
 * Bonificador por competencia.
 * - Si el personaje tiene un override manual, devuelve ese.
 * - Si no, lo calcula a partir del nivel: ceil(nivel / 4) + 1.
 */
export const proficiencyBonus = (levelOrCharacter) => {
    // Permite llamarla con un número (nivel) o con un objeto character (compatibilidad)
    if (typeof levelOrCharacter === "number") {
        return Math.ceil((levelOrCharacter || 1) / 4) + 1;
    }

    const character = levelOrCharacter || {};
    const override = character.combatStats?.proficiencyBonusOverride;
    if (override !== null && override !== undefined && override !== "") {
        return Number(override);
    }
    return Math.ceil((character.level || 1) / 4) + 1;
};

/**
 * Indica si el bonificador por competencia está siendo sobrescrito manualmente.
 */
export const isProficiencyBonusOverridden = (character) => {
    const override = character?.combatStats?.proficiencyBonusOverride;
    return override !== null && override !== undefined && override !== "";
};

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

export const savingThrowMod = (character, abilityKey) => {
    const score = character.abilityScores?.[abilityKey] ?? 10;
    const isProf = character.proficiencies?.savingThrows?.[abilityKey];
    const pb = proficiencyBonus(character);
    return abilityMod(score) + (isProf ? pb : 0);
};

export const skillMod = (character, skill) => {
    const score = character.abilityScores?.[skill.ability] ?? 10;
    const isProf = character.proficiencies?.skills?.[skill.key];
    const pb = proficiencyBonus(character);
    return abilityMod(score) + (isProf ? pb : 0);
};

/**
 * Percepción pasiva.
 * - Si el personaje tiene un override total, devuelve ese.
 * - Si no, calcula 10 + skillMod(Percepción) + bonus extra.
 */
export const passivePerception = (character) => {
    const override = character?.combatStats?.passivePerceptionOverride;
    if (override !== null && override !== undefined && override !== "") {
        return Number(override);
    }
    const perception = SKILL_LIST.find(s => s.key === "perception");
    const base = 10 + skillMod(character, perception);
    const extraBonus = Number(character?.combatStats?.passivePerceptionBonus || 0);
    return base + extraBonus;
};

export const isPassivePerceptionOverridden = (character) => {
    const override = character?.combatStats?.passivePerceptionOverride;
    return override !== null && override !== undefined && override !== "";
};
