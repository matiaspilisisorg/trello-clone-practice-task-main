import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoard);
router.patch('/:id', updateBoard);
router.delete('/:id', deleteBoard);

export default router;
