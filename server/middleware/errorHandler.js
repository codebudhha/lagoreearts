export function errorHandler(err, req, res, next) {
  console.error('🔥 Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the Lagoree Arts server.';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
