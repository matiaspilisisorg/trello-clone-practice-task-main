import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createCard,
  updateCard,
  deleteCard,
} from '../controllers/cardController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createCard);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;
