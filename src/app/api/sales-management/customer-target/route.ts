import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIRECTUS_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || "";

const fetchHeaders = {
  Authorization: `Bearer ${STATIC_TOKEN}`,
  "Content-Type": "application/json",
};

function decodeUserIdFromJwt(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadPart = parts[1];
    const pad = "=".repeat((4 - (payloadPart.length % 4)) % 4);
    const b64 = (payloadPart + pad).replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(b64, "base64").toString("utf8");
    const payload = JSON.parse(jsonStr);
    const userId = Number(payload.sub || payload.id);
    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!DIRECTUS_URL) {
    return NextResponse.json({ error: "Directus API URL not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const customerId = searchParams.get("customer_id");
  const classificationId = searchParams.get("classification_id");
  const supplierId = searchParams.get("supplier_id");

  try {
    // Build query filters for targets
    const targetFilterParams = new URLSearchParams();
    targetFilterParams.set("limit", "-1");
    targetFilterParams.set("sort", "-id");

    if (dateFrom) targetFilterParams.set("filter[date_from][_gte]", dateFrom);
    if (dateTo) targetFilterParams.set("filter[date_to][_lte]", dateTo);
    if (customerId) targetFilterParams.set("filter[customer_id][_eq]", customerId);
    if (classificationId) targetFilterParams.set("filter[classification_id][_eq]", classificationId);
    if (supplierId) targetFilterParams.set("filter[supplier_id][_eq]", supplierId);

    const [
      customersRes,
      classificationsRes,
      suppliersRes,
      productsRes,
      unitsRes,
      productSuppliersRes,
      targetsRes,
    ] = await Promise.all([
      fetch(`${DIRECTUS_URL}/items/customer?fields=id,customer_code,customer_name,store_name,classification,city,province,isActive&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/customer_classification?fields=id,classification_name&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/suppliers?fields=id,supplier_name,supplier_shortcut,supplier_type,isActive&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/products?fields=product_id,product_name,product_code,parent_id,unit_of_measurement,product_brand,isActive&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/units?fields=unit_id,unit_name,unit_shortcut&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/product_per_supplier?fields=id,supplier_id,product_id&limit=-1`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
      fetch(`${DIRECTUS_URL}/items/target_setting_customer?${targetFilterParams.toString()}`, {
        headers: fetchHeaders,
        cache: "no-store",
      }),
    ]);

    const customersJson = await customersRes.json().catch(() => ({ data: [] }));
    const classificationsJson = await classificationsRes.json().catch(() => ({ data: [] }));
    const suppliersJson = await suppliersRes.json().catch(() => ({ data: [] }));
    const productsJson = await productsRes.json().catch(() => ({ data: [] }));
    const unitsJson = await unitsRes.json().catch(() => ({ data: [] }));
    const productSuppliersJson = await productSuppliersRes.json().catch(() => ({ data: [] }));
    const targetsJson = await targetsRes.json().catch(() => ({ data: [] }));

    return NextResponse.json({
      customers: customersJson.data || [],
      classifications: classificationsJson.data || [],
      suppliers: suppliersJson.data || [],
      products: productsJson.data || [],
      units: unitsJson.data || [],
      productSuppliers: productSuppliersJson.data || [],
      targets: targetsJson.data || [],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to fetch customer target metadata", details: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!DIRECTUS_URL) {
    return NextResponse.json({ error: "Directus API URL not configured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("vos_access_token")?.value;
  const currentUserId = token ? decodeUserIdFromJwt(token) : null;

  try {
    const body = await req.json();
    const {
      customer_id,
      classification_id,
      supplier_id,
      product_id,
      date_from,
      date_to,
      uom_id,
      qty,
    } = body;

    if (!customer_id) {
      return NextResponse.json({ error: "Customer is required." }, { status: 400 });
    }
    if (!date_from || !date_to) {
      return NextResponse.json({ error: "Date range (Date From & Date To) is required." }, { status: 400 });
    }
    if (qty == null || Number(qty) < 0 || isNaN(Number(qty))) {
      return NextResponse.json({ error: "Valid target quantity is required." }, { status: 400 });
    }

    const payload = {
      customer_id: Number(customer_id),
      classification_id: classification_id ? Number(classification_id) : null,
      supplier_id: supplier_id ? Number(supplier_id) : null,
      product_id: product_id ? Number(product_id) : null,
      date_from,
      date_to,
      uom_id: uom_id ? Number(uom_id) : null,
      qty: Number(qty),
      created_by: currentUserId,
      updated_by: currentUserId,
    };

    const res = await fetch(`${DIRECTUS_URL}/items/target_setting_customer`, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { error: json?.errors?.[0]?.message || "Failed to create customer target" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, data: json?.data }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create target", details: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!DIRECTUS_URL) {
    return NextResponse.json({ error: "Directus API URL not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/target_setting_customer/${id}`, {
      method: "DELETE",
      headers: fetchHeaders,
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return NextResponse.json(
        { error: json?.errors?.[0]?.message || "Failed to delete customer target" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: "Target deleted successfully" }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Failed to delete target", details: errorMsg }, { status: 500 });
  }
}
