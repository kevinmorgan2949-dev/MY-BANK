// ==========================================
// MY BANK — SUPABASE APP
// ==========================================

const SUPABASE_URL =
    "https://kmscabqzmtxefpnzksqg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_c6Yeg0U7pi82EekTOjhcRA_iscNJta-";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// ELEMENTS
// ==========================================

const authPage = document.getElementById("authPage");
const dashboardPage = document.getElementById("dashboardPage");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

const showSignupBtn = document.getElementById("showSignupBtn");
const showLoginBtn = document.getElementById("showLoginBtn");

const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");
const balance = document.getElementById("balance");
const accountNumber = document.getElementById("accountNumber");

const history = document.getElementById("history");

const refreshBtn = document.getElementById("refreshBtn");
const refreshHistoryBtn =
    document.getElementById("refreshHistoryBtn");

const toggleBalanceBtn =
    document.getElementById("toggleBalanceBtn");

const transferBtn =
    document.getElementById("transferBtn");


// ==========================================
// SHOW MESSAGE
// ==========================================

function setMessage(element, message, type = "") {

    if (!element) return;

    element.textContent = message;

    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}


// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

    if (authPage) {
        authPage.classList.remove("hidden");
    }

    if (dashboardPage) {
        dashboardPage.classList.add("hidden");
    }

    if (loginForm) {
        loginForm.classList.remove("hidden");
    }

    if (signupForm) {
        signupForm.classList.add("hidden");
    }
}


// ==========================================
// SHOW SIGNUP
// ==========================================

function showSignup() {

    if (authPage) {
        authPage.classList.remove("hidden");
    }

    if (dashboardPage) {
        dashboardPage.classList.add("hidden");
    }

    if (loginForm) {
        loginForm.classList.add("hidden");
    }

    if (signupForm) {
        signupForm.classList.remove("hidden");
    }
}


// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

    if (authPage) {
        authPage.classList.add("hidden");
    }

    if (dashboardPage) {
        dashboardPage.classList.remove("hidden");
    }
}


// ==========================================
// SIGN UP
// ==========================================

async function createAccount() {

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;

    if (!name || !email || !password) {

        setMessage(
            signupMessage,
            "Please fill in all fields.",
            "error"
        );

        return;
    }

    if (password.length < 6) {

        setMessage(
            signupMessage,
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = "Creating account...";

    try {

        const { data, error } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {
                    data: {
                        full_name: name
                    }
                }

            });

        if (error) {
            throw error;
        }

        signupName.value = "";
        signupEmail.value = "";
        signupPassword.value = "";

        if (!data.session) {

            setMessage(
                signupMessage,
                "Account created. Check your email to confirm your account.",
                "success"
            );

        } else {

            setMessage(
                signupMessage,
                "Account created successfully!",
                "success"
            );

            await loadDashboard();
        }

    } catch (error) {

        console.error(error);

        setMessage(
            signupMessage,
            error.message || "Unable to create account.",
            "error"
        );

    } finally {

        signupBtn.disabled = false;
        signupBtn.textContent = "Create Account";
    }
}


// ==========================================
// LOGIN
// ==========================================

async function login() {

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {

        setMessage(
            loginMessage,
            "Enter your email and password.",
            "error"
        );

        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {

        const { error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });

        if (error) {
            throw error;
        }

        loginEmail.value = "";
        loginPassword.value = "";

        await loadDashboard();

    } catch (error) {

        console.error(error);

        setMessage(
            loginMessage,
            error.message || "Unable to sign in.",
            "error"
        );

    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
    }
}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {

        showLogin();

        return;
    }

    showDashboard();

    await loadUserData(user);
    await loadTransactions();
}


// ==========================================
// LOAD USER DATA
// ==========================================

async function loadUserData(user) {

    try {

        const { data: profile, error: profileError } =
            await supabaseClient
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();

        if (profileError) {
            throw profileError;
        }

        if (userName) {

            userName.textContent =
                profile.full_name || "My Bank User";
        }


        const { data: account, error: accountError } =
            await supabaseClient
                .from("bank_accounts")
                .select("account_number, balance")
                .eq("user_id", user.id)
                .single();

        if (accountError) {
            throw accountError;
        }

        if (accountNumber) {

            accountNumber.textContent =
                account.account_number;
        }

        if (balance) {

            balance.textContent =
                formatMoney(account.balance);
        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


// ==========================================
// LOAD TRANSACTIONS
// ==========================================

async function loadTransactions() {

    if (!history) return;

    history.innerHTML =
        '<div class="empty-state">Loading transactions...</div>';

    try {

        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

        if (!user) return;


        const { data: account, error: accountError } =
            await supabaseClient
                .from("bank_accounts")
                .select("id")
                .eq("user_id", user.id)
                .single();

        if (accountError) {
            throw accountError;
        }


        const { data: transactions, error } =
            await supabaseClient
                .from("transactions")
                .select(
                    "id, type, amount, description, created_at"
                )
                .eq("account_id", account.id)
                .order("created_at", {
                    ascending: false
                })
                .limit(20);

        if (error) {
            throw error;
        }


        if (!transactions || transactions.length === 0) {

            history.innerHTML =
                '<div class="empty-state">No transactions yet.</div>';

            return;
        }


        history.innerHTML = "";

        transactions.forEach(transaction => {

            const item =
                document.createElement("div");

            item.className =
                "transaction-item";

            const sign =
                transaction.type === "credit"
                    ? "+"
                    : "-";

            item.innerHTML = `
                <div>
                    <strong>
                        ${escapeHTML(
                            transaction.description ||
                            "Transaction"
                        )}
                    </strong>

                    <small>
                        ${formatDate(
                            transaction.created_at
                        )}
                    </small>
                </div>

                <strong class="${
                    transaction.type === "credit"
                        ? "credit"
                        : "debit"
                }">
                    ${sign}${formatMoney(
                        transaction.amount
                    )}
                </strong>
            `;

            history.appendChild(item);
        });

    } catch (error) {

        console.error(
            "Transaction error:",
            error
        );

        history.innerHTML =
            '<div class="empty-state">Unable to load transactions.</div>';
    }
}


// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(Number(amount) || 0);
}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date) {

    return new Date(date).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


// ==========================================
// SECURITY HELPER
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ==========================================
// LOGOUT
// ==========================================

async function logout() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {

        alert(error.message);

        return;
    }

    showLogin();
}


// ==========================================
// BALANCE VISIBILITY
// ==========================================

let balanceVisible = true;

if (toggleBalanceBtn) {

    toggleBalanceBtn.addEventListener(
        "click",
        () => {

            if (!balance) return;

            balanceVisible = !balanceVisible;

            if (balanceVisible) {

                balance.style.filter = "none";

                toggleBalanceBtn.textContent =
                    "Hide";

            } else {

                balance.style.filter =
                    "blur(8px)";

                toggleBalanceBtn.textContent =
                    "Show";
            }
        }
    );
}


// ==========================================
// BUTTON EVENTS
// ==========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            login();
        }
    );
}


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            createAccount();
        }
    );
}


if (showSignupBtn) {

    showSignupBtn.addEventListener(
        "click",
        showSignup
    );
}


if (showLoginBtn) {

    showLoginBtn.addEventListener(
        "click",
        showLogin
    );
}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logout
    );
}


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        loadDashboard
    );
}


if (refreshHistoryBtn) {

    refreshHistoryBtn.addEventListener(
        "click",
        loadTransactions
    );
}


if (transferBtn) {

    transferBtn.addEventListener(
        "click",
        () => {

            alert(
                "Transfer system will be connected after we build the secure transfer system."
            );

        }
    );
}


// ==========================================
// AUTH STATE
// ==========================================

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        if (session) {

            await loadDashboard();

        } else {

            showLogin();
        }
    }
);


// ==========================================
// START APP
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (session) {

            await loadDashboard();

        } else {

            showLogin();
        }

    }
);