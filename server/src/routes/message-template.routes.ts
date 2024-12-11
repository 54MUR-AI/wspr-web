import { Router } from 'express';
import { MessageTemplateController } from '../controllers/message-template.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new template
router.post('/', MessageTemplateController.createTemplate);

// Get all templates for the current user
router.get('/', MessageTemplateController.getTemplates);

// Search templates
router.get('/search', MessageTemplateController.searchTemplates);

// Update a template
router.put('/:templateId', MessageTemplateController.updateTemplate);

// Delete a template
router.delete('/:templateId', MessageTemplateController.deleteTemplate);

// Toggle template sharing
router.post('/:templateId/share', MessageTemplateController.toggleSharing);

export default router;
