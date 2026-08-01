import authService from '../services/AuthService.js';
import userRepository from '../repositories/UserRepository.js';
import logger from '../utils/logger.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await authService.login(email, password);
    
    // Set HTTP-Only Secure Cookie for Refresh Token
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    logger.info(`User Logged In: ${email} (${req.ip})`);

    res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    logger.warn(`Failed Login Attempt: ${req.body.email} (${req.ip}) - ${error.message}`);
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const tokens = await authService.refreshToken(token);
    
    res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || 'Invalid refresh token' });
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
    
    logger.info(`User Logged Out: ${req.user.email || req.user.id}`);
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
