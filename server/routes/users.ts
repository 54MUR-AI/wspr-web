import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users except the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUserId
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Search users by name or email
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user?.id;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          {
            id: {
              not: currentUserId
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
