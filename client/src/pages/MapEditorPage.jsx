import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Stage, Layer, Rect, Line, Group, Circle, Text, Image as KonvaImage } from "react-konva";
import { TILE_CATALOG, TILE_BY_ID, TILE_DEFAULT, TOKEN_IMAGES } from "../utils/tileCatalog.js";
import { mapsApi } from "../api/maps.js";
import { sessionsApi } from "../api/sessions.js";
import { monstersApi } from "../api/monsters.js";
import { objectsApi } from "../api/objects.js";
import { useAuth } from "../context/AuthContext.jsx";

const CELL = 32;

const TERRAIN_TILES   = TILE_CATALOG.filter(t => t.category === "terrain");
const WALL_TILES      = TILE_CATALOG.filter(t => t.category === "wall");
const FURNITURE_TILES = TILE_CATALOG.filter(t => t.category === "furniture");

function preloadImages(sources) {
    const [images, setImages] = useState({});
    useEffect(() => {
        if (sources.length === 0) return;
        const loaded = {};
        let pending = sources.length;
        const done = () => { if (--pending === 0) setImages({ ...loaded }); };
        sources.forEach(({ key, src }) => {
            const img = new window.Image();
            img.onload  = () => { loaded[key] = img; done(); };
            img.onerror = done;
            img.src = src;
        });
    }, []);
    return images;
}

/** Precarga las PNGs del catálogo de tiles; devuelve { [tileId]: HTMLImageElement } */
function useTileImages() {
    return preloadImages(
        TILE_CATALOG.filter(t => t.img).map(t => ({ key: t.id, src: t.img }))
    );
}

/** Precarga las imágenes de token; devuelve { [imgPath]: HTMLImageElement } */
function useTokenImages() {
    return preloadImages(
        TOKEN_IMAGES.map(t => ({ key: t.img, src: t.img }))
    );
}

function buildEmptyTerrain(cols, rows) {
    return Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) =>
            r === 0 || r === rows - 1 || c === 0 || c === cols - 1
                ? "wall-stone"
                : "floor-stone"
        )
    );
}

function buildEmptyMap(cols = 20, rows = 15) {
    return {
        name: "",
        description: "",
        grid: { cols, rows, cellSize: CELL },
        terrain: buildEmptyTerrain(cols, rows),
        walls: [],
        tokens: []
    };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function MapEditorPage() {
    const { user } = useAuth();
    if (!user?.isDM) {
        return (
            <div className="container">
                <div className="scroll-card" style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
                    <h1>Acceso restringido</h1>
                    <p style={{ color: "var(--ink-faded)" }}>Solo los DM pueden editar mapas.</p>
                </div>
            </div>
        );
    }
    return <Editor />;
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function Editor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionFromQuery = searchParams.get("session"); // set when coming from a session
    const isNew = !id;

    const [setupDone, setSetupDone] = useState(!isNew); // new maps need name+size first

    const [mapData, setMapData]   = useState(buildEmptyMap());
    const [loading, setLoading]   = useState(!isNew);
    const [error, setError]       = useState("");
    const [success, setSuccess]   = useState("");
    const [saving, setSaving]     = useState(false);
    const [showAI, setShowAI]     = useState(false);
    const [linkedDetail, setLinkedDetail] = useState(null); // { type:"monster"|"object", id }

    const tileImages  = useTileImages();
    const tokenImages = useTokenImages();

    const [activeTab, setActiveTab]       = useState("terrain");
    const [selectedTile, setSelectedTile] = useState("floor-stone");

    const isPainting = useRef(false);
    const stageRef   = useRef(null);

    const [ctxMenu, setCtxMenu] = useState(null); // { tokenId, x, y }

    const flash = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 2500);
    };

    // Close context menu on any external click
    useEffect(() => {
        if (!ctxMenu) return;
        const close = () => setCtxMenu(null);
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [Boolean(ctxMenu)]);

    useEffect(() => {
        if (isNew) return;
        setLoading(true);
        mapsApi.get(id)
            .then(m => { setMapData(m); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [id]);

    const save = async () => {
        if (!mapData.name.trim()) { setError("El mapa necesita un nombre"); return; }
        setSaving(true);
        try {
            if (isNew) {
                const payload = sessionFromQuery
                    ? { ...mapData, session: sessionFromQuery }
                    : mapData;
                const created = await mapsApi.create(payload);
                // If we came from a session page, link the session back to this map
                if (sessionFromQuery) {
                    await sessionsApi.update(sessionFromQuery, { map: created._id });
                }
                flash("Mapa guardado");
                navigate(`/maps/${created._id}/edit`, { replace: true });
            } else {
                await mapsApi.update(id, mapData);
                flash("Guardado");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const paintCell = useCallback((col, row, erase) => {
        const tileId = erase ? "floor-stone" : selectedTile;
        setMapData(prev => {
            if (!prev.terrain[row] || prev.terrain[row][col] === undefined) return prev;
            if (prev.terrain[row][col] === tileId) return prev; // no change, skip re-render
            const terrain = prev.terrain.map((r, ri) =>
                ri === row ? r.map((c, ci) => ci === col ? tileId : c) : r
            );
            return { ...prev, terrain };
        });
    }, [selectedTile]);

    const cellFromStage = (stage) => {
        const pos = stage.getPointerPosition();
        return {
            col: Math.floor(pos.x / CELL),
            row: Math.floor(pos.y / CELL)
        };
    };

    const handleStageMouseDown = (e) => {
        if (activeTab === "tokens") return;
        const stage = e.target.getStage();
        if (!stage) return;
        isPainting.current = true;
        const { col, row } = cellFromStage(stage);
        paintCell(col, row, e.evt.shiftKey);
    };

    const handleStageMouseMove = (e) => {
        if (!isPainting.current || activeTab === "tokens") return;
        const stage = e.target.getStage();
        if (!stage) return;
        const { col, row } = cellFromStage(stage);
        paintCell(col, row, e.evt.shiftKey);
    };

    const handleStageMouseUp  = () => { isPainting.current = false; };
    const handleStageMouseLeave = () => { isPainting.current = false; };

    const handleStageClick = (e) => {
        setCtxMenu(null);
        if (activeTab !== "tokens") return;
        if (e.evt.button !== 0) return;
        const stage = e.target.getStage();
        if (!stage) return;
        const { col, row } = cellFromStage(stage);
        // Only add if no token occupies this exact cell
        setMapData(prev => {
            if (prev.tokens.some(t => t.x === col && t.y === row)) return prev;
            return {
                ...prev,
                tokens: [
                    ...prev.tokens,
                    {
                        id: crypto.randomUUID(),
                        kind: "npc",
                        name: "Token",
                        x: col,
                        y: row,
                        color: "#6b4226",
                        notes: ""
                    }
                ]
            };
        });
    };

    const handleTokenDragEnd = useCallback((tokenId, e) => {
        const { cols, rows } = mapData.grid;
        const newX = Math.max(0, Math.min(cols - 1, Math.round(e.target.x() / CELL)));
        const newY = Math.max(0, Math.min(rows - 1, Math.round(e.target.y() / CELL)));
        e.target.x(newX * CELL);
        e.target.y(newY * CELL);
        setMapData(prev => ({
            ...prev,
            tokens: prev.tokens.map(t => t.id === tokenId ? { ...t, x: newX, y: newY } : t)
        }));
    }, [mapData.grid]);

    const handleTokenContextMenu = useCallback((tokenId, e) => {
        e.evt.preventDefault();
        setCtxMenu({ tokenId, x: e.evt.clientX, y: e.evt.clientY });
    }, []);

    const updateToken = useCallback((updated) => {
        setMapData(prev => ({
            ...prev,
            tokens: prev.tokens.map(t => t.id === updated.id ? updated : t)
        }));
        setCtxMenu(null);
    }, []);

    const deleteToken = useCallback((tokenId) => {
        setMapData(prev => ({ ...prev, tokens: prev.tokens.filter(t => t.id !== tokenId) }));
        setCtxMenu(null);
    }, []);

    const loadAIResult = (generated, meta) => {
        setMapData(prev => ({
            name:        generated.name        || prev.name,
            description: generated.description || prev.description,
            grid:        generated.grid        || prev.grid,
            terrain:     generated.terrain     || prev.terrain,
            walls:       generated.walls       ?? prev.walls,
            tokens:      generated.tokens      ?? prev.tokens,
            aiMeta:      meta ?? prev.aiMeta
        }));
        setShowAI(false);
        flash("Mapa generado — revisa y guarda cuando quieras");
    };

    // New map: ask for name + size (or AI generation) before opening the canvas
    if (!setupDone) {
        return (
            <MapSetup
                sessionFromQuery={sessionFromQuery}
                onStart={(name, cols, rows) => {
                    setMapData({ ...buildEmptyMap(cols, rows), name });
                    setSetupDone(true);
                }}
                onStartFromAI={(generated, meta) => {
                    const cols = generated.grid?.cols ?? 20;
                    const rows = generated.grid?.rows ?? 15;
                    setMapData({
                        name:        generated.name        || "Mapa generado",
                        description: generated.description || "",
                        grid:        generated.grid        || { cols, rows, cellSize: CELL },
                        terrain:     generated.terrain     || buildEmptyTerrain(cols, rows),
                        walls:       generated.walls       ?? [],
                        tokens:      generated.tokens      ?? [],
                        aiMeta:      meta
                    });
                    setSetupDone(true);
                }}
                onBack={() => navigate("/maps")}
            />
        );
    }

    if (loading) {
        return (
            <div className="container">
                <p style={{ color: "var(--ink-faded)" }}>Cargando mapa…</p>
            </div>
        );
    }

    const { grid, terrain, walls, tokens } = mapData;
    const cols    = grid?.cols ?? 20;
    const rows    = grid?.rows ?? 15;
    const stageW  = cols * CELL;
    const stageH  = rows * CELL;

    const ctxToken = ctxMenu
        ? mapData.tokens.find(t => t.id === ctxMenu.tokenId)
        : null;

    return (
        <>
            {/* Full-screen editor overlay — sits above header */}
            <div style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                background: "#1a1208"
            }}>
                {/* ── Top bar ── */}
                <div style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.45rem 0.75rem",
                    background: "#221a0e",
                    borderBottom: "1px solid #3a2e1a",
                    flexWrap: "wrap"
                }}>
                    <button
                        className="btn btn-small"
                        onClick={() => navigate("/maps")}
                        style={{ flexShrink: 0 }}
                    >
                        ← Volver
                    </button>

                    <input
                        value={mapData.name}
                        onChange={e => setMapData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre del mapa…"
                        style={{
                            flex: "1 1 180px",
                            background: "#2e2414",
                            color: "#e8d5b7",
                            border: "1px solid #4a3820",
                            borderRadius: "4px",
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.95rem",
                            fontFamily: "var(--font-display)"
                        }}
                    />

                    {sessionFromQuery && !success && !error && (
                        <span style={{ fontSize: "0.75rem", color: "#887755" }}>
                            Vinculado a sesión al guardar
                        </span>
                    )}
                    {error   && (
                        <span
                            style={{ color: "var(--blood)", fontSize: "0.8rem", cursor: "pointer" }}
                            onClick={() => setError("")}
                        >{error}</span>
                    )}
                    {success && (
                        <span style={{ color: "var(--gold)", fontSize: "0.8rem" }}>{success}</span>
                    )}

                    <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto", flexShrink: 0 }}>
                        <button
                            className="btn btn-small"
                            onClick={() => setShowAI(true)}
                            style={{ background: "#3a1a6e", color: "#cbb0ff", borderColor: "#6030a0" }}
                        >
                            Generar con IA
                        </button>
                        <button
                            className="btn btn-small btn-primary"
                            onClick={save}
                            disabled={saving}
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                    </div>
                </div>

                {/* ── Body: palette + canvas ── */}
                <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                    <Palette
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        selectedTile={selectedTile}
                        setSelectedTile={setSelectedTile}
                    />

                    {/* Canvas area */}
                    <div
                        style={{ flex: 1, overflow: "auto", background: "#0e0e0e", position: "relative" }}
                    >
                        <Stage
                            ref={stageRef}
                            width={stageW}
                            height={stageH}
                            onMouseDown={handleStageMouseDown}
                            onMouseMove={handleStageMouseMove}
                            onMouseUp={handleStageMouseUp}
                            onMouseLeave={handleStageMouseLeave}
                            onClick={handleStageClick}
                            style={{ cursor: activeTab === "tokens" ? "crosshair" : "cell", display: "block" }}
                        >
                            {/* Terrain */}
                            <Layer listening={false}>
                                {terrain.map((row, r) =>
                                    row.map((tileId, c) => {
                                        const tile = TILE_BY_ID[tileId] || TILE_DEFAULT;
                                        const img  = tileImages[tileId];
                                        return img ? (
                                            <KonvaImage
                                                key={`${r}-${c}`}
                                                x={c * CELL}
                                                y={r * CELL}
                                                width={CELL}
                                                height={CELL}
                                                image={img}
                                            />
                                        ) : (
                                            <Rect
                                                key={`${r}-${c}`}
                                                x={c * CELL}
                                                y={r * CELL}
                                                width={CELL}
                                                height={CELL}
                                                fill={tile.color}
                                            />
                                        );
                                    })
                                )}
                            </Layer>

                            {/* Grid lines */}
                            <Layer listening={false}>
                                {Array.from({ length: rows + 1 }, (_, r) => (
                                    <Line key={`h${r}`}
                                        points={[0, r * CELL, stageW, r * CELL]}
                                        stroke="#ffffff"
                                        strokeWidth={0.4}
                                        opacity={0.12}
                                    />
                                ))}
                                {Array.from({ length: cols + 1 }, (_, c) => (
                                    <Line key={`v${c}`}
                                        points={[c * CELL, 0, c * CELL, stageH]}
                                        stroke="#ffffff"
                                        strokeWidth={0.4}
                                        opacity={0.12}
                                    />
                                ))}
                            </Layer>

                            {/* Walls */}
                            <Layer listening={false}>
                                {walls.map((w, i) => (
                                    <Line
                                        key={i}
                                        points={[
                                            w.from[0] * CELL, w.from[1] * CELL,
                                            w.to[0]   * CELL, w.to[1]   * CELL
                                        ]}
                                        stroke="#cc2200"
                                        strokeWidth={3}
                                        lineCap="round"
                                    />
                                ))}
                            </Layer>

                            {/* Tokens */}
                            <Layer>
                                {tokens.map(t => (
                                    <TokenShape
                                        key={t.id}
                                        token={t}
                                        tokenImg={t.tokenImg ? tokenImages[t.tokenImg] : null}
                                        onDragEnd={(e) => handleTokenDragEnd(t.id, e)}
                                        onContextMenu={(e) => handleTokenContextMenu(t.id, e)}
                                    />
                                ))}
                            </Layer>
                        </Stage>
                    </div>
                </div>
            </div>

            {/* Context menu — rendered outside stage, fixed position */}
            {ctxMenu && ctxToken && (
                <div
                    style={{
                        position: "fixed",
                        left: ctxMenu.x,
                        top: ctxMenu.y,
                        zIndex: 200,
                        background: "var(--parchment)",
                        border: "1px solid var(--parchment-shadow)",
                        borderRadius: "6px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                        minWidth: "160px"
                    }}
                    onPointerDown={e => e.stopPropagation()}
                >
                    <TokenContextMenu
                        token={ctxToken}
                        onUpdate={updateToken}
                        onDelete={() => deleteToken(ctxMenu.tokenId)}
                        onClose={() => setCtxMenu(null)}
                        onViewLinked={(type, id) => {
                            setCtxMenu(null);
                            setLinkedDetail({ type, id });
                        }}
                    />
                </div>
            )}

            {showAI && (
                <AIModal
                    initialPrompt={mapData.aiMeta?.prompt ?? ""}
                    initialStyle={mapData.aiMeta?.style   ?? "dungeon"}
                    onClose={() => setShowAI(false)}
                    onResult={loadAIResult}
                />
            )}

            {linkedDetail && (
                <LinkedDetailModal
                    type={linkedDetail.type}
                    id={linkedDetail.id}
                    onClose={() => setLinkedDetail(null)}
                />
            )}
        </>
    );
}

// ─── Palette ──────────────────────────────────────────────────────────────────

function Palette({ activeTab, setActiveTab, selectedTile, setSelectedTile }) {
    const tiles =
        activeTab === "terrain"   ? TERRAIN_TILES :
        activeTab === "furniture" ? [...WALL_TILES, ...FURNITURE_TILES] :
        [];

    return (
        <div style={{
            width: 168,
            flexShrink: 0,
            background: "#1e1610",
            borderRight: "1px solid #3a2e1a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        }}>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #3a2e1a" }}>
                {[["terrain", "Suelo"], ["furniture", "Muros"], ["tokens", "Tokens"]].map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: "0.4rem 0",
                            fontSize: "0.65rem",
                            letterSpacing: "0.03em",
                            background: activeTab === tab ? "var(--gold)" : "transparent",
                            color: activeTab === tab ? "#1a1008" : "#887755",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            borderRadius: 0,
                            textTransform: "uppercase"
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Tile grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {activeTab !== "tokens" ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {tiles.map(tile => (
                            <TileThumbnail
                                key={tile.id}
                                tile={tile}
                                isSelected={selectedTile === tile.id}
                                onClick={() => setSelectedTile(tile.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: "0.72rem", color: "#887755", lineHeight: 1.5, margin: 0 }}>
                        Haz clic en el mapa para añadir un token.<br /><br />
                        Clic derecho sobre un token existente para editar su nombre, HP o eliminarlo.
                    </p>
                )}
            </div>

            {/* Hint */}
            {activeTab !== "tokens" && (
                <div style={{
                    padding: "6px 8px",
                    fontSize: "0.62rem",
                    color: "#665544",
                    borderTop: "1px solid #3a2e1a",
                    lineHeight: 1.4
                }}>
                    Click: pintar<br />Shift+click: borrar
                </div>
            )}
        </div>
    );
}

function TileThumbnail({ tile, isSelected, onClick }) {
    return (
        <div
            onClick={onClick}
            title={tile.name}
            style={{
                width: 44,
                height: 44,
                cursor: "pointer",
                border: `2px solid ${isSelected ? "var(--gold)" : "#3a2e1a"}`,
                borderRadius: 4,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0e0e0e",
                flexShrink: 0
            }}
        >
            {tile.img
                ? <img src={tile.img} width={32} height={32} style={{ imageRendering: "pixelated", display: "block" }} alt={tile.name} />
                : <div dangerouslySetInnerHTML={{ __html: tile.svg }} style={{ lineHeight: 0 }} />
            }
        </div>
    );
}

// ─── Token shape (Konva) ──────────────────────────────────────────────────────

function TokenShape({ token, tokenImg, onDragEnd, onContextMenu }) {
    const r = CELL / 2 - 3;
    return (
        <Group
            x={token.x * CELL}
            y={token.y * CELL}
            draggable
            onDragEnd={onDragEnd}
            onContextMenu={onContextMenu}
            onClick={e => { e.cancelBubble = true; }}
        >
            {/* Fondo de color */}
            <Circle
                x={CELL / 2}
                y={CELL / 2}
                radius={r}
                fill={token.color}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.5}
            />
            {/* Imagen de token recortada en círculo */}
            {tokenImg && (
                <Group clipFunc={ctx => ctx.arc(CELL / 2, CELL / 2, r, 0, Math.PI * 2)}>
                    <KonvaImage
                        x={CELL / 2 - r}
                        y={CELL / 2 - r}
                        width={r * 2}
                        height={r * 2}
                        image={tokenImg}
                    />
                </Group>
            )}
            {/* Borde blanco */}
            <Circle
                x={CELL / 2}
                y={CELL / 2}
                radius={r}
                fill="transparent"
                stroke="#ffffff"
                strokeWidth={1.5}
            />
            {token.hp?.current !== undefined && (
                <Text
                    x={CELL / 2 - r}
                    y={CELL / 2 - 6}
                    width={r * 2}
                    text={String(token.hp.current)}
                    fontSize={10}
                    fontStyle="bold"
                    fill="#ffffff"
                    align="center"
                />
            )}
            <Text
                x={-CELL / 2}
                y={CELL + 2}
                width={CELL * 2}
                text={token.name}
                fontSize={9}
                fill="#ffffff"
                align="center"
                shadowColor="black"
                shadowBlur={3}
                shadowOpacity={0.8}
            />
        </Group>
    );
}

// ─── Token context menu ───────────────────────────────────────────────────────

function TokenContextMenu({ token, onUpdate, onDelete, onClose, onViewLinked }) {
    const [name,    setName]    = useState(token.name  ?? "");
    const [kind,    setKind]    = useState(token.kind  ?? "npc");
    const [color,   setColor]   = useState(token.color ?? "#6b4226");
    const [hp,      setHp]      = useState(token.hp?.current ?? "");
    // linked ref IDs (may be populated objects from server, extract _id)
    const [linkedMonsterId, setLinkedMonsterId] = useState(
        token.monster?._id ?? token.monster ?? ""
    );
    const [linkedObjectId, setLinkedObjectId] = useState(
        token.object?._id ?? token.object ?? ""
    );
    // display names survive before save+reload
    const [linkedMonsterName, setLinkedMonsterName] = useState(token.monster?.name ?? "");
    const [linkedObjectName,  setLinkedObjectName]  = useState(token.object?.name  ?? "");
    const [tokenImg, setTokenImg] = useState(token.tokenImg ?? "");

    const [searchQ,    setSearchQ]    = useState("");
    const [searchRes,  setSearchRes]  = useState([]);
    const [searching,  setSearching]  = useState(false);
    const [allObjects, setAllObjects] = useState(null); // loaded once per menu open
    const searchTimer = useRef(null);

    const canLink = kind === "monster" || kind === "object";
    const currentLinkedId   = kind === "monster" ? linkedMonsterId : linkedObjectId;
    const currentLinkedName = kind === "monster" ? linkedMonsterName : linkedObjectName;

    // Load object catalog once when kind switches to "object"
    useEffect(() => {
        if (kind !== "object" || allObjects !== null) return;
        objectsApi.list()
            .then(data => setAllObjects(data))
            .catch(() => setAllObjects([]));
    }, [kind, allObjects]);

    // Clear results when kind changes
    useEffect(() => { setSearchQ(""); setSearchRes([]); }, [kind]);

    // Monster search: server-side with debounce
    useEffect(() => {
        if (kind !== "monster" || searchQ.trim().length < 2) { setSearchRes([]); return; }
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await monstersApi.list({ search: searchQ.trim() });
                setSearchRes((data.monsters ?? data).slice(0, 6));
            } catch { setSearchRes([]); }
            finally { setSearching(false); }
        }, 300);
        return () => clearTimeout(searchTimer.current);
    }, [searchQ, kind]);

    // Object search: filter in memory (no API call on every keystroke)
    useEffect(() => {
        if (kind !== "object" || !allObjects) return;
        const q = searchQ.trim().toLowerCase();
        if (q.length < 2) { setSearchRes([]); return; }
        setSearchRes(allObjects.filter(o => o.name.toLowerCase().includes(q)).slice(0, 6));
    }, [searchQ, kind, allObjects]);

    const handleLink = (item) => {
        if (kind === "monster") {
            setLinkedMonsterId(item._id);
            setLinkedMonsterName(item.name);
        } else {
            setLinkedObjectId(item._id);
            setLinkedObjectName(item.name);
        }
        setSearchQ("");
        setSearchRes([]);
    };

    const handleSave = () => {
        const updated = { ...token, name, kind, color, tokenImg: tokenImg || undefined };
        if (hp !== "" && hp !== undefined) {
            updated.hp = { current: Number(hp), max: token.hp?.max ?? Number(hp) };
        }
        if (kind === "monster") {
            updated.monster = linkedMonsterId || undefined;
            updated.object  = undefined;
        } else if (kind === "object") {
            updated.object  = linkedObjectId || undefined;
            updated.monster = undefined;
        } else {
            updated.monster = undefined;
            updated.object  = undefined;
        }
        onUpdate(updated);
    };

    const lbl = { fontSize: "0.72rem", display: "block", marginBottom: "0.2rem", color: "var(--ink-faded)" };
    const inp = { width: "100%", fontSize: "0.8rem", boxSizing: "border-box" };

    return (
        <div style={{ padding: "0.75rem", width: 220 }}>
            {/* Name */}
            <div style={{ marginBottom: "0.45rem" }}>
                <label style={lbl}>Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} autoFocus />
            </div>

            {/* Kind */}
            <div style={{ marginBottom: "0.45rem" }}>
                <label style={lbl}>Tipo</label>
                <select value={kind} onChange={e => setKind(e.target.value)} style={inp}>
                    <option value="monster">Monstruo</option>
                    <option value="npc">NPC</option>
                    <option value="object">Objeto</option>
                    <option value="pc">Personaje</option>
                </select>
            </div>

            {/* HP + Color */}
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.45rem" }}>
                <div style={{ flex: 1 }}>
                    <label style={lbl}>HP actual</label>
                    <input type="number" value={hp} onChange={e => setHp(e.target.value)}
                        style={inp} placeholder="—" />
                </div>
                <div>
                    <label style={lbl}>Color</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                        style={{ width: 40, height: 32, border: "none", padding: 2, cursor: "pointer" }} />
                </div>
            </div>

            {/* Link to bestiario / catalog */}
            {canLink && (
                <div style={{ borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.45rem", marginBottom: "0.45rem" }}>
                    <label style={lbl}>
                        {kind === "monster" ? "Vincular a Bestiario" : "Vincular a Catálogo"}
                    </label>

                    {/* Already linked */}
                    {currentLinkedId && (
                        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginBottom: "0.3rem" }}>
                            <span style={{ fontSize: "0.75rem", flex: 1, color: "var(--gold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {currentLinkedName || "Vinculado"}
                            </span>
                            <button
                                className="btn btn-small btn-primary"
                                style={{ flexShrink: 0, fontSize: "0.68rem" }}
                                onClick={() => onViewLinked(kind, currentLinkedId)}
                            >
                                Ver ficha
                            </button>
                            <button
                                className="btn btn-small"
                                style={{ flexShrink: 0, fontSize: "0.68rem", color: "var(--ink-faded)" }}
                                onClick={() => {
                                    if (kind === "monster") { setLinkedMonsterId(""); setLinkedMonsterName(""); }
                                    else { setLinkedObjectId(""); setLinkedObjectName(""); }
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Search */}
                    <input
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        style={{ ...inp, marginBottom: "0.2rem" }}
                        placeholder={kind === "monster" ? "Buscar monstruo…" : "Buscar objeto…"}
                    />
                    {searching && (
                        <p style={{ fontSize: "0.7rem", color: "var(--ink-faded)", margin: "0.2rem 0" }}>Buscando…</p>
                    )}
                    {kind === "object" && allObjects === null && (
                        <p style={{ fontSize: "0.7rem", color: "var(--ink-faded)", margin: "0.2rem 0" }}>Cargando catálogo…</p>
                    )}
                    {searchRes.length > 0 && (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid var(--parchment-shadow)", borderRadius: 3, maxHeight: 120, overflowY: "auto" }}>
                            {searchRes.map(item => (
                                <li
                                    key={item._id}
                                    onClick={() => handleLink(item)}
                                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem", cursor: "pointer", borderBottom: "1px solid var(--parchment-shadow)" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                >
                                    <strong>{item.name}</strong>
                                    {kind === "monster" && item.challengeRating !== undefined && (
                                        <span style={{ color: "var(--ink-faded)", marginLeft: "0.3rem" }}>CR {item.challengeRating}</span>
                                    )}
                                    {kind === "object" && item.category && (
                                        <span style={{ color: "var(--ink-faded)", marginLeft: "0.3rem" }}>{item.category}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Token image picker */}
            <div style={{ borderTop: "1px solid var(--parchment-shadow)", paddingTop: "0.45rem", marginBottom: "0.45rem" }}>
                <label style={lbl}>Imagen del token</label>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                    {/* Sin imagen */}
                    <div
                        title="Sin imagen"
                        onClick={() => setTokenImg("")}
                        style={{
                            width: 32, height: 32, flexShrink: 0,
                            border: `2px solid ${!tokenImg ? "var(--gold)" : "var(--parchment-shadow)"}`,
                            borderRadius: 4, cursor: "pointer",
                            background: color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, color: "#fff", fontWeight: 700
                        }}
                    >×</div>
                    {TOKEN_IMAGES.map(ti => (
                        <img
                            key={ti.id}
                            src={ti.img}
                            title={ti.name}
                            width={32}
                            height={32}
                            onClick={() => setTokenImg(ti.img)}
                            style={{
                                cursor: "pointer", flexShrink: 0,
                                border: `2px solid ${tokenImg === ti.img ? "var(--gold)" : "var(--parchment-shadow)"}`,
                                borderRadius: 4,
                                imageRendering: "pixelated"
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-small btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                    Guardar
                </button>
                <button className="btn btn-small" style={{ color: "var(--blood)", flex: 1 }} onClick={onDelete}>
                    Eliminar
                </button>
            </div>
        </div>
    );
}

// ─── AI generation modal ──────────────────────────────────────────────────────

function AIModal({ initialPrompt = "", initialStyle = "dungeon", onClose, onResult }) {
    const [prompt,     setPrompt]     = useState(initialPrompt);
    const [size,       setSize]       = useState("20x15");
    const [style,      setStyle]      = useState(initialStyle);
    const [generating, setGenerating] = useState(false);
    const [error,      setError]      = useState("");

    const generate = async () => {
        if (!prompt.trim()) { setError("Describe el mapa que quieres generar"); return; }
        const [cols, rows] = size.split("x").map(Number);
        setGenerating(true);
        setError("");
        try {
            const result = await mapsApi.generate(prompt.trim(), { cols, rows, style });
            onResult(result, { prompt: prompt.trim(), style });
        } catch (err) {
            setError(err.message);
            setGenerating(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            style={{ zIndex: 100 }}
            onClick={onClose}
        >
            <div
                className="scroll-card"
                style={{ maxWidth: 520, width: "90%", padding: "2rem" }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>
                    Generar mapa con IA
                </h2>
                <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem", margin: "0 0 1.25rem" }}>
                    Describe el lugar en lenguaje natural. La IA generará el terreno, los muros y colocará
                    monstruos del bestiario si encajan con el ambiente.
                </p>

                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>
                    Descripción del lugar
                </label>
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Una taberna de piedra a media luz, con mesas de madera y una barra al fondo…"
                    style={{ width: "100%", resize: "vertical", marginBottom: "1rem", boxSizing: "border-box" }}
                    autoFocus
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Tamaño</label>
                        <select value={size} onChange={e => setSize(e.target.value)} style={{ width: "100%" }}>
                            {SIZE_OPTIONS.map(([val, label, dims]) => (
                                <option key={val} value={val}>{label} ({dims})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Estilo</label>
                        <select value={style} onChange={e => setStyle(e.target.value)} style={{ width: "100%" }}>
                            {STYLE_OPTIONS.map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="alert" style={{ marginBottom: "1rem" }} onClick={() => setError("")}>
                        {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                        className="btn btn-primary"
                        onClick={generate}
                        disabled={generating || !prompt.trim()}
                    >
                        {generating ? "Generando…" : "Generar mapa"}
                    </button>
                    <button className="btn" onClick={onClose} disabled={generating}>
                        Cancelar
                    </button>
                    {generating && (
                        <span style={{ color: "var(--ink-faded)", fontSize: "0.8rem" }}>
                            Esto puede tardar 15–30 s…
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── New map setup screen ─────────────────────────────────────────────────────

const SIZE_OPTIONS = [
    ["20x15", "Pequeño", "20×15"],
    ["30x20", "Mediano", "30×20"],
    ["40x30", "Grande",  "40×30"]
];

const STYLE_OPTIONS = [
    ["dungeon", "Mazmorra"],
    ["bosque",  "Bosque / Exterior"],
    ["taberna", "Taberna"],
    ["ciudad",  "Edificio urbano"],
    ["templo",  "Templo / Catedral"]
];

function SizeCards({ size, setSize }) {
    return (
        <div style={{ display: "flex", gap: "0.6rem" }}>
            {SIZE_OPTIONS.map(([val, label, dims]) => (
                <label
                    key={val}
                    style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "0.3rem",
                        padding: "0.75rem 0.5rem",
                        border: `2px solid ${size === val ? "var(--gold)" : "var(--parchment-shadow)"}`,
                        borderRadius: 6, cursor: "pointer",
                        background: size === val ? "rgba(218,165,32,0.08)" : "transparent"
                    }}
                >
                    <input type="radio" name="size" value={val} checked={size === val}
                        onChange={() => setSize(val)} style={{ display: "none" }} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-faded)" }}>{dims}</span>
                </label>
            ))}
        </div>
    );
}

function MapSetup({ sessionFromQuery, onStart, onStartFromAI, onBack }) {
    const [mode, setMode] = useState("manual");

    // Manual state
    const [name, setName] = useState("");
    const [size, setSize] = useState("20x15");

    // AI state
    const [aiPrompt,    setAiPrompt]    = useState("");
    const [aiSize,      setAiSize]      = useState("20x15");
    const [aiStyle,     setAiStyle]     = useState("dungeon");
    const [generating,  setGenerating]  = useState(false);
    const [error,       setError]       = useState("");

    const handleManual = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const [cols, rows] = size.split("x").map(Number);
        onStart(name.trim(), cols, rows);
    };

    const handleAI = async () => {
        if (!aiPrompt.trim()) { setError("Describe el mapa que quieres generar"); return; }
        const [cols, rows] = aiSize.split("x").map(Number);
        setGenerating(true);
        setError("");
        try {
            const result = await mapsApi.generate(aiPrompt.trim(), { cols, rows, style: aiStyle });
            onStartFromAI(result, { prompt: aiPrompt.trim(), style: aiStyle });
        } catch (err) {
            setError(err.message);
            setGenerating(false);
        }
    };

    const modeBtn = (id, label) => (
        <button
            key={id}
            type="button"
            onClick={() => { setMode(id); setError(""); }}
            style={{
                flex: 1, padding: "0.6rem",
                border: `2px solid ${mode === id ? "var(--gold)" : "var(--parchment-shadow)"}`,
                borderRadius: 6, cursor: "pointer", fontWeight: mode === id ? 700 : 400,
                background: mode === id ? "rgba(218,165,32,0.1)" : "transparent",
                color: mode === id ? "var(--gold)" : "var(--ink-faded)",
                fontSize: "0.9rem"
            }}
        >{label}</button>
    );

    return (
        <div className="container" style={{ maxWidth: 520, paddingTop: "3rem" }}>
            <div className="scroll-card" style={{ padding: "2rem" }}>
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Nuevo mapa táctico</h2>
                {sessionFromQuery && (
                    <p style={{ color: "var(--gold)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
                        Se vinculará a la sesión al guardar.
                    </p>
                )}

                {/* Mode selector */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {modeBtn("manual", "✏️  Manual")}
                    {modeBtn("ai",     "✨  Generar con IA")}
                </div>

                {mode === "manual" ? (
                    <form onSubmit={handleManual}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>
                                Nombre del mapa *
                            </label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="La Taberna del Ciervo Negro…"
                                style={{ width: "100%", boxSizing: "border-box" }}
                                autoFocus
                                required
                            />
                        </div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Tamaño</label>
                            <SizeCards size={size} setSize={setSize} />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                                Abrir editor
                            </button>
                            <button type="button" className="btn" onClick={onBack}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>
                                Descripción del lugar *
                            </label>
                            <textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                rows={5}
                                placeholder="Una sala de tortura abandonada bajo un castillo. Entrada por un pasillo estrecho con cadenas en las paredes, celda lateral con barrotes rotos y una cámara principal con mesa de tortura y altar profano…"
                                style={{ width: "100%", resize: "vertical", boxSizing: "border-box", marginBottom: 0 }}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Tamaño</label>
                                <select value={aiSize} onChange={e => setAiSize(e.target.value)} style={{ width: "100%" }}>
                                    {SIZE_OPTIONS.map(([val,, dims]) => (
                                        <option key={val} value={val}>{dims.replace("×"," × ")}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: 600 }}>Estilo</label>
                                <select value={aiStyle} onChange={e => setAiStyle(e.target.value)} style={{ width: "100%" }}>
                                    {STYLE_OPTIONS.map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {error && (
                            <div className="alert" style={{ marginBottom: "1rem" }} onClick={() => setError("")}>{error}</div>
                        )}
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleAI}
                                disabled={generating || !aiPrompt.trim()}
                            >
                                {generating ? "Generando…" : "Generar mapa"}
                            </button>
                            <button className="btn" onClick={onBack} disabled={generating}>Cancelar</button>
                            {generating && (
                                <span style={{ color: "var(--ink-faded)", fontSize: "0.8rem" }}>
                                    Esto puede tardar 20–40 s…
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Linked detail modal (monster or object) ──────────────────────────────────

function LinkedDetailModal({ type, id, onClose }) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        setLoading(true);
        const fetch = type === "monster" ? monstersApi.get(id) : objectsApi.get(id);
        fetch
            .then(d => { setData(d); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [id, type]);

    return (
        <div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
            <div
                className="scroll-card"
                style={{ maxWidth: 540, width: "90%", padding: "1.75rem", maxHeight: "85vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}
            >
                {loading && <p style={{ color: "var(--ink-faded)" }}>Cargando…</p>}
                {error   && <p style={{ color: "var(--blood)" }}>{error}</p>}
                {data && type === "monster" && <MonsterDetail monster={data} />}
                {data && type === "object"  && <ObjectDetail  obj={data}     />}
                <button className="btn btn-small" style={{ marginTop: "1.25rem" }} onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>
    );
}

function MonsterDetail({ monster: m }) {
    const stat = (v) => {
        const mod = Math.floor((v - 10) / 2);
        return `${v} (${mod >= 0 ? "+" : ""}${mod})`;
    };
    return (
        <>
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>{m.name}</h2>
            <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
                {[m.size, m.type, m.alignment].filter(Boolean).join(" · ")}
                {m.challengeRating !== undefined && (
                    <span style={{ marginLeft: "0.5rem", color: "var(--gold)" }}>CR {m.challengeRating}</span>
                )}
            </p>
            {/* Core stats */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {m.armorClass  != null && (
                    <StatChip label="CA"  value={`${m.armorClass}${m.armorClassNote ? ` (${m.armorClassNote})` : ""}`} />
                )}
                {m.hitPoints != null && (
                    <StatChip label="PG"  value={
                        typeof m.hitPoints === "object"
                            ? `${m.hitPoints.average}${m.hitPoints.roll ? ` (${m.hitPoints.roll})` : ""}`
                            : m.hitPoints
                    } />
                )}
                {m.speed?.length > 0 && (
                    <StatChip label="Vel" value={Array.isArray(m.speed) ? m.speed.join(", ") : m.speed} />
                )}
            </div>
            {/* Ability scores */}
            {m.stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "0.3rem", marginBottom: "0.75rem", textAlign: "center" }}>
                    {[["FUE",m.stats.strength],["DES",m.stats.dexterity],["CON",m.stats.constitution],["INT",m.stats.intelligence],["SAB",m.stats.wisdom],["CAR",m.stats.charisma]].map(([lbl, val]) => (
                        <div key={lbl} style={{ background: "rgba(0,0,0,0.06)", borderRadius: 4, padding: "0.3rem 0" }}>
                            <div style={{ fontSize: "0.65rem", color: "var(--ink-faded)", fontWeight: 600 }}>{lbl}</div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{stat(val ?? 10)}</div>
                        </div>
                    ))}
                </div>
            )}
            {m.description && (
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)", marginBottom: "0.75rem" }}>{m.description}</p>
            )}
            {/* Actions */}
            {m.actions?.length > 0 && (
                <>
                    <h4 style={{ marginBottom: "0.4rem" }}>Acciones</h4>
                    {m.actions.map((a, i) => (
                        <div key={i} style={{ marginBottom: "0.5rem" }}>
                            <strong style={{ fontSize: "0.85rem" }}>{a.name}.</strong>{" "}
                            <span style={{ fontSize: "0.83rem", color: "var(--ink-faded)" }}>{a.description}</span>
                        </div>
                    ))}
                </>
            )}
        </>
    );
}

function ObjectDetail({ obj }) {
    const RARITY = { common: "Común", uncommon: "Poco común", rare: "Rara", "very rare": "Muy rara", legendary: "Legendaria", artifact: "Artefacto" };
    const CAT    = { weapon: "Arma", armor: "Armadura", shield: "Escudo", potion: "Poción", scroll: "Pergamino", wondrous: "Objeto maravilloso", tool: "Herramienta", gear: "Equipo", ammunition: "Munición" };
    return (
        <>
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>{obj.name}</h2>
            <p style={{ color: "var(--ink-faded)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
                {CAT[obj.category] ?? obj.category}
                {obj.stats?.rarity && (
                    <span style={{ marginLeft: "0.5rem", color: "var(--gold)" }}>
                        {RARITY[obj.stats.rarity] ?? obj.stats.rarity}
                    </span>
                )}
                {obj.stats?.requiresAttunement && (
                    <span style={{ marginLeft: "0.5rem", color: "var(--blood)" }}>requiere sintonización</span>
                )}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {obj.stats?.damage     && <StatChip label="Daño"  value={`${obj.stats.damage}${obj.stats.damageType ? " "+obj.stats.damageType : ""}`} />}
                {obj.stats?.armorClass && <StatChip label="CA"    value={obj.stats.armorClass} />}
                {obj.stats?.attackBonus > 0 && <StatChip label="Ataque" value={`+${obj.stats.attackBonus}`} />}
                {obj.cost > 0          && <StatChip label="Coste" value={`${obj.cost} po`} />}
            </div>
            {obj.stats?.properties?.length > 0 && (
                <p style={{ fontSize: "0.82rem", color: "var(--ink-faded)", marginBottom: "0.75rem" }}>
                    <strong>Propiedades:</strong> {obj.stats.properties.join(", ")}
                </p>
            )}
            {obj.description && (
                <p style={{ fontSize: "0.85rem", color: "var(--ink-faded)" }}>{obj.description}</p>
            )}
        </>
    );
}

function StatChip({ label, value }) {
    return (
        <div style={{ background: "rgba(0,0,0,0.07)", borderRadius: 4, padding: "0.2rem 0.5rem", fontSize: "0.8rem" }}>
            <span style={{ color: "var(--ink-faded)", marginRight: "0.25rem" }}>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}
