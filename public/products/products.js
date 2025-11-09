const addProductSection = document.getElementById("addProductSection");
const productSection = document.getElementById("productSection");
function addProduct() {
    productSection.classList.add('invisible');
    addProductSection.classList.remove('invisible');
}

function cancel(){
    productSection.classList.remove('invisible');
    addProductSection.classList.add('invisible');
}

function openMenu(btn) {
    let menu = btn.nextElementSibling;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}
