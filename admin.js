fetch("http://localhost:3000/products")
.then(res => res.json())
.then(data => {
    console.log(data);
})
.catch(err => {
    console.log("Error:", err);
});
// Add Product
function addProduct(){
    const id = document.getElementById("product_id").value;

if(id){
    updateProduct(id);
    return;
}

    const product = {

        product_name: document.getElementById("product_name").value,
        category: document.getElementById("category").value,
        price: document.getElementById("price").value,
        image: document.getElementById("image").value,
        description: document.getElementById("description").value,
        status: document.getElementById("status").value,
        new_arrival: document.getElementById("new_arrival").value,
        offer: document.getElementById("offer").value

    };


    fetch("http://localhost:3000/products", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(product)

    })

    .then(res => res.json())

    .then(data => {

        alert("Product Added Successfully");

        console.log(data);

    })

    .catch(err => {

        console.log(err);
        alert("Error adding product");

    });

}
// Load Products

function loadProducts(){

    fetch("http://localhost:3000/products")

    .then(res => res.json())

    .then(products => {

        let table = "";

        products.forEach(product => {

            table += `
            <tr>
                <td>${product.id}</td>
                <td>${product.product_name}</td>
                <td>${product.category}</td>
                <td>${product.price}</td>
                <td>${product.status == 1 ? "Show" : "Hide"}</td>
                <td>
                    <button onclick="editProduct(${product.id})">Edit</button>

<button onclick="deleteProduct(${product.id})">
Delete
</button>
                </td>
            </tr>
            `;

        });


        document.getElementById("productsTable").innerHTML = table;

    })

    .catch(err => console.log(err));

}


// Run when page opens
loadProducts();
// Upload Excel File

function uploadExcel(){

    const file = document.getElementById("excelFile").files[0];

    if(!file){
        alert("Please select an Excel file");
        return;
    }


    const formData = new FormData();

    formData.append("file", file);


    fetch("http://localhost:3000/upload-products", {

        method: "POST",
        body: formData

    })

    .then(res => res.json())

    .then(data => {

        alert(data.message);

        loadProducts();

    })

    .catch(err => {

        console.log(err);
        alert("Upload failed");

    });

}
// Delete Product

function deleteProduct(id){

    if(confirm("Are you sure you want to delete this product?")){

        fetch(`http://localhost:3000/products/${id}`, {
            method: "DELETE"
        })

        .then(res => res.json())

        .then(data => {

            alert(data.message);

            loadProducts();

        })

        .catch(err => {

            console.log(err);
            alert("Delete failed");

        });

    }

}
// Edit Product

function editProduct(id){

    console.log("Editing product:", id);

    fetch(`http://localhost:3000/products/${id}`)

    .then(res => res.json())

    .then(product => {

        document.getElementById("product_id").value = product.id;

        document.getElementById("product_name").value = product.product_name;

        document.getElementById("category").value = product.category;

        document.getElementById("price").value = product.price;

        document.getElementById("image").value = product.image;

        document.getElementById("description").value = product.description;

        document.getElementById("status").value = product.status;

        document.getElementById("new_arrival").value = product.new_arrival;

        document.getElementById("offer").value = product.offer;


        document.getElementById("productButton").innerHTML = "Update Product";

    });

}
// Update Product

function updateProduct(id){

    const product = {

        product_name: document.getElementById("product_name").value,
        category: document.getElementById("category").value,
        price: document.getElementById("price").value,
        image: document.getElementById("image").value,
        description: document.getElementById("description").value,
        status: document.getElementById("status").value,
        new_arrival: document.getElementById("new_arrival").value,
        offer: document.getElementById("offer").value

    };


    fetch(`http://localhost:3000/products/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(product)

    })

    .then(res => res.json())

    .then(data => {

        alert("Product Updated Successfully");

        loadProducts();

        document.getElementById("product_id").value = "";

        document.getElementById("productButton").innerHTML = "Add Product";

    })

    .catch(err => {

        console.log(err);

    });

}