import { Router } from "express";
import {
    listCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign,
    addParticipant, removeParticipant,
    addSession, updateSession, deleteSession,
    addLogEntry, updateLogEntry, deleteLogEntry,
    addMonsterToPool, removeMonsterFromPool
} from "../controllers/campaignController.js";
import { authRequired } from "../middlewares/authRequired.js";
import { dmRequired } from "../middlewares/dmRequired.js";
import { validateBody, validateObjectId } from "../middlewares/validateBody.js";

const router = Router();

router.use(authRequired);
router.use(dmRequired);

const cid          = validateObjectId();
const sid          = validateObjectId("sessionId");
const eid          = validateObjectId("entryId");
const charIdVal    = validateObjectId("charId");
const monsterIdVal = validateObjectId("monsterId");

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

// Pool de monstruos
router.post("/:id/monsters",              cid, addMonsterToPool);
router.delete("/:id/monsters/:monsterId", cid, monsterIdVal, removeMonsterFromPool);

export default router;
