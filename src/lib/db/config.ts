export const DB_CONFIG = {
  name: "DB",
  collections: {
    users: 'users',
    conversations: 'conversations',
    messages: 'messages',
    aliases: 'aliases',
    accounts: 'accounts',
    sessions: 'sessions',
    verificationTokens: 'verification_tokens'
  } as const
};

export type CollectionName = keyof typeof DB_CONFIG.collections;