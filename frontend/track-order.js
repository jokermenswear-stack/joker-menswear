const API = "https://joker-menswear.onrender.com";

function getStatusColor(status) {
    switch (status) {
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

function trackOrder() {

    const orderId = document.getElementById("orderId").value.trim();

    if (!orderId) {
        alert("Please enter your Order ID");
        return;
    }

    fetch(API + "/api/orders/" + orderId)
        .then(res => {
            if (!res.ok) {
                throw new Error("Order not found");
            }
            return res.json();
        })
        .then(data => {

            const order = data.order;

            document.getElementById("orderResult").innerHTML = `
                <h2>Order #${order.id}</h2>

                <p><b>Customer:</b> ${order.customer_name}</p>

                <p><b>Total:</b> ₹ ${order.total}</p>

                <p><b>Order Date:</b> ${new Date(order.created_at).toLocaleString()}</p>

                <p>
                    <b>Current Status:</b>
                    <span style="color:${getStatusColor(order.order_status)};font-weight:bold;">
                        ${order.order_status}
                    </span>
                </p>
            `;
        })
        .catch(err => {

            console.log(err);

            document.getElementById("orderResult").innerHTML = `
                <p style="color:red;">
                    Order not found or something went wrong.
                </p>
            `;
        });
}