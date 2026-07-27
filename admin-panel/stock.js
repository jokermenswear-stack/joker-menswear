const API = "http://localhost:3000";


function loadStock(){

    fetch(API + "/products")

    .then(res => res.json())

    .then(products => {


        const stockList = document.getElementById("stockList");

        stockList.innerHTML = "";


        products.forEach(product => {


            stockList.innerHTML += `

            <tr>

                <td>${product.id}</td>

                <td>${product.product_code || "-"}</td>

                <td>${product.product_name}</td>

                <td>${product.category}</td>


                <td>
                    ${product.stock || 0}
                </td>


                <td>

                    <button onclick="changeStock(${product.id}, 'add')">
                        + Add
                    </button>

                </td>


                <td>

                    <button onclick="changeStock(${product.id}, 'remove')">
                        - Remove
                    </button>

                </td>


            </tr>

            `;


        });


    })

    .catch(error => {

        console.log("Stock Error:", error);

    });


}



function changeStock(id, action){


    let amount = prompt("Enter quantity:");

    
    if(amount === null || amount === ""){
        return;
    }


    amount = Number(amount);


    if(amount <= 0){

        alert("Enter valid quantity");

        return;

    }



    fetch(API + "/products/" + id)

    .then(res => res.json())

    .then(product => {


        let currentStock = Number(product.stock || 0);


        let newStock;


        if(action === "add"){

            newStock = currentStock + amount;

        }

        else{

            newStock = currentStock - amount;

        }



        if(newStock < 0){

            alert("Stock cannot be negative");

            return;

        }



        fetch(API + "/products/" + id, {

            method:"PUT",

            headers:{
                "Content-Type":"application/json"
            },


            body:JSON.stringify({

                product_code: product.product_code,
                product_name: product.product_name,
                category: product.category,
                brand: product.brand,
                price: product.price,
                image: product.image,
                description: product.description,
                status: product.status,
                new_arrival: product.new_arrival || 0,
                offer: product.offer || 0,
                stock: newStock

            })

        })


        .then(res=>res.json())


        .then(data=>{

            alert("Stock Updated");

            loadStock();

        });


    });


}



loadStock();