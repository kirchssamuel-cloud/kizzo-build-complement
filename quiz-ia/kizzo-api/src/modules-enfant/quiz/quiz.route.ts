import { Router } from 'express';
import multer from 'multer';
import { RoleUtilisateur } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.middleware';
import { generateTopic, generatePhoto, getQuiz, submitQuiz, history } from './quiz.controller';

/** Upload en mémoire : l'image est relayée au LMS, jamais stockée sur disque. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router = Router();
router.use(authenticateToken([RoleUtilisateur.enfant, RoleUtilisateur.parent]));

router.post('/generate/topic', generateTopic);
router.post('/generate/photo', upload.single('image'), generatePhoto);
router.get('/history/:childId', history);
router.get('/:quizId', getQuiz);
router.post('/:quizId/submit', submitQuiz);

export default router;
