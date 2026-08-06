document.getElementById("productForm").addEventListener("submit", function(e){

    e.preventDefault();


    const product = {

        product_code: document.getElementById("product_code").value,

        product_name: document.getElementById("product_name").value,

        category: document.getElementById("category").value,

        brand: document.getElementById("brand").value,

        price: document.getElementById("price").value,

        offer_price: document.getElementById("offer_price").value,

        stock: document.getElementById("stock").value,

        sizes: document.getElementById("sizes").value,

        image: document.getElementById("image").value,

        images: document.getElementById("images").value,

        video: document.getElementById("video").value,

        description: document.getElementById("description").value,

        status: document.getElementById("status").value,

        new_arrival: document.getElementById("new_arrival").value,

        offer: document.getElementById("offer").value

    };


   fetch("https://joker-menswear.onrender.com/products", {

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify(product)

    })


    .then(res=>res.json())

    .then(data=>{

        alert("Product Added Successfully");

        document.getElementById("productForm").reset();

    })


    .catch(error=>{

        console.log(error);

        alert("Error adding product");

    });


});