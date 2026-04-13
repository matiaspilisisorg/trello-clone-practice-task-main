import { z } from 'zod';
import prisma from '../prisma/client.js';

const createLabelSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  color: z.string().min(1, 'Color is required'),
});

const createChecklistSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const createItemSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

const updateItemSchema = z.object({
  checked: z.boolean(),
});

export async function getCard(req, res, next) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: req.params.cardId },
      include: {
        labels: true,
        checklists: {
          include: { items: true },
        },
      },
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function createLabel(req, res, next) {
  try {
    const parsed = createLabelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const label = await prisma.label.create({
      data: {
        text: parsed.data.text,
        color: parsed.data.color,
        cardId: req.params.cardId,
      },
    });

    res.status(201).json({ data: label });
  } catch (error) {
    next(error);
  }
}

export async function deleteLabel(req, res, next) {
  try {
    await prisma.label.delete({ where: { id: req.params.labelId } });

    res.json({ data: { message: 'Label deleted' } });
  } catch (error) {
    next(error);
  }
}

export async function createChecklist(req, res, next) {
  try {
    const parsed = createChecklistSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const checklist = await prisma.checklist.create({
      data: {
        title: parsed.data.title,
        cardId: req.params.cardId,
      },
    });

    res.status(201).json({ data: checklist });
  } catch (error) {
    next(error);
  }
}

export async function deleteChecklist(req, res, next) {
  try {
    await prisma.checklist.delete({ where: { id: req.params.checklistId } });

    res.json({ data: { message: 'Checklist deleted' } });
  } catch (error) {
    next(error);
  }
}

export async function createChecklistItem(req, res, next) {
  try {
    const parsed = createItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const item = await prisma.checklistItem.create({
      data: {
        text: parsed.data.text,
        checklistId: req.params.checklistId,
      },
    });

    res.status(201).json({ data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateChecklistItem(req, res, next) {
  try {
    const current = await prisma.checklistItem.findUnique({
      where: { id: req.params.itemId },
    });

    if (!current) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const checked = req.body.checked !== undefined ? req.body.checked : !current.checked;

    const item = await prisma.checklistItem.update({
      where: { id: req.params.itemId },
      data: { checked },
    });

    res.json({ data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteChecklistItem(req, res, next) {
  try {
    await prisma.checklistItem.delete({ where: { id: req.params.itemId } });

    res.json({ data: { message: 'Item deleted' } });
  } catch (error) {
    next(error);
  }
}
