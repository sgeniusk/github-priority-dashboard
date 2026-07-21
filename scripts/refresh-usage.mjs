#!/usr/bin/env node
// refresh-usage.mjs — Claude·Codex 사용량(한도 %·리셋) 자동 수집
//
// 출처: kimbyungsu/codex-usage-monitor (MIT)의 수집 방식을 이 워크스페이스의
// 정적 대시보드 구조(usage.json + build-dashboard.mjs)에 맞게 이식.
//   - Claude: 공식 CLI의 /usage가 쓰는 OAuth usage 엔드포인트를
//     ~/.claude/.credentials.json 토큰으로 호출 (만료 시 자동 갱신).
//     ⚠ 비공식 엔드포인트 — 향후 변경 시 수동 입력 폴백으로 동작.
//   - Codex: 로컬 `codex app-server --stdio`를 JSON-RPC로 호출해
//     계정 한도 윈도우(primary/secondary)의 사용률 %·리셋을 수신.
//
// 공개 범위 정책: usage.json에는 한도 %·리셋 시각·플랜만 기록한다.
// 토큰 수·비용 추정 등 상세 사용 패턴은 수집하지 않는다 (Pages 공개 저장소).
//
// 사용법:
//   node scripts/refresh-usage.mjs              # 수집 → usage.json + dashboard FALLBACK 갱신
//   node scripts/refresh-usage.mjs --dry-run    # 결과 미리보기, 저장 안 함
//   node scripts/refresh-usage.mjs --claude-only | --codex-only
//   node scripts/refresh-usage.mjs --mock fixtures.json   # 네트워크 없이 파이프라인 테스트
//
// 종료 코드: 0 = 최소 1개 도구 수집 성공(또는 dry-run/mock), 1 = 전부 실패

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildDashboard } from "./build-dashboard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const USAGE_JSON = path.join(ROOT, "usage.json");

// Claude Code OAuth 공개 클라이언트 ID / 엔드포인트 (번들 CLI에서 확인된 상수)
const CLAUDE_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const CLAUDE_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const CLAUDE_TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const CLAUDE_OAUTH_BETA = "oauth-2025-04-20";
const USER_AGENT = "github-priority-dashboard-usage-refresh";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CLAUDE_ONLY = args.includes("--claude-only");
const CODEX_ONLY = args.includes("--codex-only");
const MOCK_FILE = args.includes("--mock") ? args[args.indexOf("--mock") + 1] : null;
const CODEX_CMD = args.includes("--codex-command")
  ? args[args.indexOf("--codex-command") + 1]
  : "codex";

const log = (m) => console.log(`[usage-refresh] ${m}`);
const warn = (m) => console.warn(`[usage-refresh] ⚠ ${m}`);

/* ────────────────────────── 공통 유틸 ────────────────────────── */

function httpRequest(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// epoch(초/밀리초 혼용) 또는 ISO 문자열 → ISO 문자열
function toIso(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d) ? null : d.toISOString();
  }
  if (typeof v === "number") {
    const ms = v > 1e12 ? v : v * 1000;
    return new Date(ms).toISOString();
  }
  return null;
}

function isoToLocalDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"),
    day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function windowLabelFromMins(mins) {
  if (mins == null) return "한도";
  if (mins <= 360) return `${Math.round(mins / 60)}시간`;
  const days = Math.round(mins / 1440);
  if (days === 7) return "주간";
  if (days >= 28 && days <= 31) return "월간";
  return `${days}일`;
}

function pct(v) {
  if (typeof v !== "number" || !isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

/* ────────────────────────── Claude 수집 ────────────────────────── */

function claudeConfigDir() {
  const env = process.env.CLAUDE_CONFIG_DIR?.trim();
  return env || path.join(os.homedir(), ".claude");
}

const KEYCHAIN_SERVICE = "Claude Code-credentials";

// 자격증명 읽기 — 1) <configDir>/.credentials.json 2) macOS Keychain 폴백
// (macOS의 Claude Code는 파일 대신 Keychain에 저장한다)
function readClaudeCredentials(dir) {
  const file = path.join(dir, ".credentials.json");
  if (fs.existsSync(file)) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const o = raw.claudeAiOauth;
      if (!o?.accessToken) return { error: "claudeAiOauth.accessToken 없음" };
      return { store: "file", file, raw, creds: o };
    } catch (e) {
      return { error: `자격증명 파싱 실패: ${e.message}` };
    }
  }
  if (process.platform === "darwin") {
    try {
      const out = execFileSync(
        "security",
        ["find-generic-password", "-a", os.userInfo().username, "-s", KEYCHAIN_SERVICE, "-w"],
        { encoding: "utf8" },
      ).trim();
      const raw = JSON.parse(out);
      const o = raw.claudeAiOauth;
      if (!o?.accessToken) return { error: "Keychain 항목에 accessToken 없음" };
      return { store: "keychain", raw, creds: o };
    } catch {
      return { error: `자격증명 없음: ${file} (Keychain '${KEYCHAIN_SERVICE}'도 조회 실패)` };
    }
  }
  return { error: `자격증명 없음: ${file}` };
}

function persistClaudeCredentials(cred, raw) {
  if (cred.store === "file") {
    fs.writeFileSync(cred.file, JSON.stringify(raw, null, 2), "utf8");
    return;
  }
  if (cred.store === "keychain") {
    execFileSync("security", [
      "add-generic-password", "-U",
      "-a", os.userInfo().username,
      "-s", KEYCHAIN_SERVICE,
      "-w", JSON.stringify(raw),
    ]);
  }
}

async function refreshClaudeToken(cred, raw, creds) {
  if (!creds.refreshToken) return null;
  const res = await httpRequest(CLAUDE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      client_id: CLAUDE_CLIENT_ID,
    }),
  });
  if (res.status !== 200) {
    warn(`Claude 토큰 갱신 실패: HTTP ${res.status}`);
    return null;
  }
  const p = JSON.parse(res.body);
  if (!p.access_token) return null;
  const updated = {
    ...creds,
    accessToken: p.access_token,
    refreshToken: p.refresh_token ?? creds.refreshToken,
    expiresAt: p.expires_in ? Date.now() + p.expires_in * 1000 : creds.expiresAt,
  };
  try {
    raw.claudeAiOauth = { ...raw.claudeAiOauth, ...updated };
    persistClaudeCredentials(cred, raw);
    log(`Claude OAuth 토큰 갱신·저장 완료 (${cred.store})`);
  } catch (e) {
    warn(`갱신 토큰 저장 실패(이번 실행엔 메모리 토큰 사용): ${e.message}`);
  }
  return updated;
}

function fetchClaudeUsageOnce(token) {
  return httpRequest(CLAUDE_USAGE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-beta": CLAUDE_OAUTH_BETA,
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
}

function normalizeClaudeUsage(rawBody) {
  const winDefs = [
    ["five_hour", "fiveHour", "5시간", 300],
    ["seven_day", "sevenDay", "주간", 10080],
    ["seven_day_opus", "sevenDayOpus", "주간(Opus)", 10080],
    ["seven_day_sonnet", "sevenDaySonnet", "주간(Sonnet)", 10080],
  ];
  const windows = [];
  for (const [key, id, label, mins] of winDefs) {
    const w = rawBody?.[key];
    if (w && typeof w.utilization === "number") {
      windows.push({
        id, label,
        usedPercent: pct(w.utilization),
        resetsAt: toIso(w.resets_at),
        windowMinutes: mins,
      });
    }
  }
  return windows;
}

async function collectClaude(mock) {
  if (mock?.claude) {
    return { ok: true, plan: mock.claude.subscriptionType ?? null, windows: normalizeClaudeUsage(mock.claude) };
  }
  const dir = claudeConfigDir();
  const cred = readClaudeCredentials(dir);
  if (cred.error) return { ok: false, error: cred.error };
  let { creds } = cred;

  if (creds.expiresAt && creds.expiresAt - Date.now() < 60_000 && creds.refreshToken) {
    const r = await refreshClaudeToken(cred, cred.raw, creds).catch(() => null);
    if (r) creds = r;
  }
  let res = await fetchClaudeUsageOnce(creds.accessToken);
  if (res.status === 401 && creds.refreshToken) {
    const r = await refreshClaudeToken(cred, cred.raw, creds).catch(() => null);
    if (r) { creds = r; res = await fetchClaudeUsageOnce(creds.accessToken); }
  }
  if (res.status === 401) return { ok: false, error: "토큰 만료 — Claude Code에 한 번 접속하면 자동 갱신됨" };
  if (res.status === 429) return { ok: false, error: "rate limited (429) — 잠시 후 재시도" };
  if (res.status !== 200) return { ok: false, error: `usage 엔드포인트 HTTP ${res.status}` };

  const body = JSON.parse(res.body);
  const windows = normalizeClaudeUsage(body);
  if (!windows.length) return { ok: false, error: "응답에 한도 윈도우 없음 (엔드포인트 형식 변경 가능성)" };
  return { ok: true, plan: creds.subscriptionType ?? null, windows };
}

/* ────────────────────────── Codex 수집 ────────────────────────── */

function codexRpc(cmd, timeoutMs = 20_000) {
  // codex app-server --stdio: newline-delimited {id, method, params} / {id, result|error}
  const child = spawn(cmd, ["app-server", "--stdio"], { windowsHide: true, shell: false });
  let buffer = "", nextId = 1;
  const pending = new Map();
  let closed = false;

  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (typeof msg.id === "number" && pending.has(msg.id)) {
          const p = pending.get(msg.id);
          pending.delete(msg.id);
          clearTimeout(p.timer);
          msg.error ? p.reject(new Error(msg.error.message || "app-server error")) : p.resolve(msg.result);
        }
        // method-only 메시지(notification)는 무시
      } catch { /* 파싱 불가 라인 무시 */ }
    }
  });
  const failAll = (e) => { for (const [, p] of pending) { clearTimeout(p.timer); p.reject(e); } pending.clear(); };
  child.on("error", failAll);
  child.on("exit", () => { closed = true; failAll(new Error("codex app-server 종료됨")); });

  return {
    request(method, params = {}) {
      if (closed) return Promise.reject(new Error("app-server not running"));
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timeout`)); }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        child.stdin.write(JSON.stringify({ id, method, params }) + "\n", "utf8", (err) => {
          if (err) { clearTimeout(timer); pending.delete(id); reject(err); }
        });
      });
    },
    dispose() { try { child.kill(); } catch { /* noop */ } },
  };
}

function normalizeCodexWindow(w, id) {
  if (!w || typeof w.usedPercent !== "number") return null;
  return {
    id,
    label: windowLabelFromMins(w.windowDurationMins ?? null),
    usedPercent: pct(w.usedPercent),
    resetsAt: toIso(w.resetsAt),
    windowMinutes: w.windowDurationMins ?? null,
  };
}

async function collectCodex(mock) {
  if (mock?.codex) {
    const rl = mock.codex.rateLimits || {};
    const windows = [normalizeCodexWindow(rl.primary, "primary"), normalizeCodexWindow(rl.secondary, "secondary")].filter(Boolean);
    return { ok: windows.length > 0, plan: rl.planType ?? null, windows, error: windows.length ? undefined : "mock에 윈도우 없음" };
  }
  const rpc = codexRpc(CODEX_CMD);
  try {
    await rpc.request("initialize", {
      clientInfo: { name: "github-priority-dashboard", title: "Usage Refresh", version: "1.0.0" },
      capabilities: { experimentalApi: true },
    });
    const limits = await rpc.request("account/rateLimits/read", {});
    const rl = limits?.rateLimits || {};
    const windows = [normalizeCodexWindow(rl.primary, "primary"), normalizeCodexWindow(rl.secondary, "secondary")].filter(Boolean);
    if (!windows.length) return { ok: false, error: "rateLimits 응답에 윈도우 없음 (로그인 상태 확인: codex login)" };
    return { ok: true, plan: rl.planType ?? null, windows };
  } catch (e) {
    const hint = /ENOENT/.test(String(e?.message)) ? ` — '${CODEX_CMD}' 실행 파일을 찾을 수 없음` : "";
    return { ok: false, error: `${e.message}${hint}` };
  } finally {
    rpc.dispose();
  }
}

/* ────────────────────────── usage.json 머지 ────────────────────────── */

// 도구별 '대표 윈도우' = 가장 긴 윈도우 (Claude: 주간, Codex: secondary/주간)
function mainWindow(windows) {
  const ranked = windows
    .filter((w) => !/Opus|Sonnet/.test(w.id))
    .sort((a, b) => (b.windowMinutes ?? 0) - (a.windowMinutes ?? 0));
  return ranked[0] || windows[0];
}

function mergeTool(existing, result, source, collectedAt) {
  const t = { ...existing };
  if (!result?.ok) {
    // 실패: 기존 값 유지, 마지막 auto는 보존(있다면) — 신선도는 collectedAt으로 판단
    return t;
  }
  const main = mainWindow(result.windows);
  t.usedPercent = main.usedPercent ?? t.usedPercent ?? 0;
  t.cycleResetDate = isoToLocalDate(main.resetsAt) || t.cycleResetDate || "";
  if (main.windowMinutes) {
    t.cycleLengthDays = Math.max(1, Math.round(main.windowMinutes / 1440));
    t.limitLabel = `${main.label} 한도`;
  }
  if (result.plan && typeof result.plan === "string") {
    // 플랜 문자열 정리 (예: "max" → "Max")
    t.plan = result.plan.length <= 12 ? result.plan.charAt(0).toUpperCase() + result.plan.slice(1) : result.plan;
  }
  t.auto = {
    source,
    collectedAt,
    windows: result.windows, // usedPercent·resetsAt·windowMinutes만 — 토큰·비용 미수집
  };
  return t;
}

/* ────────────────────────── main ────────────────────────── */

async function main() {
  const mock = MOCK_FILE ? JSON.parse(fs.readFileSync(MOCK_FILE, "utf8")) : null;
  if (mock) log(`mock 모드: ${MOCK_FILE}`);

  const usageObj = JSON.parse(fs.readFileSync(USAGE_JSON, "utf8"));
  const byTool = Object.fromEntries((usageObj.tools || []).map((t) => [t.tool, t]));
  const collectedAt = new Date().toISOString();

  const wantClaude = !CODEX_ONLY;
  const wantCodex = !CLAUDE_ONLY;

  const [claudeRes, codexRes] = await Promise.all([
    wantClaude ? collectClaude(mock) : Promise.resolve(null),
    wantCodex ? collectCodex(mock) : Promise.resolve(null),
  ]);

  let okCount = 0;
  if (claudeRes) {
    if (claudeRes.ok) {
      okCount++;
      const w = claudeRes.windows.map((x) => `${x.label} ${x.usedPercent}%`).join(", ");
      log(`Claude 수집 성공: ${w}`);
      byTool.claude = mergeTool(byTool.claude || { tool: "claude", label: "Claude (Claude Code)" }, claudeRes, "oauth-usage", collectedAt);
    } else warn(`Claude 수집 실패: ${claudeRes.error}`);
  }
  if (codexRes) {
    if (codexRes.ok) {
      okCount++;
      const w = codexRes.windows.map((x) => `${x.label} ${x.usedPercent}%`).join(", ");
      log(`Codex 수집 성공: ${w}`);
      byTool.codex = mergeTool(byTool.codex || { tool: "codex", label: "Codex CLI" }, codexRes, "codex-app-server", collectedAt);
    } else warn(`Codex 수집 실패: ${codexRes.error}`);
  }

  if (!okCount) {
    warn("모든 도구 수집 실패 — usage.json을 변경하지 않음");
    process.exit(1);
  }

  // tools 배열 재구성 (원래 순서 유지, 새 도구는 뒤에)
  const order = (usageObj.tools || []).map((t) => t.tool);
  for (const k of Object.keys(byTool)) if (!order.includes(k)) order.push(k);
  usageObj.tools = order.map((k) => byTool[k]).filter(Boolean);
  {
    const d = new Date();
    usageObj.asOf = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  usageObj._comment =
    "도구별 사용량 트래커. scripts/refresh-usage.mjs(/usage-refresh)가 로컬 CLI 자격증명으로 한도 %·리셋만 자동 수집한다(토큰·비용 상세는 비공개 유지). 자동 수집 실패 시 대시보드 사용량 패널에서 수동 입력(localStorage) 폴백.";

  const out = JSON.stringify(usageObj, null, 2) + "\n";
  if (DRY_RUN) {
    log("--dry-run: 저장하지 않음. 결과 미리보기 ↓");
    console.log(out);
    return;
  }
  fs.writeFileSync(USAGE_JSON, out, "utf8");
  buildDashboard();
  log(`usage.json + dashboard.html FALLBACK 갱신 완료 (asOf ${usageObj.asOf})`);
}

main().catch((e) => { console.error(`[usage-refresh] 치명적 오류: ${e.message}`); process.exit(1); });
