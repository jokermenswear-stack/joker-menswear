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

const notificationSound = new Audio("https://joker-menswear.onrender.com/sounds/notification.mp3");

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
    <td>
        <input type="checkbox" class="orderCheck" value="${order.id}">
    </td>
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

    <button onclick="viewOrder(${order.id})">
        View
    </button>


    ${
    order.status === "Pending"
    ?
    `
   <button
onclick="acceptOrder(${order.id}, this)"
style="background:green;margin-left:5px;">
Accept
</button>

<button
onclick="rejectOrder(${order.id}, this)"
style="background:red;margin-left:5px;">
Reject
</button>
    `
    :
    ""
    }   


    <button
        onclick="deleteOrder(${order.id})"
        style="background:red;color:white;margin-left:5px;">
        Delete
    </button>

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
// Auto refresh disabled
// setInterval(loadOrders, 3000);

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

function deleteOrder(id) {

    if (!confirm("Are you sure you want to delete Order #" + id + "?")) {
        return;
    }

    fetch(API + "/api/orders/" + id, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadOrders();
    })
    .catch(err => {
        console.log(err);
        alert("Failed to delete order.");
    });

}

document.getElementById("selectAll").addEventListener("change", function () {

    const checked = this.checked;

    document.querySelectorAll(".orderCheck").forEach(box => {
        box.checked = checked;
    });

});

document.getElementById("deleteSelectedBtn").addEventListener("click", () => {

    const selected = [];

    document.querySelectorAll(".orderCheck:checked").forEach(box => {
        selected.push(box.value);
    });

    if (selected.length === 0) {
        alert("Please select at least one order.");
        return;
    }

    if (!confirm("Delete " + selected.length + " selected order(s)?")) {
        return;
    }

    Promise.all(
        selected.map(id =>
            fetch(API + "/api/orders/" + id, {
                method: "DELETE"
            })
        )
    )
    .then(() => {
        alert("Selected orders deleted successfully.");
        loadOrders();
    })
    .catch(err => {
        console.log(err);
        alert("Failed to delete selected orders.");
    });

});

function acceptOrder(id, btn) {

    btn.disabled = true;

    if (!confirm("Accept this order?")) {
        btn.disabled = false;
        return;
    }

    fetch(API + "/api/orders/accept/" + id, {

        method: "PUT",

        headers:{
            "Content-Type":"application/json"
        }

    })

    .then(res => res.json())

  .then(data => {

    alert(data.message);

    loadOrders();

})

.catch(err => {

    btn.disabled = false;

    console.log("Accept Error:", err);

    alert("Failed to accept order");

});

}


function rejectOrder(id, btn) {

    btn.disabled = true;

    const reason = prompt("Enter rejection reason:");

    if(!reason){
        btn.disabled = false;
        return;
    }

    fetch(API + "/api/orders/reject/" + id, {

        method:"PUT",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            reason:reason
        })

    })

    .then(res=>res.json())

    .then(data=>{

        alert(data.message);

        loadOrders();

    })

    .catch(err=>{

        btn.disabled = false;

        console.log("Reject Error:",err);

        alert("Failed to reject order");

    });

}

 