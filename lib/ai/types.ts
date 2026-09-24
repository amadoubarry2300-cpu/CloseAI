export type Channel = "text" | "audio" | "image";
export type ProspectAnalysis = {
  intent: "purchase" | "information" | "comparison" | "support" | "unknown";
  interest: "cold" | "interested" | "hot" | "very_hot";
  objection: string | null;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  product: string | null;
  budget: string | null;
  score: number;
  nextAction: string;
  requiresHuman: boolean;
  reason?: string;
};
export type AIResponse = { response: string; analysis: ProspectAnalysis; provider: string; grounded: boolean };
export type ProductContext = { name: string; price?: string; description?: string; benefits?: string[]; paymentLink?: string };
export type ConversationInput = { contact?: string; length?: "courte"|"normale"|"détaillée"; messages: {role:string;content:string}[]; product?: ProductContext; knowledge?: string[]; tone?: string; language?: string };
