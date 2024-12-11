"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_template_controller_1 = require("../controllers/message-template.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Create a new template
router.post('/', message_template_controller_1.MessageTemplateController.createTemplate);
// Get all templates for the current user
router.get('/', message_template_controller_1.MessageTemplateController.getTemplates);
// Search templates
router.get('/search', message_template_controller_1.MessageTemplateController.searchTemplates);
// Update a template
router.put('/:templateId', message_template_controller_1.MessageTemplateController.updateTemplate);
// Delete a template
router.delete('/:templateId', message_template_controller_1.MessageTemplateController.deleteTemplate);
// Toggle template sharing
router.post('/:templateId/share', message_template_controller_1.MessageTemplateController.toggleSharing);
exports.default = router;
