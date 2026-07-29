const API = "https://joker-menswear-backend.onrender.com";

function trackOrder() {
    const orderId = document.getElementById("orderId").value;

    if (!orderId) {
        alert("Please enter your Order ID");
        return;
    }

    fetch(API + "/api/orders/" + orderId)
        .then(res => res.json())
        .then(data => {
            const order = data.order;

            if (!order) {
                document.getElementById("orderResult").innerHTML =
                    "<p>Order not found. Please check your Order ID.</p>";
                return;
            }

            document.getElementById("orderResult").innerHTML = `
                <h2>Order #${order.id}</h2>
                <p><b>Customer:</b> ${order.customer_name}</p>
                <p><b>Total:</b> ₹ ${order.total}</p>
                <p><b>Order Date:</b> ${order.created_at}</p>
                <p><b>Current Status:</b> <span style="color:green;font-weight:bold;">${order.status}</span></p>
            `;
        })
        .catch(error => {
            console.log("Tracking Error:", error);
            document.getElementById("orderResult").innerHTML =
                "<p>Something went wrong. Please try again later.</p>";
        });
}