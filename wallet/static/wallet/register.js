const API_BASE = "/api/wallet";

const form = document.getElementById("register-form");
const toast = document.getElementById("toast");

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.add("show");
    toast.classList.toggle("error", isError);
    setTimeout(() => toast.classList.remove("show"), 2200);
}

function parseError(payload) {
    if (!payload) return "Registration failed.";
    if (payload.detail) return payload.detail;
    const first = Object.values(payload)[0];
    if (Array.isArray(first)) return first[0];
    return "Registration failed.";
}

function setAuth(access, refresh) {
    localStorage.setItem("rush_access", access || "");
    localStorage.setItem("rush_refresh", refresh || "");
}

async function loginAfterRegister(username, password) {
    const res = await fetch(`${API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const payload = await res.json();
    if (!res.ok) {
        throw new Error(parseError(payload));
    }

    setAuth(payload.access, payload.refresh);
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const payload = {
        username: data.get("username"),
        email: data.get("email"),
        first_name: data.get("first_name"),
        last_name: data.get("last_name"),
        password: data.get("password"),
    };

    const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const result = await res.json();
    if (!res.ok) {
        showToast(parseError(result), true);
        return;
    }

    try {
        await loginAfterRegister(payload.username, payload.password);
        window.location.href = "/profile/";
    } catch (error) {
        showToast(error.message, true);
    }
});
