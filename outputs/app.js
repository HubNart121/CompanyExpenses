const STORAGE_KEY = "expense-ledger-v1";
const AUTH_KEY = "expense-ledger-auth-v1";
const SESSION_KEY = "expense-ledger-session-v1";
const IP_CACHE_KEY = "expense-ledger-client-ip-v1";
const IP_LOOKUP_URL = "https://api.ipify.org?format=json";
const DEFAULT_AUTH = Object.freeze({
  username: "admin",
  salt: "expense-ledger-default",
  passwordHash: hashPassword("admin123", "expense-ledger-default")
});

const palette = ["#2f7d78", "#d29f35", "#6d7fb8", "#c95f5f", "#4f8d5f", "#8b6f4e", "#b05b87"];

const sampleCategories = [
  { id: "food", name: "อาหาร", color: "#2f7d78" },
  { id: "transport", name: "เดินทาง", color: "#d29f35" },
  { id: "home", name: "บ้าน", color: "#6d7fb8" },
  { id: "health", name: "สุขภาพ", color: "#c95f5f" },
  { id: "shopping", name: "ช้อปปิ้ง", color: "#4f8d5f" }
];

const sampleStatuses = [
  { id: "pending", name: "รอดำเนินการ", color: "#d29f35" },
  { id: "paid", name: "จ่ายแล้ว", color: "#2f7d78" },
  { id: "review", name: "รอตรวจสอบ", color: "#6d7fb8" }
];

const today = new Date();
const pad = (value) => String(value).padStart(2, "0");
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const currentMonth = monthKey(today);

const sampleExpenses = [
  { title: "กาแฟและมื้อเช้า", amount: 145, categoryId: "food", method: "พร้อมเพย์", offset: 0 },
  { title: "ซื้อของเข้าบ้าน", amount: 1280, categoryId: "home", method: "บัตรเครดิต", offset: 1 },
  { title: "รถไฟฟ้า", amount: 92, categoryId: "transport", method: "เงินสด", offset: 2 },
  { title: "มื้อเย็น", amount: 380, categoryId: "food", method: "โอนเงิน", offset: 4 },
  { title: "ยาและวิตามิน", amount: 760, categoryId: "health", method: "พร้อมเพย์", offset: 6 },
  { title: "เสื้อทำงาน", amount: 1190, categoryId: "shopping", method: "บัตรเครดิต", offset: 9 },
  { title: "ค่าน้ำมัน", amount: 650, categoryId: "transport", method: "เงินสด", offset: 12 },
  { title: "วัตถุดิบทำอาหาร", amount: 540, categoryId: "food", method: "โอนเงิน", offset: 14 }
].map((item, index) => {
  const date = new Date(today);
  date.setDate(Math.max(1, today.getDate() - item.offset));
  return {
    id: `sample-${index + 1}`,
    date: isoDate(date),
    title: item.title,
    amount: item.amount,
    categoryId: item.categoryId,
    statusId: index % 3 === 0 ? "review" : "paid",
    method: item.method
  };
});

let state = loadState();
let listPage = 1;
let clientIp = loadCachedClientIp();

const els = {
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  currentUserLabel: document.querySelector("#currentUserLabel"),
  logoutButton: document.querySelector("#logoutButton"),
  monthFilter: document.querySelector("#monthFilter"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  rangeMode: document.querySelector("#rangeMode"),
  customStart: document.querySelector("#customStart"),
  customEnd: document.querySelector("#customEnd"),
  customRangeFields: document.querySelectorAll(".custom-range"),
  rangeSummary: document.querySelector("#rangeSummary"),
  totalLabel: document.querySelector("#totalLabel"),
  totalThisMonth: document.querySelector("#totalThisMonth"),
  monthChange: document.querySelector("#monthChange"),
  entryCount: document.querySelector("#entryCount"),
  averageExpense: document.querySelector("#averageExpense"),
  topCategory: document.querySelector("#topCategory"),
  topCategoryAmount: document.querySelector("#topCategoryAmount"),
  todayTotal: document.querySelector("#todayTotal"),
  todayCount: document.querySelector("#todayCount"),
  budgetRemaining: document.querySelector("#budgetRemaining"),
  budgetStatus: document.querySelector("#budgetStatus"),
  budgetProgress: document.querySelector("#budgetProgress"),
  budgetMetric: document.querySelector(".budget-metric"),
  expenseForm: document.querySelector("#expenseForm"),
  editingId: document.querySelector("#editingId"),
  dateInput: document.querySelector("#dateInput"),
  titleInput: document.querySelector("#titleInput"),
  urlInput: document.querySelector("#urlInput"),
  amountInput: document.querySelector("#amountInput"),
  categoryInput: document.querySelector("#categoryInput"),
  methodInput: document.querySelector("#methodInput"),
  statusInput: document.querySelector("#statusInput"),
  saveExpense: document.querySelector("#saveExpense"),
  cancelEdit: document.querySelector("#cancelEdit"),
  budgetForm: document.querySelector("#budgetForm"),
  annualBudgetInput: document.querySelector("#annualBudgetInput"),
  budgetInput: document.querySelector("#budgetInput"),
  clearBudget: document.querySelector("#clearBudget"),
  budgetHint: document.querySelector("#budgetHint"),
  createUserForm: document.querySelector("#createUserForm"),
  createUsernameInput: document.querySelector("#createUsernameInput"),
  createPasswordInput: document.querySelector("#createPasswordInput"),
  createConfirmPasswordInput: document.querySelector("#createConfirmPasswordInput"),
  createUserMessage: document.querySelector("#createUserMessage"),
  accountForm: document.querySelector("#accountForm"),
  newUsernameInput: document.querySelector("#newUsernameInput"),
  currentPasswordInput: document.querySelector("#currentPasswordInput"),
  newPasswordInput: document.querySelector("#newPasswordInput"),
  confirmPasswordInput: document.querySelector("#confirmPasswordInput"),
  accountMessage: document.querySelector("#accountMessage"),
  userList: document.querySelector("#userList"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryNameInput: document.querySelector("#categoryNameInput"),
  categoryColorInput: document.querySelector("#categoryColorInput"),
  categoryList: document.querySelector("#categoryList"),
  statusForm: document.querySelector("#statusForm"),
  statusNameInput: document.querySelector("#statusNameInput"),
  statusColorInput: document.querySelector("#statusColorInput"),
  statusList: document.querySelector("#statusList"),
  expenseTable: document.querySelector("#expenseTable"),
  emptyState: document.querySelector("#emptyState"),
  listScope: document.querySelector("#listScope"),
  listMonthFilter: document.querySelector("#listMonthFilter"),
  listYearFilter: document.querySelector("#listYearFilter"),
  listMonthField: document.querySelector("#listMonthField"),
  listYearField: document.querySelector("#listYearField"),
  listCategoryFilter: document.querySelector("#listCategoryFilter"),
  listStatusFilter: document.querySelector("#listStatusFilter"),
  listMethodFilter: document.querySelector("#listMethodFilter"),
  listPageSize: document.querySelector("#listPageSize"),
  listMeta: document.querySelector("#listMeta"),
  listPageInfo: document.querySelector("#listPageInfo"),
  listPrev: document.querySelector("#listPrev"),
  listNext: document.querySelector("#listNext"),
  searchInput: document.querySelector("#searchInput"),
  exportExcel: document.querySelector("#exportExcel"),
  backupJson: document.querySelector("#backupJson"),
  uploadJson: document.querySelector("#uploadJson"),
  jsonFileInput: document.querySelector("#jsonFileInput"),
  clearAll: document.querySelector("#clearAll"),
  resetSample: document.querySelector("#resetSample"),
  exportLogs: document.querySelector("#exportLogs"),
  clearLogs: document.querySelector("#clearLogs"),
  logTable: document.querySelector("#logTable"),
  logEmpty: document.querySelector("#logEmpty"),
  trendTitle: document.querySelector("#trendTitle"),
  trendLabel: document.querySelector("#trendLabel"),
  dailyChart: document.querySelector("#dailyChart"),
  categoryChart: document.querySelector("#categoryChart"),
  methodChart: document.querySelector("#methodChart"),
  categoryLegend: document.querySelector("#categoryLegend")
};

els.monthFilter.value = currentMonth;
els.listMonthFilter.value = currentMonth;
els.listYearFilter.value = String(today.getFullYear());
els.dateInput.value = isoDate(today);
els.customStart.value = isoDate(addDays(today, -29));
els.customEnd.value = isoDate(today);
els.expenseForm.noValidate = true;
els.urlInput.type = "text";
refreshClientIp();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    return normalizeBackupData(JSON.parse(raw)) || defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeIp(value) {
  const ip = String(value || "").trim();
  return /^[0-9a-f:.]+$/i.test(ip) && ip.length <= 45 ? ip : "Unavailable";
}

function loadCachedClientIp() {
  try {
    return normalizeIp(sessionStorage.getItem(IP_CACHE_KEY));
  } catch {
    return "Unavailable";
  }
}

function saveCachedClientIp(ip) {
  try {
    sessionStorage.setItem(IP_CACHE_KEY, normalizeIp(ip));
  } catch {
    // Session storage may be blocked in private modes; logs can still work.
  }
}

async function refreshClientIp() {
  if (!globalThis.fetch) return clientIp;
  const controller = globalThis.AbortController ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 1500) : null;
  try {
    const response = await fetch(IP_LOOKUP_URL, {
      cache: "no-store",
      signal: controller?.signal
    });
    if (!response.ok) return clientIp;
    const data = await response.json();
    clientIp = normalizeIp(data?.ip);
    saveCachedClientIp(clientIp);
  } catch {
    clientIp = normalizeIp(clientIp);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return clientIp;
}

function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function createSalt() {
  return createId("salt");
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function createAuthUser(username, password) {
  const salt = createSalt();
  return {
    id: createId("user"),
    username: normalizeUsername(username),
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString()
  };
}

function defaultAuthState() {
  return {
    version: 2,
    users: [{
      id: "user-admin",
      username: DEFAULT_AUTH.username,
      salt: DEFAULT_AUTH.salt,
      passwordHash: DEFAULT_AUTH.passwordHash,
      createdAt: "2026-06-03T00:00:00.000Z"
    }]
  };
}

function normalizeAuthUser(user, index) {
  const username = normalizeUsername(user?.username);
  if (!username || !user?.salt || !user?.passwordHash) return null;
  return {
    id: String(user.id || createId(`user-${index}`)),
    username,
    salt: String(user.salt),
    passwordHash: String(user.passwordHash),
    createdAt: Number.isNaN(Date.parse(user.createdAt)) ? new Date().toISOString() : String(user.createdAt)
  };
}

function normalizeAuth(rawAuth) {
  const sourceUsers = Array.isArray(rawAuth?.users)
    ? rawAuth.users
    : rawAuth?.username && rawAuth?.salt && rawAuth?.passwordHash
      ? [rawAuth]
      : defaultAuthState().users;
  const seen = new Set();
  const users = sourceUsers
    .map(normalizeAuthUser)
    .filter((user) => {
      if (!user) return false;
      const key = user.username.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return {
    version: 2,
    users: users.length ? users : defaultAuthState().users
  };
}

function loadAuth() {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    const auth = defaultAuthState();
    saveAuth(auth);
    return auth;
  }
  try {
    const auth = normalizeAuth(JSON.parse(raw));
    saveAuth(auth);
    return auth;
  } catch {
    const auth = defaultAuthState();
    saveAuth(auth);
    return auth;
  }
}

function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(normalizeAuth(auth)));
}

function findUserByUsername(username, auth = loadAuth()) {
  const target = normalizeUsername(username).toLowerCase();
  return auth.users.find((user) => user.username.toLowerCase() === target) || null;
}

function verifyPassword(password, user) {
  return Boolean(user?.salt && user?.passwordHash && hashPassword(password, user.salt) === user.passwordHash);
}

function currentSessionUser() {
  return sessionStorage.getItem(SESSION_KEY) || "";
}

function setSession(username) {
  sessionStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function isLoggedIn() {
  return Boolean(findUserByUsername(currentSessionUser()));
}

function syncAccountInputs() {
  const auth = loadAuth();
  const user = findUserByUsername(currentSessionUser(), auth) || auth.users[0];
  els.currentUserLabel.textContent = user.username;
  els.newUsernameInput.value = user.username;
  els.currentPasswordInput.value = "";
  els.newPasswordInput.value = "";
  els.confirmPasswordInput.value = "";
  els.createUserForm.reset();
  els.createUserMessage.textContent = "";
  els.accountMessage.textContent = "";
  renderUserList(auth);
}

function showLogin() {
  els.loginScreen.classList.remove("is-hidden");
  els.appShell.classList.add("is-hidden");
  els.loginPassword.value = "";
  els.loginUsername.value = currentSessionUser() || loadAuth().users[0]?.username || "";
  els.loginMessage.textContent = "";
  els.loginMessage.className = "auth-message";
  els.loginUsername.focus();
}

function showApp() {
  els.loginScreen.classList.add("is-hidden");
  els.appShell.classList.remove("is-hidden");
  syncAccountInputs();
  render();
}

function requireAuth() {
  if (isLoggedIn()) {
    showApp();
    return;
  }
  clearSession();
  showLogin();
}

function defaultState() {
  return {
    categories: sampleCategories.map((category) => ({ ...category })),
    statuses: sampleStatuses.map((status) => ({ ...status })),
    expenses: sampleExpenses.map((expense) => ({ ...expense })),
    annualBudgets: { [today.getFullYear()]: 144000 },
    budgets: { [currentMonth]: 12000 },
    logs: []
  };
}

function normalizeBackupData(data) {
  const source = data?.data && typeof data.data === "object" ? data.data : data;
  if (!source || typeof source !== "object") return null;
  const categories = normalizeOptionList(source.categories, sampleCategories, "cat");
  const statuses = normalizeOptionList(source.statuses, sampleStatuses, "status");
  const fallbackCategory = categories[0];
  const fallbackStatus = statuses[0];
  return {
    categories,
    statuses,
    expenses: normalizeExpenseList(source.expenses, categories, statuses, fallbackCategory, fallbackStatus),
    annualBudgets: normalizeAnnualBudgets(source.annualBudgets),
    budgets: normalizeBudgets(source.budgets),
    logs: normalizeLogs(source.logs)
  };
}

function normalizeOptionList(values, fallback, prefix) {
  const source = Array.isArray(values) && values.length ? values : fallback;
  const seenIds = new Set();
  const normalized = source
    .map((item, index) => ({
      id: String(item?.id || `${prefix}-${index + 1}`),
      name: String(item?.name || `${prefix} ${index + 1}`).trim(),
      color: /^#[0-9a-f]{6}$/i.test(String(item?.color || "")) ? item.color : palette[index % palette.length]
    }))
    .filter((item, index) => {
      if (!item.name) return false;
      if (seenIds.has(item.id)) item.id = `${item.id}-${index + 1}`;
      seenIds.add(item.id);
      return true;
    });
  return normalized.length ? normalized : fallback.map((item) => ({ ...item }));
}

function normalizeExpenseList(values, categories, statuses, fallbackCategory, fallbackStatus) {
  if (!Array.isArray(values)) return [];
  return values
    .map((expense, index) => {
      const amount = Number(expense?.amount);
      const categoryId = categories.some((category) => category.id === expense?.categoryId) ? expense.categoryId : fallbackCategory.id;
      const statusId = statuses.some((status) => status.id === expense?.statusId) ? expense.statusId : fallbackStatus.id;
      return {
        id: String(expense?.id || createId(`expense-${index}`)),
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(expense?.date || "")) ? expense.date : isoDate(today),
        title: String(expense?.title || "").trim(),
        url: normalizeUrl(expense?.url || ""),
        amount: Number.isFinite(amount) ? amount : 0,
        categoryId,
        method: String(expense?.method || "เงินสด"),
        statusId
      };
    })
    .filter((expense) => expense.title && expense.amount > 0);
}

function normalizeBudgets(values) {
  if (!values || typeof values !== "object") return {};
  return Object.fromEntries(Object.entries(values)
    .map(([key, value]) => [key, Number(value)])
    .filter(([key, value]) => /^\d{4}-\d{2}$/.test(key) && Number.isFinite(value) && value > 0));
}

function normalizeAnnualBudgets(values) {
  if (!values || typeof values !== "object") return {};
  return Object.fromEntries(Object.entries(values)
    .map(([key, value]) => [String(key), Number(value)])
    .filter(([key, value]) => /^\d{4}$/.test(key) && Number.isFinite(value) && value > 0));
}

function normalizeLogs(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((log, index) => ({
      id: String(log?.id || createId(`log-${index}`)),
      at: Number.isNaN(Date.parse(log?.at)) ? new Date().toISOString() : String(log.at),
      user: String(log?.user || "system"),
      device: String(log?.device || "Unknown"),
      ip: normalizeIp(log?.ip || log?.clientIp || ""),
      userType: String(log?.userType || "").toLowerCase() === "bot" ? "Bot" : "Human",
      action: String(log?.action || "edit"),
      detail: String(log?.detail || "")
    }))
    .slice(0, 500);
}

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: value % 1 ? 2 : 0
  }).format(value || 0);
}

function moneyInput(value) {
  return value ? money(value) : "";
}

function parseMoneyInput(value) {
  const cleaned = String(value || "").replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortDate(value) {
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "2-digit" }).format(parseDate(value));
}

function plainNumber(value) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value || 0);
}

function getCategory(id) {
  return state.categories.find((category) => category.id === id) || { name: "ไม่ระบุ", color: "#9aa5a1" };
}

function getStatus(id) {
  return state.statuses.find((status) => status.id === id) || state.statuses[0] || { id: "pending", name: "รอดำเนินการ", color: "#d29f35" };
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function daysBetween(start, end) {
  return Math.round((parseDate(end) - parseDate(start)) / 86400000) + 1;
}

function expensesForMonth(key = els.monthFilter.value) {
  return state.expenses.filter((expense) => expense.date.startsWith(key));
}

function selectedBudgetYear() {
  return parseDate(`${els.monthFilter.value}-01`).getFullYear();
}

function getAnnualBudget(year = selectedBudgetYear()) {
  return Number(state.annualBudgets?.[String(year)] || 0);
}

function getMonthlyBudget(key = els.monthFilter.value) {
  const year = parseDate(`${key}-01`).getFullYear();
  const annualBudget = getAnnualBudget(year);
  return annualBudget ? annualBudget / 12 : Number(state.budgets?.[key] || 0);
}

function getSelectedRange() {
  const selectedMonth = parseDate(`${els.monthFilter.value}-01`);
  const mode = els.rangeMode.value;
  if (mode === "today") {
    const date = isoDate(today);
    return { mode, start: date, end: date, label: "วันนี้" };
  }
  if (mode === "7days") {
    return { mode, start: isoDate(addDays(today, -6)), end: isoDate(today), label: "7 วันล่าสุด" };
  }
  if (mode === "30days") {
    return { mode, start: isoDate(addDays(today, -29)), end: isoDate(today), label: "30 วันล่าสุด" };
  }
  if (mode === "year") {
    const year = selectedMonth.getFullYear();
    return { mode, start: `${year}-01-01`, end: `${year}-12-31`, label: `ปี ${year}` };
  }
  if (mode === "custom") {
    const start = els.customStart.value || isoDate(addDays(today, -29));
    const end = els.customEnd.value || isoDate(today);
    return start <= end
      ? { mode, start, end, label: "กำหนดเอง" }
      : { mode, start: end, end: start, label: "กำหนดเอง" };
  }
  const days = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  return {
    mode: "month",
    start: `${els.monthFilter.value}-01`,
    end: `${els.monthFilter.value}-${pad(days)}`,
    label: `เดือน ${els.monthFilter.value}`
  };
}

function getPreviousRange(range) {
  const length = daysBetween(range.start, range.end);
  const previousEnd = addDays(parseDate(range.start), -1);
  const previousStart = addDays(previousEnd, -(length - 1));
  return { start: isoDate(previousStart), end: isoDate(previousEnd) };
}

function expensesForRange(range = getSelectedRange()) {
  return state.expenses.filter((expense) => expense.date >= range.start && expense.date <= range.end);
}

function getListRange() {
  const scope = els.listScope.value;
  if (scope === "month") {
    const month = els.listMonthFilter.value || els.monthFilter.value;
    const date = parseDate(`${month}-01`);
    const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return { scope, start: `${month}-01`, end: `${month}-${pad(days)}`, label: `เดือน ${month}` };
  }
  if (scope === "year") {
    const year = Number(els.listYearFilter.value || selectedBudgetYear());
    return { scope, start: `${year}-01-01`, end: `${year}-12-31`, label: `ปี ${year}` };
  }
  if (scope === "all") {
    return { scope, start: "0000-01-01", end: "9999-12-31", label: "ทั้งหมด" };
  }
  const dashboardRange = getSelectedRange();
  return { scope, ...dashboardRange, label: `Dashboard: ${dashboardRange.label}` };
}

function expensesForListRange(range = getListRange()) {
  return state.expenses.filter((expense) => expense.date >= range.start && expense.date <= range.end);
}

function groupedSum(items, keyGetter) {
  return items.reduce((acc, item) => {
    const key = keyGetter(item);
    acc[key] = (acc[key] || 0) + Number(item.amount);
    return acc;
  }, {});
}

function render() {
  renderCategories();
  renderCategoryOptions();
  renderStatuses();
  renderStatusOptions();
  renderListFilterOptions();
  renderListControls();
  renderBudgetInput();
  renderRangeControls();
  const range = getSelectedRange();
  const visibleExpenses = expensesForRange(range);
  renderMetrics(visibleExpenses, range);
  renderCharts(visibleExpenses, range);
  renderTable();
  renderLogs();
}

function renderMetrics(items, range) {
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const previousRange = getPreviousRange(range);
  const previousRangeTotal = expensesForRange(previousRange).reduce((sum, item) => sum + Number(item.amount), 0);
  const todayItems = state.expenses.filter((item) => item.date === isoDate(today));
  const byCategory = groupedSum(items, (item) => item.categoryId);
  const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  const change = previousRangeTotal ? ((total - previousRangeTotal) / previousRangeTotal) * 100 : null;
  const budget = getMonthlyBudget();
  const annualBudget = getAnnualBudget();
  const monthlyTotal = expensesForMonth().reduce((sum, item) => sum + Number(item.amount), 0);
  const budgetTotal = range.mode === "month" ? total : monthlyTotal;
  const usedPercent = budget ? Math.min((budgetTotal / budget) * 100, 100) : 0;
  const remaining = budget - budgetTotal;

  els.totalLabel.textContent = `ยอดรวม${range.label}`;
  els.totalThisMonth.textContent = money(total);
  els.monthChange.textContent = change === null ? "ยังไม่มีข้อมูลช่วงก่อนหน้า" : `${change >= 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(change).toFixed(1)}% จากช่วงก่อนหน้า`;
  els.entryCount.textContent = String(items.length);
  els.averageExpense.textContent = `เฉลี่ย ${money(items.length ? total / items.length : 0)} ต่อรายการ`;
  els.topCategory.textContent = top ? getCategory(top[0]).name : "-";
  els.topCategoryAmount.textContent = top ? money(top[1]) : money(0);
  els.todayTotal.textContent = money(todayItems.reduce((sum, item) => sum + Number(item.amount), 0));
  els.todayCount.textContent = `${todayItems.length} รายการ`;
  els.budgetRemaining.textContent = budget ? money(Math.max(remaining, 0)) : "ยังไม่ตั้งงบ";
  els.budgetStatus.textContent = budget
    ? remaining >= 0
      ? `ปี ${selectedBudgetYear()} งบรายปี ${money(annualBudget || budget * 12)} / เดือนละ ${money(budget)} ใช้ไป ${money(budgetTotal)}`
      : `เกินงบ ${money(Math.abs(remaining))} จากงบเดือนละ ${money(budget)}`
    : "ตั้งงบเพื่อดูยอดคงเหลือ";
  els.budgetProgress.style.width = `${usedPercent}%`;
  els.budgetProgress.style.background = budget && remaining < 0 ? "var(--red)" : usedPercent >= 80 ? "var(--gold)" : "var(--accent)";
  els.budgetMetric.classList.toggle("over", budget && remaining < 0);
}

function renderRangeControls() {
  const range = getSelectedRange();
  const customMode = els.rangeMode.value === "custom";
  els.customRangeFields.forEach((field) => field.classList.toggle("is-hidden", !customMode));
  els.rangeSummary.textContent = `${range.label}: ${shortDate(range.start)} - ${shortDate(range.end)}`;
}

function renderBudgetInput() {
  const year = selectedBudgetYear();
  const annualBudget = getAnnualBudget(year);
  const monthlyBudget = getMonthlyBudget();
  els.annualBudgetInput.value = moneyInput(annualBudget);
  els.budgetInput.value = moneyInput(monthlyBudget);
  els.budgetHint.textContent = annualBudget
    ? `Budget สำหรับปี ${year}: เดือนละ ${money(monthlyBudget)}`
    : `ใส่งบรายปี แล้วระบบจะคำนวณรายเดือน = รายปี / 12`;
}

function updateMonthlyBudgetPreview() {
  const annualBudget = parseMoneyInput(els.annualBudgetInput.value);
  els.budgetInput.value = moneyInput(annualBudget / 12);
}

function renderCategories() {
  els.categoryList.innerHTML = "";
  state.categories.forEach((category) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span class="dot" style="background:${category.color}"></span><span>${escapeHtml(category.name)}</span>`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "×";
    button.title = `ลบหมวด ${category.name}`;
    button.setAttribute("aria-label", `ลบหมวด ${category.name}`);
    button.addEventListener("click", () => deleteCategory(category.id));
    chip.appendChild(button);
    els.categoryList.appendChild(chip);
  });
}

function renderCategoryOptions() {
  const currentValue = els.categoryInput.value;
  els.categoryInput.innerHTML = state.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("");
  if (state.categories.some((category) => category.id === currentValue)) {
    els.categoryInput.value = currentValue;
  }
}

function renderStatuses() {
  els.statusList.innerHTML = "";
  state.statuses.forEach((status) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span class="dot" style="background:${status.color}"></span><span>${escapeHtml(status.name)}</span>`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "×";
    button.title = `ลบ status ${status.name}`;
    button.setAttribute("aria-label", `ลบ status ${status.name}`);
    button.addEventListener("click", () => deleteStatus(status.id));
    chip.appendChild(button);
    els.statusList.appendChild(chip);
  });
}

function renderStatusOptions() {
  const currentValue = els.statusInput.value;
  els.statusInput.innerHTML = state.statuses
    .map((status) => `<option value="${status.id}">${escapeHtml(status.name)}</option>`)
    .join("");
  if (state.statuses.some((status) => status.id === currentValue)) {
    els.statusInput.value = currentValue;
  }
}

function renderListFilterOptions() {
  const currentCategory = els.listCategoryFilter.value;
  const currentStatus = els.listStatusFilter.value;
  const currentMethod = els.listMethodFilter.value;
  els.listCategoryFilter.innerHTML = `<option value="">ทุกหมวด</option>${state.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join("")}`;
  els.listStatusFilter.innerHTML = `<option value="">ทุก Status</option>${state.statuses
    .map((status) => `<option value="${status.id}">${escapeHtml(status.name)}</option>`)
    .join("")}`;
  const methods = [...new Set(state.expenses.map((expense) => expense.method).filter(Boolean))].sort();
  els.listMethodFilter.innerHTML = `<option value="">ทุกวิธีจ่าย</option>${methods
    .map((method) => `<option value="${escapeHtml(method)}">${escapeHtml(method)}</option>`)
    .join("")}`;
  if (state.categories.some((category) => category.id === currentCategory)) els.listCategoryFilter.value = currentCategory;
  if (state.statuses.some((status) => status.id === currentStatus)) els.listStatusFilter.value = currentStatus;
  if (methods.includes(currentMethod)) els.listMethodFilter.value = currentMethod;
}

function renderListControls() {
  const scope = els.listScope.value;
  els.listMonthField.classList.toggle("is-hidden", scope !== "month");
  els.listYearField.classList.toggle("is-hidden", scope !== "year");
}

function getFilteredListItems(range = getListRange()) {
  const query = els.searchInput.value.trim().toLowerCase();
  const categoryFilter = els.listCategoryFilter.value;
  const statusFilter = els.listStatusFilter.value;
  const methodFilter = els.listMethodFilter.value;
  return expensesForListRange(range)
    .filter((item) => !categoryFilter || item.categoryId === categoryFilter)
    .filter((item) => !statusFilter || getStatus(item.statusId).id === statusFilter)
    .filter((item) => !methodFilter || item.method === methodFilter)
    .filter((item) => `${item.date} ${item.title} ${item.url || ""} ${getCategory(item.categoryId).name} ${getStatus(item.statusId).name} ${item.method} ${item.amount}`.toLowerCase().includes(query))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function renderTable() {
  const range = getListRange();
  const pageSize = Number(els.listPageSize.value) || 10;
  const items = getFilteredListItems(range);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  listPage = Math.min(Math.max(1, listPage), totalPages);
  const startIndex = (listPage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  els.expenseTable.innerHTML = "";
  els.emptyState.classList.toggle("show", items.length === 0);
  els.listMeta.textContent = items.length
    ? `${range.label} • แสดง ${startIndex + 1}-${Math.min(startIndex + pageSize, items.length)} จาก ${items.length} รายการ`
    : `${range.label} • 0 รายการ`;
  els.listPageInfo.textContent = `หน้า ${listPage} / ${totalPages}`;
  els.listPrev.disabled = listPage <= 1;
  els.listNext.disabled = listPage >= totalPages;

  pageItems.forEach((item) => {
    const category = getCategory(item.categoryId);
    const status = getStatus(item.statusId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="วันที่">${shortDate(item.date)}</td>
      <td data-label="รายการ">${escapeHtml(item.title)}</td>
      <td data-label="หมวด"><span class="chip"><span class="dot" style="background:${category.color}"></span>${escapeHtml(category.name)}</span></td>
      <td data-label="วิธีจ่าย">${escapeHtml(item.method)}</td>
      <td data-label="Status"><span class="chip"><span class="dot" style="background:${status.color}"></span>${escapeHtml(status.name)}</span></td>
      <td data-label="ลิงก์" class="link-col"></td>
      <td data-label="จำนวนเงิน" class="amount-col">${money(Number(item.amount))}</td>
      <td data-label="จัดการ"><div class="row-actions"></div></td>
    `;
    const linkCell = row.querySelector(".link-col");
    if (item.url) {
      const link = document.createElement("a");
      link.className = "link-button";
      link.href = normalizeUrl(item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "เปิดลิงก์";
      linkCell.appendChild(link);
    } else {
      linkCell.textContent = "-";
    }
    const actions = row.querySelector(".row-actions");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "แก้ไข";
    edit.addEventListener("click", () => startEdit(item.id));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "ลบ";
    remove.addEventListener("click", () => deleteExpense(item.id));
    actions.append(edit, remove);
    els.expenseTable.appendChild(row);
  });
}

function renderCharts(items, range) {
  renderDailyChart(items, range);
  renderCategoryChart(items);
  renderMethodChart(items);
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssHeight = rect.height || Number(canvas.getAttribute("height")) || 260;
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.floor(cssHeight * ratio);
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, width: canvas.width / ratio, height: canvas.height / ratio };
}

function renderDailyChart(items, range) {
  const { ctx, width, height } = setupCanvas(els.dailyChart);
  const totalDays = daysBetween(range.start, range.end);
  const monthly = totalDays > 62;
  const values = monthly ? buildMonthlyBuckets(range) : buildDailyBuckets(range);
  items.forEach((item) => {
    const key = monthly ? item.date.slice(0, 7) : item.date;
    const bucket = values.find((value) => value.key === key);
    if (bucket) bucket.amount += Number(item.amount);
  });
  const max = Math.max(...values.map((item) => item.amount), 100);
  const padX = 42;
  const padY = 28;
  const chartW = width - padX - 14;
  const chartH = height - padY * 2;
  const barW = Math.max(4, chartW / values.length - 3);

  clearChart(ctx, width, height);
  drawGrid(ctx, width, height, padX, padY, chartH, max);
  ctx.fillStyle = "#2f7d78";
  values.forEach((item, index) => {
    const barH = (item.amount / max) * chartH;
    const x = padX + index * (chartW / values.length) + 1;
    const y = height - padY - barH;
    ctx.fillRect(x, y, barW, barH);
  });
  ctx.fillStyle = "#667371";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText(values[0]?.label || "", padX, height - 8);
  ctx.fillText(values[values.length - 1]?.label || "", Math.max(padX, width - 70), height - 8);
  els.trendTitle.textContent = monthly ? "แนวโน้มรายเดือน" : "แนวโน้มรายวัน";
  els.trendLabel.textContent = `${totalDays} วัน`;
}

function buildDailyBuckets(range) {
  const totalDays = daysBetween(range.start, range.end);
  return Array.from({ length: totalDays }, (_, index) => {
    const date = addDays(parseDate(range.start), index);
    return { key: isoDate(date), label: String(date.getDate()), amount: 0 };
  });
}

function buildMonthlyBuckets(range) {
  const buckets = [];
  const cursor = parseDate(`${range.start.slice(0, 7)}-01`);
  const end = parseDate(`${range.end.slice(0, 7)}-01`);
  while (cursor <= end) {
    const key = monthKey(cursor);
    buckets.push({ key, label: key.slice(5), amount: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function renderCategoryChart(items) {
  const { ctx, width, height } = setupCanvas(els.categoryChart);
  const byCategory = groupedSum(items, (item) => item.categoryId);
  const rows = Object.entries(byCategory)
    .map(([id, amount]) => ({ ...getCategory(id), amount }))
    .sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const radius = Math.max(58, Math.min(width, height) / 2 - 58);
  const cx = width / 2;
  const cy = height / 2;
  let angle = -Math.PI / 2;
  const slices = [];

  clearChart(ctx, width, height);
  if (!total) {
    drawEmptyChart(ctx, width, height, "ยังไม่มีข้อมูล");
    els.categoryLegend.innerHTML = "";
    return;
  }
  rows.forEach((row) => {
    const slice = (row.amount / total) * Math.PI * 2;
    slices.push({ ...row, start: angle, end: angle + slice, percent: (row.amount / total) * 100 });
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = row.color;
    ctx.fill();
    angle += slice;
  });
  drawPercentLabels(ctx, slices, cx, cy, radius, width, height);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.fillStyle = "#1e2b2a";
  ctx.textAlign = "center";
  ctx.font = "700 18px Segoe UI, sans-serif";
  ctx.fillText(money(total), cx, cy - 2);
  ctx.fillStyle = "#667371";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText("รวม 100%", cx, cy + 18);
  ctx.textAlign = "left";
  els.categoryLegend.innerHTML = rows
    .map((row) => {
      const percent = total ? (row.amount / total) * 100 : 0;
      return `<div class="legend-row"><span class="dot" style="background:${row.color}"></span><span>${escapeHtml(row.name)}</span><span class="legend-percent">${percent.toFixed(1)}%</span><strong>${money(row.amount)}</strong></div>`;
    })
    .join("");
}

function drawPercentLabels(ctx, slices, cx, cy, radius, width, height) {
  const labels = slices.map((slice) => {
    const mid = (slice.start + slice.end) / 2;
    const side = Math.cos(mid) >= 0 ? 1 : -1;
    return {
      ...slice,
      mid,
      side,
      anchorX: cx + Math.cos(mid) * (radius + 4),
      anchorY: cy + Math.sin(mid) * (radius + 4),
      elbowX: cx + Math.cos(mid) * (radius + 19),
      elbowY: cy + Math.sin(mid) * (radius + 19),
      labelY: Math.min(height - 14, Math.max(14, cy + Math.sin(mid) * (radius + 30)))
    };
  });

  [-1, 1].forEach((side) => {
    const group = labels.filter((label) => label.side === side).sort((a, b) => a.labelY - b.labelY);
    for (let index = 1; index < group.length; index += 1) {
      group[index].labelY = Math.max(group[index].labelY, group[index - 1].labelY + 18);
    }
    const overflow = group.length ? group[group.length - 1].labelY - (height - 14) : 0;
    if (overflow > 0) {
      group.forEach((label) => {
        label.labelY -= overflow;
      });
    }
  });

  ctx.font = "700 12px Segoe UI, sans-serif";
  ctx.lineWidth = 1.4;
  labels.forEach((label) => {
    const textX = label.side > 0 ? Math.min(width - 8, label.elbowX + 18) : Math.max(8, label.elbowX - 18);
    const lineEndX = label.side > 0 ? textX - 5 : textX + 5;
    ctx.strokeStyle = label.color;
    ctx.beginPath();
    ctx.moveTo(label.anchorX, label.anchorY);
    ctx.lineTo(label.elbowX, label.elbowY);
    ctx.lineTo(lineEndX, label.labelY);
    ctx.stroke();
    ctx.fillStyle = label.color;
    ctx.textAlign = label.side > 0 ? "left" : "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${label.percent.toFixed(1)}%`, textX, label.labelY);
  });
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

function renderMethodChart(items) {
  const { ctx, width, height } = setupCanvas(els.methodChart);
  const rows = Object.entries(groupedSum(items, (item) => item.method)).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map((row) => row[1]), 100);
  const padX = 92;
  const rowH = rows.length ? Math.min(44, (height - 34) / rows.length) : 36;

  clearChart(ctx, width, height);
  if (!rows.length) {
    drawEmptyChart(ctx, width, height, "ยังไม่มีข้อมูล");
    return;
  }
  rows.forEach(([method, amount], index) => {
    const y = 24 + index * rowH;
    const barW = ((width - padX - 28) * amount) / max;
    ctx.fillStyle = "#667371";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillText(method, 8, y + 17);
    ctx.fillStyle = palette[index % palette.length];
    ctx.fillRect(padX, y, barW, 22);
    ctx.fillStyle = "#1e2b2a";
    ctx.fillText(money(amount), padX + barW + 8, y + 16);
  });
}

function clearChart(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(ctx, width, height, padX, padY, chartH, max) {
  ctx.strokeStyle = "#e7ede9";
  ctx.fillStyle = "#667371";
  ctx.font = "12px Segoe UI, sans-serif";
  for (let i = 0; i <= 4; i += 1) {
    const y = padY + (chartH / 4) * i;
    const value = max - (max / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(width - 12, y);
    ctx.stroke();
    ctx.fillText(value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value), 4, y + 4);
  }
}

function drawEmptyChart(ctx, width, height, label) {
  ctx.fillStyle = "#667371";
  ctx.textAlign = "center";
  ctx.font = "14px Segoe UI, sans-serif";
  ctx.fillText(label, width / 2, height / 2);
  ctx.textAlign = "left";
}

function resetListAndRender() {
  listPage = 1;
  renderTable();
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function logActionLabel(action) {
  return {
    login: "Login",
    logout: "Logout",
    edit: "Edit",
    delete: "Delete"
  }[action] || action;
}

function detectOperatingSystem(userAgent, platform) {
  const source = `${userAgent} ${platform}`.toLowerCase();
  if (source.includes("windows")) return "Windows";
  if (source.includes("android")) return "Android";
  if (source.includes("iphone") || source.includes("ipad") || source.includes("ipod")) return "iOS";
  if (source.includes("mac")) return "macOS";
  if (source.includes("linux")) return "Linux";
  return platform || "Unknown OS";
}

function detectBrowser(userAgent) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios|chromium/i.test(userAgent)) return "Safari";
  return "Unknown Browser";
}

function detectDeviceType(userAgent) {
  const platform = navigator.platform || "";
  const iPadLike = platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1;
  if (/ipad|tablet/i.test(userAgent) || iPadLike) return "Tablet";
  if (navigator.userAgentData?.mobile || /mobi|android|iphone|ipod/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function detectUserType(userAgent) {
  const botPattern = /(bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|telegrambot|headless|phantomjs|lighthouse|pagespeed|curl|wget|python-requests|postmanruntime|playwright|puppeteer)/i;
  if (!userAgent || navigator.webdriver || botPattern.test(userAgent)) return "Bot";
  return "Human";
}

function getClientLogMeta() {
  const userAgent = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const device = [
    detectDeviceType(userAgent),
    detectBrowser(userAgent),
    detectOperatingSystem(userAgent, platform)
  ].filter(Boolean).join(" / ");
  return {
    device,
    ip: normalizeIp(clientIp),
    userType: detectUserType(userAgent)
  };
}

function addLog(action, detail = "") {
  const clientMeta = getClientLogMeta();
  state.logs = normalizeLogs(state.logs);
  state.logs.unshift({
    id: createId("log"),
    at: new Date().toISOString(),
    user: currentSessionUser() || "system",
    device: clientMeta.device,
    ip: clientMeta.ip,
    userType: clientMeta.userType,
    action,
    detail
  });
  state.logs = state.logs.slice(0, 500);
  saveState();
  renderLogs();
}

function renderLogs() {
  const rows = normalizeLogs(state.logs).slice(0, 120);
  els.logTable.innerHTML = rows
    .map((log) => `
      <tr>
        <td data-label="เวลา">${escapeHtml(formatDateTime(log.at))}</td>
        <td data-label="User">${escapeHtml(log.user)}</td>
        <td data-label="Device">${escapeHtml(log.device)}</td>
        <td data-label="IP">${escapeHtml(log.ip)}</td>
        <td data-label="Type"><span class="log-action ${log.userType === "Bot" ? "bot" : "human"}">${escapeHtml(log.userType)}</span></td>
        <td data-label="Action"><span class="log-action">${escapeHtml(logActionLabel(log.action))}</span></td>
        <td data-label="รายละเอียด">${escapeHtml(log.detail || "-")}</td>
      </tr>
    `)
    .join("");
  els.logEmpty.classList.toggle("show", rows.length === 0);
}

function renderUserList(auth = loadAuth()) {
  const current = currentSessionUser();
  els.userList.innerHTML = auth.users
    .map((user) => {
      const isCurrent = user.username === current;
      const disableDelete = isCurrent || auth.users.length <= 1;
      return `
        <div class="user-row ${isCurrent ? "current" : ""}">
          <div>
            <span class="user-name">${escapeHtml(user.username)}</span>
            <span class="user-meta">${isCurrent ? "กำลังใช้งาน" : "บัญชีผู้ใช้"} · ${escapeHtml(formatDateTime(user.createdAt))}</span>
          </div>
          <button type="button" data-delete-user="${escapeHtml(user.username)}" ${disableDelete ? "disabled" : ""}>ลบ</button>
        </div>
      `;
    })
    .join("");
  els.userList.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => deleteUser(button.dataset.deleteUser));
  });
}

function deleteUser(username) {
  const auth = loadAuth();
  const user = findUserByUsername(username, auth);
  if (!user) return;
  if (auth.users.length <= 1) {
    alert("ต้องมีบัญชีผู้ใช้อย่างน้อย 1 บัญชี");
    return;
  }
  if (user.username === currentSessionUser()) {
    alert("ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่");
    return;
  }
  if (!confirm(`ต้องการลบบัญชี ${user.username} หรือไม่`)) return;
  auth.users = auth.users.filter((item) => item.id !== user.id);
  saveAuth(auth);
  addLog("delete", `ลบบัญชีผู้ใช้: ${user.username}`);
  renderUserList(loadAuth());
}

function startEdit(id) {
  const item = state.expenses.find((expense) => expense.id === id);
  if (!item) return;
  els.editingId.value = item.id;
  els.dateInput.value = item.date;
  els.titleInput.value = item.title;
  els.urlInput.value = item.url || "";
  els.amountInput.value = item.amount;
  els.categoryInput.value = item.categoryId;
  els.methodInput.value = item.method;
  els.statusInput.value = item.statusId || getStatus().id;
  els.saveExpense.textContent = "บันทึกการแก้ไข";
  els.cancelEdit.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearEdit() {
  els.editingId.value = "";
  els.expenseForm.reset();
  els.dateInput.value = isoDate(today);
  els.saveExpense.textContent = "บันทึกรายการ";
  els.cancelEdit.classList.add("hidden");
}

function deleteExpense(id) {
  const deleted = state.expenses.find((expense) => expense.id === id);
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  saveState();
  if (deleted) addLog("delete", `ลบรายการ: ${deleted.title}`);
  render();
}

function deleteCategory(id) {
  const category = state.categories.find((item) => item.id === id);
  const used = state.expenses.some((expense) => expense.categoryId === id);
  if (used) {
    alert("หมวดนี้ยังมีรายการค่าใช้จ่ายอยู่ กรุณาแก้ไขหรือลบรายการก่อน");
    return;
  }
  state.categories = state.categories.filter((category) => category.id !== id);
  saveState();
  if (category) addLog("delete", `ลบหมวดหมู่: ${category.name}`);
  render();
}

function deleteStatus(id) {
  const statusItem = state.statuses.find((status) => status.id === id);
  if (state.statuses.length <= 1) {
    alert("ต้องมี Status อย่างน้อย 1 ค่า");
    return;
  }
  const used = state.expenses.some((expense) => (expense.statusId || getStatus().id) === id);
  if (used) {
    alert("Status นี้ยังมีรายการค่าใช้จ่ายอยู่ กรุณาแก้ไขหรือลบรายการก่อน");
    return;
  }
  state.statuses = state.statuses.filter((status) => status.id !== id);
  saveState();
  if (statusItem) addLog("delete", `ลบ status: ${statusItem.name}`);
  render();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function normalizeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function exportMonthToExcel() {
  const range = getListRange();
  const items = getFilteredListItems(range).sort((a, b) => a.date.localeCompare(b.date));
  const month = els.monthFilter.value;
  const year = selectedBudgetYear();
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const monthlyTotal = expensesForMonth().reduce((sum, item) => sum + Number(item.amount), 0);
  const annualBudget = getAnnualBudget(year);
  const budget = getMonthlyBudget(month);
  const remaining = budget - monthlyTotal;
  const rows = items.map((item, index) => {
    const category = getCategory(item.categoryId);
    const status = getStatus(item.statusId);
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(category.name)}</td>
        <td>${escapeHtml(item.method)}</td>
        <td>${escapeHtml(status.name)}</td>
        <td>${escapeHtml(item.url || "")}</td>
        <td style="mso-number-format:'0.00';">${Number(item.amount).toFixed(2)}</td>
      </tr>
    `;
  }).join("");
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Tahoma, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #b8c4bf; padding: 8px; }
          th { background: #2f7d78; color: #ffffff; }
          .summary th { background: #e8eeea; color: #1e2b2a; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Expense Ledger - ${escapeHtml(range.label)} (${escapeHtml(range.start)} ถึง ${escapeHtml(range.end)})</h2>
        <table class="summary">
          <tr><th>ยอดรวม</th><td>${escapeHtml(money(total))}</td></tr>
          <tr><th>Budget รายปี</th><td>${annualBudget ? escapeHtml(money(annualBudget)) : "ยังไม่ตั้งงบ"}</td></tr>
          <tr><th>Budget รายเดือน</th><td>${budget ? escapeHtml(money(budget)) : "ยังไม่ตั้งงบ"}</td></tr>
          <tr><th>คงเหลือ/เกินงบ</th><td>${budget ? escapeHtml(remaining >= 0 ? money(remaining) : `เกินงบ ${money(Math.abs(remaining))}`) : "-"}</td></tr>
          <tr><th>จำนวนรายการ</th><td>${items.length}</td></tr>
        </table>
        <br>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>วันที่</th>
              <th>รายการ</th>
              <th>หมวด</th>
              <th>วิธีจ่าย</th>
              <th>Status</th>
              <th>Link URL</th>
              <th>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${rows || "<tr><td colspan=\"8\">ไม่มีข้อมูลในช่วงเวลานี้</td></tr>"}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expense-ledger-${range.start}-to-${range.end}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportLogsToExcel() {
  const logs = normalizeLogs(state.logs).sort((a, b) => new Date(b.at) - new Date(a.at));
  const rows = logs.map((log, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatDateTime(log.at))}</td>
        <td>${escapeHtml(log.user)}</td>
        <td>${escapeHtml(log.device)}</td>
        <td>${escapeHtml(log.ip)}</td>
        <td>${escapeHtml(log.userType)}</td>
        <td>${escapeHtml(logActionLabel(log.action))}</td>
        <td>${escapeHtml(log.detail || "-")}</td>
      </tr>
    `).join("");
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Tahoma, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #b8c4bf; padding: 8px; text-align: left; }
          th { background: #2f7d78; color: #ffffff; }
          .summary th { background: #e8eeea; color: #1e2b2a; }
        </style>
      </head>
      <body>
        <h2>CompanyExpenses Audit Log</h2>
        <table class="summary">
          <tr><th>Exported At</th><td>${escapeHtml(formatDateTime(new Date().toISOString()))}</td></tr>
          <tr><th>Total Logs</th><td>${logs.length}</td></tr>
        </table>
        <br>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>เวลา</th>
              <th>User</th>
              <th>Device</th>
              <th>IP</th>
              <th>Type</th>
              <th>Action</th>
              <th>รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            ${rows || "<tr><td colspan=\"8\">ยังไม่มี Audit Log</td></tr>"}
          </tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `companyexpenses-audit-log-${isoDate(today)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function backupStateToJson() {
  const payload = {
    app: "expense-ledger-dashboard",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expense-ledger-backup-${isoDate(today)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function uploadJsonBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const restoredState = normalizeBackupData(parsed);
      if (!restoredState) {
        alert("ไฟล์ JSON นี้ไม่ใช่ backup ที่รองรับ");
        return;
      }
      if (!confirm("ต้องการนำเข้าไฟล์ JSON และเขียนทับข้อมูลปัจจุบันหรือไม่")) return;
      state = restoredState;
      saveState();
      addLog("edit", "นำเข้า JSON backup");
      clearEdit();
      render();
      alert("นำเข้า JSON สำเร็จ");
    } catch {
      alert("อ่านไฟล์ JSON ไม่สำเร็จ กรุณาตรวจสอบไฟล์อีกครั้ง");
    } finally {
      els.jsonFileInput.value = "";
    }
  });
  reader.readAsText(file);
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const auth = loadAuth();
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value;
  const user = findUserByUsername(username, auth);
  if (user && verifyPassword(password, user)) {
    setSession(user.username);
    els.loginForm.reset();
    await refreshClientIp();
    addLog("login", "เข้าสู่ระบบ");
    showApp();
    return;
  }
  els.loginMessage.textContent = "Username หรือ Password ไม่ถูกต้อง";
  els.loginMessage.className = "auth-message error";
});

els.logoutButton.addEventListener("click", () => {
  addLog("logout", "ออกจากระบบ");
  clearSession();
  showLogin();
});

els.createUserForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const auth = loadAuth();
  const username = normalizeUsername(els.createUsernameInput.value);
  const password = els.createPasswordInput.value;
  const confirmPassword = els.createConfirmPasswordInput.value;

  els.createUserMessage.textContent = "";
  if (!username) {
    els.createUserMessage.textContent = "กรุณากรอก Username";
    return;
  }
  if (findUserByUsername(username, auth)) {
    els.createUserMessage.textContent = "Username นี้มีอยู่แล้ว";
    return;
  }
  if (password.length < 6) {
    els.createUserMessage.textContent = "Password ควรมีอย่างน้อย 6 ตัวอักษร";
    return;
  }
  if (password !== confirmPassword) {
    els.createUserMessage.textContent = "ยืนยัน Password ไม่ตรงกัน";
    return;
  }

  auth.users.push(createAuthUser(username, password));
  saveAuth(auth);
  els.createUserForm.reset();
  els.createUserMessage.textContent = "สร้างบัญชีสำเร็จ";
  addLog("edit", `สร้างบัญชีผู้ใช้: ${username}`);
  renderUserList(loadAuth());
});

els.accountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const auth = loadAuth();
  const currentUser = findUserByUsername(currentSessionUser(), auth);
  const username = els.newUsernameInput.value.trim();
  const currentPassword = els.currentPasswordInput.value;
  const newPassword = els.newPasswordInput.value;
  const confirmPassword = els.confirmPasswordInput.value;

  els.accountMessage.textContent = "";
  if (!username) {
    els.accountMessage.textContent = "กรุณากรอก Username";
    return;
  }
  if (!currentUser) {
    els.accountMessage.textContent = "ไม่พบบัญชีที่กำลังใช้งาน";
    requireAuth();
    return;
  }
  const duplicateUser = findUserByUsername(username, auth);
  if (duplicateUser && duplicateUser.id !== currentUser.id) {
    els.accountMessage.textContent = "Username นี้มีอยู่แล้ว";
    return;
  }
  if (!verifyPassword(currentPassword, currentUser)) {
    els.accountMessage.textContent = "Password เดิมไม่ถูกต้อง";
    return;
  }
  if (newPassword && newPassword.length < 6) {
    els.accountMessage.textContent = "Password ใหม่ควรมีอย่างน้อย 6 ตัวอักษร";
    return;
  }
  if (newPassword !== confirmPassword) {
    els.accountMessage.textContent = "ยืนยัน Password ใหม่ไม่ตรงกัน";
    return;
  }

  const oldUsername = currentUser.username;
  currentUser.username = username;
  if (newPassword) {
    currentUser.salt = createSalt();
    currentUser.passwordHash = hashPassword(newPassword, currentUser.salt);
  }
  saveAuth(auth);
  setSession(currentUser.username);
  addLog("edit", `เปลี่ยนบัญชีผู้ใช้: ${oldUsername} -> ${currentUser.username}`);
  syncAccountInputs();
  els.accountMessage.textContent = "บันทึกบัญชีสำเร็จ";
});

els.clearLogs.addEventListener("click", () => {
  if (!confirm("ต้องการล้าง Audit Log ทั้งหมดหรือไม่")) return;
  state.logs = [];
  saveState();
  renderLogs();
});

els.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const isEdit = Boolean(els.editingId.value);
  const payload = {
    id: els.editingId.value || createId("expense"),
    date: els.dateInput.value,
    title: els.titleInput.value.trim(),
    url: normalizeUrl(els.urlInput.value),
    amount: Number(els.amountInput.value),
    categoryId: els.categoryInput.value,
    method: els.methodInput.value,
    statusId: els.statusInput.value
  };
  if (!payload.title || payload.amount <= 0) return;

  if (isEdit) {
    state.expenses = state.expenses.map((expense) => expense.id === payload.id ? payload : expense);
  } else {
    state.expenses.push(payload);
  }
  saveState();
  if (isEdit) addLog("edit", `แก้ไขรายการ: ${payload.title}`);
  clearEdit();
  els.monthFilter.value = payload.date.slice(0, 7);
  if (els.listScope.value === "month") els.listMonthFilter.value = payload.date.slice(0, 7);
  if (els.listScope.value === "year") els.listYearFilter.value = payload.date.slice(0, 4);
  listPage = 1;
  render();
});

els.categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.categoryNameInput.value.trim();
  if (!name) return;
  state.categories.push({
    id: createId("cat"),
    name,
    color: els.categoryColorInput.value
  });
  saveState();
  els.categoryForm.reset();
  els.categoryColorInput.value = palette[state.categories.length % palette.length];
  render();
});

els.statusForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.statusNameInput.value.trim();
  if (!name) return;
  state.statuses.push({
    id: createId("status"),
    name,
    color: els.statusColorInput.value
  });
  saveState();
  els.statusForm.reset();
  els.statusColorInput.value = palette[state.statuses.length % palette.length];
  render();
});

els.annualBudgetInput.addEventListener("input", updateMonthlyBudgetPreview);
els.annualBudgetInput.addEventListener("focus", () => {
  const annualBudget = parseMoneyInput(els.annualBudgetInput.value);
  els.annualBudgetInput.value = annualBudget ? String(annualBudget) : "";
});
els.annualBudgetInput.addEventListener("blur", () => {
  const annualBudget = parseMoneyInput(els.annualBudgetInput.value);
  els.annualBudgetInput.value = moneyInput(annualBudget);
  els.budgetInput.value = moneyInput(annualBudget / 12);
});

els.budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const year = String(selectedBudgetYear());
  const annualBudget = parseMoneyInput(els.annualBudgetInput.value);
  state.annualBudgets = state.annualBudgets || {};
  if (annualBudget > 0) {
    state.annualBudgets[year] = annualBudget;
  } else {
    delete state.annualBudgets[year];
  }
  saveState();
  addLog("edit", annualBudget > 0 ? `ตั้งงบรายปี ${year}: ${money(annualBudget)}` : `ล้างงบรายปี ${year}`);
  render();
});

els.clearBudget.addEventListener("click", () => {
  const year = String(selectedBudgetYear());
  state.annualBudgets = state.annualBudgets || {};
  state.budgets = state.budgets || {};
  delete state.annualBudgets[year];
  Object.keys(state.budgets)
    .filter((key) => key.startsWith(`${year}-`))
    .forEach((key) => delete state.budgets[key]);
  saveState();
  addLog("delete", `ล้างงบรายปี ${year}`);
  render();
});

els.cancelEdit.addEventListener("click", clearEdit);
els.searchInput.addEventListener("input", () => resetListAndRender());
els.listScope.addEventListener("change", () => {
  if (els.listScope.value === "month") els.listMonthFilter.value = els.monthFilter.value;
  if (els.listScope.value === "year") els.listYearFilter.value = String(selectedBudgetYear());
  renderListControls();
  resetListAndRender();
});
els.listMonthFilter.addEventListener("change", resetListAndRender);
els.listYearFilter.addEventListener("input", resetListAndRender);
els.listCategoryFilter.addEventListener("change", resetListAndRender);
els.listStatusFilter.addEventListener("change", resetListAndRender);
els.listMethodFilter.addEventListener("change", resetListAndRender);
els.listPageSize.addEventListener("change", resetListAndRender);
els.listPrev.addEventListener("click", () => {
  listPage = Math.max(1, listPage - 1);
  renderTable();
});
els.listNext.addEventListener("click", () => {
  listPage += 1;
  renderTable();
});
els.exportExcel.addEventListener("click", exportMonthToExcel);
els.exportLogs.addEventListener("click", exportLogsToExcel);
els.backupJson.addEventListener("click", backupStateToJson);
els.uploadJson.addEventListener("click", () => els.jsonFileInput.click());
els.jsonFileInput.addEventListener("change", (event) => uploadJsonBackup(event.target.files[0]));
els.rangeMode.addEventListener("change", render);
els.customStart.addEventListener("change", render);
els.customEnd.addEventListener("change", render);
els.monthFilter.addEventListener("change", render);
els.prevMonth.addEventListener("click", () => shiftMonth(-1));
els.nextMonth.addEventListener("click", () => shiftMonth(1));
els.clearAll.addEventListener("click", () => {
  if (!confirm("ต้องการล้างรายการค่าใช้จ่ายทั้งหมดหรือไม่")) return;
  const count = state.expenses.length;
  state.expenses = [];
  saveState();
  addLog("delete", `ล้างรายการทั้งหมด ${count} รายการ`);
  clearEdit();
  render();
});
els.resetSample.addEventListener("click", () => {
  state = defaultState();
  saveState();
  clearEdit();
  render();
});

window.addEventListener("resize", render);

function shiftMonth(delta) {
  const date = new Date(`${els.monthFilter.value}-01`);
  if (els.rangeMode.value === "year") {
    date.setFullYear(date.getFullYear() + delta);
  } else {
    date.setMonth(date.getMonth() + delta);
  }
  els.monthFilter.value = monthKey(date);
  render();
}

requireAuth();
