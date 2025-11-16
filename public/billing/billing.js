const orderQty = document.getElementById("orderQty");
const productId = document.getElementById("productId").value;
let totalPrice = document.getElementById("totalPrice");
const productRetailPrice = parseFloat(document.getElementById("productRetailPrice").value);
const productWholesalePrice = parseFloat(document.getElementById("productWholesalePrice").value);
orderQty.addEventListener('input', ()=>{
    let qty=parseInt(orderQty.value)||0;
    totalPrice.value=qty>=10?(qty*productWholesalePrice).toFixed(2):(qty*productRetailPrice).toFixed(2);
});

const billingForm = document.getElementById("billingForm");

billingForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    try {
        const response = await fetch("/billing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, qty:orderQty.value, totalPrice:totalPrice.value })
        });
        const result = await response.json();

        if (result.success) {
            alert("Order placed successfully!");
            window.location.href = "/orders";
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Request failed.");
        console.error(err);
    }
});

