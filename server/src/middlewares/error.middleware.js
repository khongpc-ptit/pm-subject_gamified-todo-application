const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống`
    },
    timestamp: new Date().toISOString()
  });
};

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Middleware]:', err);
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = err.message || 'Hệ thống đang bận, vui lòng thử lại sau';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { notFoundHandler, errorHandler };
