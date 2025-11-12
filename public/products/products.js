 // Elements
        const addProductBtn = document.getElementById('addProductBtn');
        const addProductOverlay = document.getElementById('addProductOverlay');
        const cancelBtn = document.getElementById('cancelBtn');
        const itemForm = document.getElementById('itemForm');
        const inventoryBody = document.getElementById('inventoryBody');

        // Open popup
        addProductBtn.addEventListener('click', () => {
            addProductOverlay.classList.remove('hidden');
        });

        // Close popup
        cancelBtn.addEventListener('click', () => {
            addProductOverlay.classList.add('hidden');
            itemForm.reset();
        });

        // Handle form submit
        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productData = {
                productName: document.getElementById('itemName').value.trim(),
                category: document.getElementById('itemCategory').value,
                retailPrice: document.getElementById('itemRetailPrice').value,
                wholesalePrice: document.getElementById('itemWholesalePrice').value,
                quantity: document.getElementById('itemQuantity').value                
            };

            try {
                const response = await fetch('/products/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                const result = await response.json();

                if (result.success) {
                    // Optionally reload table or append new row
                    location.reload();
                } else {
                    alert('Failed to add product');
                }
            } catch (err) {
                alert('Request failed');
            }
        });