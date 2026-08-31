export interface QuietDeskReply {
  text: string;
  capabilities?: boolean;
}

// Deliberately local: this portfolio prototype does not contact an AI service.
export function quietDeskReply(question: string): QuietDeskReply {
  const text = question.toLowerCase().trim();

  if (/contact|linkedin|github|reach/.test(text)) {
    return { text: 'You can use the Contact menu to find Lucas’s verified LinkedIn and GitHub profiles.' };
  }
  if (/skill|capabilit|technology|tech stack|what.*do/.test(text)) {
    return {
      text: 'Lucas works mainly with backend systems and architecture, has some frontend experience, and is currently exploring AI rather than claiming deep AI expertise.',
      capabilities: true,
    };
  }
  if (/background|about|experience|who.*lucas|backend|architecture|frontend|\bai\b/.test(text)) {
    return {
      text: 'Lucas is a software engineer focused mainly on backend work and architecture, with some frontend experience and a growing interest in AI.',
    };
  }
  if (/approach|work|process|design/.test(text)) {
    return {
      text: 'His approach is to understand the context, shape a clear system around real constraints, and iterate carefully.',
    };
  }
  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(text)) {
    return { text: 'Hello — I can answer concise questions about Lucas’s background, approach, and areas of focus.' };
  }
  return {
    text: 'I only have a small set of verified information about Lucas, so I can help with his background, approach, skills, or contact links.',
  };
}
