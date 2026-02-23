// ── Maintenance Mode Flag ──
// Set to true to disable all Add to Cart functionality site-wide.
// Set back to false to re-enable purchasing.
const CART_MAINTENANCE_MODE = true;

// Check if localStorage is available (some browsers/modes block it)
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Fallback in-memory cart for when localStorage is unavailable
let memoryCart = [];

function getCart() {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage unavailable, using in-memory cart');
        return memoryCart;
    }

    try {
        const cart = localStorage.getItem('cart');
        if (!cart) {
            return [];
        }

        const parsed = JSON.parse(cart);

        // Validate that cart is actually an array
        if (!Array.isArray(parsed)) {
            console.error('Cart data is corrupted (not an array), resetting cart');
            localStorage.removeItem('cart');
            return [];
        }

        return parsed;
    } catch (e) {
        console.error('Error reading cart from localStorage:', e);
        // Clear corrupted data
        try {
            localStorage.removeItem('cart');
        } catch (clearError) {
            console.error('Failed to clear corrupted cart:', clearError);
        }
        return [];
    }
}

function saveCart(cart) {
    // Validate that cart is an array before saving
    if (!Array.isArray(cart)) {
        console.error('Attempted to save invalid cart data (not an array)');
        cart = [];
    }

    if (!isLocalStorageAvailable()) {
        console.warn('localStorage unavailable, cart will not persist');
        memoryCart = cart;
        updateCartCount();
        return;
    }

    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    } catch (e) {
        console.error('Error saving cart to localStorage:', e);
        memoryCart = cart;
        updateCartCount();
    }
}

let cartToastTimeout;

function showCartToast(message) {
    let toast = document.querySelector('.cart-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <div class="cart-toast__icon">🛒</div>
            <div class="cart-toast__text"></div>
            <button class="cart-toast__close" type="button" aria-label="Dismiss notification">×</button>
        `;
        document.body.appendChild(toast);
        toast.querySelector('.cart-toast__close').addEventListener('click', () => {
            toast.classList.remove('cart-toast--visible');
        });
    }

    const textEl = toast.querySelector('.cart-toast__text');
    if (textEl) textEl.textContent = message;

    toast.classList.add('cart-toast--visible');

    if (cartToastTimeout) clearTimeout(cartToastTimeout);
    cartToastTimeout = setTimeout(() => {
        toast.classList.remove('cart-toast--visible');
    }, 2500);
}

function addToCart(product, quantity = 1, customization = null, customImage = null) {
    if (CART_MAINTENANCE_MODE) {
        showCartToast('Store is under maintenance — ordering will be back soon!');
        return;
    }

    const cart = getCart();

    // For customized items, don't merge with existing - each customization is unique
    const shouldMerge = !customization;
    const existingItem = shouldMerge ? cart.find(item => item.productId === product.id && !item.customization) : null;

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const cartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: quantity
        };

        // Add customization if provided
        if (customization) {
            cartItem.customization = customization;
        }

        // Add custom image if provided
        if (customImage) {
            cartItem.customImage = customImage;
        }

        cart.push(cartItem);
    }

    saveCart(cart);

    // Analytics: explicit add_to_cart event
    if (window.wbAnalytics && typeof window.wbAnalytics.trackCustom === 'function') {
        try {
            window.wbAnalytics.trackCustom('add_to_cart', {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity
            });
        } catch (e) {
            console.warn('Analytics add_to_cart failed', e);
        }
    }

    showCartToast(`${product.name} added to cart`);
}

function removeFromCart(productId) {
    let cart = getCart();
    // Convert to string for comparison to handle type mismatches
    cart = cart.filter(item => String(item.productId) !== String(productId));
    saveCart(cart);
    updateCartCount();
    if (window.location.pathname.includes('cart.html') && typeof loadCartPage === 'function') {
        loadCartPage();
    }
}

function updateQuantity(productId, quantity) {
    const cart = getCart();
    // Convert to string for comparison to handle type mismatches
    const item = cart.find(item => String(item.productId) === String(productId));

    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
            updateCartCount();
            if (window.location.pathname.includes('cart.html') && typeof loadCartPage === 'function') {
                loadCartPage();
            }
        }
    }
}

function clearCart() {
    if (isLocalStorageAvailable()) {
        try {
            localStorage.removeItem('cart');
        } catch (e) {
            console.error('Error clearing cart from localStorage:', e);
        }
    }
    memoryCart = [];
    updateCartCount();
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const cart = getCart();

    // Extra safety check in case getCart returns something unexpected
    if (!Array.isArray(cart)) {
        console.error('updateCartCount: cart is not an array');
        const cartCountElements = document.querySelectorAll('#cart-count');
        cartCountElements.forEach(el => el.textContent = '0');
        return;
    }

    const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(el => el.textContent = count);
}

function loadCartPage() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        cartItemsContainer.style.display = 'none';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartItemsContainer.style.display = 'block';
    cartSummary.style.display = 'block';
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
                <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateQuantity(${item.productId}, parseInt(this.value))">
                <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
            </div>
            <div class="item-total">
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.productId})">Remove</button>
        </div>
    `).join('');
    
    const total = getCartTotal();
    document.getElementById('subtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartCount);
} else {
    updateCartCount();
}
