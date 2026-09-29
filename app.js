// ========================================
// SUPABASE CONNECTION
// ========================================

const SUPABASE_URL =
    "https://kmscabqzmtxefpnzksqg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_c6Yeg0U7pi82EekTOjhcRA_iscNJta-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ========================================
// APP VARIABLES
// ========================================

let currentUser = null;
let currentAccount = null;
let balanceVisible = true;


// ========================================
// ELEMENTS
// ========================================

const authPage =
    document.getElementById("authPage");

const dashboardPage =
    document.getElementById("dashboardPage");

const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");


// ========================================
// LOGIN
// ========================================

document
    .getElementById("loginBtn")
    .addEventListener("click", login);


async function login() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const message =
        document.getElementById("loginMessage");


    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        message.className =
            "message error";

        return;
    }


    message.textContent =
        "Logging in...";

    message.className =
        "message";


    const { data, error } =
        await supabaseClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });


    if (error) {

        message.textContent =
            error.message;

        message.className =
            "message error";

        return;
    }


    currentUser = data.user;

    message.textContent = "";

    await loadDashboard();
}


// ========================================
// SIGN UP
// ========================================

document
    .getElementById("signupBtn")
    .addEventListener("click", signup);


async function signup() {

    const fullName =
        document
            .getElementById("signupName")
            .value
            .trim();

    const email =
        document
            .getElementById("signupEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            .value;

    const message =
        document.getElementById("signupMessage");


    if (!fullName || !email || !password) {

        message.textContent =
            "Please fill in all fields.";

        message.className =
            "message error";

        return;
    }


    if (password.length < 6) {

        message.textContent =
            "Password must be at least 6 characters.";

        message.className =
            "message error";

        return;
    }


    message.textContent =
        "Creating your account...";

    message.className =
        "message";


    const { data, error } =
        await supabaseClient.auth
            .signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        full_name: fullName
                    }

                }

            });


    if (error) {

        message.textContent =
            error.message;

        message.className =
            "message error";

        return;
    }


    if (!data.session) {

        message.textContent =
            "Account created. Check your email to confirm your account.";

        message.className =
            "message success";

        return;
    }


    currentUser = data.user;

    message.textContent = "";

    await loadDashboard();
}


// ========================================
// LOAD DASHBOARD
// ========================================

async function loadDashboard() {

    if (!currentUser) return;


    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", currentUser.id)
            .single();


    if (profileError) {

        console.error(profileError);

        alert(
            "Could not load your profile."
        );

        return;
    }


    const { data: account, error: accountError } =
        await supabaseClient
            .from("bank_accounts")
            .select(
                "id, account_number, balance"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .single();


    if (accountError) {

        console.error(accountError);

        alert(
            "Could not load your bank account."
        );

        return;
    }


    currentAccount = account;


    document
        .getElementById("userName")
        .textContent =
        profile.full_name || "User";


    document
        .getElementById("accountNumber")
        .textContent =
        account.account_number;


    updateBalance();


    authPage
        .classList
        .add("hidden");

    dashboardPage
        .classList
        .remove("hidden");


    await loadTransactions();
}


// ========================================
// BALANCE
// ========================================

function updateBalance() {

    const balanceElement =
        document.getElementById("balance");


    if (!currentAccount) {

        balanceElement.textContent =
            "₦0.00";

        return;
    }


    if (!balanceVisible) {

        balanceElement.textContent =
            "₦••••••";

        return;
    }


    const amount =
        Number(
            currentAccount.balance || 0
        );


    balanceElement.textContent =
        "₦" +
        amount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


// ========================================
// SHOW / HIDE BALANCE
// ========================================

document
    .getElementById("toggleBalanceBtn")
    .addEventListener(
        "click",
        () => {

            balanceVisible =
                !balanceVisible;

            updateBalance();

        }
    );


// ========================================
// TRANSACTIONS
// ========================================

async function loadTransactions() {

    const history =
        document.getElementById("history");


    history.innerHTML =
        '<div class="empty">Loading transactions...</div>';


    const { data, error } =
        await supabaseClient
            .from("transactions")
            .select(
                "id, type, amount, description, created_at"
            )
            .eq(
                "account_id",
                currentAccount.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(10);


    if (error) {

        console.error(error);

        history.innerHTML =
            '<div class="empty">Unable to load transactions.</div>';

        return;
    }


    if (!data || data.length === 0) {

        history.innerHTML =
            '<div class="empty">No transactions yet.</div>';

        return;
    }


    history.innerHTML = "";


    data.forEach(transaction => {

        const item =
            document.createElement("div");

        item.className =
            "transaction";


        const sign =
            transaction.type === "credit"
                ? "+"
                : "-";


        const amount =
            Number(transaction.amount)
                .toLocaleString(
                    "en-NG",
                    {
                        minimumFractionDigits: 2
                    }
                );


        const date =
            new Date(
                transaction.created_at
            ).toLocaleString(
                "en-NG",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );


        item.innerHTML = `

            <div>

                <strong>
                    ${escapeHTML(
                        transaction.description ||
                        "Transaction"
                    )}
                </strong>

                <small>
                    ${date}
                </small>

            </div>

            <span class="${transaction.type}">
                ${sign}₦${amount}
            </span>

        `;


        history.appendChild(item);

    });
}


// ========================================
// REFRESH ACCOUNT
// ========================================

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        refreshAccount
    );


document
    .getElementById("refreshHistoryBtn")
    .addEventListener(
        "click",
        refreshAccount
    );


async function refreshAccount() {

    if (!currentUser) return;


    const { data: account, error } =
        await supabaseClient
            .from("bank_accounts")
            .select(
                "id, account_number, balance"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .single();


    if (error) {

        alert(
            "Unable to refresh account."
        );

        return;
    }


    currentAccount = account;

    updateBalance();

    await loadTransactions();
}


// ========================================
// LOGOUT
// ========================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        logout
    );


async function logout() {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentAccount = null;


    dashboardPage
        .classList
        .add("hidden");

    authPage
        .classList
        .remove("hidden");


    document
        .getElementById("loginEmail")
        .value = "";

    document
        .getElementById("loginPassword")
        .value = "";
}


// ========================================
// SWITCH LOGIN / SIGNUP
// ========================================

document
    .getElementById("showSignupBtn")
    .addEventListener(
        "click",
        () => {

            loginForm
                .classList
                .add("hidden");

            signupForm
                .classList
                .remove("hidden");

        }
    );


document
    .getElementById("showLoginBtn")
    .addEventListener(
        "click",
        () => {

            signupForm
                .classList
                .add("hidden");

            loginForm
                .classList
                .remove("hidden");

        }
    );


// ========================================
// TRANSFER MODAL
// ========================================

document
    .getElementById("transferBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("transferModal")
                .classList
                .remove("hidden");

        }
    );


document
    .getElementById("closeTransferBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("transferModal")
                .classList
                .add("hidden");

        }
    );


// ========================================
// TRANSFER
// ========================================

document
    .getElementById("sendTransferBtn")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("transferMessage")
                .textContent =
                "Transfer system will be connected next.";

        }
    );


// ========================================
// CHECK EXISTING SESSION
// ========================================

async function checkSession() {

    const { data } =
        await supabaseClient.auth
            .getSession();


    if (data.session) {

        currentUser =
            data.session.user;

        await loadDashboard();

    }

}


// ========================================
// HTML SAFETY
// ========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ========================================
// START APP
// ========================================

checkSession();