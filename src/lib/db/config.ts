export const DB_CONFIG = {
   name: "DB", 
   collections: {
     users: 'users',
     problemSets: 'problem_sets',
     problems: 'problems',
     messages: 'messages',
     accounts: 'accounts',
     sessions: 'sessions',
     verificationTokens: 'verification_tokens'
   } as const
 };
 
 export type CollectionName = keyof typeof DB_CONFIG.collections;