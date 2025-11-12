const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080'
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Water Blob Store API is running!' });
});

// ============================================================================
// PRODUCT ROUTES
// ============================================================================

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM products WHERE active = true ORDER BY created_at DESC'
        );
        res.json({ products: result.rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1 AND active = true',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// ============================================================================
// CHECKOUT ROUTES
// ============================================================================

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in cart' });
        }

        // Fetch products from database to verify prices
        const productIds = items.map(item => item.productId);
        const result = await pool.query(
            'SELECT * FROM products WHERE id = ANY($1)',
            [productIds]
        );

        const products = result.rows;

        // Build line items for Stripe
        const lineItems = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            if (!product.active) {
                throw new Error(`Product ${product.name} is no longer available`);
            }

            // Check inventory
            if (product.inventory !== null && product.inventory < item.quantity) {
                throw new Error(`Not enough ${product.name} in stock`);
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        description: product.description,
                        images: product.image_url ? [product.image_url] : []
                    },
                    unit_amount: Math.round(product.price * 100) // Convert to cents
                },
                quantity: item.quantity
            };
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/cart`,
            shipping_address_collection: {
                allowed_countries: ['US'] // Adjust as needed
            },
            metadata: {
                items: JSON.stringify(items)
            }
        });

        res.json({ 
            sessionId: session.id, 
            url: session.url 
        });

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// ORDER ROUTES
// ============================================================================

// Get order by session ID
app.get('/api/order/:sessionId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE stripe_session_id = $1',
            [req.params.sessionId]
        );

        if (result.rows.length === 0) {
            // Try to fetch from Stripe if not in database yet
            const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
            
            return res.json({
                order: {
                    id: null,
                    session_id: session.id,
                    customer_email: session.customer_details?.email,
                    amount: session.amount_total / 100,
                    status: session.payment_status
                }
            });
        }

        res.json({ order: result.rows[0] });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// ============================================================================
// STRIPE WEBHOOK
// ============================================================================

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            // Parse items from metadata
            const items = JSON.parse(session.metadata.items);

            // Create order in database
            const orderResult = await pool.query(
                `INSERT INTO orders 
                (stripe_session_id, customer_email, customer_name, amount, status, shipping_address, items)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    session.id,
                    session.customer_details.email,
                    session.customer_details.name,
                    session.amount_total / 100,
                    'paid',
                    JSON.stringify(session.shipping_details),
                    JSON.stringify(items)
                ]
            );

            // Update inventory for each item
            for (const item of items) {
                await pool.query(
                    'UPDATE products SET inventory = inventory - $1 WHERE id = $2 AND inventory IS NOT NULL',
                    [item.quantity, item.productId]
                );
            }

            console.log('Order created:', orderResult.rows[0]);

            // TODO: Send confirmation email

        } catch (error) {
            console.error('Error processing order:', error);
        }
    }

    res.json({ received: true });
});

// ============================================================================
// ADMIN ROUTES (Add authentication later)
// ============================================================================

// Get all orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100'
        );
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Add new product
app.post('/api/admin/products', async (req, res) => {
    try {
        const { name, description, price, image_url, inventory } = req.body;

        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, inventory, active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING *`,
            [name, description, price, image_url, inventory]
        );

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const { name, description, price, image_url, inventory, active } = req.body;
        
        const result = await pool.query(
            `UPDATE products 
            SET name = $1, description = $2, price = $3, image_url = $4, 
                inventory = $5, active = $6, updated_at = NOW()
            WHERE id = $7
            RETURNING *`,
            [name, description, price, image_url, inventory, active, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log(`Water Blob Store API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end();
    process.exit(0);
});
