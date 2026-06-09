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

// Sólo se puede marcar como asistente a quien ya participa en la campaña
const sanitizeAttendees = (campaign, attendees) => {
    if (!Array.isArray(attendees)) return [];
    const participantIds = new Set(campaign.participants.map(p => p.character?.toString()).filter(Boolean));
    return attendees.filter(a => participantIds.has(a?.toString()));
};

const sanitizeDuration = (duration) =>
    duration === undefined || duration === null || duration === "" ? undefined : Number(duration);

// Populate ligero para la lista
const listPopulate = (q) =>
    q.populate({ path: "participants.character", select: "name charClass level" });

// Populate completo para detalle (log entries con monstruo + pool de monstruos)
const detailPopulate = (q) =>
    q
        .populate({ path: "participants.character", select: "name charClass level avatar" })
        .populate({ path: "sessions.attendees",     select: "name charClass level avatar" })
        .populate({ path: "sessions.log.monster",  select: "name challengeRating type" })
        .populate({ path: "sessions.log.monsters", select: "name challengeRating type" })
        .populate({ path: "monsters", select: "name challengeRating type size source" })
        .populate({ path: "encounterTemplates.monsters", select: "name challengeRating type size" })
        .populate({ path: "availabilityPolls.options.votes", select: "name charClass level avatar" });

// Populate para la vista de jugador — igual que el detalle del DM pero sin notas privadas
const playerPopulate = (q) => detailPopulate(q);

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

// ─── Vista de jugador ─────────────────────────────────────────────────────────
// Un jugador "participa" en una campaña si alguno de sus personajes está en
// campaign.participants. Las notas privadas del DM (noteCards) nunca se exponen.

const charIdsOfUser = async (userId) => {
    const chars = await Character.find({ user: userId }).select("_id").lean();
    return chars.map(c => c._id);
};

export const listForPlayer = async (userId) => {
    const charIds = await charIdsOfUser(userId);
    const campaigns = await listPopulate(
        Campaign.find(
            { "participants.character": { $in: charIds } },
            "name description status participants sessions notes createdAt"
        ).sort({ createdAt: -1 })
    ).lean();
    return campaigns.map(({ noteCards, ...rest }) => rest);
};

export const getForPlayer = async (id, userId) => {
    const charIds = await charIdsOfUser(userId);
    const campaign = await playerPopulate(Campaign.findById(id)).lean();
    if (!campaign) throw notFound();
    const myCharIds = new Set(charIds.map(c => c.toString()));
    const isParticipant = campaign.participants.some(p => myCharIds.has((p.character?._id || p.character)?.toString()));
    if (!isParticipant) throw forbidden();
    delete campaign.noteCards;
    return campaign;
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
    const { title, date, summary, duration, attendees } = data;
    if (!title?.trim()) throw badReq("El título de la sesión es obligatorio");
    campaign.sessions.push({
        title,
        date,
        summary,
        duration:  sanitizeDuration(duration),
        attendees: sanitizeAttendees(campaign, attendees)
    });
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const updateSession = async (id, sessionId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const session = campaign.sessions.id(sessionId);
    if (!session) throw notFound("Sesión no encontrada");
    const { title, date, summary, duration, attendees } = data;
    if (title     !== undefined) session.title     = title;
    if (date      !== undefined) session.date      = date;
    if (summary   !== undefined) session.summary   = summary;
    if (duration  !== undefined) session.duration  = sanitizeDuration(duration);
    if (attendees !== undefined) session.attendees = sanitizeAttendees(campaign, attendees);
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

// ─── Notas compartidas con los jugadores ──────────────────────────────────────

export const addSharedNote = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    campaign.sharedNotes.push({ content: data.content || "" });
    await campaign.save();
    return campaign.sharedNotes[campaign.sharedNotes.length - 1];
};

export const updateSharedNote = async (id, noteId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const note = campaign.sharedNotes.id(noteId);
    if (!note) throw notFound("Nota no encontrada");
    if (data.content !== undefined) note.content = data.content;
    await campaign.save();
    return { updated: true };
};

export const removeSharedNote = async (id, noteId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const note = campaign.sharedNotes.id(noteId);
    if (!note) throw notFound("Nota no encontrada");
    note.deleteOne();
    await campaign.save();
    return { deleted: true };
};

// ─── Plantillas de encuentro ──────────────────────────────────────────────────

export const addEncounterTemplate = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const { name, monsterIds = [] } = data;
    if (!name?.trim()) throw badReq("El nombre de la plantilla es obligatorio");
    campaign.encounterTemplates.push({ name, monsters: monsterIds });
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const updateEncounterTemplate = async (id, templateId, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const template = campaign.encounterTemplates.id(templateId);
    if (!template) throw notFound("Plantilla no encontrada");
    const { name, monsterIds } = data;
    if (name       !== undefined) template.name     = name;
    if (monsterIds !== undefined) template.monsters = monsterIds;
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const removeEncounterTemplate = async (id, templateId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const template = campaign.encounterTemplates.id(templateId);
    if (!template) throw notFound("Plantilla no encontrada");
    template.deleteOne();
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

// ─── Encuestas de disponibilidad ──────────────────────────────────────────────

export const addAvailabilityPoll = async (id, data, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const { title, dates = [] } = data;
    if (!Array.isArray(dates) || !dates.length) throw badReq("Debes proponer al menos una fecha");
    campaign.availabilityPolls.push({
        ...(title?.trim() ? { title: title.trim() } : {}),
        options: dates.map(date => ({ date, votes: [] }))
    });
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const closeAvailabilityPoll = async (id, pollId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const poll = campaign.availabilityPolls.id(pollId);
    if (!poll) throw notFound("Encuesta no encontrada");
    poll.status = "closed";
    await campaign.save();
    return detailPopulate(Campaign.findById(id)).lean();
};

export const removeAvailabilityPoll = async (id, pollId, dmId) => {
    const campaign = await Campaign.findById(id);
    checkOwner(campaign, dmId);
    const poll = campaign.availabilityPolls.id(pollId);
    if (!poll) throw notFound("Encuesta no encontrada");
    poll.deleteOne();
    await campaign.save();
    return { deleted: true };
};

// El jugador vota con uno de sus propios personajes que participe en la campaña.
// Sólo puede tener un voto activo a la vez: votar otra opción mueve su voto.
export const voteAvailabilityPoll = async (id, pollId, optionId, characterId, userId) => {
    const campaign = await Campaign.findById(id);
    if (!campaign) throw notFound();
    if (!campaign.participants.some(p => p.character?.equals(characterId))) throw forbidden();
    const char = await Character.findOne({ _id: characterId, user: userId }).select("_id").lean();
    if (!char) throw forbidden();

    const poll = campaign.availabilityPolls.id(pollId);
    if (!poll) throw notFound("Encuesta no encontrada");
    if (poll.status !== "open") throw conflict("La encuesta está cerrada");
    const option = poll.options.id(optionId);
    if (!option) throw notFound("Opción no encontrada");

    poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => !v.equals(characterId));
    });
    option.votes.push(characterId);
    await campaign.save();
    return getForPlayer(id, userId);
};
