-- 1. Table: products (Catalog)
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    price_usd numeric(12,2) NOT NULL,
    category text,
    image_url text
);

-- 2. Table: sales (Transaction headers)
CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    customer_name text NOT NULL,
    customer_cedula text NOT NULL, -- Cedula or RIF
    customer_phone text,
    total_usd numeric(12,2) NOT NULL,
    total_bs numeric(12,2) NOT NULL,
    rate numeric(12,2) NOT NULL,
    payment_cash_usd numeric(12,2) DEFAULT 0,
    payment_cash_bs numeric(12,2) DEFAULT 0,
    payment_pos_bs numeric(12,2) DEFAULT 0,
    payment_transfer_bs numeric(12,2) DEFAULT 0,
    receipt_number text,
    status text,
    payment_details jsonb,
    synced_at timestamp with time zone DEFAULT now()
);

-- 3. Table: sale_items (Transaction details)
CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
    product_name text NOT NULL, -- Decoupled snapshot of product name
    price_usd numeric(12,2) NOT NULL,
    weight_kg numeric(12,3) NOT NULL,
    total_bs numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (Optional but recommended)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Create default policies for public access (Adjust for production)
CREATE POLICY "Allow public read for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert for sale_items" ON public.sale_items FOR INSERT WITH CHECK (true);
