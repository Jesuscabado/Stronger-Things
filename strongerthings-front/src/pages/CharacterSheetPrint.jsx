import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { charactersApi } from "../api/characters.js";

const mod = (score) => Math.floor((score - 10) / 2);
const formatMod = (n) => n >= 0 ? `+${n}` : `${n}`;
const profBonus = (level) => Math.ceil(level / 4) + 1;

// Habilidades de D&D 5e con su atributo asociado
const SKILLS = [
    { name: "Acrobacias", abbr: "Des", key: "dexterity" },
    { name: "Atletismo", abbr: "Fue", key: "strength" },
    { name: "C. Arcano", abbr: "Int", key: "intelligence" },
    { name: "Engaño", abbr: "Car", key: "charisma" },
    { name: "Historia", abbr: "Int", key: "intelligence" },
    { name: "Interpretación", abbr: "Car", key: "charisma" },
    { name: "Intimidación", abbr: "Car", key: "charisma" },
    { name: "Investigación", abbr: "Int", key: "intelligence" },
    { name: "Juego de Manos", abbr: "Des", key: "dexterity" },
    { name: "Medicina", abbr: "Sab", key: "wisdom" },
    { name: "Naturaleza", abbr: "Int", key: "intelligence" },
    { name: "Percepción", abbr: "Sab", key: "wisdom" },
    { name: "Perspicacia", abbr: "Sab", key: "wisdom" },
    { name: "Persuasión", abbr: "Car", key: "charisma" },
    { name: "Religión", abbr: "Int", key: "intelligence" },
    { name: "Sigilo", abbr: "Des", key: "dexterity" },
    { name: "Supervivencia", abbr: "Sab", key: "wisdom" },
    { name: "T. con Animales", abbr: "Sab", key: "wisdom" }
];

const ABILITIES = [
    { label: "FUERZA", key: "strength" },
    { label: "DESTREZA", key: "dexterity" },
    { label: "CONSTITUCIÓN", key: "constitution" },
    { label: "INTELIGENCIA", key: "intelligence" },
    { label: "SABIDURÍA", key: "wisdom" },
    { label: "CARISMA", key: "charisma" }
];

export default function CharacterSheetPrint() {
    const { id } = useParams();
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        charactersApi.get(id)
            .then(setCharacter)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="sheet-loading">Cargando hoja...</div>;
    if (error) return <div className="sheet-loading">Error: {error}</div>;
    if (!character) return null;

    const stats = character.abilityScores || {};
    const pb = profBonus(character.level || 1);
    const dexMod = mod(stats.dexterity || 10);
    const wisMod = mod(stats.wisdom || 10);
    const passivePerception = 10 + wisMod;

    return (
        <div className="sheet-wrapper">
            {/* Botones de control (solo se ven en pantalla, no al imprimir) */}
            <div className="sheet-controls no-print">
                <button onClick={() => window.print()} className="btn btn-primary">
                    🖨 Imprimir / Guardar como PDF
                </button>
                <button onClick={() => window.close()} className="btn">
                    ← Cerrar
                </button>
            </div>

            <div className="sheet-page">
                {/* Cabecera */}
                <div className="sheet-header">
                    <div className="sheet-title">
                        <div className="sheet-logo">⚔ DUNGEONS &amp; DRAGONS</div>
                        <div className="sheet-charname">{character.name}</div>
                    </div>
                    <div className="sheet-meta">
                        <div className="meta-row">
                            <div className="meta-cell">
                                <div className="meta-label">CLASE Y NIVEL</div>
                                <div className="meta-value">{character.charClass} {character.level}</div>
                            </div>
                            <div className="meta-cell">
                                <div className="meta-label">RAZA</div>
                                <div className="meta-value">{character.race || "—"}</div>
                            </div>
                            <div className="meta-cell">
                                <div className="meta-label">JUGADOR</div>
                                <div className="meta-value">{character.user?.username || "—"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sheet-body">
                    {/* Columna izquierda: atributos */}
                    <div className="sheet-col-left">
                        {ABILITIES.map(a => {
                            const score = stats[a.key] ?? 10;
                            const m = mod(score);
                            return (
                                <div key={a.key} className="ability-box">
                                    <div className="ability-label">{a.label}</div>
                                    <div className="ability-mod">{formatMod(m)}</div>
                                    <div className="ability-score">{score}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Columna central: salvaciones, habilidades, AC, HP */}
                    <div className="sheet-col-center">
                        <div className="prof-bonus">
                            <div className="prof-label">BONIFICADOR POR COMPETENCIA</div>
                            <div className="prof-value">+{pb}</div>
                        </div>

                        <div className="saving-throws">
                            <div className="section-title">TIRADAS DE SALVACIÓN</div>
                            {ABILITIES.map(a => (
                                <div key={a.key} className="skill-row">
                                    <span className="skill-circle">○</span>
                                    <span className="skill-mod">{formatMod(mod(stats[a.key] ?? 10))}</span>
                                    <span className="skill-name">{a.label.charAt(0) + a.label.slice(1).toLowerCase()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="skills">
                            <div className="section-title">HABILIDADES</div>
                            {SKILLS.map(s => (
                                <div key={s.name} className="skill-row">
                                    <span className="skill-circle">○</span>
                                    <span className="skill-mod">{formatMod(mod(stats[s.key] ?? 10))}</span>
                                    <span className="skill-name">{s.name} <span className="skill-attr">({s.abbr})</span></span>
                                </div>
                            ))}
                        </div>

                        <div className="passive-box">
                            <div className="passive-value">{passivePerception}</div>
                            <div className="passive-label">PERCEPCIÓN PASIVA (SAB)</div>
                        </div>
                    </div>

                    {/* Columna derecha: combate, ataques, inventario, rasgos */}
                    <div className="sheet-col-right">
                        <div className="combat-stats">
                            <div className="combat-cell">
                                <div className="combat-value">10 + {dexMod}</div>
                                <div className="combat-label">CLASE DE ARMADURA</div>
                            </div>
                            <div className="combat-cell">
                                <div className="combat-value">{formatMod(dexMod)}</div>
                                <div className="combat-label">INICIATIVA</div>
                            </div>
                            <div className="combat-cell">
                                <div className="combat-value">30 ft</div>
                                <div className="combat-label">VELOCIDAD</div>
                            </div>
                        </div>

                        <div className="hp-box">
                            <div className="hp-label">PUNTOS DE GOLPE</div>
                            <div className="hp-current">
                                {character.hitPoints?.current ?? 0} / {character.hitPoints?.max ?? 0}
                            </div>
                            <div className="hp-sub">PG actuales / máximos</div>
                        </div>

                        <div className="gold-box">
                            <div className="gold-label">💰 ORO</div>
                            <div className="gold-value">{character.gold ?? 0} po</div>
                        </div>

                        <div className="attacks-section">
                            <div className="section-title">ATAQUES Y ARMAS</div>
                            <table className="attacks-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Bono</th>
                                        <th>Daño/Tipo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {character.inventory
                                        ?.filter(i => i.equipped && i.baseObject?.stats?.damage)
                                        ?.map(i => {
                                            const isFinesse = i.baseObject?.stats?.properties?.includes("Sutileza");
                                            const usesDex = isFinesse && dexMod > mod(stats.strength ?? 10);
                                            const abilityMod = usesDex ? dexMod : mod(stats.strength ?? 10);
                                            return (
                                                <tr key={i._id}>
                                                    <td>{i.customName || i.baseObject?.name}</td>
                                                    <td>{formatMod(abilityMod + pb)}</td>
                                                    <td>{i.baseObject.stats.damage} {i.baseObject.stats.damageType || ""}</td>
                                                </tr>
                                            );
                                        })}
                                    {(!character.inventory || character.inventory.filter(i => i.equipped && i.baseObject?.stats?.damage).length === 0) && (
                                        <tr><td colSpan="3" className="empty-row">Sin armas equipadas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="equipment-section">
                            <div className="section-title">EQUIPO</div>
                            <ul className="equipment-list">
                                {character.inventory?.length > 0 ? (
                                    character.inventory.map(i => (
                                        <li key={i._id}>
                                            {i.customName ? (
                                                <>
                                                    <strong>{i.customName}</strong> <em>({i.baseObject?.name})</em>
                                                </>
                                            ) : i.baseObject?.name}
                                            {i.quantity > 1 && ` ×${i.quantity}`}
                                            {i.equipped && <span className="badge-eq"> ⚔</span>}
                                        </li>
                                    ))
                                ) : (
                                    <li className="empty-row">Las alforjas están vacías</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="sheet-footer">
                    Generado por StrongerThings — D&amp;D 5e Character Manager
                </div>
            </div>
        </div>
    );
}
