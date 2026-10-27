"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Customer,
  CustomerClassification,
  Supplier,
  Product,
  Unit,
  CustomerTargetRecord,
  CustomerTargetFormData,
  CustomerTargetMetadataResponse,
} from "../types";
import { toast } from "sonner";

const initialForm: CustomerTargetFormData = {
  customer_id: "",
  classification_id: "",
  supplier_id: "",
  product_id: "",
  date_from: "",
  date_to: "",
  uom_id: "",
  qty: "",
};

export function useCustomerTarget() {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Raw data from server
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [classifications, setClassifications] = useState<CustomerClassification[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<{ supplier_id: number; product_id: number }[]>([]);
  const [targets, setTargets] = useState<CustomerTargetRecord[]>([]);

  // Form State
  const [formData, setFormData] = useState<CustomerTargetFormData>(initialForm);

  // Table filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");
  const [filterClassification, setFilterClassification] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-management/customer-target");
      if (!res.ok) {
        throw new Error("Failed to fetch customer target metadata");
      }
      const data: CustomerTargetMetadataResponse = await res.json();
      setCustomers(data.customers || []);
      setClassifications(data.classifications || []);
      setSuppliers(data.suppliers || []);
      setProducts(data.products || []);
      setUnits(data.units || []);
      setProductSuppliers(data.productSuppliers || []);
      setTargets(data.targets || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handle Customer change:
   * Rule: If selected customer has classification, auto-populate classification dropdown;
   * otherwise leave it blank.
   */
  const handleCustomerChange = (customerId: string) => {
    if (!customerId) {
      setFormData((prev) => ({
        ...prev,
        customer_id: "",
      }));
      return;
    }

    const selectedCust = customers.find((c) => String(c.id) === customerId);
    let matchedClassificationId = "";
    if (selectedCust && selectedCust.classification != null) {
      matchedClassificationId = String(selectedCust.classification);
    }

    setFormData((prev) => ({
      ...prev,
      customer_id: customerId,
      classification_id: matchedClassificationId,
    }));
  };

  /**
   * Handle Classification change:
   * Rule: When classification is selected, customer dropdown filters to customers in that classification.
   * If current selected customer is not in this classification, reset customer selection.
   */
  const handleClassificationChange = (classId: string) => {
    setFormData((prev) => {
      let nextCustomerId = prev.customer_id;
      if (classId) {
        const currentCust = customers.find((c) => String(c.id) === prev.customer_id);
        if (currentCust && String(currentCust.classification) !== classId) {
          nextCustomerId = "";
        }
      }
      return {
        ...prev,
        classification_id: classId,
        customer_id: nextCustomerId,
      };
    });
  };

  /**
   * Handle Supplier change:
   * Rule: If supplier is changed, check if current product belongs to this supplier.
   * If not, reset product_id and uom_id.
   */
  const handleSupplierChange = (suppId: string) => {
    setFormData((prev) => {
      let nextProductId = prev.product_id;
      let nextUomId = prev.uom_id;

      if (suppId && prev.product_id) {
        const allowedProductIds = new Set(
          productSuppliers
            .filter((ps) => String(ps.supplier_id) === suppId)
            .map((ps) => ps.product_id)
        );

        if (!allowedProductIds.has(Number(prev.product_id))) {
          nextProductId = "";
          nextUomId = "";
        }
      }

      return {
        ...prev,
        supplier_id: suppId,
        product_id: nextProductId,
        uom_id: nextUomId,
      };
    });
  };

  /**
   * Handle Product change:
   * When product is chosen, automatically set UOM to that product's unit_of_measurement
   */
  const handleProductChange = (prodId: string) => {
    if (!prodId) {
      setFormData((prev) => ({
        ...prev,
        product_id: "",
        uom_id: "",
      }));
      return;
    }

    const selectedProd = products.find((p) => String(p.product_id) === prodId);
    let defaultUom = formData.uom_id;
    if (selectedProd && selectedProd.unit_of_measurement) {
      defaultUom = String(selectedProd.unit_of_measurement);
    }
    setFormData((prev) => ({
      ...prev,
      product_id: prodId,
      uom_id: defaultUom,
    }));
  };

  /**
   * Handle UOM change:
   * Rule: When a UOM is picked, auto-switch to the exact product variant record
   * that possesses this unit of measurement, so that the correct product and product code
   * are selected and displayed.
   */
  const handleUomChange = (uomId: string) => {
    if (!uomId) {
      setFormData((prev) => ({ ...prev, uom_id: "" }));
      return;
    }

    const currentProd = products.find((p) => String(p.product_id) === formData.product_id);

    if (currentProd) {
      // Find related variants of this product (same parent_id or same product_name or parent itself)
      const parentId = currentProd.parent_id;
      const matchedVariant = products.find((p) => {
        if (String(p.unit_of_measurement) !== uomId) return false;

        // 1. Matches by parent_id
        if (parentId && (p.parent_id === parentId || p.product_id === parentId)) return true;
        if (p.parent_id === currentProd.product_id) return true;

        // 2. Matches by same base product_name
        if (
          p.product_name &&
          currentProd.product_name &&
          p.product_name.trim().toLowerCase() === currentProd.product_name.trim().toLowerCase()
        ) {
          return true;
        }

        return false;
      });

      if (matchedVariant) {
        setFormData((prev) => ({
          ...prev,
          product_id: String(matchedVariant.product_id),
          uom_id: uomId,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      uom_id: uomId,
    }));
  };

  /**
   * Available Units for the currently selected product.
   * If a product is selected, filter units to only those available for that product & its variants.
   */
  const availableUnits = useMemo(() => {
    if (!formData.product_id) {
      return units;
    }

    const currentProd = products.find((p) => String(p.product_id) === formData.product_id);
    if (!currentProd) return units;

    const parentId = currentProd.parent_id;

    // Find all variants for this product
    const relatedVariants = products.filter((p) => {
      if (p.product_id === currentProd.product_id) return true;
      if (parentId && (p.parent_id === parentId || p.product_id === parentId)) return true;
      if (p.parent_id === currentProd.product_id) return true;
      if (
        p.product_name &&
        currentProd.product_name &&
        p.product_name.trim().toLowerCase() === currentProd.product_name.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });

    const variantUomIds = new Set(
      relatedVariants
        .map((p) => p.unit_of_measurement)
        .filter((uom): uom is number => uom != null && uom > 0)
    );

    if (variantUomIds.size === 0) {
      return units;
    }

    const filtered = units.filter((u) => variantUomIds.has(u.unit_id));
    return filtered.length > 0 ? filtered : units;
  }, [formData.product_id, products, units]);

  /**
   * Filtered customer options based on selected classification:
   * If classification is selected, show only customers assigned to that classification.
   * Otherwise show all customers.
   */
  const filteredCustomers = useMemo(() => {
    if (!formData.classification_id) {
      return customers;
    }
    return customers.filter(
      (c) => String(c.classification) === formData.classification_id
    );
  }, [customers, formData.classification_id]);

  /**
   * Filtered products based on selected supplier:
   * If a supplier is chosen, only display products that are linked via product_per_supplier.
   * Otherwise, show all products.
   */
  const filteredProducts = useMemo(() => {
    if (!formData.supplier_id) {
      return products;
    }

    const supplierIdNum = Number(formData.supplier_id);
    const linkedProductIds = new Set(
      productSuppliers
        .filter((ps) => ps.supplier_id === supplierIdNum)
        .map((ps) => ps.product_id)
    );

    return products.filter((p) => linkedProductIds.has(p.product_id));
  }, [products, productSuppliers, formData.supplier_id]);

  /**
   * Lookups for fast display in table
   */
  const customerById = useMemo(() => {
    const map = new Map<number, Customer>();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const classificationById = useMemo(() => {
    const map = new Map<number, CustomerClassification>();
    classifications.forEach((c) => map.set(c.id, c));
    return map;
  }, [classifications]);

  const supplierById = useMemo(() => {
    const map = new Map<number, Supplier>();
    suppliers.forEach((s) => map.set(s.id, s));
    return map;
  }, [suppliers]);

  const productById = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.product_id, p));
    return map;
  }, [products]);

  const unitById = useMemo(() => {
    const map = new Map<number, Unit>();
    units.forEach((u) => map.set(u.unit_id, u));
    return map;
  }, [units]);

  // Enriched targets with joined names
  const enrichedTargets = useMemo(() => {
    return targets.map((t) => {
      const cust = t.customer_id ? customerById.get(t.customer_id) : undefined;
      const cls = t.classification_id ? classificationById.get(t.classification_id) : undefined;
      const supp = t.supplier_id ? supplierById.get(t.supplier_id) : undefined;
      const prod = t.product_id ? productById.get(t.product_id) : undefined;
      const uom = t.uom_id ? unitById.get(t.uom_id) : undefined;

      return {
        ...t,
        customer_name: cust?.customer_name || `Customer #${t.customer_id}`,
        customer_code: cust?.customer_code || "-",
        classification_name: cls?.classification_name || "-",
        supplier_name: supp?.supplier_name || (t.supplier_id ? `Supplier #${t.supplier_id}` : "-"),
        product_name: prod?.product_name || (t.product_id ? `Product #${t.product_id}` : "-"),
        product_code: prod?.product_code || "-",
        uom_name: uom?.unit_name || (t.uom_id ? `UOM #${t.uom_id}` : "-"),
      };
    });
  }, [targets, customerById, classificationById, supplierById, productById, unitById]);

  // Filtered targets for table search
  const filteredTargets = useMemo(() => {
    return enrichedTargets.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSupplier =
        !filterSupplier || String(t.supplier_id) === filterSupplier;

      const matchesClassification =
        !filterClassification || String(t.classification_id) === filterClassification;

      return matchesSearch && matchesSupplier && matchesClassification;
    });
  }, [enrichedTargets, searchTerm, filterSupplier, filterClassification]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast.error("Please select a customer.");
      return;
    }
    if (!formData.date_from || !formData.date_to) {
      toast.error("Please select both Date From and Date To.");
      return;
    }
    if (new Date(formData.date_from) > new Date(formData.date_to)) {
      toast.error("Date From cannot be later than Date To.");
      return;
    }
    if (!formData.qty || Number(formData.qty) < 0 || isNaN(Number(formData.qty))) {
      toast.error("Please input a valid Target Quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales-management/customer-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to create customer target.");
      }

      toast.success("Customer Target saved successfully!");
      // Reset form fields
      setFormData(initialForm);
      // Reload targets
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving customer target";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete target record
  const handleDeleteTarget = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sales-management/customer-target?id=${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete target");
      }
      toast.success("Target deleted successfully");
      setTargets((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting target";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return {
    loading,
    submitting,
    deletingId,
    formData,
    setFormData,
    customers,
    filteredCustomers,
    classifications,
    suppliers,
    products,
    filteredProducts,
    units,
    targets: filteredTargets,
    allTargetsCount: targets.length,
    searchTerm,
    setSearchTerm,
    filterSupplier,
    setFilterSupplier,
    filterClassification,
    setFilterClassification,
    availableUnits,
    handleCustomerChange,
    handleClassificationChange,
    handleSupplierChange,
    handleProductChange,
    handleUomChange,
    handleSubmit,
    handleDeleteTarget,
    refreshData: fetchData,
  };
}
