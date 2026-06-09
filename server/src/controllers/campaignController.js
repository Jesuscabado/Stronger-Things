import * as svc from "../services/campaignService.js";

const handle = (error, res, next) => {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
};

// ─── Campañas ─────────────────────────────────────────────────────────────────
export const listCampaigns    = async (req, res, next) => { try { res.json(await svc.list(req.user._id)); }                                        catch (e) { handle(e, res, next); } };
export const getCampaign      = async (req, res, next) => { try { res.json(await svc.getById(req.params.id, req.user._id)); }                      catch (e) { handle(e, res, next); } };
export const createCampaign   = async (req, res, next) => { try { res.status(201).json(await svc.create(req.body, req.user._id)); }                catch (e) { handle(e, res, next); } };
export const updateCampaign   = async (req, res, next) => { try { res.json(await svc.update(req.params.id, req.body, req.user._id)); }             catch (e) { handle(e, res, next); } };
export const deleteCampaign   = async (req, res, next) => { try { res.json(await svc.remove(req.params.id, req.user._id)); }                      catch (e) { handle(e, res, next); } };

// ─── Vista de jugador ─────────────────────────────────────────────────────────
export const listParticipatingCampaigns = async (req, res, next) => { try { res.json(await svc.listForPlayer(req.user._id)); }                  catch (e) { handle(e, res, next); } };
export const getParticipatingCampaign   = async (req, res, next) => { try { res.json(await svc.getForPlayer(req.params.id, req.user._id)); }    catch (e) { handle(e, res, next); } };

export const voteAvailabilityPoll = async (req, res, next) => {
    try {
        const { characterId } = req.body;
        if (!characterId) return res.status(400).json({ message: "Falta characterId" });
        res.json(await svc.voteAvailabilityPoll(req.params.id, req.params.pollId, req.params.optionId, characterId, req.user._id));
    } catch (e) { handle(e, res, next); }
};

// ─── Participantes ────────────────────────────────────────────────────────────
export const addParticipant = async (req, res, next) => {
    try {
        const { characterId } = req.body;
        if (!characterId) return res.status(400).json({ message: "Falta characterId" });
        res.json(await svc.addParticipant(req.params.id, characterId, req.user._id));
    } catch (e) { handle(e, res, next); }
};
export const removeParticipant = async (req, res, next) => { try { res.json(await svc.removeParticipant(req.params.id, req.params.charId, req.user._id)); } catch (e) { handle(e, res, next); } };

// ─── Sesiones ─────────────────────────────────────────────────────────────────
export const addSession    = async (req, res, next) => { try { res.status(201).json(await svc.addSession(req.params.id, req.body, req.user._id)); }                              catch (e) { handle(e, res, next); } };
export const updateSession = async (req, res, next) => { try { res.json(await svc.updateSession(req.params.id, req.params.sessionId, req.body, req.user._id)); }                catch (e) { handle(e, res, next); } };
export const deleteSession = async (req, res, next) => { try { res.json(await svc.removeSession(req.params.id, req.params.sessionId, req.user._id)); }                         catch (e) { handle(e, res, next); } };

// ─── Log ──────────────────────────────────────────────────────────────────────
export const addLogEntry    = async (req, res, next) => { try { res.status(201).json(await svc.addLogEntry(req.params.id, req.params.sessionId, req.body, req.user._id)); }                       catch (e) { handle(e, res, next); } };
export const updateLogEntry = async (req, res, next) => { try { res.json(await svc.updateLogEntry(req.params.id, req.params.sessionId, req.params.entryId, req.body, req.user._id)); }           catch (e) { handle(e, res, next); } };
export const deleteLogEntry = async (req, res, next) => { try { res.json(await svc.removeLogEntry(req.params.id, req.params.sessionId, req.params.entryId, req.user._id)); }                     catch (e) { handle(e, res, next); } };

// ─── Notas DM ─────────────────────────────────────────────────────────────────
export const addNoteCard    = async (req, res, next) => { try { res.status(201).json(await svc.addNoteCard(req.params.id, req.body, req.user._id)); }                              catch (e) { handle(e, res, next); } };
export const updateNoteCard = async (req, res, next) => { try { res.json(await svc.updateNoteCard(req.params.id, req.params.noteId, req.body, req.user._id)); }                   catch (e) { handle(e, res, next); } };
export const removeNoteCard = async (req, res, next) => { try { res.json(await svc.removeNoteCard(req.params.id, req.params.noteId, req.user._id)); }                             catch (e) { handle(e, res, next); } };

// ─── Pool de monstruos ────────────────────────────────────────────────────────
export const addMonsterToPool = async (req, res, next) => {
    try {
        const { monsterId } = req.body;
        if (!monsterId) return res.status(400).json({ message: "Falta monsterId" });
        res.status(201).json(await svc.addMonsterToPool(req.params.id, monsterId, req.user._id));
    } catch (e) { handle(e, res, next); }
};
export const removeMonsterFromPool = async (req, res, next) => { try { res.json(await svc.removeMonsterFromPool(req.params.id, req.params.monsterId, req.user._id)); } catch (e) { handle(e, res, next); } };

// ─── Notas compartidas ────────────────────────────────────────────────────────
export const addSharedNote    = async (req, res, next) => { try { res.status(201).json(await svc.addSharedNote(req.params.id, req.body, req.user._id)); }                  catch (e) { handle(e, res, next); } };
export const updateSharedNote = async (req, res, next) => { try { res.json(await svc.updateSharedNote(req.params.id, req.params.noteId, req.body, req.user._id)); }         catch (e) { handle(e, res, next); } };
export const removeSharedNote = async (req, res, next) => { try { res.json(await svc.removeSharedNote(req.params.id, req.params.noteId, req.user._id)); }                   catch (e) { handle(e, res, next); } };

// ─── Plantillas de encuentro ──────────────────────────────────────────────────
export const addEncounterTemplate    = async (req, res, next) => { try { res.status(201).json(await svc.addEncounterTemplate(req.params.id, req.body, req.user._id)); }                              catch (e) { handle(e, res, next); } };
export const updateEncounterTemplate = async (req, res, next) => { try { res.json(await svc.updateEncounterTemplate(req.params.id, req.params.templateId, req.body, req.user._id)); }                catch (e) { handle(e, res, next); } };
export const removeEncounterTemplate = async (req, res, next) => { try { res.json(await svc.removeEncounterTemplate(req.params.id, req.params.templateId, req.user._id)); }                          catch (e) { handle(e, res, next); } };

// ─── Encuestas de disponibilidad (DM) ─────────────────────────────────────────
export const addAvailabilityPoll   = async (req, res, next) => { try { res.status(201).json(await svc.addAvailabilityPoll(req.params.id, req.body, req.user._id)); }            catch (e) { handle(e, res, next); } };
export const closeAvailabilityPoll = async (req, res, next) => { try { res.json(await svc.closeAvailabilityPoll(req.params.id, req.params.pollId, req.user._id)); }              catch (e) { handle(e, res, next); } };
export const removeAvailabilityPoll = async (req, res, next) => { try { res.json(await svc.removeAvailabilityPoll(req.params.id, req.params.pollId, req.user._id)); }            catch (e) { handle(e, res, next); } };
