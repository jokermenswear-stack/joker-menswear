const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const XLSX = require('xlsx');
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/admin-panel", express.static(path.join(__dirname, "..", "admin-panel")));

app.use("/sounds", express.static(path.join(__dirname, "..", "admin-panel", "sounds")));
app.use("/images", express.static(path.join(__dirname, "..", "frontend", "images")));

const upload = multer({ dest: "uploads/" });
// MySQL connection
const db = mysql.createConnection({
    host: 'sakura.proxy.rlwy.net',
    user: 'root',
    password: 'erYzmKnlZSwVGsLldIdRiIPrxdiRdWkm',
    port: 13149,
    database: 'railway'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Test route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
// Get all orders
app.get('/api/orders', (req, res) => {
    const sql = 'SELECT * FROM orders ORDER BY created_at DESC';

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results);
    });
});


// Save new order (Buy Now + Cart Checkout)
app.post('/api/orders', (req, res) => {

    console.log("ORDER RECEIVED:", req.body);

    const {
        customer_name,
        phone,
        address,
        status
    } = req.body;


    // Detect cart order or single product order

    let items = [];

    if (req.body.items && Array.isArray(req.body.items)) {

        // Cart checkout
        items = req.body.items;

    } else {

        // Buy Now
        items = [
            {
                product_id: req.body.product_id,
                product_name: req.body.product_name,
                size: req.body.size,
                quantity: req.body.quantity,
                price: req.body.price
            }
        ];

    }


    // Calculate total

    let total = 0;

    items.forEach(item => {

        total += Number(item.price) * Number(item.quantity);

    });


// ===============================
// CREATE ORDER SIGNATURE
// ===============================

const orderSignature = items
.map(item =>
`${item.product_id || item.id}-${item.size || ""}-${item.quantity || item.qty || 1}`
)
.sort()
.join("|");
console.log("ORDER SIGNATURE:", orderSignature);
console.log("ITEMS:", items);

if(!orderSignature || orderSignature.includes("undefined")){
    console.log("Invalid order signature:", orderSignature);
    return res.status(400).json({
        error:"Invalid order data"
    });
}

// Check duplicate
db.query(
`
SELECT id
FROM orders
WHERE phone = ?
AND order_signature = ?
AND order_status NOT IN ('Delivered','Cancelled')
LIMIT 1
`,
[phone, orderSignature],
(err, result) => {

    if(err){
        console.log(err);
        return res.status(500).json({
            error:"Duplicate check failed"
        });
    }

    if(result.length){

        return res.json({
            success:true,
            duplicate:true,
            order_id:result[0].id
        });

    }   
    
    
   // Create order

const orderSql = `
INSERT INTO orders
(
    customer_name,
    phone,
    address,
    total,
    status,
    order_status,
    order_signature
)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;


const orderData = [
    customer_name,
    phone,
    address,
    total,
    status || "Pending",
    status || "Pending",
    orderSignature
];


console.log("FINAL INSERT DATA:", orderData);


db.query(
    orderSql,
    orderData,
    (err, result) => {

        if (err) {

            console.log("ORDER INSERT ERROR:", err);

            return res.status(500).json({
                error:"Order creation failed"
            });

        }


        const orderId = result.insertId;


        console.log(
            "ORDER CREATED:",
            orderId,
            "SIGNATURE:",
            orderSignature
        );



        // Insert all products

        const itemSql = `
        INSERT INTO order_items
        (
            order_id,
            product_id,
            product_name,
            size,
            quantity,
            price
        )
        VALUES ?
        `;



        const itemValues = items.map(item => [

            orderId,
            item.product_id,
            item.product_name,
            item.size || "",
            item.quantity,
            item.price

        ]);



        db.query(
            itemSql,
            [itemValues],
            (itemErr)=>{


                if(itemErr){

                    console.log(
                        "ORDER ITEMS ERROR:",
                        itemErr
                    );

                    return res.status(500).json({
                        error:"Order items failed"
                    });

                }



                // Notify Admin

                io.emit("new-order",{

                    orderId: orderId,
                    customer: customer_name

                });



                console.log(
                    "NEW ORDER SENT TO ADMIN:",
                    orderId
                );



                res.json({

                    success:true,
                    order_id:orderId

                });


            }
        );


    }
);

// Get all products
app.get('/products', (req, res) => {

    const sql = 'SELECT * FROM products';

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results);

    });

});
// Add new product
app.post('/products', (req, res) => {

    const {
        customer_name,
        phone,
        address,
        product_id,
        product_name,
        size,
        quantity,
        price,
        status
    } = req.body;

    const sql = `
        INSERT INTO products
        (product_code, product_name, category, brand, price, offer_price, stock, sizes, image, images, video, description, status, new_arrival, offer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            product_code,
            product_name,
            category,
            brand,
            price,
            offer_price || null,
            stock,
            sizes || null,
            image,
            images,
            video || null,
            description,
            status,
            new_arrival,
            offer
        ],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    error: "Failed to add product"
                });
            }

            res.json({
                success: true,
                message: "Product added successfully",
                id: result.insertId
            });
        }
    );

});
// Bulk Upload Products from Excel
app.post('/upload-products', upload.single('file'), (req, res) => {

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const products = XLSX.utils.sheet_to_json(sheet);

    products.forEach((product) => {

        const sql = `
            INSERT INTO products
            (product_code, product_name, category, brand, price, offer_price, stock, sizes, image, images, video, description, status, new_arrival, offer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            product.product_code || null,
            product.product_name || null,
            product.category || null,
            product.brand || null,
            product.price || 0,
            product.offer_price || null,
            product.stock || 0,
            product.sizes || null,
            product.image || null,
            product.images || null,
            product.video || null,
            product.description || null,
            product.status || 1,
            product.new_arrival || 0,
            product.offer || 0
        ], (err) => {
            if (err) {
                console.log("Bulk upload error:", err);
            }
        });

    });

    res.json({
        message: "Products uploaded successfully"
    });

});
// Delete Product

app.delete('/products/:id', (req, res) => {

    const id = req.params.id;

    const sql = "DELETE FROM products WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                error: "Delete failed"
            });
        }

        res.json({
            message: "Product deleted successfully"
        });

    });

});

// Get single product by ID

app.get('/products/:id', (req, res) => {

    const id = req.params.id;

    const sql = "SELECT * FROM products WHERE id = ?";

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                error: "Database error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        res.json(result[0]);

    });

});
// Update Product

app.put('/products/:id', (req, res) => {

    const id = req.params.id;

    const {
        product_code,
        product_name,
        category,
        brand,
        price,
        image,
        description,
        status,
        new_arrival,
        offer,
        stock
    } = req.body;


    const sql = `
        UPDATE products SET
        product_code=?,
        product_name=?,
        category=?,
        brand=?,
        price=?,
        image=?,
        description=?,
        status=?,
        new_arrival=?,
        offer=?,
        stock=?
        WHERE id=?
        `;


    db.query(
        sql,
        [
            product_code,
            product_name,
            category,
            brand,
            price,
            image,
            description,
            status,
            new_arrival,
            offer,
            stock,
            id
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    error: "Update failed"
                });
            }


            res.json({
                message: "Product updated successfully"
            });

        }
    );

});
// Admin Login

app.post('/admin-login', (req, res) => {

    const { username, password } = req.body;

    const sql = "SELECT * FROM admins WHERE username=? AND password=?";

    db.query(sql, [username, password], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }


        if (result.length > 0) {

            res.json({
                success: true,
                message: "Login successful"
            });

        }
        else {

            res.json({
                success: false,
                message: "Invalid username or password"
            });

        }

    });

});

// Get complete order details

app.get("/api/orders/:id", (req, res) => {

    const orderId = req.params.id;

    const orderSql = `
            SELECT *
            FROM orders
            WHERE id = ?
        `;

    db.query(orderSql, [orderId], (err, orderResult) => {

        if (err) {
            console.log(err);

            return res.status(500).json({
                error: "Database error"
            });
        }

        if (orderResult.length === 0) {

            return res.status(404).json({
                error: "Order not found"
            });

        }

        const itemSql = `
                SELECT *
                FROM order_items
                WHERE order_id = ?
            `;

        db.query(itemSql, [orderId], (err2, itemResult) => {

            if (err2) {
                console.log(err2);

                return res.status(500).json({
                    error: "Database error"
                });
            }

            res.json({

                order: orderResult[0],

                items: itemResult

            });

        });

    });

});

// Update Order Status

app.put("/api/orders/:id/status", (req, res) => {

    console.log("========== STATUS UPDATE ==========");
    console.log("Order ID:", req.params.id);
    console.log("Request Body:", req.body);

    const id = req.params.id;
    const { order_status } = req.body;

    db.query(
    "SELECT order_status FROM orders WHERE id = ?",
    [id],
    (err, orderResult) => {

        if (err) {
            console.log("SELECT ERROR:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const currentStatus = orderResult[0].order_status;

        
         db.query(
    `UPDATE orders
     SET order_status = ?, status = ?
     WHERE id = ?`,
    [order_status, order_status, id],
    (err2) => {

        if (err2) {
            console.log("UPDATE ERROR:", err2);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

                    // Reduce stock only when changing to Shipped first time
                    if (order_status === "Shipped" && currentStatus !== "Shipped") {


                        const itemSql = `
                            SELECT product_name, quantity
                            FROM order_items
                            WHERE order_id = ?
                        `;


                        db.query(
                            itemSql,
                            [id],
                            (err3, items) => {

                                if (err3) {
                                    return res.status(500).json({
                                        success: false,
                                        message: "Failed to get order items"
                                    });
                                }


                                items.forEach(item => {

                                    db.query(
                                        `
                                        UPDATE products
                                        SET stock = stock - ?
                                        WHERE product_name = ?
                                        AND stock >= ?
                                        `,
                                        [
                                            item.quantity,
                                            item.product_name,
                                            item.quantity
                                        ]
                                    );

                                });


                                res.json({
                                    success: true,
                                    message: "Order status updated and stock reduced successfully"
                                });

                            }
                        );


                    } else {

                        res.json({
                            success: true,
                            message: "Order status updated successfully"
                        });

                    }

                }
            );

        }
    );

});      
      
        // Admin Accept Order - Create Payment Waiting
        app.put("/api/orders/accept/:id", (req, res) => {

            const orderId = req.params.id;

            // Create payment entry if not already exists
            const checkSql = `
        SELECT * FROM payments 
        WHERE order_id = ?
    `;

            db.query(checkSql, [orderId], (err, result) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }


                if (result.length === 0) {

                    const insertSql = `
                INSERT INTO payments
                (order_id, payment_status)
                VALUES (?, 'Pending')
            `;


                    db.query(insertSql, [orderId], (err2) => {

                        if (err2) {
                            console.log(err2);
                            return res.status(500).json({
                                success: false,
                                message: "Payment creation failed"
                            });
                        }


                        updateOrder();

                    });


                } else {

                    updateOrder();

                }



                function updateOrder() {

                    const sql = `
                UPDATE orders
                SET status='Confirmed',
                    order_status='Confirmed'
                WHERE id=?
            `;


                    db.query(sql, [orderId], (err3) => {

                        if (err3) {
                            console.log(err3);

                            return res.status(500).json({
                                success: false,
                                message: "Order update failed"
                            });
                        }


                        // Notify customer page instantly
                        io.emit("order-status-update", {
                            orderId: orderId,
                            status: "Confirmed"
                        });


                        res.json({
                            success: true,
                            message: "Order accepted"
                        });

                    });

                }


            });


        });

        // Admin Reject Order
        app.put("/api/orders/reject/:id", (req, res) => {

            const orderId = req.params.id;
            const { reason } = req.body;

            const sql = `
        UPDATE orders
        SET status = 'Cancelled',
            order_status = 'Cancelled',
            rejection_reason = ?
        WHERE id = ?
    `;

            db.query(sql, [reason, orderId], (err) => {

                if (err) {
                    console.log(err);

                    return res.status(500).json({
                        success: false,
                        message: "Failed to reject order"
                    });
                }

                io.emit("order-status-update", {
                    orderId: orderId,
                    status: "Cancelled",
                    reason: reason
                });

                res.json({
                    success: true,
                    message: "Order rejected successfully"
                });

            });

        });


        // Submit Payment Transaction ID
        app.post("/api/payment/submit", (req, res) => {

            const { order_id, transaction_id, payment_method } = req.body;

            const sql = `
        UPDATE payments
        SET transaction_id = ?,
            payment_method = ?,
            payment_status = 'Pending'
        WHERE order_id = ?
    `;

            db.query(sql, [transaction_id, payment_method, order_id], (err) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to submit payment"
                    });
                }

                res.json({
                    success: true,
                    message: "Transaction ID submitted successfully. Admin will verify payment."
                });

            });

        });

        // Admin Approve Payment
        app.put("/api/payment/approve/:order_id", (req, res) => {

            const orderId = req.params.order_id;

            // Update payments table
            const paymentSql = `
        UPDATE payments
        SET payment_status = 'Paid'
        WHERE order_id = ?
    `;

            db.query(paymentSql, [orderId], (err) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to approve payment"
                    });
                }

                // Update orders table
                const orderSql = `
    UPDATE orders
    SET payment_status = 'Paid',
        order_status = 'Confirmed',
        status = 'Confirmed'
    WHERE id = ?
`;

                db.query(orderSql, [orderId], (err2) => {

                    if (err2) {
                        console.log(err2);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update order status"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Payment approved successfully"
                    });

                });

            });

        });

        // Reject Payment with Remarks
        app.put("/api/payment/reject", (req, res) => {

            const { order_id, remarks } = req.body;

            const paymentSql = `
        UPDATE payments
        SET payment_status = 'Rejected',
            remarks = ?
        WHERE order_id = ?
    `;

            db.query(paymentSql, [remarks, order_id], (err) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to reject payment"
                    });
                }

                const orderSql = `
            UPDATE orders
            SET payment_status = 'Pending',
                order_status = 'Pending',
                status = 'Pending'
            WHERE id = ?
        `;

                db.query(orderSql, [order_id], (err2) => {

                    if (err2) {
                        console.log(err2);
                        return res.status(500).json({
                            success: false,
                            message: "Failed to update order status"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Payment rejected successfully"
                    });

                });

            });

        });

        // Get Payment Status for Customer
        app.get("/api/payment/status/:order_id", (req, res) => {

            const orderId = req.params.order_id;

            const sql = `
        SELECT payment_status, remarks
        FROM payments
        WHERE order_id = ?
    `;

            db.query(sql, [orderId], (err, result) => {

                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (result.length === 0) {
                    return res.json({
                        success: false,
                        message: "Payment not found"
                    });
                }

                res.json({
                    success: true,
                    payment_status: result[0].payment_status,
                    remarks: result[0].remarks || ""
                });

            });
        });

        // Get Pending Payment Verifications
        app.get("/api/payments/pending", (req, res) => {

            const sql = `
        SELECT p.order_id, p.transaction_id, o.customer_name, o.total
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.payment_status = 'Pending'
          AND p.transaction_id IS NOT NULL
        ORDER BY p.created_at DESC
    `;

            db.query(sql, (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                res.json({
                    success: true,
                    payments: result
                });
            });
        });

        // Delete Order
        app.delete("/api/orders/:id", (req, res) => {

            const orderId = req.params.id;

            db.query(
                "DELETE FROM order_items WHERE order_id = ?",
                [orderId],
                (err) => {

                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Failed to delete order items"
                        });
                    }

                    db.query(
                        "DELETE FROM payments WHERE order_id = ?",
                        [orderId],
                        (err2) => {

                            if (err2) {
                                console.log(err2);
                                return res.status(500).json({
                                    message: "Failed to delete payment"
                                });
                            }

                            db.query(
                                "DELETE FROM orders WHERE id = ?",
                                [orderId],
                                (err3) => {

                                    if (err3) {
                                        console.log(err3);
                                        return res.status(500).json({
                                            message: "Failed to delete order"
                                        });
                                    }

                                    res.json({
                                        success: true,
                                        message: "Order deleted successfully"
                                    });

                                }
                            );

                        }
                    );

                }
            );

        });

        // Get store status
        app.get("/api/store-status", (req, res) => {

            db.query("SELECT store_open FROM store_settings LIMIT 1", (err, result) => {

                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }

                res.json(result[0]);
            });
        });

        // Toggle store status
        app.put("/api/store-status/toggle", (req, res) => {

            db.query("SELECT store_open FROM store_settings LIMIT 1", (err, result) => {

                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }

                const newStatus = result[0].store_open == 1 ? 0 : 1;

                db.query(
                    "UPDATE store_settings SET store_open = ? WHERE id = 1",
                    [newStatus],
                    (err2) => {

                        if (err2) {
                            return res.status(500).json({ error: "Update failed" });
                        }

                        res.json({
                            success: true,
                            message: newStatus == 1 ? "Store Opened" : "Store Closed"
                        });
                    }
                );
            });
        });
        const PORT = process.env.PORT || 3000;

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });