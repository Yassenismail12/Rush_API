const API_BASE = "/api/wallet";

const state = {
    access: localStorage.getItem("rush_access") || "",
    refresh: localStorage.getItem("rush_refresh") || "",
    currentPage: 1,
    nextUrl: null,
    prevUrl: null,
};

const els = {
    logoutBtn: document.getElementById("logout-btn"),
    profileName: document.getElementById("profile-name"),
    profileUsername: document.getElementById("profile-username"),
    profileEmail: document.getElementById("profile-email"),
    profileSubtitle: document.getElementById("profile-subtitle"),
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

function goToLogin() {
    window.location.href = "/login/";
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

function txBadge(status) {
    if (status === "SUCCESS") return "OK";
    if (status === "FAILED") return "FAILED";
    return "PENDING";
}

function txBadgeClass(status) {
    if (status === "SUCCESS") return "status-pill success";
    if (status === "FAILED") return "status-pill failed";
    return "status-pill pending";
}

function txDate(input) {
    return new Date(input).toLocaleString();
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
                <td><span class="${escapeHtml(txBadgeClass(row.status))}">${escapeHtml(txBadge(row.status))}</span></td>
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

async function loadProfile() {
    const res = await authFetch(`${API_BASE}/profile/`);
    if (!res.ok) {
        throw new Error("Could not load profile");
    }

    const data = await res.json();
    const user = data.user || {};
    const wallet = data.wallet || {};
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    els.profileName.textContent = fullName || user.username || "User";
    els.profileUsername.textContent = user.username || "-";
    els.profileEmail.textContent = user.email || "-";
    els.profileSubtitle.textContent = `@${user.username || "user"}`;
    els.balanceValue.textContent = formatMoney(wallet.balance, wallet.currency || "USD");
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

async function loadBalance() {
    const res = await authFetch(`${API_BASE}/balance/`);
    if (!res.ok) {
        throw new Error("Could not load balance");
    }
    const data = await res.json();
    els.balanceValue.textContent = formatMoney(data.balance, data.currency || "USD");
}

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
    goToLogin();
});

(async function bootstrap() {
    if (!state.access) {
        goToLogin();
        return;
    }

    try {
        await loadProfile();
        await loadTransactions();
    } catch {
        clearAuth();
        goToLogin();
    }
})();
