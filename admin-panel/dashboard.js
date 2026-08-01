console.log("Dashboard JS NEW VERSION");

const API = "https://joker-menswear.onrender.com";

console.log("API =", API);


// ==========================
// LOAD DASHBOARD COUNTS
// ==========================

function loadDashboard() {

    fetch(API + "/api/orders")
        .then(res => res.json())
        .then(orders => {

            console.log("ORDERS:", JSON.stringify(orders, null, 2));


            const totalOrders = orders.length;

            const pendingOrders = orders.filter(order =>
                order.order_status === "Pending"
            ).length;

            const confirmedOrders = orders.filter(order =>
                order.order_status === "Confirmed"
            ).length;

            const packedOrders = orders.filter(order =>
                order.order_status === "Packed"
            ).length;

            const shippedOrders = orders.filter(order =>
                order.order_status === "Shipped"
            ).length;

            const deliveredOrders = orders.filter(order =>
                order.order_status === "Delivered"
            ).length;

            const cancelledOrders = orders.filter(order =>
                order.order_status === "Cancelled"
            ).length;


            const totalRevenue = orders
                .filter(order =>
                    order.order_status === "Delivered"
                )
                .reduce((sum, order) => {

                    return sum + Number(order.total || 0);

                }, 0);



            updateCard("totalOrders", totalOrders);
            updateCard("pendingOrders", pendingOrders);
            updateCard("confirmedOrders", confirmedOrders);
            updateCard("packedOrders", packedOrders);
            updateCard("shippedOrders", shippedOrders);
            updateCard("deliveredOrders", deliveredOrders);
            updateCard("cancelledOrders", cancelledOrders);
            updateCard("totalRevenue", "₹ " + totalRevenue);


        })
        .catch(error => {

            console.log("Dashboard Error:", error);

        });

}


// Safe card update

function updateCard(id, value){

    const element = document.getElementById(id);

    if(element){

        element.innerText = value;

    }

}



// ==========================
// STORE STATUS
// ==========================

function loadStoreStatus(){

    fetch(API + "/api/store-status")

    .then(res => res.json())

    .then(data => {


        const statusText =
            document.getElementById("storeStatusText");


        const toggleBtn =
            document.getElementById("storeToggleBtn");


        if(!statusText || !toggleBtn) return;


        if(data.store_open == 1){

            statusText.innerText = "🟢 Store is Open";
            toggleBtn.innerText = "Close Store";

        }
        else{

            statusText.innerText = "🔴 Store is Closed";
            toggleBtn.innerText = "Open Store";

        }


    })

    .catch(err =>
        console.log("Store status error:", err)
    );

}



function toggleStore(){

    fetch(API + "/api/store-status/toggle",{

        method:"PUT"

    })

    .then(res => res.json())

    .then(data => {

        alert(data.message);

        loadStoreStatus();

    })

    .catch(err =>
        console.log("Toggle error:",err)
    );

}



// ==========================
// PAYMENT COUNT
// ==========================

function loadPaymentCount(){

    fetch(API + "/api/payments/pending")

    .then(res => res.json())

    .then(data => {


        const paymentCount =
            document.getElementById("paymentCount");


        if(paymentCount){

            paymentCount.innerText =
                "(" + data.payments.length + ")";

        }


    })

    .catch(error => {

        console.log("Payment count error:", error);

    });

}



// ==========================
// START
// ==========================

loadDashboard();

loadStoreStatus();

loadPaymentCount();



setInterval(loadDashboard,5000);

setInterval(loadPaymentCount,5000);