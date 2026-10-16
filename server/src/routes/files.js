import express from 'express';
import { extractFileContent } from '../controllers/filesController.js';

const router = express.Router();

// POST /api/files/extract
router.post('/extract', extractFileContent);

export default router;
