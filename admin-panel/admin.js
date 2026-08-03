function login() {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    fetch("https://joker-menswear-backend.onrender.com/admin-login", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            username: username,
            password: password
        })

    })

    .then(res => res.json())

    .then(data => {

        if (data.success) {

            localStorage.setItem("adminLoggedIn", "true");

            alert("Login Successful");

            // Open the dashboard on the website service
            window.location.href = "https://joker-menswear.onrender.com/admin-panel/dashboard.html";

        } else {

            alert("Wrong Username or Password");

        }

    })

    .catch(error => {

        console.log(error);
        alert("Server connection failed");

    });

}