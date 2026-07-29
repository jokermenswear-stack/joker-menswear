
let products = {};

fetch("https://joker-menswear-backend.onrender.com/products")
.then(res => res.json())
.then(data => {

    data.forEach(product => {

        products[product.product_code] = {
            name: product.product_name,
            price: "₹" + product.price,
            stock: product.stock,
            status: product.status,
            newArrival: product.new_arrival,
            offer: product.offer,
            images: product.images 
    ? product.images.split(",").map(img => img.trim())
    : [product.image]
        };

    });

    console.log(products);

    renderProducts();

})
.catch(err => {
    console.log("Error:", err);
});

function renderProducts() {

    const shirtBox = document.getElementById("shirtProducts");
    const tshirtBox = document.getElementById("tshirtProducts");
    const pantBox = document.getElementById("pantProducts");

    shirtBox.innerHTML = "";
    tshirtBox.innerHTML = "";
    pantBox.innerHTML = "";
    
    for (let id in products) {

        const product = products[id];

        if (product.status == 0) {
            continue;
        }

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div class="image-slider">

                <button class="arrow" onclick="changeImage('${id}',-1)">◀</button>

<img id="${id}Image" 
src="${product.images[0]}">

<button class="arrow" onclick="changeImage('${id}',1)">▶</button>

<div class="dots" id="${id}Dots"></div>

</div>

<h3>${product.name}</h3>
<h4>${product.price}</h4>

           ${product.stock > 0
    ? `<a href="payment.html?id=${id}">Buy Now</a>`
    : `<button disabled style="background:gray; cursor:not-allowed;">Current Out of Stock</button>`
}
        `;


        if (id.startsWith("SH")) {
            shirtBox.appendChild(card);
        }

        else if (id.startsWith("TS")) {
            tshirtBox.appendChild(card);
        }

        else if (id.startsWith("PANT")) {
            pantBox.appendChild(card);
        }
    }
}
