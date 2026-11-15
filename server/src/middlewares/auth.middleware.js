const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Thiếu Header Authorization hoặc token không hợp lệ'
      },
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'supersecretkey_gamified_todo_sprint1';
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token đã hết hạn hoặc không hợp lệ'
      },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { verifyToken };
