import "dotenv/config";
import http from "node:http";

const PORT = Number(process.env.PORT || 3001);
const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL ||
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const QWEN_MODEL = process.env.QWEN_MODEL || "qwen-plus";

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

function getCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function sendJson(response, statusCode, data, origin = "") {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...getCorsHeaders(origin),
  });

  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 12000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => {
      return (
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
      );
    })
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 3000),
    }));
}

async function handleChat(request, response, origin) {
  if (!allowedOrigins.has(origin)) {
    return sendJson(response, 403, { error: "Origin is not allowed" }, origin);
  }

  if (!QWEN_API_KEY) {
    return sendJson(
      response,
      500,
      { error: "QWEN_API_KEY is not configured" },
      origin
    );
  }

  let body;

  try {
    body = await readJsonBody(request);
  } catch (error) {
    return sendJson(response, 400, { error: error.message }, origin);
  }

  const question = normalizeText(body.question, 2000);
  const selectedText = normalizeText(body.selectedText, 5000);
  const history = normalizeHistory(body.history);

  if (!question) {
    return sendJson(response, 400, { error: "Question is empty" }, origin);
  }

  const systemPrompt = `
Ты помощник на учебном сайте по C++.
Отвечай по-русски.
Объясняй просто, но технически точно.
Учитывай, что ученица новичок.
Если вопрос связан с выделенным текстом, сначала объясни именно выделенный фрагмент.
Если в коде есть ошибка, покажи: что не так, почему, как исправить.
Не выдумывай факты о проекте.
Не давай слишком длинный ответ без необходимости.
`.trim();

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    {
      role: "user",
      content: selectedText
        ? `Выделенный текст:\n${selectedText}\n\nВопрос:\n${question}`
        : question,
    },
  ];

  try {
    const qwenResponse = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QWEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    const qwenData = await qwenResponse.json();

    if (!qwenResponse.ok) {
      return sendJson(
        response,
        qwenResponse.status,
        {
          error: "Qwen API error",
          details: qwenData,
        },
        origin
      );
    }

    const answer =
      qwenData?.choices?.[0]?.message?.content ||
      "Не удалось получить ответ от модели.";

    return sendJson(response, 200, { answer }, origin);
  } catch (error) {
    return sendJson(
      response,
      502,
      {
        error: "Failed to call Qwen API",
        details: error instanceof Error ? error.message : String(error),
      },
      origin
    );
  }
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";

  if (request.method === "OPTIONS") {
    response.writeHead(204, getCorsHeaders(origin));
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    return sendJson(response, 200, { ok: true }, origin);
  }

  if (request.method === "POST" && request.url === "/api/chat") {
    return handleChat(request, response, origin);
  }

  return sendJson(response, 404, { error: "Not found" }, origin);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Qwen local proxy: http://127.0.0.1:${PORT}`);
});