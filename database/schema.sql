-- Water Blob Store Database Schema

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    inventory INTEGER,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    shipping_address JSONB,
    items JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_session ON orders(stripe_session_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Sample Products
INSERT INTO products (name, description, price, image_url, inventory) VALUES
('Water Blob - Small', 'Perfect for individual use. Compact and portable.', 29.99, 'https://via.placeholder.com/400x400', 50),
('Water Blob - Medium', 'Great for families. Larger capacity and durability.', 49.99, 'https://via.placeholder.com/400x400', 30),
('Water Blob - Large', 'Commercial grade. Maximum capacity and performance.', 89.99, 'https://via.placeholder.com/400x400', 15),
('Water Blob Accessories Pack', 'Everything you need to maintain your Water Blob.', 19.99, 'https://via.placeholder.com/400x400', 100);
