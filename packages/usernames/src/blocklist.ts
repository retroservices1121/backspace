// Brand / trademark blocklist. The intent is "would a reasonable observer
// assume this account is the brand"; we are not trying to be exhaustive.
// Comparisons are case-insensitive; entries here must be lowercase.
export const TRADEMARK_BLOCKLIST: ReadonlySet<string> = new Set([
  // Big tech
  'apple', 'mac', 'macos', 'iphone', 'ipad', 'ios', 'icloud', 'itunes',
  'microsoft', 'windows', 'xbox', 'azure', 'office', 'outlook', 'bing',
  'google', 'alphabet', 'gmail', 'youtube', 'android', 'chrome', 'chromebook',
  'amazon', 'aws', 'kindle', 'alexa', 'audible', 'prime', 'twitch',
  'meta', 'facebook', 'instagram', 'whatsapp', 'threads', 'oculus',
  'tiktok', 'bytedance', 'douyin',
  'twitter', 'x',
  'snap', 'snapchat',
  'linkedin', 'pinterest', 'reddit', 'quora', 'discord', 'slack', 'zoom',
  'telegram', 'signal', 'wechat',
  'netflix', 'disney', 'hulu', 'paramount', 'peacock', 'hbo', 'max',
  'spotify', 'soundcloud', 'pandora', 'tidal',
  'openai', 'chatgpt', 'gpt', 'anthropic', 'claude', 'gemini', 'bard',
  'midjourney', 'stability', 'huggingface',
  // Sports / apparel
  'nike', 'adidas', 'puma', 'reebok', 'underarmour', 'newbalance', 'asics',
  'gucci', 'prada', 'chanel', 'louisvuitton', 'lv', 'hermes', 'dior',
  'rolex', 'cartier', 'tiffany',
  // Auto / mobility
  'tesla', 'spacex', 'starlink', 'twitter', 'boring',
  'toyota', 'honda', 'ford', 'gm', 'chevrolet', 'bmw', 'mercedes', 'audi',
  'porsche', 'ferrari', 'lamborghini', 'volkswagen', 'volvo',
  'uber', 'lyft', 'doordash', 'instacart', 'grubhub',
  'airbnb', 'booking', 'expedia',
  // Financial
  'visa', 'mastercard', 'americanexpress', 'amex',
  'paypal', 'venmo', 'cashapp', 'zelle', 'wise',
  'jpmorgan', 'chase', 'citi', 'citibank', 'wellsfargo', 'bankofamerica', 'boa',
  'goldman', 'goldmansachs', 'morganstanley', 'blackrock', 'vanguard',
  'robinhood', 'fidelity', 'schwab', 'etrade',
  'stripe', 'square', 'block', 'shopify', 'plaid',
  // Crypto / web3
  'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'polygon', 'matic',
  'avalanche', 'avax', 'cardano', 'ada', 'ripple', 'xrp', 'dogecoin', 'doge',
  'coinbase', 'binance', 'kraken', 'gemini', 'ftx', 'bybit', 'okx',
  'opensea', 'blur', 'magiceden',
  'metamask', 'phantom', 'ledger', 'trezor', 'rainbow',
  'uniswap', 'curve', 'aave', 'compound', 'makerdao', 'lido',
  'chainlink', 'arbitrum', 'optimism', 'base', 'starknet', 'zksync',
  'polymarket', 'kalshi', 'manifold', 'augur', 'gnosis', 'azuro',
  'privy', 'walletconnect', 'reown', 'ably',
  // Media / news
  'cnn', 'bbc', 'fox', 'foxnews', 'nyt', 'nytimes', 'wapo', 'wsj',
  'reuters', 'bloomberg', 'forbes', 'cnbc', 'espn', 'nba', 'nfl', 'mlb', 'nhl',
  'fifa', 'uefa',
  // Government / international
  'usa', 'usgov', 'whitehouse', 'fbi', 'cia', 'nsa', 'irs', 'sec',
  'un', 'who', 'nato',
  // Backspace platform
  'backspace', 'backspaceapp', 'backspacehq', 'backspacefyi', 'backspaceto',
  'backspacethat', 'backspaceofficial', 'backspacesupport', 'backspaceteam',
]);

// Reserved system / role names. Same case-insensitive lookup.
export const RESERVED_BLOCKLIST: ReadonlySet<string> = new Set([
  // Roles
  'admin', 'admins', 'administrator', 'root', 'superuser', 'su',
  'owner', 'owners', 'ceo', 'cto', 'cfo', 'coo', 'founder', 'founders',
  'staff', 'team', 'employee', 'employees', 'intern',
  'mod', 'mods', 'moderator', 'moderators',
  'official', 'verified',
  // Help / contact / abuse
  'support', 'help', 'helpdesk', 'contact', 'info', 'feedback', 'press', 'pr',
  'billing', 'invoice', 'invoices', 'payments', 'sales', 'marketing', 'legal',
  'security', 'abuse', 'report', 'reports', 'safety', 'trust',
  'postmaster', 'webmaster', 'hostmaster', 'noc',
  // Infra
  'www', 'mail', 'email', 'ftp', 'api', 'apis', 'app', 'apps', 'web',
  'cdn', 'static', 'assets', 'media', 'public', 'private',
  'login', 'logout', 'register', 'signup', 'signin', 'signout',
  'oauth', 'auth', 'authentication', 'account', 'accounts',
  'settings', 'preferences', 'profile', 'profiles',
  'user', 'users', 'me', 'you', 'them', 'us',
  'null', 'undefined', 'nan', 'none', 'nil', 'void',
  'system', 'default', 'guest', 'anonymous', 'anon', 'unknown',
  // Env
  'test', 'tests', 'testing', 'demo', 'sample', 'example',
  'dev', 'developer', 'developers', 'beta', 'alpha', 'prod', 'production', 'staging',
  'dashboard', 'console', 'terminal', 'shell', 'server', 'client', 'host', 'hosting',
  // Status
  'status', 'health', 'healthcheck', 'ping', 'pong', 'metrics', 'stats',
  'analytics', 'logs', 'log', 'debug', 'error', 'errors',
  // Product nouns (avoid being mistaken for system surfaces)
  'home', 'feed', 'timeline', 'stream', 'live', 'news', 'trending', 'explore',
  'search', 'discover', 'notifications',
  'dm', 'dms', 'chat', 'chats', 'room', 'rooms', 'channel', 'channels',
  'community', 'communities', 'space', 'spaces', 'group', 'groups',
  'page', 'pages', 'event', 'events',
  'market', 'markets', 'prediction', 'predictions', 'bet', 'bets',
  'position', 'positions', 'trade', 'trades',
  'wallet', 'wallets', 'claim', 'claims',
  'post', 'posts', 'comment', 'comments', 'like', 'likes',
  'follow', 'follows', 'follower', 'followers', 'following',
  'subscribe', 'unsubscribe', 'subscription', 'subscriptions',
  'tier', 'tiers', 'plan', 'plans',
  'webhook', 'webhooks', 'cron',
]);
