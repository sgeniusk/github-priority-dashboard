import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function compileInlineScripts(relativePath) {
  const html = read(relativePath);
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (/type=["']application\/json["']/i.test(attrs)) continue;
    const script = match[2].trim();
    if (!script) continue;
    count += 1;
    new vm.Script(script, { filename: `${relativePath}:script[${count}]` });
  }
  assert(count > 0, `${relativePath} has inline script`);
}

class FakeElement {
  constructor(tagName, id = '') {
    this.tagName = tagName;
    this.id = id;
    this.children = [];
    this.className = '';
    this.attributes = {};
    this.style = {
      values: {},
      setProperty: (name, value) => {
        this.style.values[name] = value;
      },
    };
    this.hidden = false;
    this.value = '';
    this.href = '';
    this._textContent = '';
    this._innerHTML = '';
  }

  append(...nodes) {
    this.children.push(...nodes.filter(Boolean));
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
    this._innerHTML = '';
  }

  set textContent(value) {
    this._textContent = value == null ? '' : String(value);
    this.children = [];
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent || '').join('');
  }

  set innerHTML(value) {
    this._innerHTML = value == null ? '' : String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

function createFakeDocument(html) {
  const ids = new Map();
  const idRegex = /<([a-z0-9-]+)([^>]*\sid=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    const [, tag, attrs, id, body] = match;
    const element = new FakeElement(tag, id);
    if (/type=["']application\/json["']/i.test(attrs)) {
      element.textContent = body;
    }
    ids.set(id, element);
  }

  return {
    title: '',
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    getElementById(id) {
      if (!ids.has(id)) ids.set(id, new FakeElement('div', id));
      return ids.get(id);
    },
  };
}

function getExecutableScripts(html) {
  const scripts = [];
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    if (/type=["']application\/json["']/i.test(match[1])) continue;
    const script = match[2].trim();
    if (script) scripts.push(script);
  }
  return scripts;
}

async function smokePage(relativePath, href, validate) {
  const html = read(relativePath);
  const document = createFakeDocument(html);
  const runtimeErrors = [];
  const context = vm.createContext({
    document,
    location: new URL(href),
    history: { pushState() {} },
    window: {},
    console: {
      log() {},
      warn() {},
      error(...args) {
        runtimeErrors.push(args.join(' '));
      },
    },
    fetch() {
      return Promise.reject(new Error('fetch should not run for file protocol smoke'));
    },
    URL,
    URLSearchParams,
    Promise,
    Error,
    setTimeout,
    clearTimeout,
  });

  for (const script of getExecutableScripts(html)) {
    vm.runInContext(script, context, { filename: `${relativePath}:runtime` });
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(runtimeErrors.length === 0, `${relativePath} file fallback has no console errors`);
  validate(document);
}

function extractConstObject(html, name) {
  const marker = `const ${name} = `;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`${name} not found`);
  let i = start + marker.length;
  while (/\s/.test(html[i])) i += 1;
  if (html[i] !== '{') throw new Error(`${name} is not an object literal`);

  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        inString = false;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      return vm.runInNewContext(`(${html.slice(i, j + 1)})`);
    }
  }
  throw new Error(`${name} object literal is not closed`);
}

function assertFallbackMatches(html, constName, jsonPath) {
  const fallback = extractFallback(html, constName);
  const json = parseJson(jsonPath);
  assert(
    JSON.stringify(fallback) === JSON.stringify(json),
    `${constName} matches ${jsonPath}`,
  );
}

function extractFallback(html, constName) {
  try {
    return extractConstObject(html, constName);
  } catch (error) {
    const id = {
      FALLBACK_PROJECTS: 'fallback-projects',
      FALLBACK_REPORTS: 'fallback-reports',
      FALLBACK_SUGGESTIONS: 'fallback-suggestions',
      FALLBACK_LOGS: 'fallback-logs',
    }[constName];
    if (!id) throw error;
    const pattern = new RegExp(`<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i');
    const match = html.match(pattern);
    if (!match) throw error;
    return JSON.parse(match[1]);
  }
}

const reportHtml = read('report.html');
const newsItemCount = parseJson('news.json').items.length;
assert(reportHtml.includes('프로젝트 뉴스'), 'report.html title is the news feed');
assert(reportHtml.includes('FALLBACK_NEWS'), 'report.html has FALLBACK_NEWS');
assert(reportHtml.includes('./news.json'), 'report.html fetches news.json');
assert(reportHtml.includes('project-report.html?repo='), 'news cards link to project reports');
assert(!reportHtml.includes('FALLBACK_JOURNAL'), 'report.html removed FALLBACK_JOURNAL');
assert(!reportHtml.includes('journal.json'), 'report.html no longer fetches journal.json');
assert(!reportHtml.includes('journalDate'), 'report.html removed journal date selector');
assertFallbackMatches(reportHtml, 'FALLBACK_NEWS', 'news.json');
compileInlineScripts('report.html');
await smokePage(
  'report.html',
  'file:///Users/taewookkim/dev/github-priority-dashboard/report.html',
  (document) => {
    assert(
      document.getElementById('reportRoot').textContent.includes('뜬이유 iOS'),
      'report.html renders news cards from fallback',
    );
    assert(
      document.getElementById('footerMeta').textContent.includes(`뉴스 ${newsItemCount}건`),
      'report.html renders news footer count',
    );
  },
);

assert(existsSync(join(ROOT, 'project-report.html')), 'project-report.html exists');
const projectHtml = existsSync(join(ROOT, 'project-report.html')) ? read('project-report.html') : '';
assert(projectHtml.includes('URLSearchParams'), 'project report reads repo query');
assert(projectHtml.includes('FALLBACK_PROJECTS'), 'project report has projects fallback');
assert(projectHtml.includes('FALLBACK_REPORTS'), 'project report has reports fallback');
assert(projectHtml.includes('FALLBACK_SUGGESTIONS'), 'project report has suggestions fallback');
assert(projectHtml.includes('FALLBACK_LOGS'), 'project report has logs fallback');
assert(projectHtml.includes('./projects.json'), 'project report fetches projects.json');
assert(projectHtml.includes('./reports.json'), 'project report fetches reports.json');
assert(projectHtml.includes('./suggestions.json'), 'project report fetches suggestions.json');
assert(projectHtml.includes('./project-logs.json'), 'project report fetches project-logs.json');
assert(projectHtml.includes('projectSelector'), 'project report includes project selector');
assert(projectHtml.includes('logs[repo]'), 'project report renders selected repo logs');
assert(projectHtml.includes('← 뉴스'), 'project report links back to news');
assert(projectHtml.includes('← 대시보드'), 'project report links back to dashboard');
if (projectHtml) {
  assertFallbackMatches(projectHtml, 'FALLBACK_PROJECTS', 'projects.json');
  assertFallbackMatches(projectHtml, 'FALLBACK_REPORTS', 'reports.json');
  assertFallbackMatches(projectHtml, 'FALLBACK_SUGGESTIONS', 'suggestions.json');
  assertFallbackMatches(projectHtml, 'FALLBACK_LOGS', 'project-logs.json');
  compileInlineScripts('project-report.html');
  await smokePage(
    'project-report.html',
    'file:///Users/taewookkim/dev/github-priority-dashboard/project-report.html?repo=honbul',
    (document) => {
      assert(
        document.getElementById('projectTitle').textContent.includes('혼불'),
        'project-report.html renders selected project title',
      );
      assert(
        document.getElementById('helpPanel').textContent.includes('Godot'),
        'project-report.html renders help panel from fallback',
      );
      assert(
        document.getElementById('timelinePanel').textContent.includes('커밋') ||
          document.getElementById('timelinePanel').textContent.includes('진척 변동'),
        'project-report.html renders timeline from fallback',
      );
    },
  );
}

process.exit(failures ? 1 : 0);
