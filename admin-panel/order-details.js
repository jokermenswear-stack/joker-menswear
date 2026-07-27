const API = "http://localhost:3000";

const params = new URLSearchParams(window.location.search);
const orderId = params.get("id");

loadOrder();

function loadOrder() {

    fetch(API + "/api/orders/" + orderId)
        .then(res => res.json())
        .then(data => {

            const order = data.order;
            const items = data.items;

            let productsHTML = "";

            items.forEach(item => {

                productsHTML += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${item.size}</td>
                    <td>${item.quantity}</td>
                    <td>₹ ${item.price}</td>
                </tr>
                `;

            });

            document.getElementById("orderDetails").innerHTML = `

            <h2>Order #${order.id}</h2>

            <hr>

            <p><b>Customer:</b> ${order.customer_name}</p>
            <p><b>Phone:</b> ${order.phone}</p>
            <p><b>Address:</b> ${order.address}</p>
            <p><b>Total:</b> ₹ ${order.total}</p>
            <p><b>Date:</b> ${order.created_at}</p>

            <hr>

            <h3>Products</h3>

            <table border="1" width="100%">
                <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Price</th>
                </tr>

                ${productsHTML}

            </table>

            <br>

            <h3>Order Status</h3>

            <select id="status">

                <option value="Pending" ${order.status=="Pending"?"selected":""}>Pending</option>
                <option value="Confirmed" ${order.status=="Confirmed"?"selected":""}>Confirmed</option>
                <option value="Packed" ${order.status=="Packed"?"selected":""}>Packed</option>
                <option value="Shipped" ${order.status=="Shipped"?"selected":""}>Shipped</option>
                <option value="Delivered" ${order.status=="Delivered"?"selected":""}>Delivered</option>
                <option value="Cancelled" ${order.status=="Cancelled"?"selected":""}>Cancelled</option>
                <option value="Out of Stock" ${order.status=="Out of Stock"?"selected":""}>Out of Stock</option>
                <option value="Payment Failed" ${order.status=="Payment Failed"?"selected":""}>Payment Failed</option>
                <option value="Return Requested" ${order.status=="Return Requested"?"selected":""}>Return Requested</option>
                <option value="Returned" ${order.status=="Returned"?"selected":""}>Returned</option>

            </select>

            <br><br>

            <button onclick="saveStatus()">
                Update Status
            </button>

            <br><br>

            <button onclick="printInvoice()">
                🧾 Print Invoice
            </button>

            <button onclick="printCourierLabel()">
                📦 Print Courier Label
            </button>

            `;

        });

}

function saveStatus() {

    const status = document.getElementById("status").value;

    fetch(API + "/api/orders/" + orderId + "/status", {

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

        alert("Order Status Updated Successfully");

        loadOrder();

    });

}
function printInvoice() {

    const customerName = document.querySelector("p:nth-of-type(1)").innerText.replace("Customer: ", "");
    const phone = document.querySelector("p:nth-of-type(2)").innerText.replace("Phone: ", "");
    const address = document.querySelector("p:nth-of-type(3)").innerText.replace("Address: ", "");
    const total = document.querySelector("p:nth-of-type(4)").innerText;
    const date = document.querySelector("p:nth-of-type(5)").innerText.replace("Date: ", "");

    // Get all product rows
    const rows = document.querySelectorAll("table tr");
    let productsHTML = "";

    rows.forEach((row, index) => {
        if (index !== 0) { // Skip header row
            productsHTML += row.outerHTML;
        }
    });

    const invoiceWindow = window.open("", "", "width=900,height=1000");

    invoiceWindow.document.write(`
    <html>
    <head>
        <title>Invoice</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 30px;
                color: #000;
            }

            .invoice {
                max-width: 800px;
                margin: auto;
                border: 2px solid #000;
                padding: 20px;
            }

            .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }

            .header h1 {
                margin: 0;
                font-size: 32px;
            }

            .header p {
                margin: 5px 0;
            }

            .details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }

            .details div {
                width: 48%;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
            }

            table, th, td {
                border: 1px solid #000;
            }

            th, td {
                padding: 10px;
                text-align: left;
            }

            th {
                background: #f0f0f0;
            }

            .total {
                text-align: right;
                margin-top: 20px;
                font-size: 20px;
                font-weight: bold;
            }

            .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
            }

            @media print {
                body {
                    padding: 0;
                }

                .invoice {
                    border: none;
                }
            }
        </style>
    </head>

    <body>

        <div class="invoice">

            <div class="header">
                <h1>JOKER MENSWEAR</h1>
                <p>NH Main Road, Near New Bus Stand, Kadayanallur - 627751</p>
                <p>Phone: +91 90471 54637</p>
                <h2>INVOICE</h2>
            </div>

            <div class="details">

                <div>
                    <h3>Bill To:</h3>
                    <p><b>${customerName}</b></p>
                    <p>${phone}</p>
                    <p>${address}</p>
                </div>

                <div style="text-align:right;">
                    <p><b>Invoice No:</b> #${orderId}</p>
                    <p><b>Date:</b> ${date}</p>
                    <p><b>Status:</b> ${document.getElementById("status").value}</p>
                </div>

            </div>

            <table>

                <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Price</th>
                </tr>

                ${productsHTML}

            </table>

            <div class="total">
                ${total}
            </div>

            <div class="footer">
                <p>Thank you for shopping with Joker Menswear!</p>
                <p>Visit again for premium menswear collections.</p>
            </div>

        </div>

    </body>
    </html>
    `);

    invoiceWindow.document.close();
    invoiceWindow.print();
}

function printCourierLabel() {

    const customerName = document.querySelector("p:nth-of-type(1)").innerText.replace("Customer: ", "");
    const phone = document.querySelector("p:nth-of-type(2)").innerText.replace("Phone: ", "");
    const address = document.querySelector("p:nth-of-type(3)").innerText.replace("Address: ", "");
    const total = document.querySelector("p:nth-of-type(4)").innerText;

    const firstProduct = document.querySelector("table tr:nth-child(2) td:nth-child(1)")?.innerText || "-";
    const firstSize = document.querySelector("table tr:nth-child(2) td:nth-child(2)")?.innerText || "-";
    const firstQty = document.querySelector("table tr:nth-child(2) td:nth-child(3)")?.innerText || "-";

    const labelWindow = window.open("", "", "width=800,height=1000");

    labelWindow.document.write(`
    <html>
    <head>
        <title>Courier Label</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: #fff;
            }

            .label {
                width: 100%;
                max-width: 700px;
                margin: auto;
                border: 3px solid #000;
                padding: 20px;
                box-sizing: border-box;
            }

            .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }

            .header h1 {
                margin: 0;
                font-size: 28px;
                color: #000;
            }

            .section {
                border: 1px solid #000;
                padding: 12px;
                margin-bottom: 15px;
            }

            .section h3 {
                margin: 0 0 8px 0;
                background: #000;
                color: #fff;
                padding: 6px;
                font-size: 16px;
            }

            .section p {
                margin: 5px 0;
                font-size: 15px;
                line-height: 1.5;
            }

            .receiver {
                font-size: 18px;
                font-weight: bold;
            }

            .order-details table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            .order-details th,
            .order-details td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
                font-size: 14px;
            }

            .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 13px;
                font-weight: bold;
            }

            @media print {
                body {
                    padding: 0;
                }

                .label {
                    border: 3px solid #000;
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>

    <body>

        <div class="label">

            <div class="header">
                <h1>JOKER MENSWEAR</h1>
                <p>Courier Shipping Label</p>
            </div>

            <div class="section">
                <h3>FROM (Sender)</h3>
                <p>
                    <b>Joker Menswear</b><br>
                    NH Main Road, Near New Bus Stand,<br>
                    Opp. Attakulam Cricket Ground,<br>
                    Kadayanallur - 627751<br>
                    Phone: +91 90471 54637
                </p>
            </div>

            <div class="section">
                <h3>TO (Receiver)</h3>
                <p class="receiver">
                    ${customerName}
                </p>
                <p>
                    Phone: ${phone}<br>
                    Address: ${address}
                </p>
            </div>

            <div class="section order-details">
                <h3>ORDER DETAILS</h3>

                <p><b>Order ID:</b> #${orderId}</p>

                <table>
                    <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Qty</th>
                    </tr>
                    <tr>
                        <td>${firstProduct}</td>
                        <td>${firstSize}</td>
                        <td>${firstQty}</td>
                    </tr>
                </table>

                <p><b>${total}</b></p>
                <p><b>Status:</b> ${document.getElementById("status").value}</p>
            </div>

            <div class="footer">
                Thank you for shopping with Joker Menswear
            </div>

        </div>

    </body>
    </html>
    `);

    labelWindow.document.close();
    labelWindow.print();
}