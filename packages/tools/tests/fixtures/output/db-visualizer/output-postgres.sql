-- Database Schema: e-commerce
-- Dialect: postgresql

-- Registered users table
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" VARCHAR(20) NOT NULL DEFAULT 'customer',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);

CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_role" ON "users" ("role");

CREATE TABLE "products" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "category_id" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
);

CREATE INDEX "idx_products_category" ON "products" ("category_id");
CREATE INDEX "idx_products_price" ON "products" ("price");

CREATE TABLE "categories" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "parent_id" INTEGER,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_name_unique" UNIQUE ("name"),
  CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories" ("id")
);

CREATE TABLE "orders" (
  "id" SERIAL NOT NULL,
  "user_id" UUID NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
);

CREATE INDEX "idx_orders_user" ON "orders" ("user_id");
CREATE INDEX "idx_orders_status" ON "orders" ("status");

CREATE TABLE "order_items" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id"),
  CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
);

CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id");
CREATE INDEX "idx_order_items_product" ON "order_items" ("product_id");
