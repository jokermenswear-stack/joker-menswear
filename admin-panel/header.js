document.getElementById("header-container").innerHTML = `
<header class="admin-header">

    <div class="logo">
        🃏 Joker Menswear Admin
    </div>

    <nav class="admin-nav">

        <a href="dashboard.html" id="nav-dashboard">🏠 Dashboard</a>

        <a href="products.html" id="nav-products">📦 Products</a>

        <a href="orders.html" id="nav-orders">📋 Orders</a>

        <a href="stock.html" id="nav-stock">📊 Stock</a>

        <a href="admin-payment.html" id="nav-payments">💳 Payments</a>

    </nav>

    <button id="logoutBtn">🚪 Logout</button>

</header>
`;

// Highlight current page
const page = window.location.pathname.split("/").pop();

if (page === "dashboard.html") {
    document.getElementById("nav-dashboard").classList.add("active");
}
else if (
    page === "products.html" ||
    page === "add-product.html" ||
    page === "edit-product.html"
) {
    document.getElementById("nav-products").classList.add("active");
}
else if (
    page === "orders.html" ||
    page === "order-details.html"
) {
    document.getElementById("nav-orders").classList.add("active");
}
else if (page === "stock.html") {
    document.getElementById("nav-stock").classList.add("active");
}
else if (page === "admin-payment.html") {
    document.getElementById("nav-payments").classList.add("active");
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    if (confirm("Are you sure you want to logout?")) {

        localStorage.removeItem("adminLoggedIn");

        window.location.href = "admin.html";

    }

});