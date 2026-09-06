export type Tier = "Significant" | "Notable" | "Normal";
export type Confidence = "High" | "Medium" | "Low";

export type HomeStock = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  tier: Tier;
  confidence: Confidence;
  freshness: string;
  watchType: string;
  price: number | null;
  move: number;
  relative: number;
  volume: number;
  evidence: string[];
  insightKey: string | null;
  reviewed: boolean;
  deEmphasized: boolean;
  computedAt: string | null;
};

export type Pulse = {
  significant: number;
  notable: number;
  normal: number;
};

export type MarketContextRow = {
  sector: string;
  move: number;
  tracked: number;
};

export type HomeResponse = {
  demo: boolean;
  watchlist: HomeStock[];
  catchUp: HomeStock[];
  catchUpOverflow: number;
  pulse: Pulse;
  marketContext: MarketContextRow[];
  baseline: null;
  updated: string;
};

export type SecuritySearchHit = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
};

export type ExploreStock = SecuritySearchHit & {
  price: number | null;
  move: number | null;
  status: "Not yet tracked" | null;
  watching: boolean;
};

export type ExploreResponse = { items: ExploreStock[]; sectors: string[] };

export type WatchManageEntry = {
  symbol: string;
  watch_type: string;
  expires_at: string | null;
  threshold: number | null;
  mute: number;
  name: string;
};

export type WatchManageResponse = {
  entries: WatchManageEntry[];
  mutedCategories: string[];
};

export type SettingsResponse = {
  price: number;
  volume: number;
  news: number;
  earnings: number;
  corporate_actions: number;
  mutedCategories: string[];
};

export type Insight = {
  symbol: string;
  computed_at: string;
  baseline_price: number | null;
  current_price: number | null;
  tier: Tier;
  confidence: Confidence;
  freshness: string;
  evidence_json: string;
  signals_json: string;
  model_version: string;
};

export type Comparison = {
  baselinePrice: number;
  baselineTimestamp: string;
  currentPrice: number;
  currentTimestamp: string;
  absoluteDifference: number;
  percentageDifference: number | null;
};

export type TimelineEvent = {
  id: number;
  symbol: string | null;
  layer: string;
  category: string;
  title: string;
  detail: string | null;
  source: string | null;
  timestamp: string;
  status: string;
};

export type EventThread = {
  id: number;
  symbol: string;
  category: string;
  status: string;
  opened_at: string;
  updated_at: string;
  event_count: number;
  events: TimelineEvent[];
};

export type TimelineResponse = {
  events: TimelineEvent[];
  threads: EventThread[];
  demo: boolean;
};

export type StockContext = {
  stockMove: number | null;
  sector: string | null;
  benchmarkSymbol: string | null;
  benchmarkMove: number | null;
  peerMove: number | null;
  peers: { symbol: string; name: string; move: number | null; freshness: string }[];
  label: string;
};

export type StockDetailResponse = {
  stock: SecuritySearchHit;
  insight: Insight | null;
  comparison: Comparison | null;
  timeline: TimelineEvent[];
  history: { timestamp: string; price: number; volume: number | null }[];
  context: StockContext;
  reviewed: boolean;
};

export type ApiError = { error: string; detail?: string };
