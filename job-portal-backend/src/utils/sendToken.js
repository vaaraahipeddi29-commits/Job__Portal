const jwt = require('jsonwebtoken');

const cookieOptions = () => ({
  httpOnly: true, // JavaScript in the browser cannot read this cookie
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
});

const sendToken = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  const days = Number(process.env.COOKIE_EXPIRES_DAYS) || 1;
  res.cookie('token', token, {
    ...cookieOptions(),
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  // The token itself is NOT returned in the body - it only lives in the httpOnly cookie.
  res.status(statusCode).json({ success: true, message, data: { user } });
};

const clearToken = (res) => {
  res.cookie('token', '', { ...cookieOptions(), expires: new Date(0) });
};

module.exports = { sendToken, clearToken };
