console.log("Dashboard JS loaded");

const API = "https://joker-menswear-backend.onrender.com";

function loadDashboard() {

    fetch(API + "/api/orders")
        .then(res => res.json())
        .then(orders => {

            // Total Orders
            const totalOrders = orders.length;

            // Pending Orders
            const pendingOrders = orders.filter(order =>
                order.status === "Pending"
            ).length;

            // Confirmed Orders
            const confirmedOrders = orders.filter(order =>
                order.status === "Confirmed"
            ).length;

            // Packed Orders
            const packedOrders = orders.filter(order =>
                order.status === "Packed"
            ).length;

            // Shipped Orders
            const shippedOrders = orders.filter(order =>
                order.status === "Shipped"
            ).length;

            // Delivered Orders
            const deliveredOrders = orders.filter(order =>
                order.status === "Delivered"
            ).length;

            // Cancelled Orders
            const cancelledOrders = orders.filter(order =>
                order.status === "Cancelled"
            ).length;

            // Total Revenue (only Delivered orders)
            const totalRevenue = orders
                .filter(order => order.status === "Delivered")
                .reduce((sum, order) => {
                    return sum + Number(order.total || 0);
                }, 0);

            // Update Dashboard Cards
            document.getElementById("totalOrders").innerText = totalOrders;
            document.getElementById("pendingOrders").innerText = pendingOrders;
            document.getElementById("confirmedOrders").innerText = confirmedOrders;
            document.getElementById("packedOrders").innerText = packedOrders;
            document.getElementById("shippedOrders").innerText = shippedOrders;
            document.getElementById("deliveredOrders").innerText = deliveredOrders;
            document.getElementById("cancelledOrders").innerText = cancelledOrders;
            document.getElementById("totalRevenue").innerText = "₹ " + totalRevenue;

        })
        .catch(error => {
            console.log("Dashboard Error:", error);
        });

}

// Load dashboard immediately
loadDashboard();

// Auto refresh every 5 seconds
setInterval(loadDashboard, 5000);

// Load current store status
function loadStoreStatus() {

    fetch(API + "/api/store-status")
        .then(res => res.json())
        .then(data => {

            const statusText = document.getElementById("storeStatusText");
            const toggleBtn = document.getElementById("storeToggleBtn");

            if (data.store_open == 1) {
                statusText.innerText = "🟢 Store is Open";
                toggleBtn.innerText = "Close Store";
            } else {
                statusText.innerText = "🔴 Store is Closed";
                toggleBtn.innerText = "Open Store";
            }
        });
}

// Toggle store open/close
function toggleStore() {

    fetch(API + "/api/store-status/toggle", {
        method: "PUT"
    })
    .then(res => res.json())
    .then(data => {

        alert(data.message);
        loadStoreStatus();

    });
}

// Load store status when dashboard opens
loadStoreStatus();

// Load pending payment verification count

function loadPaymentCount(){

    fetch(API + "/api/payments/pending")
    .then(res => res.json())
    .then(data => {

        const count = data.payments.length;

        document.getElementById("paymentCount").innerText =
        "(" + count + ")";

    })
    .catch(error => {
        console.log("Payment count error:", error);
    });

}


// Load immediately
loadPaymentCount();

// Auto refresh every 5 seconds
setInterval(loadPaymentCount, 5000);