// backend/middleware/errorHandler.js
//
// Catches anything that falls through routes without being handled.
// This is what keeps the whole Node process alive when something
// unexpected throws — no crash, no stack trace to the client.

function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err); // full detail server-side only

  if (res.headersSent) return next(err);

  res.status(500).json({
    success: false,
    message: "Something went wrong on Zenvyra's side. Please try again.",
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "That endpoint doesn't exist.",
  });
}

module.exports = { errorHandler, notFoundHandler };
