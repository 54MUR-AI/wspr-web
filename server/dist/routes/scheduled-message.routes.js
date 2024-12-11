"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheduled_message_controller_1 = require("../controllers/scheduled-message.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Create a new scheduled message
router.post('/', scheduled_message_controller_1.ScheduledMessageController.createScheduledMessage);
// Get all scheduled messages for the current user
router.get('/', scheduled_message_controller_1.ScheduledMessageController.getScheduledMessages);
// Update a scheduled message
router.put('/:messageId', scheduled_message_controller_1.ScheduledMessageController.updateScheduledMessage);
// Cancel a scheduled message
router.delete('/:messageId', scheduled_message_controller_1.ScheduledMessageController.cancelScheduledMessage);
exports.default = router;
