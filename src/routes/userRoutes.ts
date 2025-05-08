import express from 'express';
import { getUserPageInfo, getAllClipsFromUser, getRecentClips } from '../controllers/userController.js';
import { validateUserParams } from "../middlewares/validateUserParams.js";

const router = express.Router();

router.get('/recent/:handle', validateUserParams, getRecentClips);
router.get('/:handle/:page', validateUserParams, getUserPageInfo);
router.get('/:handle', validateUserParams, getAllClipsFromUser);

export default router;
