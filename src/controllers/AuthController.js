import authService from '../services/AuthService.js';
import userRepository from '../repositories/UserRepository.js';
import logger from '../utils/logger.js';

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // true in production, false for local dev (10.0.2.2 vs localhost)
    sameSite: isProd ? 'strict' : 'lax', // Lax for cross-origin local dev
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  };
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(email, password, ipAddress, userAgent);
    
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    logger.info(`User Logged In: ${email} (${req.ip})`);

    // Include refreshToken in response so native apps can store it via Preferences/localStorage
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    logger.warn(`Failed Login Attempt: ${req.body.email} (${req.ip}) - ${error.message}`);
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.headers['x-refresh-token'];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const tokens = await authService.refreshToken(token, ipAddress, userAgent);
    
    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions());
    
    res.json({ success: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
  } catch (error) {
    res.clearCookie('refreshToken', { ...getCookieOptions(), maxAge: 0 });
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
    const token = req.cookies.refreshToken || req.headers['x-refresh-token'];
    await authService.logout(token);
    
    res.clearCookie('refreshToken', { ...getCookieOptions(), maxAge: 0 });
    
    logger.info(`User Logged Out: ${req.user.email || req.user.id}`);
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePushToken = async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    const token = req.cookies.refreshToken || req.headers['x-refresh-token'];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token is required to update push token' });
    }

    if (!pushToken) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }

    await authService.updateSessionPushToken(token, pushToken);
    
    res.json({ success: true, message: 'Push token updated successfully' });
  } catch (error) {
    next(error);
  }
};
