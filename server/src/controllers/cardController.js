import { z } from 'zod';
import prisma from '../prisma/client.js';

const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  listId: z.string().optional(),
  position: z.number().optional(),
});

export async function createCard(req, res, next) {
  try {
    const parsed = createCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const maxCard = await prisma.card.findFirst({
      where: { listId: req.params.listId },
      orderBy: { position: 'desc' },
    });

    const position = maxCard ? maxCard.position + 1 : 1;

    const card = await prisma.card.create({
      data: {
        title: parsed.data.title,
        position,
        listId: req.params.listId,
      },
    });

    res.status(201).json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function updateCard(req, res, next) {
  try {
    const parsed = updateCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const data = { ...parsed.data };

    if (data.dueDate !== undefined) {
      data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const card = await prisma.card.update({
      where: { id: req.params.id },
      data,
    });

    // Re-index if positions are too close
    if (parsed.data.position !== undefined) {
      const targetListId = parsed.data.listId || card.listId;
      const allCards = await prisma.card.findMany({
        where: { listId: targetListId },
        orderBy: { position: 'asc' },
      });

      let needsReindex = false;
      for (let i = 1; i < allCards.length; i++) {
        if (allCards[i].position - allCards[i - 1].position < 0.001) {
          needsReindex = true;
          break;
        }
      }

      if (needsReindex) {
        for (let i = 0; i < allCards.length; i++) {
          await prisma.card.update({
            where: { id: allCards[i].id },
            data: { position: i + 1 },
          });
        }

        const updated = await prisma.card.findUnique({
          where: { id: req.params.id },
        });
        return res.json({ data: updated });
      }
    }

    res.json({ data: card });
  } catch (error) {
    next(error);
  }
}

export async function deleteCard(req, res, next) {
  try {
    await prisma.card.delete({ where: { id: req.params.id } });

    res.json({ data: { message: 'Card deleted' } });
  } catch (error) {
    next(error);
  }
}
