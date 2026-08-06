const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const currentIndex = {};

for (let id in products) {
    currentIndex[id] = 0;
}
function updateCard(productId) {

    const product = products[productId];

    const media = document.getElementById(productId + "Image");
    const buy = document.getElementById(productId + "BuyNow");

    if (!product || !media) return;

    const file = product.images[currentIndex[productId]];

    if (file.endsWith(".mp4")) {

       media.outerHTML = `
    <video
        id="${productId}Image"
        controls
        controlsList="nodownload"
        playsinline
        webkit-playsinline
        preload="metadata">
        <source src="${file}" type="video/mp4">
    </video>
`;

    } else {

        media.outerHTML = `
            <img
                id="${productId}Image"
                src="${file}"
                alt="${product.name}">
        `;

    }

    if (buy) {
       buy.href = "payment.html?id=" + productId;
    }
}

function changeImage(productId, step) {

    const product = products[productId];
    if (!product) return;

    currentIndex[productId] += step;

    if (currentIndex[productId] < 0) {
        currentIndex[productId] = product.images.length - 1;
    }

    if (currentIndex[productId] >= product.images.length) {
        currentIndex[productId] = 0;
    }

    updateCard(productId);

    const dots = document.querySelectorAll(`#${productId}Dots .dot`);

    dots.forEach((dot, index) => {
        if (index === currentIndex[productId]) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

let baseId = productId;
let selectedIndex = 0;

if (productId && productId.includes("-")) {
    const parts = productId.split("-");
    baseId = parts[0];
    selectedIndex = Number(parts[1]) - 1;
}

let product = products[baseId];

// PAYMENT PAGE DISPLAY
if (product) {

    const img = document.getElementById("productImage");
    const name = document.getElementById("productName");
    const price = document.getElementById("productPrice");

    let selectedIndex = 0;

    if (productId && productId.includes("-")) {
        selectedIndex = Number(productId.split("-")[1]) - 1;
    }

    if (img) {
        img.src = product.images[selectedIndex] || product.images[0];
    }

    if (name) {
        name.textContent = product.name;
    }

    if (price) {
        price.textContent = product.price;
    }
}
// WHATSAPP ORDER

async function sendWhatsApp() {

    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let address = document.getElementById("address").value.trim();
    let size = document.getElementById("size").value;
    let quantity = document.getElementById("quantity").value;
    

    // Check required fields
    if (
        name === "" ||
        phone === "" ||
        address === "" ||
        size === "Select Size" ||
        quantity === ""  
    ) 
    {
        alert("⚠️ Please fill in all the details before submitting your order.");
        return;
    }

    // Validate phone number
    if (phone.length !== 10 || isNaN(phone)) {
        alert("⚠️ Please enter a valid 10-digit mobile number.");
        return;
    }

    // Confirm Order
    let confirmOrder = confirm(
        "Are you sure you want to submit your order?\n\nAfter submitting, wait for confirmation from Joker Menswear. Once confirmed, click 'View Payment Details' to complete your payment."
    );

    if (!confirmOrder) {
        return;
    }
    const response = await fetch("https://joker-menswear-backend.onrender.com/api/orders", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
  body: JSON.stringify({
    product_id: product.id,
    customer_name: name,
    phone: phone,
    address: address,   
    product_name: product.name,
    size: size,
    quantity: quantity,
    price: parseFloat(product.price.replace(/[^\d.]/g, "")),
    status: "Pending"
})
});

const result = await response.json();

if (!result.success) {
    alert("Failed to save order.");
    return;
}

// Show Order ID to customer
alert(
    "Thank you! Your order has been placed successfully.\\n\\n" +
    "Your Order ID is: #" + result.orderId + "\\n\\n" +
    "Please save this Order ID to track your order later."
);
let message =
`🛒 New Order Details:
👤 Name: ${name}
📞 Phone: ${phone}
🏠 Address: ${address}
👕 Product: ${product ? product.name : baseProductId}
🎨 Variant: ${productId}
💰 Price: ${product ? product.price : ""}
📏 Size: ${size}
🔢 Quantity: ${quantity}`;

    let whatsappNumber = "919047154637";
   let url = "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(message);

    // Enable Payment Button
    document.getElementById("paymentBtn").disabled = false;

    alert("✅ Your order details are ready.\n\nTap 'Send' in WhatsApp to send your order. After our confirmation, click 'View Payment Details' to complete your payment.");

    window.open(url, "_blank");
}
function renderProducts() {

    const newArrivalBox = document.getElementById("newArrivalProducts");
    const offerBox = document.getElementById("offerProducts");
    const shirtBox = document.getElementById("shirtProducts");
    const tshirtBox = document.getElementById("tshirtProducts");
    const pantBox = document.getElementById("pantProducts");

    console.log(newArrivalBox, offerBox, shirtBox, tshirtBox, pantBox);

    let newArrivalCount = 0;
    let offerCount = 0;

    let shirtCount = 0;
    let tshirtCount = 0;
    let pantCount = 0;

    for (let id in products) {

        const product = products[id];


        // New Arrivals (independent from status)
        if (product.newArrival == 1 && newArrivalCount < 5) {
            newArrivalBox.appendChild(createCard(id, product));
            newArrivalCount++;
        }


        // Offers (independent from status)
        if (product.offer == 1 && offerCount < 5) {
            offerBox.appendChild(createCard(id, product));
            offerCount++;
        }


        // Hide from main category if status = 0
        if (product.status == 0) {
            continue;
        }


        // Shirts
        if (id.startsWith("SH") && shirtCount < 5) {
            shirtBox.appendChild(createCard(id, product));
            shirtCount++;
        }

        // T-Shirts
        else if (id.startsWith("TS") && tshirtCount < 5) {
            tshirtBox.appendChild(createCard(id, product));
            tshirtCount++;
        }

        // Pants
        else if (id.startsWith("PANT") && pantCount < 5) {
            pantBox.appendChild(createCard(id, product));
            pantCount++;
        }
    }
    // Hide empty sections

if (newArrivalCount === 0 && newArrivalBox) {
    newArrivalBox.parentElement.style.display = "none";
}

if (offerCount === 0 && offerBox) {
    offerBox.parentElement.style.display = "none";
}

if (shirtCount === 0 && shirtBox) {
    shirtBox.parentElement.style.display = "none";
}

if (tshirtCount === 0 && tshirtBox) {
    tshirtBox.parentElement.style.display = "none";
}

if (pantCount === 0 && pantBox) {
    pantBox.parentElement.style.display = "none";
}

}

function createCard(id, product) {

    const card = document.createElement("div");
    card.className = "card";

    let sizes = id.startsWith("PANT")
        ? "28 | 30 | 32 | 34 | 36 | 38 | 40"
        : "M | L | XL | XXL";
        
card.innerHTML = `
    <div class="image-slider">

        <button class="arrow"
            onclick="changeImage('${id}', -1)">◀</button>

        <img
            id="${id}Image"
            src="${product.images[0]}"
            alt="${product.name}">

        <button class="arrow"
            onclick="changeImage('${id}', 1)">▶</button>

    </div>


<div class="dots" id="${id}Dots"></div>

<h3>${product.name}</h3>

    <h4>${product.price}</h4>

    <p>⭐ 4.8 / 5 Rating</p>

    <p><strong>Size:</strong> ${sizes}</p>

  ${product.stock > 0
  ? `
     <p><strong>Status:</strong> ✅ In Stock</p>
     <p>🚚 Free Shipping</p>

     <div class="product-buttons">

        <a id="${id}BuyNow" href="payment.html?id=${id}" class="buy-btn">
            Buy Now
        </a>

        <button class="cart-btn" onclick="addToCart('${id}')">
            Add to Cart
        </button>

     </div>
     `
  : `
     <p><strong>Status:</strong> ❌ Out of Stock</p>

     <button disabled style="background:gray; cursor:not-allowed;">
        Current Out of Stock
     </button>
     `
}
`;

const dots = card.querySelector(".dots");

product.images.forEach((img, index) => {
    const dot = document.createElement("span");
    dot.className = "dot";

    if (index === 0) {
        dot.classList.add("active");
    }

    dots.appendChild(dot);
});

const slider = card.querySelector(".image-slider");

let startX = 0;
let startY = 0;

slider.addEventListener("touchstart", function(e){
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

slider.addEventListener("touchend", function(e){

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;

    const diffX = startX - endX;
    const diffY = startY - endY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {

        if (diffX > 0) {
            changeImage(id, 1);
        } else {
            changeImage(id, -1);
        }

    }
});

return card;
}

const topBtn = document.getElementById("topBtn");

if (topBtn) {

    window.addEventListener("scroll", function () {
        if (window.scrollY > 200) {
            topBtn.style.display = "flex";
        } else {
            topBtn.style.display = "none";
        }
    });

    topBtn.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

}

let storeOpen = true;

// Check store status from backend
async function checkStoreStatus() {

    try {
      const res = await fetch("https://joker-menswear-backend.onrender.com/api/store-status");        const data = await res.json();

        storeOpen = data.store_open == 1;

        if (!storeOpen) {

            // Show store closed message
            const banner = document.createElement("div");
            banner.innerHTML = "⚠️ Store is currently closed. Please visit again later.";
            banner.style.cssText = `
                background: #f44336;
                color: white;
                text-align: center;
                padding: 12px;
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 9999;
            `;

            document.body.prepend(banner);

           // Change all Buy Now links and Out of Stock buttons to Store Closed
document.querySelectorAll("a[id$='BuyNow'], button").forEach(btn => {

    // Only change product buttons, not every button on the page
    if (
        btn.innerText.includes("Buy Now") ||
        btn.innerText.includes("Current Out of Stock")
    ) {
        btn.innerText = "Store Closed";
        btn.style.background = "gray";
        btn.style.pointerEvents = "none";
        btn.style.cursor = "not-allowed";
    }
});
        }

    } catch (err) {
        console.log("Store status error:", err);
    }
}

// Run when customer page loads
checkStoreStatus();