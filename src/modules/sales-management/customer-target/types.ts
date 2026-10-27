export interface Customer {
  id: number;
  customer_code?: string;
  customer_name: string;
  store_name?: string;
  classification?: number | null;
  city?: string;
  province?: string;
  isActive?: number;
}

export interface CustomerClassification {
  id: number;
  classification_name: string;
}

export interface Supplier {
  id: number;
  supplier_name: string;
  supplier_shortcut?: string;
  supplier_type?: string;
  isActive?: number;
}

export interface Product {
  product_id: number;
  product_name: string;
  product_code?: string;
  parent_id?: number | null;
  unit_of_measurement?: number;
  product_brand?: number;
  isActive?: number;
}

export interface Unit {
  unit_id: number;
  unit_name: string;
  unit_shortcut?: string;
}

export interface CustomerTargetRecord {
  id: number;
  customer_id: number | null;
  classification_id: number | null;
  supplier_id: number | null;
  date_from: string;
  date_to: string;
  uom_id: number | null;
  product_id: number | null;
  qty: number | string;
  created_at?: string;
  created_by?: number | null;
  updated_at?: string;
  updated_by?: number | null;
  // Joined/display fields
  customer_name?: string;
  customer_code?: string;
  classification_name?: string;
  supplier_name?: string;
  product_name?: string;
  product_code?: string;
  uom_name?: string;
  creator_name?: string;
}

export interface CustomerTargetFormData {
  customer_id: string;
  classification_id: string;
  supplier_id: string;
  product_id: string;
  date_from: string;
  date_to: string;
  uom_id: string;
  qty: string;
}

export interface ProductPerSupplier {
  id?: number;
  supplier_id: number;
  product_id: number;
}

export interface CustomerTargetMetadataResponse {
  customers: Customer[];
  classifications: CustomerClassification[];
  suppliers: Supplier[];
  products: Product[];
  units: Unit[];
  productSuppliers: ProductPerSupplier[];
  targets: CustomerTargetRecord[];
}
