import Campaign from "../models/Campaign.js";
import Character from "../models/Character.js";
import Monster from "../models/Monster.js";

// ─── Helpers de error ─────────────────────────────────────────────────────────
const notFound  = (msg = "Campaña no encontrada")   => Object.assign(new Error(msg), { status: 404 });
const forbidden = (msg = "Acceso denegado")          => Object.assign(new Error(msg), { status: 403 });
const conflict  = (msg)                              => Object.assign(new Error(msg), { status: 409 });
const badReq    = (msg)                              => Object.assign(new Error(msg), { status: 400 });

const checkOwner = (campaign, dmId) => {
    if (!campaign) throw notFound();
    if (!campaign.dm.equals(dmId)) throw forbidden();
};

// Populate ligero para la lista
const listPopulate = (q) =>
    q.populate({ path: "participants.character", select: "name charClass level" });

// Populate completo para detalle (log entries con monstruo + pool de monstruos)
const detailPopulate = (q) =>
    q
        .populate({ path: "participants.character", select: "name charClass level avatar" })
        .populate({ path: "sessions.log.monster",  select: "name challengeRating type" })
        .populate({ path: "sessions.log.monsters", select: "name challengeRating type" })
        .populate({ path: "monsters", select: "name challengeRating type size source" });

// ─── Campañas ─────────────────────────────────────────────────────────────────

export const list = (dmId) =>
    listPopulate(
        Campaign.find({ dm: dmId }, "name description status participants sessions notes createdAt")
            .sort({ createdAt: -1 })
    ).lean();

export const getById = async (id, dmId) => {
    const campaign = await detailPopulate(Campaign.findById(id));
    checkOwner(campaign, dmId);
    return campaign;
};

export const create = async (data, dmId) => {
    const { name, description, status, notes } = data;
    return Campaign.create({ dm: dmId, name, description, status, notes });
};

export const update = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const { name, description, status, notes } = data;
    if (name        !== undefined) campaign.name        = name;
    if (description !== undefined) campaign.description = description;
    if (status      !== undefined) campaign.status      = status;
    if (notes       !== undefined) campaign.notes       = notes;
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const remove = async (id, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    await campaign.deleteOne();
    return { deleted: true };
};

// ─── Participantes ────────────────────────────────────────────────────────────

export const addParticipant = async (id, characterId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const char = await Character.findById(characterId).select("name").lean();
    if (!char) throw notFound("Personaje no encontrado");
    if (campaign.participants.some(p => p.character?.equals(characterId))) throw conflict("Personaje ya en la campaña");
    campaign.participants.push({ character: characterId, characterName: char.name });
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const removeParticipant = async (id, characterId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    campaign.participants = campaign.participants.filter(p => !p.character?.equals(characterId));
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

// ─── Sesiones ─────────────────────────────────────────────────────────────────

export const addSession = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const { title, date, summary } = data;
    if (!title?.trim()) throw badReq("El título de la sesión es obligatorio");
    campaign.sessions.push({ title, date, summary });
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const updateSession = async (id, sessionId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");
    const { title, date, summary } = data;
    if (title   !== undefined) session.title   = title;
    if (date    !== undefined) session.date    = date;
    if (summary !== undefined) session.summary = summary;
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const removeSession = async (id, sessionId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");
    session.deleteOne();
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

// ─── Log de una sesión ────────────────────────────────────────────────────────

export const addLogEntry = async (id, sessionId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");

    const { kind, content, monsterIds = [] } = data;

    let monsterNames = [];
    if (monsterIds.length) {
        const found = await Monster.find({ _id: { $in: monsterIds } }).select("name").lean();
        monsterNames = monsterIds
            .map(id => found.find(m => m._id.toString() === id.toString())?.name)
            .filter(Boolean);
    }

    session.log.push({
        kind: kind || "note",
        content: content || "",
        monsters: monsterIds,
        monsterNames
    });
    await campaign.save();

    const updated = await Campaign.findById(id)
        .populate({ path: "sessions.log.monster",  select: "name challengeRating type" })
        .populate({ path: "sessions.log.monsters", select: "name challengeRating type" });
    const updatedSession = updated.sessions.id(sessionId);
    return updatedSession.log[updatedSession.log.length - 1];
};

export const updateLogEntry = async (id, sessionId, entryId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");
    const entry = session.log.id(entryId);
    if (!entry) throw notFound("Entrada no encontrada");

    const { content, kind } = data;
    if (content !== undefined) entry.content = content;
    if (kind    !== undefined) entry.kind    = kind;
    await campaign.save();

    const updated = await Campaign.findById(id)
        .populate({ path: "sessions.log.monster",  select: "name challengeRating type" })
        .populate({ path: "sessions.log.monsters", select: "name challengeRating type" });
    return updated.sessions.id(sessionId).log.id(entryId);
};

export const removeLogEntry = async (id, sessionId, entryId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");
    const entry = session.log.id(entryId);
    if (!entry) throw notFound("Entrada no encontrada");
    entry.deleteOne();
    await campaign.save();
    return { deleted: true };
};

// ─── Pool de monstruos de la campaña ─────────────────────────────────────────

export const addMonsterToPool = async (id, monsterId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const monster = await Monster.findById(monsterId).lean();
    if (!monster) throw notFound("Monstruo no encontrado");
    if (campaign.monsters.some(m => m.equals(monsterId))) throw conflict("Monstruo ya en el pool de la campaña");
    campaign.monsters.push(monsterId);
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

// ─── Notas DM (cards) ─────────────────────────────────────────────────────────

export const addNoteCard = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    campaign.noteCards.push({ content: data.content || "" });
    await campaign.save();
    return campaign.noteCards[campaign.noteCards.length - 1];
};

export const updateNoteCard = async (id, noteId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const note = campaign.noteCards.id(noteId);
    if (!note) throw notFound("Nota no encontrada");
    if (data.content !== undefined) note.content = data.content;
    await campaign.save();
    return { updated: true };
};

export const removeNoteCard = async (id, noteId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const note = campaign.noteCards.id(noteId);
    if (!note) throw notFound("Nota no encontrada");
    note.deleteOne();
    await campaign.save();
    return { deleted: true };
};

export const removeMonsterFromPool = async (id, monsterId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    campaign.monsters = campaign.monsters.filter(m => !m.equals(monsterId));
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};
