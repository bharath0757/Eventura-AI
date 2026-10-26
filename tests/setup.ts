// Ordinary tests are credential-free and must never reach an external AI service.
process.env.GEMINI_API_KEY = "";
process.env.GEMINI_MODEL = "";
globalThis.fetch = async () => {
  throw new Error(
    "Network requests are disabled in ordinary tests. Mock the provider or fetch boundary explicitly.",
  );
};
