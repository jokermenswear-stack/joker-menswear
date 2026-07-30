const API = "https://joker-menswear.onrender.com";
const socket = io("https://joker-menswear.onrender.com");
socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

socket.on("new-order", (data) => {
    console.log("NEW ORDER RECEIVED:", data);
});

if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

const notificationSound = new Audio("/sounds/notification.mp3");

// Sound will be enabled after clicking the bell once
let soundEnabled = false;

function getStatusColor(status) {
    switch(status) {
        case "Pending": return "#FFA500";
        case "Confirmed": return "#2196F3";
        case "Packed": return "#9C27B0";
        case "Shipped": return "#03A9F4";
        case "Delivered": return "#4CAF50";
        case "Cancelled": return "#F44336";
        case "Out of Stock": return "#795548";
        case "Payment Failed": return "#E91E63";
        case "Return Requested": return "#FF9800";
        case "Returned": return "#607D8B";
        default: return "#666";
    }
}

function loadOrders() {

    fetch(API + "/api/orders")
        .then(res => res.json())
        .then(orders => {

            const orderList = document.getElementById("orderList");
            orderList.innerHTML = "";

            orders.forEach(order => {

                orderList.innerHTML += `
<tr>
    <td>${order.id}</td>
    <td>${order.customer_name}</td>
    <td>${order.phone}</td>
    <td>₹ ${order.total}</td>

    <td>
    <select class="status-dropdown"
            style="background:${getStatusColor(order.status)}; color:white;"
            onchange="updateStatus(${order.id}, this.value)">

        <option ${order.status=="Pending"?"selected":""}>Pending</option>
        <option ${order.status=="Confirmed"?"selected":""}>Confirmed</option>
        <option ${order.status=="Packed"?"selected":""}>Packed</option>
        <option ${order.status=="Shipped"?"selected":""}>Shipped</option>
        <option ${order.status=="Delivered"?"selected":""}>Delivered</option>
        <option ${order.status=="Cancelled"?"selected":""}>Cancelled</option>
        <option ${order.status=="Out of Stock"?"selected":""}>Out of Stock</option>
        <option ${order.status=="Payment Failed"?"selected":""}>Payment Failed</option>
        <option ${order.status=="Return Requested"?"selected":""}>Return Requested</option>
        <option ${order.status=="Returned"?"selected":""}>Returned</option>

    </select>
</td>

    <td>${order.created_at}</td>

    <td>
        <button onclick="viewOrder(${order.id})">View</button>
    </td>
</tr>
`;
            });

        })
        .catch(error => {
            console.log("Order Error:", error);
        });

}

function updateStatus(id, status) {

    if (status === "Shipped") {
        const confirmStock = confirm(
            "This order will reduce stock automatically. Do you want to continue?"
        );

        if (!confirmStock) {
            loadOrders();
            return;
        }
    }

    fetch(API + "/api/orders/" + id + "/status", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            status: status
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Order Status Updated");
        loadOrders();
    })
    .catch(err => {
        console.log("Status Update Error:", err);
    });
}

function viewOrder(id) {

    window.location.href = "order-details.html?id=" + id;

}
loadOrders();

// Auto refresh every 3 seconds (temporary test)
setInterval(loadOrders, 3000);

let unreadCount = 0;

// New order notification
socket.on("new-order", (data) => {

    // Play sound only if enabled
    if (soundEnabled) {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(err => console.log(err));
    }

    unreadCount++;

    const count = document.getElementById("notificationCount");
    count.style.display = "inline-block";
    count.innerText = unreadCount;

    if (Notification.permission === "granted") {
        new Notification("🛒 New Order", {
            body: "Customer: " + data.customer
        });
    } else {
        alert("🔔 New Order Received!\nCustomer: " + data.customer);
    }

    loadOrders();

});

// Notification bell click
document.getElementById("notificationBell").addEventListener("click", async () => {

    // Enable sound permanently for this page
    if (!soundEnabled) {
        try {
            await notificationSound.play();
            notificationSound.pause();
            notificationSound.currentTime = 0;

            soundEnabled = true;

            alert("Order notification sound enabled!");
        } catch (err) {
            alert("Please allow audio in your browser.");
        }
    }

    // Reset unread count
    unreadCount = 0;

    const count = document.getElementById("notificationCount");
    count.style.display = "none";
    count.innerText = "0";

});