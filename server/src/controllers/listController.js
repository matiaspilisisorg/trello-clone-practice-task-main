import { z } from 'zod';
import prisma from '../prisma/client.js';

const createListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

const moveListSchema = z.object({
  position: z.number(),
});

export async function createList(req, res, next) {
  try {
    const parsed = createListSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const board = await prisma.board.findUnique({
      where: { id: req.params.boardId },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const maxList = await prisma.list.findFirst({
      where: { boardId: req.params.boardId },
      orderBy: { position: 'desc' },
    });

    const position = maxList ? maxList.position + 1 : 1;

    const list = await prisma.list.create({
      data: {
        title: parsed.data.title,
        position,
        boardId: req.params.boardId,
      },
    });

    res.status(201).json({ data: list });
  } catch (error) {
    next(error);
  }
}

export async function updateList(req, res, next) {
  try {
    const parsed = updateListSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const list = await prisma.list.update({
      where: { id: req.params.id },
      data: { title: parsed.data.title },
    });

    res.json({ data: list });
  } catch (error) {
    next(error);
  }
}

export async function moveList(req, res, next) {
  try {
    const parsed = moveListSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const list = await prisma.list.update({
      where: { id: req.params.id },
      data: { position: parsed.data.position },
    });

    const allLists = await prisma.list.findMany({
      where: { boardId: list.boardId },
      orderBy: { position: 'asc' },
    });

    // Check if any adjacent positions are too close
    let needsReindex = false;
    for (let i = 1; i < allLists.length; i++) {
      if (allLists[i].position - allLists[i - 1].position < 0.001) {
        needsReindex = true;
        break;
      }
    }

    if (needsReindex) {
      for (let i = 0; i < allLists.length; i++) {
        await prisma.list.update({
          where: { id: allLists[i].id },
          data: { position: i + 1 },
        });
      }

      const updated = await prisma.list.findUnique({
        where: { id: req.params.id },
      });
      return res.json({ data: updated });
    }

    res.json({ data: list });
  } catch (error) {
    next(error);
  }
}

export async function deleteList(req, res, next) {
  try {
    await prisma.list.delete({ where: { id: req.params.id } });

    res.json({ data: { message: 'List deleted' } });
  } catch (error) {
    next(error);
  }
}
