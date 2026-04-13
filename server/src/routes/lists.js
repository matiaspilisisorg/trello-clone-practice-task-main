import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createList,
  updateList,
  moveList,
  deleteList,
} from '../controllers/listController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createList);
router.patch('/:id', updateList);
router.patch('/:id/move', moveList);
router.delete('/:id', deleteList);

export default router;
