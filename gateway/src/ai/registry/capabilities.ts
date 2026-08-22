export type CapabilityType = 
  | 'conversation'
  | 'knowledge'
  | 'reasoning'
  | 'calculation'
  | 'coding'
  | 'creative'
  | 'translation'
  | 'summarization'
  | 'system'
  | 'owner_operation'
  | 'provider_management'
  | 'vision'
  | 'unsupported'
  | 'chat.generate'
  | 'chat.stream';

export interface CapabilityDefinition {
  id: CapabilityType;
  name: string;
  description: string;
  requiresGeneralAI: boolean;
}

export const CAPABILITY_REGISTRY: Record<string, CapabilityDefinition> = {
  conversation: {
    id: 'conversation',
    name: 'Conversation',
    description: 'Basic interactive conversation, greetings, and identity',
    requiresGeneralAI: false,
  },
  knowledge: {
    id: 'knowledge',
    name: 'General Knowledge',
    description: 'Factual knowledge, explanations, concepts, and Q&A',
    requiresGeneralAI: true,
  },
  reasoning: {
    id: 'reasoning',
    name: 'Complex Reasoning',
    description: 'Multi-step logic, analysis, and problem-solving',
    requiresGeneralAI: true,
  },
  calculation: {
    id: 'calculation',
    name: 'Calculation & Arithmetic',
    description: 'Mathematical operations, arithmetic, and basic equations',
    requiresGeneralAI: false,
  },
  coding: {
    id: 'coding',
    name: 'Code Generation & Analysis',
    description: 'Writing, debugging, and explaining code in programming languages',
    requiresGeneralAI: true,
  },
  creative: {
    id: 'creative',
    name: 'Creative Writing',
    description: 'Stories, poems, creative ideation, and prose',
    requiresGeneralAI: true,
  },
  translation: {
    id: 'translation',
    name: 'Language Translation',
    description: 'Translating text between natural human languages',
    requiresGeneralAI: true,
  },
  summarization: {
    id: 'summarization',
    name: 'Text Summarization',
    description: 'Distilling long text into concise key points',
    requiresGeneralAI: true,
  },
  system: {
    id: 'system',
    name: 'System Information',
    description: 'Internal system health, status checks, and architecture queries',
    requiresGeneralAI: false,
  },
  owner_operation: {
    id: 'owner_operation',
    name: 'Owner Operations',
    description: 'Privileged operations restricted to platform Overseer/Owner',
    requiresGeneralAI: false,
  },
  provider_management: {
    id: 'provider_management',
    name: 'Provider & Model Management',
    description: 'Listing and querying available providers and models',
    requiresGeneralAI: false,
  },
  vision: {
    id: 'vision',
    name: 'Visual Understanding',
    description: 'Image and visual media analysis',
    requiresGeneralAI: true,
  },
  unsupported: {
    id: 'unsupported',
    name: 'Unsupported Capability',
    description: 'Requests requiring capabilities outside supported boundaries',
    requiresGeneralAI: false,
  },
};

export function getCapabilityDefinition(capability: string): CapabilityDefinition {
  return CAPABILITY_REGISTRY[capability] || {
    id: 'unsupported' as CapabilityType,
    name: capability,
    description: `Custom or dynamic capability "${capability}"`,
    requiresGeneralAI: true,
  };
}

export function isGeneralAICapability(capabilities: string[]): boolean {
  return capabilities.some(c => {
    const def = CAPABILITY_REGISTRY[c];
    return def ? def.requiresGeneralAI : false;
  });
}
