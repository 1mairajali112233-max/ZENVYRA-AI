// backend/utils/apiResponse.js
// Every endpoint in Zenvyra responds with ONE consistent JSON shape.
// This is the only file that should ever build a success/error envelope.

function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function fail(res, message, statusCode = 400, extra = {}) {
  return res.status(statusCode).json({ success: false, message, ...extra });
}

// Friendly, never-leaky messages for AI provider failures.
// Real error detail goes to console.error server-side only.
function aiFailure(res, err) {
  const status = err?.status || err?.response?.status;

  if (status === 429) {
    return fail(
      res,
      "Zenvyra's AI service is temporarily busy. Please try again shortly.",
      503
    );
  }

  if (status === 503) {
    return fail(
      res,
      "Zenvyra's AI service is temporarily unavailable. Please try again in a moment.",
      503
    );
  }

  return fail(
    res,
    "Something went wrong on Zenvyra's side. Please try again.",
    502
  );
}

module.exports = { success, fail, aiFailure };
