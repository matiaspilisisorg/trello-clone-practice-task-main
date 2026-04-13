import { z } from 'zod';
import prisma from '../prisma/client.js';

const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  color: z.string().optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).optional(),
  color: z.string().optional(),
});

async function getBoardStats(userId) {
  const rows = await prisma.$queryRaw`
    SELECT
      b.id                                                         AS "boardId",
      COUNT(DISTINCT l.id)::int                                    AS "listCount",
      COUNT(DISTINCT c.id)::int                                    AS "totalCards",
      COUNT(DISTINCT CASE
        WHEN c."dueDate" IS NOT NULL
         AND c."dueDate" < NOW() AT TIME ZONE 'UTC'
        THEN c.id END)::int                                        AS "pastDue",
      COUNT(DISTINCT CASE
        WHEN c."dueDate" IS NOT NULL
         AND c."dueDate" >= NOW() AT TIME ZONE 'UTC'
         AND c."dueDate" <= (NOW() AT TIME ZONE 'UTC' + INTERVAL '5 days')
        THEN c.id END)::int                                        AS "dueSoon"
    FROM "Board" b
    LEFT JOIN "List" l ON l."boardId" = b.id
    LEFT JOIN "Card" c ON c."listId" = l.id
    WHERE b."ownerId" = ${userId}
    GROUP BY b.id
  `;

  return Object.fromEntries(rows.map((r) => [r.boardId, r]));
}

export async function getBoards(req, res, next) {
  try {
    const [boards, statsMap] = await Promise.all([
      prisma.board.findMany({
        where: { ownerId: req.userId },
        orderBy: { createdAt: 'desc' },
      }),
      getBoardStats(req.userId),
    ]);

    const data = boards.map((board) => ({
      ...board,
      stats: statsMap[board.id] ?? { listCount: 0, totalCards: 0, pastDue: 0, dueSoon: 0 },
    }));

    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function createBoard(req, res, next) {
  try {
    const parsed = createBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        color: parsed.data.color,
        ownerId: req.userId,
      },
    });

    res.status(201).json({ data: board });
  } catch (error) {
    next(error);
  }
}

export async function getBoard(req, res, next) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        lists: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: { labels: true },
            },
          },
        },
      },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: board });
  } catch (error) {
    next(error);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const parsed = updateBoardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (board.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.board.delete({ where: { id: req.params.id } });

    res.json({ data: { message: 'Board deleted' } });
  } catch (error) {
    next(error);
  }
}
