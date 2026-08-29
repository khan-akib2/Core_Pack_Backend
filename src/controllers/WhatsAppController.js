import WhatsAppService from '../services/WhatsAppService.js';

export const getWhatsAppStatus = (req, res) => {
  try {
    const status = WhatsAppService.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logoutWhatsApp = async (req, res) => {
  try {
    await WhatsAppService.logout();
    res.status(200).json({ success: true, message: 'Logged out of WhatsApp successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reconnectWhatsApp = async (req, res) => {
  try {
    // Trigger reinitialization asynchronously so endpoint returns fast
    WhatsAppService.reinitialize().catch(err => {
      console.error('WhatsApp reinitialize error:', err);
    });
    res.status(200).json({ success: true, message: 'WhatsApp Engine re-initialization triggered.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
