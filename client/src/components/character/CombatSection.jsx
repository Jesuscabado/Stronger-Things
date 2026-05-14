import { useState, useEffect } from "react";
import {
    abilityMod,
    formatMod,
    proficiencyBonus
} from "../../utils/dndCalc.js";

const HIT_DICE_TYPES = ["d6", "d8", "d10", "d12"];

/**
 * Pestaña COMBATE — CA, iniciativa, velocidad, PG, dados de golpe,
 * salvaciones contra muerte, tabla de ataques.
 */
export default function CombatSection({ character, onUpdate }) {
    const stats = character.abilityScores || {};
    const combat = character.combatStats || {};
    const hp = character.hitPoints || {};
    const dexMod = abilityMod(stats.dexterity);
    const pb = proficiencyBonus(character.level);

    // Helpers de actualización
    const updateCombat = (field, value) => {
        onUpdate({ combatStats: { ...combat, [field]: value } });
    };

    const updateHitDice = (field, value) => {
        onUpdate({
            combatStats: {
                ...combat,
                hitDice: { ...(combat.hitDice || {}), [field]: value }
            }
        });
    };

    const updateDeathSaves = (field, value) => {
        const current = combat.deathSaves || { successes: 0, failures: 0 };
        onUpdate({
            combatStats: {
                ...combat,
                deathSaves: { ...current, [field]: value }
            }
        });
    };

    const resetDeathSaves = () => {
        onUpdate({
            combatStats: {
                ...combat,
                deathSaves: { successes: 0, failures: 0 }
            }
        });
    };

    const updateHitPoints = (field, value) => {
        onUpdate({ hitPoints: { ...hp, [field]: value } });
    };

    // Calcular ataques desde armas equipadas del inventario
    const equippedWeapons = character.inventory?.filter(
        i => i.equipped && i.baseObject?.stats?.damage
    ) || [];

    const computeAttackBonus = (weapon) => {
        const props = weapon.baseObject?.stats?.properties || [];
        const isFinesse = props.some(p =>
            p.toLowerCase().includes("sutileza") || p.toLowerCase().includes("finesse")
        );
        const isRanged = props.some(p =>
            p.toLowerCase().includes("distancia") || p.toLowerCase().includes("ranged") ||
            p.toLowerCase().includes("arrojadiza") || p.toLowerCase().includes("thrown")
        );
        const strMod = abilityMod(stats.strength);
        const dxMod = dexMod;
        // Sutileza = el mayor de los dos. A distancia = DES.
        const baseMod = isRanged ? dxMod : (isFinesse ? Math.max(strMod, dxMod) : strMod);
        return baseMod + pb;
    };

    return (
        <>
            {/* Stats principales: CA, Iniciativa, Velocidad */}
            <div className="scroll-card">
                <h2>Estadísticas de combate</h2>
                <div className="combat-stats-row">
                    <BigStat
                        label="Clase de Armadura"
                        value={combat.armorClass ?? 10}
                        onSave={(v) => updateCombat("armorClass", v)}
                        min={1} max={30}
                    />
                    <BigStat
                        label="Iniciativa"
                        value={(combat.initiative ?? 0) + dexMod}
                        readonly
                        helper={`Des ${formatMod(dexMod)} + bonus ${formatMod(combat.initiative ?? 0)}`}
                    />
                    <BigStat
                        label="Velocidad"
                        value={combat.speed ?? 30}
                        suffix=" ft"
                        onSave={(v) => updateCombat("speed", v)}
                        min={0} max={120}
                    />
                </div>

                {/* Bonus extra de iniciativa (editable separado) */}
                <div style={{ marginTop: "1rem", padding: "0.7rem", background: "rgba(184, 134, 11, 0.05)", borderRadius: "4px" }}>
                    <label style={{ fontSize: "0.85rem", color: "var(--ink-faded)" }}>
                        Bonificador extra de iniciativa (talentos, dotes, objetos):{" "}
                        <EditableNumber
                            value={combat.initiative ?? 0}
                            onSave={(v) => updateCombat("initiative", v)}
                        />
                    </label>
                </div>
            </div>

            {/* Puntos de golpe */}
            <div className="scroll-card">
                <h2>❤ Puntos de golpe</h2>
                <div className="combat-stats-row">
                    <BigStat
                        label="PG actuales"
                        value={hp.current ?? 0}
                        onSave={(v) => updateHitPoints("current", v)}
                        color="var(--blood, #8b1a1a)"
                        min={0}
                    />
                    <BigStat
                        label="PG máximos"
                        value={hp.max ?? 0}
                        onSave={(v) => updateHitPoints("max", v)}
                        min={1}
                    />
                    <BigStat
                        label="PG temporales"
                        value={hp.temporary ?? 0}
                        onSave={(v) => updateHitPoints("temporary", v)}
                        min={0}
                    />
                </div>
            </div>

            {/* Dados de golpe + Salvaciones contra muerte */}
            <div className="scroll-card">
                <div className="combat-two-cols">
                    <div>
                        <h2 style={{ marginTop: 0 }}>🎲 Dados de golpe</h2>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                            <span>Total:</span>
                            <EditableNumber
                                value={combat.hitDice?.total ?? character.level ?? 1}
                                onSave={(v) => updateHitDice("total", v)}
                                min={0}
                            />
                            <select
                                value={combat.hitDice?.type ?? "d8"}
                                onChange={(e) => updateHitDice("type", e.target.value)}
                                style={{ width: "auto", padding: "0.3rem" }}
                            >
                                {HIT_DICE_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span>Usados:</span>
                            <EditableNumber
                                value={combat.hitDice?.used ?? 0}
                                onSave={(v) => updateHitDice("used", v)}
                                min={0}
                                max={combat.hitDice?.total ?? character.level}
                            />
                            <span style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                (quedan {Math.max(0, (combat.hitDice?.total ?? 0) - (combat.hitDice?.used ?? 0))})
                            </span>
                        </div>
                    </div>

                    <div>
                        <h2 style={{ marginTop: 0 }}>💀 Salvaciones contra muerte</h2>
                        <div style={{ marginBottom: "0.5rem" }}>
                            <DeathSaveRow
                                label="Éxitos"
                                value={combat.deathSaves?.successes ?? 0}
                                color="var(--gold, #b8860b)"
                                onChange={(v) => updateDeathSaves("successes", v)}
                            />
                            <DeathSaveRow
                                label="Fallos"
                                value={combat.deathSaves?.failures ?? 0}
                                color="var(--blood, #8b1a1a)"
                                onChange={(v) => updateDeathSaves("failures", v)}
                            />
                        </div>
                        <button className="btn btn-small" onClick={resetDeathSaves}>↻ Resetear</button>
                    </div>
                </div>
            </div>

            {/* Tabla de ataques (calculada de armas equipadas) */}
            <div className="scroll-card">
                <h2>⚔ Ataques y armas</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginTop: "-0.5rem" }}>
                    Calculado automáticamente a partir de las armas equipadas en tu inventario.
                </p>
                {equippedWeapons.length === 0 ? (
                    <div className="empty">Sin armas equipadas. Equipa un arma desde la pestaña Inventario.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid var(--ink)", textAlign: "left" }}>
                                <th style={{ padding: "0.5rem", fontFamily: "Cinzel", fontSize: "0.8rem", textTransform: "uppercase" }}>Arma</th>
                                <th style={{ padding: "0.5rem", fontFamily: "Cinzel", fontSize: "0.8rem", textTransform: "uppercase", width: "100px" }}>Ataque</th>
                                <th style={{ padding: "0.5rem", fontFamily: "Cinzel", fontSize: "0.8rem", textTransform: "uppercase" }}>Daño</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equippedWeapons.map(w => {
                                const bonus = computeAttackBonus(w);
                                return (
                                    <tr key={w._id} style={{ borderBottom: "1px dashed var(--parchment-shadow)" }}>
                                        <td style={{ padding: "0.5rem" }}>
                                            <strong>{w.customName || w.baseObject?.name}</strong>
                                            {w.customName && (
                                                <span style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                                    {" "}({w.baseObject?.name})
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                                            {formatMod(bonus)}
                                        </td>
                                        <td style={{ padding: "0.5rem" }}>
                                            {w.baseObject?.stats?.damage}{" "}
                                            <span style={{ color: "var(--ink-faded)", fontSize: "0.85rem" }}>
                                                {w.baseObject?.stats?.damageType}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

/**
 * Caja grande con valor y label, editable o de solo lectura.
 */
function BigStat({ label, value, onSave, suffix = "", helper, color, readonly, min, max }) {
    return (
        <div style={{
            border: "2px solid var(--ink)",
            borderRadius: "6px",
            padding: "0.8rem",
            textAlign: "center",
            background: "rgba(255,255,255,0.3)"
        }}>
            <div style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: color || "var(--ink)",
                lineHeight: 1
            }}>
                {readonly ? (
                    <>{value > 0 ? "+" : ""}{value}{suffix}</>
                ) : (
                    <>
                        <EditableNumber value={value} onSave={onSave} min={min} max={max} />
                        {suffix}
                    </>
                )}
            </div>
            <div style={{
                fontSize: "0.7rem",
                fontFamily: "Cinzel, serif",
                color: "var(--ink-faded)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginTop: "0.4rem",
                lineHeight: 1.2
            }}>
                {label}
            </div>
            {helper && (
                <div style={{ fontSize: "0.7rem", color: "var(--ink-faded)", marginTop: "0.3rem", fontStyle: "italic" }}>
                    {helper}
                </div>
            )}
        </div>
    );
}

/**
 * Fila de circulitos de salvaciones contra muerte (3 max).
 */
function DeathSaveRow({ label, value, color, onChange }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <span style={{ width: "70px", fontSize: "0.9rem" }}>{label}:</span>
            {[1, 2, 3].map(n => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(value === n ? n - 1 : n)}
                    style={{
                        width: "20px", height: "20px",
                        borderRadius: "50%",
                        border: `2px solid ${color}`,
                        background: n <= value ? color : "transparent",
                        cursor: "pointer",
                        padding: 0
                    }}
                    aria-label={`${label} ${n}`}
                />
            ))}
        </div>
    );
}

function EditableNumber({ value, onSave, min, max }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);

    useEffect(() => { setDraft(value); }, [value]);

    const commit = () => {
        const n = Number(draft);
        if (!Number.isFinite(n) || n === value) {
            setEditing(false);
            setDraft(value);
            return;
        }
        if (min != null && n < min) { setDraft(value); setEditing(false); return; }
        if (max != null && n > max) { setDraft(value); setEditing(false); return; }
        onSave(n);
        setEditing(false);
    };

    if (!editing) {
        return (
            <strong onClick={() => setEditing(true)} style={{ cursor: "pointer", borderBottom: "1px dotted var(--ink-faded)" }}>
                {value}
            </strong>
        );
    }

    return (
        <input
            type="number"
            autoFocus
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") { setDraft(value); setEditing(false); }
            }}
            style={{ width: "60px", display: "inline-block", padding: "0.1rem 0.3rem", fontSize: "1rem" }}
        />
    );
}
