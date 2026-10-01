// =====================================================
// MY BANK - SUPABASE CONFIGURATION
// =====================================================

const SUPABASE_URL =
    "https://kmscabqzmtxefpnzksqg.supabase.co";

const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttc2NhYnF6bXR4ZWZwbnprc3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDY0MzEsImV4cCI6MjEwNTU4MjQzMX0.0C8V-zMMgZFBuH6KP1MoW5-qBi21CnGqFrkFemNnWj0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// ELEMENTS
// =====================================================

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

const userName = document.getElementById("userName");
const balance = document.getElementById("balance");
const accountNumber = document.getElementById("accountNumber");

const logoutBtn = document.getElementById("logoutBtn");
const toggleBalanceBtn = document.getElementById("toggleBalanceBtn");

const transferBtn = document.getElementById("transferBtn");
const refreshBtn = document.getElementById("refreshBtn");
const refreshHistoryBtn = document.getElementById("refreshHistoryBtn");

const history = document.getElementById("history");


// =====================================================
// HELPERS
// =====================================================

function showLogin() {
    if (loginForm) loginForm.classList.remove("hidden");
    if (signupForm) signupForm.classList.add("hidden");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (signupMessage) {
        signupMessage.textContent = "";
    }
}


function showSignup() {
    if (loginForm) loginForm.classList.add("hidden");
    if (signupForm) signupForm.classList.remove("hidden");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    if (signupMessage) {
        signupMessage.textContent = "";
    }
}


function showDashboard() {
    if (authPage) {
        authPage.classList.add("hidden");
    }

    if (dashboardPage) {
        dashboardPage.classList.remove("hidden");
    }
}


function showAuth() {
    if (dashboardPage) {
        dashboardPage.classList.add("hidden");
    }

    if (authPage) {
        authPage.classList.remove("hidden");
    }
}


function formatMoney(amount) {
    const number = Number(amount || 0);

    return "₦" + number.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(date) {
    return new Date(date).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}


function escapeHTML(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// SWITCH LOGIN / SIGNUP
// =====================================================

if (showSignupBtn) {
    showSignupBtn.addEventListener("click", function () {
        showSignup();
    });
}


if (showLoginBtn) {
    showLoginBtn.addEventListener("click", function () {
        showLogin();
    });
}


// =====================================================
// SIGN UP
// =====================================================

if (signupForm) {

    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = signupName.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;

        if (!name || !email || !password) {
            signupMessage.textContent =
                "Please fill in all fields.";

            return;
        }

        if (password.length < 6) {
            signupMessage.textContent =
                "Password must be at least 6 characters.";

            return;
        }

        signupBtn.disabled = true;
        signupBtn.textContent = "Creating account...";
        signupMessage.textContent = "";

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


            if (data.user && !data.session) {

                signupMessage.textContent =
                    "Account created! Check your email to confirm your account.";

            } else {

                signupMessage.textContent =
                    "Account created successfully!";

                setTimeout(function () {
                    showDashboard();
                    loadDashboard();
                }, 1000);

            }

        } catch (error) {

            console.error("Signup error:", error);

            signupMessage.textContent =
                error.message || "Unable to create account.";

        } finally {

            signupBtn.disabled = false;
            signupBtn.textContent = "Create Account";

        }

    });

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {

            loginMessage.textContent =
                "Please enter your email and password.";

            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Signing in...";
        loginMessage.textContent = "";

        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,
                    password: password

                });


            if (error) {
                throw error;
            }


            if (data.session) {

                showDashboard();

                await loadDashboard();

            }

        } catch (error) {

            console.error("Login error:", error);

            loginMessage.textContent =
                error.message || "Unable to sign in.";

        } finally {

            loginBtn.disabled = false;
            loginBtn.textContent = "Sign In";

        }

    });

}


// =====================================================
// LOAD DASHBOARD
// =====================================================

async function loadDashboard() {

    try {

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient.auth.getSession();


        if (sessionError) {
            throw sessionError;
        }


        const session = sessionData.session;


        if (!session) {

            showAuth();

            return;
        }


        const user = session.user;


        // ---------------------------------------------
        // PROFILE
        // ---------------------------------------------

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();


        if (profileError) {
            console.error("Profile error:", profileError);
        }


        if (userName) {

            userName.textContent =
                profile?.full_name ||
                user.user_metadata?.full_name ||
                "User";

        }


        // ---------------------------------------------
        // BANK ACCOUNT
        // ---------------------------------------------

        const {
            data: account,
            error: accountError
        } = await supabaseClient
            .from("bank_accounts")
            .select("id, account_number, balance")
            .eq("user_id", user.id)
            .maybeSingle();


        if (accountError) {
            throw accountError;
        }


        if (account) {

            if (accountNumber) {
                accountNumber.textContent =
                    account.account_number;
            }

            if (balance) {
                balance.textContent =
                    formatMoney(account.balance);
            }

            await loadTransactions(account.id);

        } else {

            if (accountNumber) {
                accountNumber.textContent =
                    "No account";
            }

            if (balance) {
                balance.textContent =
                    "₦0.00";
            }

            if (history) {
                history.innerHTML =
                    "<p>No transactions yet.</p>";
            }

        }

    } catch (error) {

        console.error("Dashboard error:", error);

        if (history) {
            history.innerHTML =
                "<p>Unable to load account information.</p>";
        }

    }

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions(accountId) {

    if (!history) {
        return;
    }


    history.innerHTML =
        "<p>Loading transactions...</p>";


    try {

        const {
            data: transactions,
            error
        } = await supabaseClient
            .from("transactions")
            .select("*")
            .eq("account_id", accountId)
            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        if (!transactions || transactions.length === 0) {

            history.innerHTML =
                "<p>No transactions yet.</p>";

            return;
        }


        history.innerHTML = "";


        transactions.forEach(function (transaction) {

            const item =
                document.createElement("div");

            item.className =
                "transaction-item";


            const isCredit =
                transaction.type === "credit";


            item.innerHTML = `

                <div class="transaction-info">

                    <strong>
                        ${escapeHTML(
                            transaction.description ||
                            (isCredit ? "Money received" : "Payment")
                        )}
                    </strong>

                    <small>
                        ${formatDate(transaction.created_at)}
                    </small>

                </div>

                <div class="transaction-amount ${isCredit ? "credit" : "debit"}">

                    ${isCredit ? "+" : "-"}
                    ${formatMoney(transaction.amount)}

                </div>

            `;


            history.appendChild(item);

        });


    } catch (error) {

        console.error("Transaction error:", error);

        history.innerHTML =
            "<p>Unable to load transaction history.</p>";

    }

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        logoutBtn.disabled = true;

        try {

            const { error } =
                await supabaseClient.auth.signOut();


            if (error) {
                throw error;
            }


            showAuth();

            showLogin();

        } catch (error) {

            console.error("Logout error:", error);

        } finally {

            logoutBtn.disabled = false;

        }

    });

}


// =====================================================
// SHOW / HIDE BALANCE
// =====================================================

let balanceVisible = true;
let realBalance = null;


if (toggleBalanceBtn) {

    toggleBalanceBtn.addEventListener(
        "click",
        function () {

            if (!balance) {
                return;
            }


            if (balanceVisible) {

                realBalance =
                    balance.textContent;

                balance.textContent =
                    "₦ ••••••";

                balanceVisible = false;

            } else {

                balance.textContent =
                    realBalance || "₦0.00";

                balanceVisible = true;

            }

        }
    );

}


// =====================================================
// REFRESH
// =====================================================

if (refreshBtn) {

    refreshBtn.addEventListener("click", async function () {

        await loadDashboard();

    });

}


if (refreshHistoryBtn) {

    refreshHistoryBtn.addEventListener(
        "click",
        async function () {

            await loadDashboard();

        }
    );

}


// =====================================================
// TRANSFER
// =====================================================

if (transferBtn) {

    transferBtn.addEventListener("click", function () {

        alert(
            "Transfer system will be connected after we build the secure transfer system."
        );

    });

}


// =====================================================
// AUTH STATE
// =====================================================

supabaseClient.auth.onAuthStateChange(
    async function (event, session) {

        if (session) {

            showDashboard();

            await loadDashboard();

        } else {

            showAuth();

        }

    }
);


// =====================================================
// INITIAL CHECK
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            showAuth();

            return;
        }


        if (data.session) {

            showDashboard();

            await loadDashboard();

        } else {

            showAuth();

            showLogin();

        }

    }
);