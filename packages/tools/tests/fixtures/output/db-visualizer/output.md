# Database Schema: e-commerce

## Tables

### users

> Registered users table

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | uuid | No | PK | gen_random_uuid() | - |
| email | varchar(255) | No | UQ | - | - |
| name | varchar(100) | No |  | - | - |
| password_hash | varchar(255) | No |  | - | - |
| role | varchar(20) | No |  | 'customer' | - |
| created_at | timestamp | No |  | now() | - |

**Indexes:**
- `idx_users_email`: email (unique)
- `idx_users_role`: role

### products

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | serial | No | PK | - | - |
| name | varchar(200) | No |  | - | - |
| description | text | Yes |  | - | - |
| price | decimal(10,2) | No |  | - | - |
| stock | integer | No |  | 0 | - |
| category_id | integer | Yes | FK | - | - |
| created_at | timestamp | No |  | now() | - |

**Indexes:**
- `idx_products_category`: category_id
- `idx_products_price`: price

### categories

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | serial | No | PK | - | - |
| name | varchar(100) | No | UQ | - | - |
| parent_id | integer | Yes | FK | - | - |

### orders

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | serial | No | PK | - | - |
| user_id | uuid | No | FK | - | - |
| total | decimal(10,2) | No |  | - | - |
| status | varchar(20) | No |  | 'pending' | - |
| created_at | timestamp | No |  | now() | - |

**Indexes:**
- `idx_orders_user`: user_id
- `idx_orders_status`: status

### order_items

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | serial | No | PK | - | - |
| order_id | integer | No | FK | - | - |
| product_id | integer | No | FK | - | - |
| quantity | integer | No |  | - | - |
| unit_price | decimal(10,2) | No |  | - | - |

**Indexes:**
- `idx_order_items_order`: order_id
- `idx_order_items_product`: product_id

## Relationships

| From | To | Type |
|------|----|----|
| products.category_id | categories.id | one-to-many |
| categories.parent_id | categories.id | one-to-many |
| orders.user_id | users.id | one-to-many |
| order_items.order_id | orders.id | one-to-many |
| order_items.product_id | products.id | one-to-many |