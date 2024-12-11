import { Router } from 'express';
import { ScheduledMessageController } from '../controllers/scheduled-message.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new scheduled message
router.post('/', ScheduledMessageController.createScheduledMessage);

// Get all scheduled messages for the current user
router.get('/', ScheduledMessageController.getScheduledMessages);

// Update a scheduled message
router.put('/:messageId', ScheduledMessageController.updateScheduledMessage);

// Cancel a scheduled message
router.delete('/:messageId', ScheduledMessageController.cancelScheduledMessage);

export default router;
