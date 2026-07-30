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
    app.use(express.static(path.join(__dirname, "..")));
   app.use("/sounds", express.static("sounds"));
app.use("/images", express.static("images"));
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
   // Save new order
app.post('/api/orders', (req, res) => {
console.log("ORDER API RECEIVED", req.body);

    const {
        product_id,
        customer_name,
        phone,
        address,
        product_name,
        size,
        quantity,
        price,
        status
    } = req.body;


    const orderSql = `
        INSERT INTO orders
        (customer_name, phone, address, total, status)
        VALUES (?, ?, ?, ?, ?)
    `;


    const total = Number(price) * Number(quantity);


    db.query(
        orderSql,
        [
            customer_name,
            phone,
            address,
            total,
            status || "Pending"
        ],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: "Failed to save order"
                });
            }


            const orderId = result.insertId;


            const itemSql = `
                INSERT INTO order_items
                (order_id, product_id, product_name, size, quantity, price)
                VALUES (?, ?, ?, ?, ?, ?)
            `;


            db.query(
                itemSql,
                [
                    orderId,
                    product_id,
                    product_name,
                    size,
                    quantity,
                    price
                ],
                (err2) => {

                    if (err2) {
                        console.error(err2);
                        return res.status(500).json({
                            error: "Failed to save order item"
                        });
                    }


                    // Live notification to admin
                 console.log("SENDING NEW ORDER:", orderId, customer_name);

io.emit("new-order", {
    orderId: orderId,
    customer: customer_name
});


                    res.json({
                        success: true,
                        order_id: orderId
                    });

                }
            );

        }
    );

});
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

                if(err){
                    console.log(err);

                    return res.status(500).json({
                        error:"Update failed"
                    });
                }


                res.json({
                    message:"Product updated successfully"
                });

            }
        );

    });
    // Admin Login

    app.post('/admin-login', (req, res) => {

        const { username, password } = req.body;

        const sql = "SELECT * FROM admins WHERE username=? AND password=?";

        db.query(sql, [username, password], (err, result) => {

            if(err){
                console.log(err);
                return res.status(500).json({
                    success:false,
                    message:"Database error"
                });
            }


            if(result.length > 0){

                res.json({
                    success:true,
                    message:"Login successful"
                });

            }
            else{

                res.json({
                    success:false,
                    message:"Invalid username or password"
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

    const id = req.params.id;
    const { status } = req.body;

    // First get current order status
    db.query("SELECT status FROM orders WHERE id = ?", [id], (err, orderResult) => {

        if (err || orderResult.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Order not found"
            });
        }

        const currentStatus = orderResult[0].status;

        // Update order status
        db.query(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, id],
            (err2) => {

                if (err2) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                // Reduce stock only when changing to Shipped for the first time
                if (status === "Shipped" && currentStatus !== "Shipped") {

                    const itemSql = "SELECT product_name, quantity FROM order_items WHERE order_id = ?";

                    db.query(itemSql, [id], (err3, items) => {

                        if (err3) {
                            return res.status(500).json({
                                success: false,
                                message: "Failed to get order items"
                            });
                        }

                        // Update stock for each item
                        items.forEach(item => {

                            const stockSql = `
                                UPDATE products
                                SET stock = stock - ?
                                WHERE product_name = ? AND stock >= ?
                            `;

                            db.query(
                                stockSql,
                                [item.quantity, item.product_name, item.quantity]
                            );
                        });

                        res.json({
                            success: true,
                            message: "Order status updated and stock reduced successfully"
                        });
                    });

                } else {

                    // For all other statuses, just update status
                    res.json({
                        success: true,
                        message: "Order status updated successfully"
                    });
                }
            }
        );
    });
});

  // Generate Payment Verification Code
app.post("/api/payment/generate-code", (req, res) => {

    const order_id = Number(req.body.order_id);

    // Check if Order ID is valid
    if (!order_id) {
        return res.json({
            success: false,
            message: "Please enter a valid Order ID"
        });
    }

    // Check if payment code already exists
    const checkSql = "SELECT * FROM payments WHERE order_id = ?";

    db.query(checkSql, [order_id], (err, existing) => {

        if (err) {
            console.log("Check error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        // If code already exists
        if (existing.length > 0) {
            return res.json({
                success: false,
                message: "Payment code already generated",
                code: existing[0].verification_code
            });
        }

        // Create new code
        const code = "JKR" + Math.floor(10000 + Math.random() * 90000);

        const insertSql = `
            INSERT INTO payments
            (order_id, verification_code, payment_status)
            VALUES (?, ?, 'Pending')
        `;

        db.query(insertSql, [order_id, code], (err2) => {

            if (err2) {
                console.log("Insert error:", err2);
                return res.status(500).json({
                    success: false,
                    message: "Failed to generate code"
                });
            }

            // Update order status
            const updateOrder = `
                UPDATE orders
                SET order_status='Confirmed',
                    status='Confirmed'
                WHERE id=?
            `;

            db.query(updateOrder, [order_id]);

            res.json({
                success: true,
                message: "Payment code generated",
                code: code
            });
        });
    });
});

// Verify Payment Code
app.post("/api/payment/verify-code", (req, res) => {

    const { verification_code } = req.body;

    const sql = `
        SELECT p.*, o.customer_name, o.total
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE p.verification_code = ?
    `;

    db.query(sql, [verification_code], (err, result) => {

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
                message: "Invalid verification code"
            });
        }

        res.json({
            success: true,
            message: "Code verified successfully",
            payment: result[0]
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