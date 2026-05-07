import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { charactersApi } from "../api/characters.js";
import {
    ABILITY_LIST,
    SKILL_LIST,
    abilityMod,
    formatMod,
    savingThrowMod,
    skillMod,
    passivePerception,
    proficiencyBonus
} from "../utils/dndCalc.js";

const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    const combat = character.combatStats || {};
    const personality = character.personality || {};
    const physical = character.physical || {};
    const sc = character.spellcasting || {};
    const profs = character.proficiencies || {};

    const pb = proficiencyBonus(character.level);
    const dexMod = abilityMod(stats.dexterity);

    const equippedWeapons = character.inventory?.filter(
        i => i.equipped && i.baseObject?.stats?.damage
    ) || [];

    const computeAttackBonus = (weapon) => {
        const props = weapon.baseObject?.stats?.properties || [];
        const isFinesse = props.some(p => p.toLowerCase().includes("sutileza") || p.toLowerCase().includes("finesse"));
        const isRanged = props.some(p =>
            p.toLowerCase().includes("distancia") || p.toLowerCase().includes("ranged") ||
            p.toLowerCase().includes("arrojadiza") || p.toLowerCase().includes("thrown")
        );
        const strMod = abilityMod(stats.strength);
        const baseMod = isRanged ? dexMod : (isFinesse ? Math.max(strMod, dexMod) : strMod);
        return baseMod + pb;
    };

    const knownSpells = sc.spellsKnown || [];
    const hasSpells = knownSpells.length > 0 || sc.ability;
    const knownByLevel = {};
    for (const k of knownSpells) {
        const lvl = k.spell?.level ?? 0;
        if (!knownByLevel[lvl]) knownByLevel[lvl] = [];
        knownByLevel[lvl].push(k);
    }

    return (
        <div className="sheet-wrapper">
            <div className="sheet-controls no-print">
                <button onClick={() => window.print()} className="btn btn-primary">
                    🖨 Imprimir / Guardar como PDF
                </button>
                <button onClick={() => window.close()} className="btn">← Cerrar</button>
            </div>

            {/* ═══════════════ PÁGINA 1: STATS & COMBATE ═══════════════ */}
            <div className="sheet-page">
                <div className="sheet-header">
                    <div className="sheet-title">
                        <div className="sheet-logo">⚔ StrongerThings</div>
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
                                <div className="meta-label">TRASFONDO</div>
                                <div className="meta-value">{character.background || "—"}</div>
                            </div>
                            <div className="meta-cell">
                                <div className="meta-label">ALINEAMIENTO</div>
                                <div className="meta-value">{character.alignment || "—"}</div>
                            </div>
                            <div className="meta-cell">
                                <div className="meta-label">EXPERIENCIA</div>
                                <div className="meta-value">{character.experiencePoints || 0} XP</div>
                            </div>
                            <div className="meta-cell">
                                <div className="meta-label">JUGADOR</div>
                                <div className="meta-value">{character.user?.username || "—"}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sheet-body">
                    {/* Columna izq: atributos */}
                    <div className="sheet-col-left">
                        {ABILITY_LIST.map(a => {
                            const score = stats[a.key] ?? 10;
                            const m = abilityMod(score);
                            return (
                                <div key={a.key} className="ability-box">
                                    <div className="ability-label">{a.label.toUpperCase()}</div>
                                    <div className="ability-mod">{formatMod(m)}</div>
                                    <div className="ability-score">{score}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Columna centro: bonus, salvaciones, habilidades */}
                    <div className="sheet-col-center">
                        <div className="prof-bonus">
                            <div className="prof-label">BONIFICADOR POR COMPETENCIA</div>
                            <div className="prof-value">+{pb}</div>
                        </div>

                        {character.inspiration && (
                            <div className="inspiration-badge">✨ INSPIRACIÓN</div>
                        )}

                        <div className="saving-throws">
                            <div className="section-title">TIRADAS DE SALVACIÓN</div>
                            {ABILITY_LIST.map(a => {
                                const isProf = profs.savingThrows?.[a.key];
                                const total = savingThrowMod(character, a.key);
                                return (
                                    <div key={a.key} className={`skill-row ${isProf ? "skill-row--prof" : ""}`}>
                                        <span className="skill-circle">{isProf ? "●" : "○"}</span>
                                        <span className="skill-mod">{formatMod(total)}</span>
                                        <span className="skill-name">{a.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="skills">
                            <div className="section-title">HABILIDADES</div>
                            {SKILL_LIST.map(s => {
                                const isProf = profs.skills?.[s.key];
                                const total = skillMod(character, s);
                                return (
                                    <div key={s.key} className={`skill-row ${isProf ? "skill-row--prof" : ""}`}>
                                        <span className="skill-circle">{isProf ? "●" : "○"}</span>
                                        <span className="skill-mod">{formatMod(total)}</span>
                                        <span className="skill-name">{s.label} <span className="skill-attr">({s.abbr})</span></span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="passive-box">
                            <div className="passive-value">{passivePerception(character)}</div>
                            <div className="passive-label">PERCEPCIÓN PASIVA (SAB)</div>
                        </div>
                    </div>

                    {/* Columna der: combate, ataques, inventario */}
                    <div className="sheet-col-right">
                        <div className="combat-stats">
                            <div className="combat-cell">
                                <div className="combat-value">{combat.armorClass ?? 10}</div>
                                <div className="combat-label">CLASE DE ARMADURA</div>
                            </div>
                            <div className="combat-cell">
                                <div className="combat-value">{formatMod((combat.initiative ?? 0) + dexMod)}</div>
                                <div className="combat-label">INICIATIVA</div>
                            </div>
                            <div className="combat-cell">
                                <div className="combat-value">{combat.speed ?? 30}</div>
                                <div className="combat-label">VELOCIDAD (FT)</div>
                            </div>
                        </div>

                        <div className="hp-box">
                            <div className="hp-label">PUNTOS DE GOLPE</div>
                            <div className="hp-current">
                                {character.hitPoints?.current ?? 0} / {character.hitPoints?.max ?? 0}
                            </div>
                            {character.hitPoints?.temporary > 0 && (
                                <div className="hp-temp">+{character.hitPoints.temporary} temporales</div>
                            )}
                        </div>

                        <div className="combat-mini-row">
                            <div className="combat-mini-cell">
                                <span className="mini-label">Dados de golpe</span>
                                <span className="mini-value">
                                    {Math.max(0, (combat.hitDice?.total ?? character.level) - (combat.hitDice?.used ?? 0))}
                                    /{combat.hitDice?.total ?? character.level}{combat.hitDice?.type ?? "d8"}
                                </span>
                            </div>
                            <div className="combat-mini-cell">
                                <span className="mini-label">Salv. muerte</span>
                                <span className="mini-value">
                                    <span style={{ color: "var(--gold)" }}>✓ {combat.deathSaves?.successes ?? 0}</span>
                                    {" / "}
                                    <span style={{ color: "#8b1a1a" }}>✗ {combat.deathSaves?.failures ?? 0}</span>
                                </span>
                            </div>
                        </div>

                        <div className="gold-box">
                            <span className="gold-label">💰 ORO:</span>
                            <span className="gold-value">{character.gold ?? 0} po</span>
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
                                    {equippedWeapons.length > 0 ? equippedWeapons.map(w => (
                                        <tr key={w._id}>
                                            <td>{w.customName || w.baseObject?.name}</td>
                                            <td>{formatMod(computeAttackBonus(w))}</td>
                                            <td>{w.baseObject?.stats?.damage} <span className="attack-type">{w.baseObject?.stats?.damageType}</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" className="empty-row">Sin armas equipadas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="equipment-section">
                            <div className="section-title">EQUIPO</div>
                            {character.inventory?.length > 0 ? (
                                <ul className="equipment-list">
                                    {character.inventory.map(i => (
                                        <li key={i._id}>
                                            {i.customName ? (
                                                <><strong>{i.customName}</strong> <em>({i.baseObject?.name})</em></>
                                            ) : i.baseObject?.name}
                                            {i.quantity > 1 && ` ×${i.quantity}`}
                                            {i.equipped && <span className="badge-eq"> ⚔</span>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="empty-row">Las alforjas están vacías</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sheet-footer">Página 1 — StrongerThings</div>
            </div>

            {/* ═══════════════ PÁGINA 2: PERSONALIDAD ═══════════════ */}
            <div className="sheet-page">
                <div className="sheet-header">
                    <div className="sheet-title">
                        <div className="sheet-logo">⚔ StrongerThings</div>
                        <div className="sheet-charname">{character.name}</div>
                    </div>
                    <div className="sheet-meta">
                        <div className="physical-meta-grid">
                            <PhysicalCell label="EDAD" value={physical.age} />
                            <PhysicalCell label="ALTURA" value={physical.height} />
                            <PhysicalCell label="PESO" value={physical.weight} />
                            <PhysicalCell label="OJOS" value={physical.eyes} />
                            <PhysicalCell label="PIEL" value={physical.skin} />
                            <PhysicalCell label="PELO" value={physical.hair} />
                        </div>
                    </div>
                </div>

                <div className="page2-grid">
                    <div className="page2-col-left">
                        <NarrativeBlock title="ASPECTO DEL PERSONAJE" content={personality.appearance} flex />
                    </div>

                    <div className="page2-col-right">
                        <NarrativeBlock title="RASGOS DE PERSONALIDAD" content={personality.traits} small />
                        <NarrativeBlock title="IDEALES" content={personality.ideals} small />
                        <NarrativeBlock title="VÍNCULOS" content={personality.bonds} small />
                        <NarrativeBlock title="DEFECTOS" content={personality.flaws} small />
                    </div>
                </div>

                <div className="page2-grid">
                    <div className="page2-col-left">
                        <NarrativeBlock title="HISTORIA DEL PERSONAJE" content={personality.backstory} flex />
                    </div>
                    <div className="page2-col-right">
                        <NarrativeBlock title="ALIADOS Y ORGANIZACIONES" content={personality.allies} />
                        <NarrativeBlock title="RASGOS Y ATRIBUTOS ADICIONALES" content={personality.featuresAndTraits} />
                        <NarrativeBlock title="TESORO" content={personality.treasure} />
                    </div>
                </div>

                {(profs.languages?.length > 0 || profs.other?.length > 0) && (
                    <div className="proficiency-section">
                        <div className="section-title">OTRAS COMPETENCIAS E IDIOMAS</div>
                        {profs.languages?.length > 0 && (
                            <div className="prof-line">
                                <strong>Idiomas:</strong> {profs.languages.join(", ")}
                            </div>
                        )}
                        {profs.other?.length > 0 && (
                            <div className="prof-line">
                                <strong>Competencias:</strong> {profs.other.join(", ")}
                            </div>
                        )}
                    </div>
                )}

                <div className="sheet-footer">Página 2 — StrongerThings</div>
            </div>

            {/* ═══════════════ PÁGINA 3: HECHIZOS (solo si aplica) ═══════════════ */}
            {hasSpells && (
                <div className="sheet-page">
                    <div className="sheet-header">
                        <div className="sheet-title">
                            <div className="sheet-logo">⚔ StrongerThings</div>
                            <div className="sheet-charname">{character.name}</div>
                        </div>
                        <div className="sheet-meta">
                            <div className="meta-row">
                                <div className="meta-cell">
                                    <div className="meta-label">CLASE LANZADORA</div>
                                    <div className="meta-value">{character.charClass}</div>
                                </div>
                                <div className="meta-cell">
                                    <div className="meta-label">APTITUD MÁGICA</div>
                                    <div className="meta-value">
                                        {sc.ability ? sc.ability.charAt(0).toUpperCase() + sc.ability.slice(1) : "—"}
                                    </div>
                                </div>
                                <div className="meta-cell">
                                    <div className="meta-label">CD SALVACIÓN</div>
                                    <div className="meta-value">{sc.saveDC ?? 8}</div>
                                </div>
                                <div className="meta-cell">
                                    <div className="meta-label">BONO DE ATAQUE</div>
                                    <div className="meta-value">{formatMod(sc.attackBonus ?? 0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Espacios de conjuro en grid 3x3 */}
                    <div className="spell-slots-section">
                        <div className="section-title">ESPACIOS DE CONJURO</div>
                        <div className="spell-slots-grid">
                            {SLOT_LEVELS.map(lvl => {
                                const slot = sc.spellSlots?.[`level${lvl}`] || { total: 0, used: 0 };
                                const remaining = Math.max(0, slot.total - slot.used);
                                return (
                                    <div key={lvl} className={`slot-print ${slot.total === 0 ? "slot-print--empty" : ""}`}>
                                        <div className="slot-print__level">Nv {lvl}</div>
                                        <div className="slot-print__circles">
                                            {Array.from({ length: slot.total }).map((_, i) => (
                                                <span key={i} className={`slot-circle ${i < slot.used ? "slot-circle--used" : ""}`}>○</span>
                                            ))}
                                            {slot.total === 0 && <span className="slot-print__empty">—</span>}
                                        </div>
                                        <div className="slot-print__count">{remaining}/{slot.total}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hechizos por nivel */}
                    <div className="spells-section">
                        {/* Trucos */}
                        {knownByLevel[0] && (
                            <SpellLevelGroup level={0} spells={knownByLevel[0]} />
                        )}
                        {SLOT_LEVELS.map(lvl => knownByLevel[lvl] ? (
                            <SpellLevelGroup key={lvl} level={lvl} spells={knownByLevel[lvl]} />
                        ) : null)}

                        {knownSpells.length === 0 && (
                            <div className="empty-row" style={{ padding: "2mm" }}>
                                Aún no se conocen hechizos.
                            </div>
                        )}
                    </div>

                    <div className="sheet-footer">Página 3 — StrongerThings</div>
                </div>
            )}
        </div>
    );
}

function PhysicalCell({ label, value }) {
    return (
        <div className="meta-cell">
            <div className="meta-label">{label}</div>
            <div className="meta-value">{value || "—"}</div>
        </div>
    );
}

function NarrativeBlock({ title, content, small, flex }) {
    return (
        <div className={`narrative-block ${flex ? "narrative-block--flex" : ""} ${small ? "narrative-block--small" : ""}`}>
            <div className="narrative-block__title">{title}</div>
            <div className="narrative-block__content">
                {content || <span className="narrative-block__empty">—</span>}
            </div>
        </div>
    );
}

function SpellLevelGroup({ level, spells }) {
    return (
        <div className="spell-print-group">
            <div className="spell-print-group__title">
                {level === 0 ? "TRUCOS" : `NIVEL ${level}`} ({spells.length})
            </div>
            <ul className="spell-print-list">
                {spells.map(known => {
                    const sp = known.spell;
                    if (!sp) return null;
                    return (
                        <li key={known._id}>
                            <span className="spell-print-mark">
                                {level === 0 ? "✦" : (known.prepared ? "●" : "○")}
                            </span>
                            <strong>{sp.name}</strong>
                            <span className="spell-print-meta">
                                {sp.school}
                                {sp.concentration && " • C"}
                                {sp.ritual && " • R"}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
