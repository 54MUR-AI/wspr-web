import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import {
  getCurrentUser,
  registerWebAuthn,
  verifyWebAuthnRegistration,
  getWebAuthnLoginOptions,
  verifyWebAuthnLogin,
} from '../controllers/auth.controller';

const router = Router();

// Routes
router.get('/me', requireAuth, asyncHandler(getCurrentUser));
router.post('/webauthn/register/options', asyncHandler(registerWebAuthn));
router.post('/webauthn/register/verify', asyncHandler(verifyWebAuthnRegistration));
router.post('/webauthn/login/options', asyncHandler(getWebAuthnLoginOptions));
router.post('/webauthn/login/verify', asyncHandler(verifyWebAuthnLogin));

export default router;
