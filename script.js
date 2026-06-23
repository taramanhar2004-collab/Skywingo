/* =========================
   TIRANGA GAMING PRO SCRIPT
========================= */

/* ---------- DEFAULT DEMO USER ----------
   Agar login system nahi bana hai to demo user create ho jayega.
   Agar tumhara khud ka login system hai to isko use mat karo / adjust kar lo.
--------------------------------------- */
function ensureDemoUser() {
  let user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) {
    const demoUser = {
      name: "Player",
      email: "player@example.com",
      coins: 0,
      lastBonusDate: "",
      rank: "Bronze"
    };
    localStorage.setItem("loggedInUser", JSON.stringify(demoUser));
  }
}

/* ---------- GET USER ---------- */
function getLoggedInUser() {
  return JSON.parse(localStorage.getItem("loggedInUser")) || null;
}

/* ---------- SAVE USER ---------- */
function saveLoggedInUser(user) {
  localStorage.setItem("loggedInUser", JSON.stringify(user));
}

/* ---------- AUTH CHECK ---------- */
function checkAuth() {
  ensureDemoUser();

  const user = getLoggedInUser();
  if (!user) {
    showToast("Login required");
    return;
  }
}

/* ---------- RANK SYSTEM ---------- */
function getRankByCoins(coins) {
  if (coins >= 5000) return "Legend";
  if (coins >= 2500) return "Diamond";
  if (coins >= 1200) return "Platinum";
  if (coins >= 700) return "Gold";
  if (coins >= 300) return "Silver";
  return "Bronze";
}

/* ---------- LOAD DASHBOARD ---------- */
function loadDashboard() {
  const user = getLoggedInUser();
  if (!user) return;

  // rank update
  user.rank = getRankByCoins(Number(user.coins || 0));
  saveLoggedInUser(user);

  // topbar / sidebar / profile
  setText("dashUser", user.name || "Player");
  setText("sideUserName", user.name || "Player");

  setText("walletBalance", user.coins || 0);

  setText("profileName", user.name || "Player");
  setText("profileEmail", user.email || "example@gmail.com");
  setText("profileCoins", user.coins || 0);
  setText("profileRank", user.rank || "Bronze");

  // cards
  setText("cardCoins", user.coins || 0);
  setText("rankCard", user.rank || "Bronze");

  // hero stats
  setText("gamesCount", "6");
  setText("bonusCount", "50");
  setText("rankText", user.rank || "Bronze");
}

/* ---------- SET SIDEBAR USER ---------- */
function setSidebarUser() {
  const user = getLoggedInUser();
  if (!user) return;
  setText("sideUserName", user.name || "Player");
}

/* ---------- CLAIM DAILY BONUS ---------- */
function claimDailyBonus() {
  const user = getLoggedInUser();
  if (!user) {
    showToast("User not found");
    return;
  }

  const today = new Date().toDateString();

  if (user.lastBonusDate === today) {
    showToast("Aaj ka bonus already claim ho chuka hai");
    return;
  }

  user.coins = Number(user.coins || 0) + 50;
  user.lastBonusDate = today;
  user.rank = getRankByCoins(user.coins);

  saveLoggedInUser(user);
  loadDashboard();

  showToast("Daily bonus claimed! +50 Coins");
}

/* ---------- LOGOUT ---------- */
function logoutUser() {
  // Agar tum real login page banaoge to redirect kar sakte ho
  // फिलहाल demo reset logout
  localStorage.removeItem("loggedInUser");
  showToast("Logged out successfully");

  setTimeout(() => {
    location.reload();
  }, 900);
}

/* ---------- TOAST ---------- */
function showToast(message = "Notification") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* ---------- MOBILE SIDEBAR TOGGLE ---------- */
function toggleSidebar() {
  const nav = document.querySelector(".side-nav");
  if (nav) {
    nav.classList.toggle("collapsed");
  }
}

/* ---------- HELPER ---------- */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ---------- OPTIONAL: DEMO COINS ADD ----------
   Browser console me test ke liye:
   addCoins(100)
---------------------------------------------- */
function addCoins(amount = 0) {
  const user = getLoggedInUser();
  if (!user) return;

  user.coins = Number(user.coins || 0) + Number(amount || 0);
  user.rank = getRankByCoins(user.coins);
  saveLoggedInUser(user);
  loadDashboard();

  showToast(amount + " coins added");
}

/* ---------- OPTIONAL: RESET USER ----------
   Browser console me test ke liye:
   resetUserData()
---------------------------------------------- */
function resetUserData() {
  localStorage.removeItem("loggedInUser");
  ensureDemoUser();
  loadDashboard();
  showToast("User data reset");
}

/* ---------- PAGE INIT ---------- */
window.addEventListener("load", () => {
  checkAuth();
  loadDashboard();
  setSidebarUser();
});
/* =========================
   WALLET + GAMES PAGE LOGIC
========================= */

function getTransactions() {
  return JSON.parse(localStorage.getItem("walletTransactions")) || [];
}

function saveTransactions(list) {
  localStorage.setItem("walletTransactions", JSON.stringify(list));
}

function addTransaction(type, amount, title) {
  const transactions = getTransactions();
  transactions.unshift({
    type,
    amount,
    title,
    date: new Date().toLocaleString()
  });
  saveTransactions(transactions);
}

/* override addCoins with transaction support */
const __oldAddCoins = addCoins;
addCoins = function(amount = 0) {
  const user = getLoggedInUser();
  if (!user) return;

  user.coins = Number(user.coins || 0) + Number(amount || 0);
  user.rank = getRankByCoins(user.coins);
  saveLoggedInUser(user);

  addTransaction("plus", amount, "Coins Added");
  loadDashboard();
  loadWalletPage();
  loadGamesPage();
  showToast(amount + " coins added");
};

/* bonus me transaction */
const __oldClaimDailyBonus = claimDailyBonus;
claimDailyBonus = function() {
  const user = getLoggedInUser();
  if (!user) {
    showToast("User not found");
    return;
  }

  const today = new Date().toDateString();
  if (user.lastBonusDate === today) {
    showToast("Aaj ka bonus already claim ho chuka hai");
    return;
  }

  user.coins = Number(user.coins || 0) + 50;
  user.lastBonusDate = today;
  user.rank = getRankByCoins(user.coins);
  saveLoggedInUser(user);

  addTransaction("plus", 50, "Daily Bonus Claimed");

  loadDashboard();
  loadWalletPage();
  loadGamesPage();
  showToast("Daily bonus claimed! +50 Coins");
};

/* withdraw request */
function requestWithdraw() {
  const user = getLoggedInUser();
  if (!user) {
    showToast("User not found");
    return;
  }

  const upiInput = document.getElementById("upiId");
  const coinInput = document.getElementById("withdrawCoins");

  const upiId = upiInput ? upiInput.value.trim() : "";
  const coins = coinInput ? Number(coinInput.value || 0) : 500;

  if (!upiId) {
    showToast("UPI ID enter karo");
    return;
  }

  if (!coins || coins < 500) {
    showToast("Minimum 500 coins withdraw kar sakte ho");
    return;
  }

  if (Number(user.coins || 0) < coins) {
    showToast("Wallet me itne coins nahi hain");
    return;
  }

  user.coins = Number(user.coins || 0) - coins;
  user.rank = getRankByCoins(user.coins);
  saveLoggedInUser(user);

  addTransaction("minus", coins, "Withdraw Request");

  if (upiInput) upiInput.value = "";
  if (coinInput) coinInput.value = "";

  loadDashboard();
  loadWalletPage();
  loadGamesPage();
  showToast("Withdraw request submitted");
}

/* wallet page load */
function loadWalletPage() {
  const user = getLoggedInUser();
  if (!user) return;

  setText("walletPageBalance", user.coins || 0);
  setText("walletCoinsCard", user.coins || 0);
  setText("walletRankCard", user.rank || "Bronze");

  renderTransactions();
}

/* games page load */
function loadGamesPage() {
  const user = getLoggedInUser();
  if (!user) return;

  setText("gamesWalletBalance", user.coins || 0);
  setText("gamesCoinsCard", user.coins || 0);
  setText("gamesRankCard", user.rank || "Bronze");
}

/* transaction render */
function renderTransactions() {
  const box = document.getElementById("transactionList");
  if (!box) return;

  const transactions = getTransactions();

  if (!transactions.length) {
    box.innerHTML = `
      <div class="transaction-item">
        <div class="transaction-left">
          <div class="transaction-icon">📄</div>
          <div class="transaction-meta">
            <h4>No Transactions Yet</h4>
            <p>Abhi wallet history empty hai</p>
          </div>
        </div>
        <div class="transaction-amount plus">0</div>
      </div>
    `;
    return;
  }

  box.innerHTML = transactions.map(item => `
    <div class="transaction-item">
      <div class="transaction-left">
        <div class="transaction-icon">${item.type === "plus" ? "💚" : "🏦"}</div>
        <div class="transaction-meta">
          <h4>${item.title}</h4>
          <p>${item.date}</p>
        </div>
      </div>
      <div class="transaction-amount ${item.type}">
        ${item.type === "plus" ? "+" : "-"}${item.amount}
      </div>
    </div>
  `).join("");
}