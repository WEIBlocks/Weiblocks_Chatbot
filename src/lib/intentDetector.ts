export interface IntentResult {
  isLead: boolean;
  projectType: string;
  confidence: number;
}

const PROJECT_KEYWORDS = [
  'build', 'develop', 'create', 'project', 'app', 'platform', 'website',
  'mvp', 'launch', 'make', 'need', 'want', 'looking for', 'interested in',
  'hire', 'work with', 'help me', 'can you', 'we need'
];

const PRICING_KEYWORDS = [
  'cost', 'price', 'budget', 'how much', 'quote', 'estimate', 'pricing',
  'rates', 'charge', 'fee', 'affordable', 'expensive', 'cheap', 'invest'
];

const TIMELINE_KEYWORDS = [
  'timeline', 'deadline', 'asap', 'urgent', 'when', 'weeks', 'months',
  'how long', 'timeframe', 'delivery', 'schedule', 'quickly', 'fast'
];

const CONTACT_KEYWORDS = [
  'contact', 'call', 'talk', 'meeting', 'schedule', 'demo', 'consultation',
  'reach', 'email', 'phone', 'speak', 'chat', 'discuss', 'book'
];

const SERVICE_KEYWORDS: Record<string, string[]> = {
  'AI Development': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'chatbot', 'automation', 'agent', 'llm', 'gpt', 'openai'],
  'Blockchain': ['blockchain', 'web3', 'decentralized', 'distributed', 'consensus', 'ledger'],
  'Smart Contracts': ['smart contract', 'solidity', 'evm', 'ethereum', 'polygon', 'tron'],
  'DeFi': ['defi', 'dex', 'swap', 'liquidity', 'yield', 'farming', 'lending', 'borrowing', 'protocol'],
  'NFT': ['nft', 'non-fungible', 'marketplace', 'collection', 'mint'],
  'Token Development': ['token', 'erc20', 'erc-20', 'bep20', 'spl', 'tokenomics', 'ico', 'ido', 'presale'],
  'Solana': ['solana', 'sol', 'anchor', 'rust', 'spl'],
  'Staff Augmentation': ['staff', 'augmentation', 'team', 'developer', 'hire', 'engineer', 'talent'],
  'RWA': ['rwa', 'real world asset', 'tokenization', 'real estate'],
  'Mobile App': ['mobile', 'ios', 'android', 'react native', 'flutter'],
  'Full-Stack': ['fullstack', 'full-stack', 'full stack', 'frontend', 'backend', 'web app'],
};

function matchKeywords(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}

function detectProjectType(text: string): string {
  for (const [type, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (matchKeywords(text, keywords)) {
      return type;
    }
  }
  return 'General';
}

export function detectIntent(message: string): IntentResult {
  const lower = message.toLowerCase();
  let score = 0;

  const hasProject = matchKeywords(lower, PROJECT_KEYWORDS);
  const hasPricing = matchKeywords(lower, PRICING_KEYWORDS);
  const hasTimeline = matchKeywords(lower, TIMELINE_KEYWORDS);
  const hasContact = matchKeywords(lower, CONTACT_KEYWORDS);

  if (hasProject) score += 3;
  if (hasPricing) score += 4;
  if (hasTimeline) score += 2;
  if (hasContact) score += 4;

  // Check service keyword hits for additional signal
  for (const keywords of Object.values(SERVICE_KEYWORDS)) {
    if (matchKeywords(lower, keywords)) {
      score += 2;
      break;
    }
  }

  const isLead = score >= 4;
  const confidence = Math.min(score / 10, 1);
  const projectType = detectProjectType(lower);

  return { isLead, projectType, confidence };
}
