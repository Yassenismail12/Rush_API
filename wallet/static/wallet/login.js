const API_BASE = "/api/wallet";

const form = document.getElementById("login-form");
const toast = document.getElementById("toast");

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.add("show");
    toast.classList.toggle("error", isError);
    setTimeout(() => toast.classList.remove("show"), 2200);
}

function setAuth(access, refresh) {
    localStorage.setItem("rush_access", access || "");
    localStorage.setItem("rush_refresh", refresh || "");
}

async function tryExistingSession() {
    const access = localStorage.getItem("rush_access");
    if (!access) return;

    const res = await fetch(`${API_BASE}/profile/`, {
        headers: { Authorization: `Bearer ${access}` },
    });

    if (res.ok) {
        window.location.href = "/profile/";
    }
}

function parseError(payload) {
    if (!payload) return "Login failed.";
    if (payload.detail) return payload.detail;
    const first = Object.values(payload)[0];
    if (Array.isArray(first)) return first[0];
    return "Login failed.";
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: data.get("username"),
            password: data.get("password"),
        }),
    });

    const payload = await res.json();
    if (!res.ok) {
        showToast(parseError(payload), true);
        return;
    }

    setAuth(payload.access, payload.refresh);
    window.location.href = "/profile/";
});

tryExistingSession().catch(() => {});
