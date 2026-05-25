import Session from "../models/Session.js";
import Character from "../models/Character.js";

const notFound = (msg = "Sesión no encontrada") => {
    const err = new Error(msg);
    err.status = 404;
    return err;
};

const forbidden = (msg = "Acceso denegado") => {
    const err = new Error(msg);
    err.status = 403;
    return err;
};

const conflict = (msg) => {
    const err = new Error(msg);
    err.status = 409;
    return err;
};

const populateParticipants = (query) =>
    query.populate({
        path: "participants.character",
        select: "name charClass level avatar"
    });

export const list = async (dmId) => {
    return populateParticipants(
        Session.find({ dm: dmId }).sort({ createdAt: -1 })
    ).lean();
};

export const getById = async (id, dmId) => {
    const session = await populateParticipants(Session.findById(id));
    if (!session) throw notFound();
    if (!session.dm.equals(dmId)) throw forbidden();
    return session;
};

export const create = async (data, dmId) => {
    const { name, description, date, status, notes } = data;
    return Session.create({ dm: dmId, name, description, date, status, notes });
};

export const update = async (id, data, dmId) => {
    const session = await Session.findById(id);
    if (!session) throw notFound();
    if (!session.dm.equals(dmId)) throw forbidden();

    const { name, description, date, status, notes } = data;
    if (name !== undefined) session.name = name;
    if (description !== undefined) session.description = description;
    if (date !== undefined) session.date = date;
    if (status !== undefined) session.status = status;
    if (notes !== undefined) session.notes = notes;

    await session.save();
    return populateParticipants(Session.findById(id)).lean();
};

export const remove = async (id, dmId) => {
    const session = await Session.findById(id);
    if (!session) throw notFound();
    if (!session.dm.equals(dmId)) throw forbidden();
    await session.deleteOne();
    return { message: "Sesión eliminada" };
};

export const addParticipant = async (sessionId, characterId, dmId) => {
    const session = await Session.findById(sessionId);
    if (!session) throw notFound();
    if (!session.dm.equals(dmId)) throw forbidden();

    const character = await Character.findById(characterId).select("name").lean();
    if (!character) throw notFound("Personaje no encontrado");

    const already = session.participants.some(p => p.character.equals(characterId));
    if (already) throw conflict("Este personaje ya está en la sesión");

    session.participants.push({ character: characterId, characterName: character.name });
    await session.save();

    return populateParticipants(Session.findById(sessionId)).lean();
};

export const removeParticipant = async (sessionId, characterId, dmId) => {
    const session = await Session.findById(sessionId);
    if (!session) throw notFound();
    if (!session.dm.equals(dmId)) throw forbidden();

    session.participants = session.participants.filter(
        p => !p.character.equals(characterId)
    );
    await session.save();
    return { message: "Participante eliminado" };
};
