const urlParams = new URLSearchParams(window.location.search);

const productId = urlParams.get("id");


// Load product details

fetch(`https://joker-menswear-backend.onrender.com/products/${productId}`)

.then(res => res.json())

.then(product => {


    document.getElementById("product_code").value = product.product_code || "";

    document.getElementById("product_name").value = product.product_name || "";

    document.getElementById("category").value = product.category || "";

    document.getElementById("brand").value = product.brand || "";

    document.getElementById("price").value = product.price || "";

    document.getElementById("stock").value = product.stock || "";

    document.getElementById("image").value = product.image || "";

    document.getElementById("description").value = product.description || "";

    document.getElementById("status").value = product.status;


})

.catch(err => {

    console.log(err);

});



// Update Product

document.getElementById("editForm").addEventListener("submit", function(e){


    e.preventDefault();


    const updatedProduct = {


        product_code: document.getElementById("product_code").value,

        product_name: document.getElementById("product_name").value,

        category: document.getElementById("category").value,

        brand: document.getElementById("brand").value,

        price: document.getElementById("price").value,

        stock: document.getElementById("stock").value,

        image: document.getElementById("image").value,

        description: document.getElementById("description").value,

        status: document.getElementById("status").value,

        new_arrival: 0,

        offer: 0

    };



   fetch(`https://joker-menswear-backend.onrender.com/products/${productId}`, {


        method:"PUT",


        headers:{

            "Content-Type":"application/json"

        },


        body:JSON.stringify(updatedProduct)


    })


    .then(res=>res.json())


    .then(data=>{


        alert(data.message);


        window.location.href="products.html";


    });


});