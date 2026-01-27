// AI Services are disabled via user request.
// This file is kept as a placeholder to prevent import errors during transition.

export const askRulesBot = async (query: string): Promise<string> => {
    console.warn("AI Module is disabled.");
    return "AI Module Offline.";
};
