import express from 'express';
import { handleIncomingCall } from '../controllers/webhook.controller.js';

const router = express.Router();

// Twilio/Exotel webhook — NO AUTH (validated by Twilio signature)
// This is the most critical route in the entire app
router.post('/incoming-call', handleIncomingCall);

export default router;
