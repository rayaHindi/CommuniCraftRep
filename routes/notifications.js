const express = require('express');
const {
  sendInvitation,
  getInvitations,
  acceptInvitation,
  declineInvitation
} = require('../controllers/notifications');
const { authenticateTokenHandler } = require('../auth/auth');

const router = express.Router();
router.use(express.json());

router.post('/send-invitation', authenticateTokenHandler,sendInvitation);
router.get('/invitations',authenticateTokenHandler,getInvitations);
router.put('/accept-invitation/:invitationId', authenticateTokenHandler,acceptInvitation);
router.put('/decline-invitation/:invitationId', authenticateTokenHandler,declineInvitation);

module.exports = router;
