const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { buildAssistantReply } = require("../services/assistantService");

const sendMessage = asyncHandler(async (req, res) => {
  const message = String(req.body?.message || "").trim();

  if (!message) {
    throw new ApiError(400, "Message is required.");
  }

  if (message.length > 500) {
    throw new ApiError(400, "Message is too long (max 500 characters).");
  }

  const answer = await buildAssistantReply({
    message,
    user: req.user,
  });

  res.status(200).json({
    success: true,
    reply: answer.reply,
    suggestions: Array.isArray(answer.suggestions) ? answer.suggestions : [],
    intent: answer.intent || "fallback",
    answeredAt: new Date().toISOString(),
  });
});

module.exports = { sendMessage };
