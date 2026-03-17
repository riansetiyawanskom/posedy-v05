export interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}
