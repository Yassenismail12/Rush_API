const API_BASE = "/api/wallet";

const state = {
    access: localStorage.getItem("rush_access") || "",
    refresh: localStorage.getItem("rush_refresh") || "",
    currentPage: 1,
    nextUrl: null,
    prevUrl: null,
};

const els = {
    authShell: document.getElementById("auth-shell"),
    dashboard: document.getElementById("dashboard"),
    logoutBtn: document.getElementById("logout-btn"),
    loginTab: document.getElementById("login-tab"),
    registerTab: document.getElementById("register-tab"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    depositForm: document.getElementById("deposit-form"),
    transferForm: document.getElementById("transfer-form"),
    balanceValue: document.getElementById("balance-value"),
    historyBody: document.getElementById("history-body"),
    pageInfo: document.getElementById("page-info"),
    prevPage: document.getElementById("prev-page"),
    nextPage: document.getElementById("next-page"),
    statusFilter: document.getElementById("status-filter"),
    refreshHistory: document.getElementById("refresh-history"),
    toast: document.getElementById("toast"),
};

function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    els.toast.classList.toggle("error", isError);
    setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function setAuth(access, refresh) {
    state.access = access || "";
    state.refresh = refresh || "";
    localStorage.setItem("rush_access", state.access);
    localStorage.setItem("rush_refresh", state.refresh);
}

function clearAuth() {
    state.access = "";
    state.refresh = "";
    localStorage.removeItem("rush_access");
    localStorage.removeItem("rush_refresh");
}

function formatMoney(amount, currency = "USD") {
    const number = Number(amount || 0);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(number);
}

function parseError(payload) {
    if (!payload) return "Request failed.";
    if (payload.error) return payload.error;
    if (payload.detail) return payload.detail;
    const first = Object.values(payload)[0];
    if (Array.isArray(first)) return first[0];
    return "Request failed.";
}

async function refreshAccessToken() {
    if (!state.refresh) return false;

    const res = await fetch(`${API_BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: state.refresh }),
    });

    if (!res.ok) {
        clearAuth();
        return false;
    }

    const data = await res.json();
    setAuth(data.access, state.refresh);
    return true;
}

async function authFetch(url, options = {}, allowRetry = true) {
    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${state.access}`,
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 && allowRetry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return authFetch(url, options, false);
        }
    }
    return response;
}

function switchToDashboard() {
    els.authShell.classList.add("hidden");
    els.dashboard.classList.remove("hidden");
    els.logoutBtn.hidden = false;
}

function switchToAuth() {
    els.dashboard.classList.add("hidden");
    els.authShell.classList.remove("hidden");
    els.logoutBtn.hidden = true;
}

function setActiveTab(tab) {
    const login = tab === "login";
    els.loginTab.classList.toggle("active", login);
    els.registerTab.classList.toggle("active", !login);
    els.loginForm.classList.toggle("hidden", !login);
    els.registerForm.classList.toggle("hidden", login);
}

function txBadge(status) {
    if (status === "SUCCESS") return "OK";
    if (status === "FAILED") return "FAILED";
    return "PENDING";
}

function txDate(input) {
    const value = new Date(input);
    return value.toLocaleString();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getPageFromUrl(url) {
    if (!url) return 1;
    try {
        const parsed = new URL(url, window.location.origin);
        return Number(parsed.searchParams.get("page")) || 1;
    } catch {
        return 1;
    }
}

function renderHistory(rows) {
    if (!rows.length) {
        els.historyBody.innerHTML = '<tr><td colspan="6" class="muted">No transactions found.</td></tr>';
        return;
    }

    els.historyBody.innerHTML = rows
        .map(
            (row) => `
            <tr>
                <td>${escapeHtml(row.reference_id)}</td>
                <td>${escapeHtml(row.sender || "-")}</td>
                <td>${escapeHtml(row.receiver || "-")}</td>
                <td>${formatMoney(row.amount)}</td>
                <td>${escapeHtml(txBadge(row.status))}</td>
                <td>${escapeHtml(txDate(row.timestamp))}</td>
            </tr>
        `
        )
        .join("");
}

function updatePager() {
    els.pageInfo.textContent = `Page ${state.currentPage}`;
    els.nextPage.disabled = !state.nextUrl;
    els.prevPage.disabled = !state.prevUrl;
}

async function loadBalance() {
    const res = await authFetch(`${API_BASE}/balance/`);
    if (!res.ok) {
        throw new Error("Could not load balance");
    }
    const data = await res.json();
    els.balanceValue.textContent = formatMoney(data.balance, data.currency || "USD");
}

async function loadTransactions(url = null) {
    const status = els.statusFilter.value;
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const target = url || `${API_BASE}/transactions/${query}`;

    const res = await authFetch(target);
    if (!res.ok) {
        throw new Error("Could not load transaction history");
    }

    const data = await res.json();
    renderHistory(data.results || []);
    state.nextUrl = data.next;
    state.prevUrl = data.previous;
    state.currentPage = getPageFromUrl(url || target);

    updatePager();
}

async function initDashboard() {
    switchToDashboard();
    await loadBalance();
    await loadTransactions();
}

els.loginTab.addEventListener("click", () => setActiveTab("login"));
els.registerTab.addEventListener("click", () => setActiveTab("register"));

els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.loginForm);
    const payload = {
        username: formData.get("username"),
        password: formData.get("password"),
    };

    const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        showToast(parseError(data), true);
        return;
    }

    setAuth(data.access, data.refresh);
    showToast("Logged in successfully.");
    els.loginForm.reset();
    try {
        await initDashboard();
    } catch {
        showToast("Login succeeded, but loading data failed.", true);
    }
});

els.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.registerForm);
    const payload = {
        username: formData.get("username"),
        email: formData.get("email"),
        first_name: formData.get("first_name"),
        last_name: formData.get("last_name"),
        password: formData.get("password"),
    };

    const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        showToast(parseError(data), true);
        return;
    }

    els.registerForm.reset();
    setActiveTab("login");
    showToast("Registration complete. You can now log in.");
});

els.depositForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.depositForm);
    const payload = { amount: formData.get("amount") };

    const res = await authFetch(`${API_BASE}/deposit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        showToast(parseError(data), true);
        return;
    }

    els.depositForm.reset();
    showToast(data.message || "Deposit successful.");
    await loadBalance();
    await loadTransactions();
});

els.transferForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(els.transferForm);
    const payload = {
        receiver_username: formData.get("receiver_username"),
        amount: formData.get("amount"),
    };

    const res = await authFetch(`${API_BASE}/transfer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
        showToast(parseError(data), true);
        return;
    }

    els.transferForm.reset();
    showToast(data.message || "Transfer sent.");
    await loadBalance();
    await loadTransactions();
});

els.statusFilter.addEventListener("change", async () => {
    try {
        await loadTransactions();
    } catch {
        showToast("Failed to apply filter.", true);
    }
});

els.refreshHistory.addEventListener("click", async () => {
    try {
        await loadTransactions();
        showToast("History refreshed.");
    } catch {
        showToast("Failed to refresh history.", true);
    }
});

els.nextPage.addEventListener("click", async () => {
    if (!state.nextUrl) return;
    try {
        await loadTransactions(state.nextUrl);
    } catch {
        showToast("Could not load next page.", true);
    }
});

els.prevPage.addEventListener("click", async () => {
    if (!state.prevUrl) return;
    try {
        await loadTransactions(state.prevUrl);
    } catch {
        showToast("Could not load previous page.", true);
    }
});

els.logoutBtn.addEventListener("click", () => {
    clearAuth();
    switchToAuth();
    showToast("Logged out.");
});

(async function bootstrap() {
    setActiveTab("login");
    if (!state.access) {
        switchToAuth();
        return;
    }

    try {
        await initDashboard();
    } catch {
        clearAuth();
        switchToAuth();
    }
})();
