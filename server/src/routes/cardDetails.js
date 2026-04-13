import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCard,
  createLabel,
  deleteLabel,
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '../controllers/cardDetailController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getCard);

router.post('/labels', createLabel);
router.delete('/labels/:labelId', deleteLabel);

router.post('/checklists', createChecklist);
router.delete('/checklists/:checklistId', deleteChecklist);

router.post('/checklists/:checklistId/items', createChecklistItem);
router.patch('/checklists/:checklistId/items/:itemId', updateChecklistItem);
router.delete('/checklists/:checklistId/items/:itemId', deleteChecklistItem);

export default router;
