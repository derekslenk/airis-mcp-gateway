// Server metadata configuration
// Maps each MCP server to its required API keys/secrets

export interface ServerKeyConfig {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'url';
  required: boolean;
}

export interface ServerConfig {
  keys: ServerKeyConfig[];
  documentation?: string;
}

// Server configurations
export const SERVER_CONFIGS: Record<string, ServerConfig> = {
  // === AI SEARCH & RESEARCH ===
  tavily: {
    keys: [
      {
        name: 'TAVILY_API_KEY',
        label: 'Tavily API Key',
        placeholder: 'tvly-xxxxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://tavily.com/',
  },

  // === DATABASE & BACKEND ===
  supabase: {
    keys: [
      {
        name: 'SUPABASE_URL',
        label: 'Supabase URL',
        placeholder: 'https://xxx.supabase.co',
        type: 'url',
        required: true,
      },
      {
        name: 'SUPABASE_ANON_KEY',
        label: 'Supabase Anon Key',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://supabase.com/docs',
  },

  mongodb: {
    keys: [
      {
        name: 'MONGODB_CONNECTION_STRING',
        label: 'MongoDB Connection String',
        placeholder: 'mongodb+srv://user:pass@cluster.mongodb.net/db',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://www.mongodb.com/docs/atlas/driver-connection/',
  },

  'mcp-postgres-server': {
    keys: [
      {
        name: 'POSTGRES_CONNECTION_STRING',
        label: 'PostgreSQL Connection String',
        placeholder: 'postgresql://user:pass@localhost:5432/db',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://www.postgresql.org/docs/',
  },

  // === PRODUCTIVITY & COLLABORATION ===
  notion: {
    keys: [
      {
        name: 'NOTION_API_KEY',
        label: 'Notion API Key',
        placeholder: 'secret_xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://developers.notion.com/',
  },

  slack: {
    keys: [
      {
        name: 'SLACK_BOT_TOKEN',
        label: 'Slack Bot Token',
        placeholder: 'xoxb-xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
      {
        name: 'SLACK_TEAM_ID',
        label: 'Slack Team ID',
        placeholder: 'T01234567',
        type: 'text',
        required: true,
      },
    ],
    documentation: 'https://api.slack.com/',
  },

  figma: {
    keys: [
      {
        name: 'FIGMA_ACCESS_TOKEN',
        label: 'Figma Access Token',
        placeholder: 'figd_xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://help.figma.com/hc/en-us/articles/8085703771159',
  },

  // === PAYMENT & API INTEGRATIONS ===
  stripe: {
    keys: [
      {
        name: 'STRIPE_SECRET_KEY',
        label: 'Stripe Secret Key',
        placeholder: 'sk_live_xxxxxxxxxxxx or sk_test_xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://stripe.com/docs/keys',
  },

  twilio: {
    keys: [
      {
        name: 'TWILIO_ACCOUNT_SID',
        label: 'Twilio Account SID',
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'text',
        required: true,
      },
      {
        name: 'TWILIO_API_KEY',
        label: 'Twilio API Key',
        placeholder: 'SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
      {
        name: 'TWILIO_API_SECRET',
        label: 'Twilio API Secret',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://www.twilio.com/docs/iam/keys/api-key',
  },

  // === DEVELOPMENT TOOLS ===
  github: {
    keys: [
      {
        name: 'GITHUB_PERSONAL_ACCESS_TOKEN',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
  },

  'brave-search': {
    keys: [
      {
        name: 'BRAVE_API_KEY',
        label: 'Brave Search API Key',
        placeholder: 'BSAxxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
    ],
    documentation: 'https://brave.com/search/api/',
  },

  sentry: {
    keys: [
      {
        name: 'SENTRY_AUTH_TOKEN',
        label: 'Sentry Auth Token',
        placeholder: 'sntrys_xxxxxxxxxxxx',
        type: 'password',
        required: true,
      },
      {
        name: 'SENTRY_ORG',
        label: 'Sentry Organization',
        placeholder: 'my-organization',
        type: 'text',
        required: true,
      },
    ],
    documentation: 'https://docs.sentry.io/api/auth/',
  },
};

// Helper function to get server config
export function getServerConfig(serverName: string): ServerConfig | null {
  return SERVER_CONFIGS[serverName] || null;
}

// Helper function to check if server requires API keys
export function requiresApiKeys(serverName: string): boolean {
  return serverName in SERVER_CONFIGS;
}

// Helper function to get all required key names for a server
export function getRequiredKeys(serverName: string): string[] {
  const config = getServerConfig(serverName);
  return config ? config.keys.filter(k => k.required).map(k => k.name) : [];
}
