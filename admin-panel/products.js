fetch("https://joker-menswear.onrender.com/products")

.then(res => res.json())

.then(products => {

    let table = document.getElementById("productList");


    products.forEach(product => {


        let row = document.createElement("tr");


      row.innerHTML = `
    <td><input type="checkbox" class="product-checkbox" value="${product.id}"></td>
    <td>${product.id}</td>
    <td>${product.product_code || "-"}</td>
    <td>${product.product_name}</td>
    <td>${product.category}</td>
    <td>₹${product.price}</td>
    <td>${product.stock || 0}</td>
    <td>
        <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
        <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
    </td>
`;


        table.appendChild(row);


    });


})


.catch(error => {

    console.log("Error:", error);

});



function deleteProduct(id){


    if(confirm("Delete this product?")){


       fetch(`https://joker-menswear.onrender.com/products/${id}`, {

            method:"DELETE"

        })


        .then(res => res.json())


        .then(data => {


            alert(data.message);

            location.reload();


        });


    }

}
function editProduct(id){

    window.location.href = "edit-product.html?id=" + id;

}