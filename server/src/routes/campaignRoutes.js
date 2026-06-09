import { Router } from "express";
import {
    listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
    listParticipatingCampaigns, getParticipatingCampaign, voteAvailabilityPoll,
    addParticipant, removeParticipant,
    addSession, updateSession, deleteSession,
    addLogEntry, updateLogEntry, deleteLogEntry,
    addNoteCard, updateNoteCard, removeNoteCard,
    addSharedNote, updateSharedNote, removeSharedNote,
    addEncounterTemplate, updateEncounterTemplate, removeEncounterTemplate,
    addAvailabilityPoll, closeAvailabilityPoll, removeAvailabilityPoll,
    addMonsterToPool, removeMonsterFromPool
} from "../controllers/campaignController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { dmRequired } from "../middlewares/dmRequired.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.use(authRequired);

const cid          = validateObjectId();
const pollIdVal    = validateObjectId("pollId");
const optionIdVal  = validateObjectId("optionId");

// Vista de jugador — accesible para cualquier usuario autenticado que participe
router.get("/participating",     listParticipatingCampaigns);
router.get("/participating/:id", cid, getParticipatingCampaign);
router.post(
    "/participating/:id/polls/:pollId/options/:optionId/vote",
    cid, pollIdVal, optionIdVal, validateBody(["characterId"]), voteAvailabilityPoll
);

router.use(dmRequired);

const sid          = validateObjectId("sessionId");
const eid          = validateObjectId("entryId");
const charIdVal    = validateObjectId("charId");
const monsterIdVal = validateObjectId("monsterId");
const templateIdVal = validateObjectId("templateId");

// Campañas
router.get("/",    listCampaigns);
router.post("/",   validateBody(["name"]), createCampaign);
router.get("/:id",    cid, getCampaign);
router.put("/:id",    cid, updateCampaign);
router.delete("/:id", cid, deleteCampaign);

// Participantes
router.post("/:id/participants",           cid, addParticipant);
router.delete("/:id/participants/:charId", cid, charIdVal, removeParticipant);

// Sesiones
router.post("/:id/sessions",              cid, validateBody(["title"]), addSession);
router.put("/:id/sessions/:sessionId",    cid, sid, updateSession);
router.delete("/:id/sessions/:sessionId", cid, sid, deleteSession);

// Log de sesión
router.post("/:id/sessions/:sessionId/log",             cid, sid, addLogEntry);
router.put("/:id/sessions/:sessionId/log/:entryId",     cid, sid, eid, updateLogEntry);
router.delete("/:id/sessions/:sessionId/log/:entryId",  cid, sid, eid, deleteLogEntry);

// Notas DM (privadas)
const nid = validateObjectId("noteId");
router.post("/:id/notecards",            cid, addNoteCard);
router.put("/:id/notecards/:noteId",     cid, nid, updateNoteCard);
router.delete("/:id/notecards/:noteId",  cid, nid, removeNoteCard);

// Notas compartidas con jugadores
router.post("/:id/sharednotes",            cid, addSharedNote);
router.put("/:id/sharednotes/:noteId",     cid, nid, updateSharedNote);
router.delete("/:id/sharednotes/:noteId",  cid, nid, removeSharedNote);

// Plantillas de encuentro
router.post("/:id/encountertemplates",                cid, validateBody(["name"]), addEncounterTemplate);
router.put("/:id/encountertemplates/:templateId",     cid, templateIdVal, updateEncounterTemplate);
router.delete("/:id/encountertemplates/:templateId",  cid, templateIdVal, removeEncounterTemplate);

// Encuestas de disponibilidad
router.post("/:id/polls",                cid, addAvailabilityPoll);
router.put("/:id/polls/:pollId/close",   cid, pollIdVal, closeAvailabilityPoll);
router.delete("/:id/polls/:pollId",      cid, pollIdVal, removeAvailabilityPoll);

// Pool de monstruos
router.post("/:id/monsters",              cid, addMonsterToPool);
router.delete("/:id/monsters/:monsterId", cid, monsterIdVal, removeMonsterFromPool);

export default router;
