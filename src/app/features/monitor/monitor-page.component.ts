/**
 * System Monitor Dashboard — real-time health overview of all backend services.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DATA FLOW                                                             │
 * │                                                                        │
 * │  Frontend (this component)                                             │
 * │    ↓  GET /api/v1/admin/system-health  (via ApiService)                │
 * │  Backend (AdminDebugController → SystemHealthService)                  │
 * │    ↓  Probes 8 services in parallel                                    │
 * │  Returns JSON: { timestamp, services: { name: { status, ...metrics }}} │
 * │    ↓                                                                   │
 * │  buildCards() maps JSON → ServiceCard[] for template rendering         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Services monitored:
 *   1. Oracle Backend  — JVM runtime stats (memory, threads, uptime)
 *   2. PostgreSQL      — JDBC health + HikariCP pool stats
 *   3. Ollama LLM      — REST /api/tags → loaded models list
 *   4. Mem0 API        — FastAPI sidecar ping + response time
 *   5. Mem0 pgvector   — Vector DB JDBC health
 *   6. Mem0 Neo4j      — Graph DB HTTP ping
 *   7. Claude API      — Config check (key presence, model name)
 *   8. Image Provider  — Config check (gemini/modelslab key + model)
 *
 * Auto-refreshes every 15s. Manual refresh via button.
 *
 * @see SystemHealthService (backend)
 * @see AdminDebugController#getSystemHealth() (endpoint)
 * @see ApiService#getSystemHealth() (HTTP call)
 */
import {
  ChangeDetectionStrategy, Component, OnInit, OnDestroy,
  signal, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';

interface RoutingService {
  service: string;
  provider: string;
  model: string;
  fixed: boolean;
}

interface AiRoutingReport {
  anthropicModel: string;
  ollamaModel: string;
  services: Record<string, RoutingService>;
  fixed: Record<string, RoutingService>;
}

// ── Types ───────────────────────────────────────────────────────────────────

/** Raw JSON shape from GET /api/v1/admin/system-health → services.{name} */
interface ServiceHealth { status: string; [key: string]: any; }

/** Root response from GET /api/v1/admin/system-health */
interface HealthReport { timestamp: string; services: Record<string, ServiceHealth>; }

/** View-model for a single service card in the grid */
interface ServiceCard {
  key: string;                                  // JSON key in response (e.g. "oracleBackend")
  label: string;                                // Display name (e.g. "Oracle Backend")
  icon: string;                                 // Emoji icon
  status: string;                               // UP | DOWN | CONFIGURED | NOT_CONFIGURED
  metrics: { label: string; value: string }[];  // Key-value pairs shown in card body
}

/** View-model for a Docker volume in the storage section */
interface VolumeInfo {
  name: string;
  fullName: string;
  size: string;
  sizeBytes: number;
  service: string;
  pct: number;       // percentage of largest volume (for bar width)
  severity: string;  // 'green' | 'yellow' | 'red'
}

/**
 * Registry defining how to map each service's raw JSON → display card.
 *
 * Each entry documents:
 *   - key:     JSON key in the API response
 *   - label:   Human-readable name for the UI
 *   - icon:    Emoji representing the service
 *   - metrics: Functions that extract display values from raw JSON
 *
 * This is the SINGLE SOURCE OF TRUTH for card layout.
 * To add a new service: add one entry here + backend check in SystemHealthService.
 */
const SERVICE_REGISTRY: {
  key: string;
  label: string;
  icon: string;
  metrics: (d: ServiceHealth) => { label: string; value: string }[];
}[] = [
  {
    // Source: SystemHealthService.checkSelf() → JVM Runtime + MXBean
    key: 'oracleBackend', label: 'Oracle Backend', icon: '⚙️',
    metrics: d => [
      { label: 'JVM Memory',     value: `${d['jvmMemoryUsedMb']}MB / ${d['jvmMemoryMaxMb']}MB` },
      { label: 'Active Threads', value: `${d['activeThreads']}` },
      { label: 'Java Version',   value: `${d['javaVersion']}` },
      { label: 'Uptime',         value: fmtUptime(d['uptimeSeconds']) },
    ],
  },
  {
    // Source: SystemHealthService.checkPostgres() → JDBC SELECT version() + HikariCP MXBean
    key: 'postgres', label: 'PostgreSQL', icon: '🐘',
    metrics: d => [
      ...(d['version'] ? [{ label: 'Version', value: fmtPg(d['version']) }] : []),
      ...(d['activeConnections'] != null ? [
        { label: 'Pool (active/idle/total)', value: `${d['activeConnections']}/${d['idleConnections']}/${d['totalConnections']}` },
        { label: 'Max Pool Size',            value: `${d['maxConnections']}` },
      ] : []),
      ...(d['error'] ? [{ label: 'Error', value: d['error'] }] : []),
    ],
  },
  {
    // Source: SystemHealthService.checkOllama() → GET {ollamaBaseUrl}/api/tags
    key: 'ollama', label: 'Ollama LLM', icon: '🧠',
    metrics: d => [
      { label: 'Base URL',    value: d['baseUrl'] },
      { label: 'Chat Model',  value: d['chatModel'] },
      ...(d['models'] ? [{ label: 'Loaded Models', value: (d['models'] as string[]).join(', ') }] : []),
      ...(d['error'] ? [{ label: 'Error', value: d['error'] }] : []),
    ],
  },
  {
    // Source: SystemHealthService.checkMem0Api() → GET {mem0BaseUrl}/docs (FastAPI Swagger)
    key: 'mem0Api', label: 'Mem0 API', icon: '💾',
    metrics: d => [
      { label: 'Base URL', value: d['baseUrl'] },
      ...(d['responseTimeMs'] != null ? [{ label: 'Response Time', value: `${d['responseTimeMs']}ms` }] : []),
      ...(d['error'] ? [{ label: 'Error', value: d['error'] }] : []),
    ],
  },
  {
    // Source: SystemHealthService.checkMem0Pgvector() → JDBC localhost:8432 SELECT version()
    key: 'mem0Pgvector', label: 'Mem0 pgvector', icon: '📐',
    metrics: d => [
      ...(d['version'] ? [{ label: 'Version', value: fmtPg(d['version']) }] : []),
      ...(d['error'] ? [{ label: 'Error', value: d['error'] }] : []),
    ],
  },
  {
    // Source: SystemHealthService.checkMem0Neo4j() → GET http://localhost:7474
    key: 'mem0Neo4j', label: 'Mem0 Neo4j', icon: '🕸️',
    metrics: d => [
      ...(d['error'] ? [{ label: 'Error', value: d['error'] }] : []),
    ],
  },
  {
    // Source: SystemHealthService.checkClaudeApi() → config check only (no API call)
    // Config: spring.ai.anthropic.api-key + spring.ai.anthropic.chat.options.model
    key: 'claudeApi', label: 'Claude API', icon: '🤖',
    metrics: d => [
      { label: 'Model',   value: d['model'] },
      { label: 'API Key', value: d['keyPresent'] ? 'Present' : 'Missing' },
    ],
  },
  {
    // Source: SystemHealthService.checkImageProvider() → config check only
    // Config: app.image-provider + app.gemini.* or app.modelslab.*
    key: 'imageProvider', label: 'Image Provider', icon: '🎨',
    metrics: d => [
      { label: 'Provider', value: d['provider'] },
      { label: 'Model',    value: d['model'] },
      { label: 'API Key',  value: d['keyPresent'] ? 'Present' : 'Missing' },
    ],
  },
];

// ── Helpers (pure functions, used by SERVICE_REGISTRY) ──────────────────────

/** Format seconds → human-readable uptime string */
function fmtUptime(sec: number): string {
  if (!sec) return 'N/A';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/** Shorten "PostgreSQL 16.13 (Debian 16.13-1.pgdg...)" → "PostgreSQL 16.13" */
function fmtPg(v: string): string {
  return v.match(/PostgreSQL (\d+\.\d+)/)?.[0] ?? v.substring(0, 40);
}

// ── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-monitor-page',
  standalone: true,
  imports: [NgClass, DatePipe, DecimalPipe, FormsModule, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './monitor-page.component.html',
  styleUrl: './monitor-page.component.scss',
})
export class MonitorPageComponent implements OnInit, OnDestroy {
  private readonly api    = inject(ApiService);
  private readonly router = inject(Router);

  serviceCards  = signal<ServiceCard[]>([]);
  lastUpdated   = signal<Date>(new Date());
  loading       = signal(false);
  error         = signal<string | null>(null);

  routingRows   = signal<(RoutingService & { key: string })[]>([]);
  switchingKey  = signal<string | null>(null);
  switchResult  = signal<{ ok: boolean; message: string } | null>(null);

  // Storage usage
  storageVolumes  = signal<VolumeInfo[]>([]);
  storageTotal    = signal<string>('');
  storageLoading  = signal(false);
  storageError    = signal<string | null>(null);

  // Notification rules
  notifRules      = signal<any[]>([]);
  notifLoading    = signal(false);
  notifError      = signal<string | null>(null);
  showRuleForm    = signal(false);
  todayActivity   = signal<Record<string, number>>({});
  deletingRuleId  = signal<string | null>(null);

  // New rule form fields
  ruleForm = {
    name: '', description: '', category: 'HABIT',
    outputType: 'REMINDER', schedule: 'WATER',
    intervalMinutes: 30, timeOfDay: '', dayOfWeek: '',
    bedtime: '22:00', wakeTime: '06:30',
    quietStart: '22:00', quietEnd: '07:00',
    dailyQuota: 3, cooldownMinutes: null as number | null,
    priority: 1, quickAction: true, suppressDuringWorkout: false,
  };

  // Mem0 memories
  memories        = signal<{ id: string; memory: string; hash: string | null; score: number | null }[]>([]);
  memoriesLoading = signal(false);
  memoriesError   = signal<string | null>(null);
  memorySearchQuery = '';
  memorySearchMode  = signal(false);
  deletingMemoryId  = signal<string | null>(null);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.refresh();
    this.loadRouting();
    this.loadMemories();
    this.loadStorage();
    this.loadNotifRules();
    this.loadTodayActivity();
    this.timer = setInterval(() => { this.refresh(); this.loadStorage(); }, 15_000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Fetch health data from backend and rebuild cards */
  refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getSystemHealth().subscribe({
      next: (report: HealthReport) => {
        this.serviceCards.set(this.buildCards(report.services));
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.message || 'Connection refused');
        this.loading.set(false);
      },
    });
  }

  loadRouting(): void {
    this.api.getAiRouting().subscribe({
      next: (data: AiRoutingReport) => {
        const rows: (RoutingService & { key: string })[] = [];
        for (const [key, s] of Object.entries(data.services)) {
          rows.push({ key, ...s });
        }
        for (const [key, s] of Object.entries(data.fixed)) {
          rows.push({ key, ...s });
        }
        this.routingRows.set(rows);
      },
      error: () => {},
    });
  }

  switchProvider(serviceKey: string, provider: string): void {
    this.switchingKey.set(serviceKey);
    this.switchResult.set(null);
    this.api.updateAiRouting(serviceKey, provider).subscribe({
      next: (res: any) => {
        this.switchResult.set({ ok: true, message: `✅ ${res.updated} → ${res.provider} (${res.model})` });
        this.switchingKey.set(null);
        this.loadRouting();
        setTimeout(() => this.switchResult.set(null), 4000);
      },
      error: (err: any) => {
        this.switchResult.set({ ok: false, message: `❌ Failed: ${err.message}` });
        this.switchingKey.set(null);
      },
    });
  }

  // ── Storage Usage ────────────────────────────────────────────────────

  loadStorage(): void {
    this.storageLoading.set(true);
    this.storageError.set(null);
    this.api.getStorageUsage().subscribe({
      next: (res: any) => {
        const raw: any[] = res.volumes || [];
        const maxBytes = Math.max(...raw.map((v: any) => v.sizeBytes), 1);
        const volumes: VolumeInfo[] = raw.map((v: any) => ({
          name: v.name,
          fullName: v.fullName,
          size: v.size,
          sizeBytes: v.sizeBytes,
          service: v.service,
          pct: Math.max((v.sizeBytes / maxBytes) * 100, 1),
          severity: v.sizeBytes > 2 * 1024 * 1024 * 1024 ? 'red'
                  : v.sizeBytes > 500 * 1024 * 1024 ? 'yellow'
                  : 'green',
        }));
        volumes.sort((a, b) => b.sizeBytes - a.sizeBytes);
        this.storageVolumes.set(volumes);
        this.storageTotal.set(res.totalFormatted || 'N/A');
        this.storageLoading.set(false);
      },
      error: (err: any) => {
        this.storageError.set(err.message || 'Failed to load storage data');
        this.storageLoading.set(false);
      },
    });
  }

  // ── Notification Rules ───────────────────────────────────────────────

  loadNotifRules(): void {
    this.notifLoading.set(true);
    this.notifError.set(null);
    this.api.getNotificationRules().subscribe({
      next: (rules: any[]) => {
        this.notifRules.set(rules);
        this.notifLoading.set(false);
      },
      error: (err: any) => {
        this.notifError.set(err.message || 'Failed to load rules');
        this.notifLoading.set(false);
      },
    });
  }

  loadTodayActivity(): void {
    this.api.getTodayActivity().subscribe({
      next: (data: Record<string, number>) => this.todayActivity.set(data),
      error: () => {},
    });
  }

  createRule(): void {
    const f = this.ruleForm;
    const payload: any = {
      name: f.name,
      description: f.description || null,
      category: f.category,
      outputType: f.outputType,
      schedule: f.schedule,
      intervalMinutes: f.schedule === 'INTERVAL' ? f.intervalMinutes : null,
      timeOfDay: f.timeOfDay || null,
      dayOfWeek: f.dayOfWeek || null,
      bedtime: f.bedtime || null,
      wakeTime: f.wakeTime || null,
      quietStart: f.quietStart || null,
      quietEnd: f.quietEnd || null,
      dailyQuota: f.dailyQuota,
      cooldownMinutes: f.cooldownMinutes,
      priority: f.priority,
      quickAction: f.quickAction,
      suppressDuringWorkout: f.suppressDuringWorkout,
    };

    this.notifLoading.set(true);
    this.api.createNotificationRule(payload).subscribe({
      next: () => {
        this.showRuleForm.set(false);
        this.resetRuleForm();
        this.loadNotifRules();
      },
      error: (err: any) => {
        this.notifError.set(err.message || 'Failed to create rule');
        this.notifLoading.set(false);
      },
    });
  }

  toggleRule(id: string): void {
    this.api.toggleNotificationRule(id).subscribe({
      next: () => this.loadNotifRules(),
      error: () => {},
    });
  }

  deleteRule(id: string): void {
    this.deletingRuleId.set(id);
    this.api.deleteNotificationRule(id).subscribe({
      next: () => {
        this.notifRules.update(r => r.filter(x => x.id !== id));
        this.deletingRuleId.set(null);
      },
      error: () => this.deletingRuleId.set(null),
    });
  }

  logQuickAction(type: string): void {
    this.api.logActivity(type).subscribe({
      next: () => this.loadTodayActivity(),
      error: () => {},
    });
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      WORKOUT: '💪', HABIT: '🔄', SHOPPING: '🛒',
      MEAL: '🍽️', STUDY: '📚', CUSTOM: '⚡',
    };
    return icons[cat] || '⚡';
  }

  getScheduleLabel(rule: any): string {
    const fmtTime = (t: string) => t ? t.substring(0, 5) : '';
    switch (rule.schedule) {
      case 'WATER': return `Water (${fmtTime(rule.wakeTime)}–${fmtTime(rule.bedtime)})`;
      case 'INTERVAL': return `Every ${rule.intervalMinutes}m`;
      case 'DAILY': return `Daily ${fmtTime(rule.timeOfDay)}`;
      case 'WEEKLY': return `${rule.dayOfWeek} ${fmtTime(rule.timeOfDay)}`;
      default: return rule.schedule;
    }
  }

  private resetRuleForm(): void {
    this.ruleForm = {
      name: '', description: '', category: 'HABIT',
      outputType: 'REMINDER', schedule: 'WATER',
      intervalMinutes: 30, timeOfDay: '', dayOfWeek: '',
      bedtime: '22:00', wakeTime: '06:30',
      quietStart: '22:00', quietEnd: '07:00',
      dailyQuota: 3, cooldownMinutes: null,
      priority: 1, quickAction: true, suppressDuringWorkout: false,
    };
  }

  // ── Mem0 Memories ──────────────────────────────────────────────────────

  loadMemories(): void {
    this.memoriesLoading.set(true);
    this.memoriesError.set(null);
    this.memorySearchMode.set(false);
    this.memorySearchQuery = '';
    this.api.getMemories().subscribe({
      next: (res: any) => {
        this.memories.set(res.memories || []);
        this.memoriesLoading.set(false);
      },
      error: (err: any) => {
        this.memoriesError.set(err.message || 'Failed to load memories');
        this.memoriesLoading.set(false);
      },
    });
  }

  searchMemories(): void {
    const q = this.memorySearchQuery.trim();
    if (!q) { this.loadMemories(); return; }
    this.memoriesLoading.set(true);
    this.memoriesError.set(null);
    this.memorySearchMode.set(true);
    this.api.searchMemories(q).subscribe({
      next: (res: any) => {
        this.memories.set(res.memories || []);
        this.memoriesLoading.set(false);
      },
      error: (err: any) => {
        this.memoriesError.set(err.message || 'Search failed');
        this.memoriesLoading.set(false);
      },
    });
  }

  deleteMemory(id: string): void {
    this.deletingMemoryId.set(id);
    this.api.deleteMemory(id).subscribe({
      next: () => {
        this.memories.update(m => m.filter(x => x.id !== id));
        this.deletingMemoryId.set(null);
      },
      error: () => this.deletingMemoryId.set(null),
    });
  }

  deleteAllMemories(): void {
    this.memoriesLoading.set(true);
    this.api.deleteAllMemories().subscribe({
      next: () => {
        this.memories.set([]);
        this.memoriesLoading.set(false);
      },
      error: (err: any) => {
        this.memoriesError.set(err.message || 'Failed to delete');
        this.memoriesLoading.set(false);
      },
    });
  }

  onMemorySearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.searchMemories();
  }

  onTabChanged(tab: NavTab): void {
    const routes: Record<string, string> = {
      spread: '/spread', chat: '/chat', tasks: '/tasks',
      nutrition: '/nutrition', profile: '/profile', monitor: '/monitor',
    };
    this.router.navigate([routes[tab] || '/spread']);
  }

  /**
   * Maps raw API response → ServiceCard[] using SERVICE_REGISTRY.
   * Only includes services that are present in the response.
   */
  private buildCards(services: Record<string, ServiceHealth>): ServiceCard[] {
    return SERVICE_REGISTRY
      .filter(reg => services[reg.key])
      .map(reg => ({
        key:     reg.key,
        label:   reg.label,
        icon:    reg.icon,
        status:  services[reg.key].status,
        metrics: reg.metrics(services[reg.key]),
      }));
  }
}
