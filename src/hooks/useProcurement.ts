import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BridgeSpan, ExtraItem } from "@/data/bridgeConfig";
import { ComponentItem } from "@/data/components";
import { buildMaterialsList, MaterialRow } from "@/lib/materialsList";
import {
  SENSOR_PROD_KEY,
  SENSOR_PROD_LABEL,
  SENSOR_PRODUCTION_ITEMS,
} from "@/data/sensorProduction";

export type PurchaseStatus = "nao" | "parcial" | "sim";

export interface ProcurementRow {
  id?: string;
  budget_id: string;
  user_id: string;
  bridge_key: string;
  bridge_name: string;
  category: string;
  component_id: string;
  component_name: string;
  unit: string;
  qty: number;
  unit_price_ref: number;
  total_ref: number;
  purchase_status: PurchaseStatus;
  amount_paid: number;
  supplier: string;
  purchase_date: string | null;
  delivery_status: PurchaseStatus;
  delivery_date: string | null;
  notes: string;
  purchase_url: string;
  original_currency: "BRL" | "USD";
  original_unit_price: number;
  qty_per_sensor: number;
  in_scope: boolean;
}

export type ProcurementEditable = Pick<
  ProcurementRow,
  | "purchase_status"
  | "amount_paid"
  | "supplier"
  | "purchase_date"
  | "delivery_status"
  | "delivery_date"
  | "notes"
  | "unit_price_ref"
  | "total_ref"
  | "purchase_url"
>;


type Key = string; // `${bridge_key}|${component_id}`
const rowKey = (bridgeKey: string, componentId: string) => `${bridgeKey}|${componentId}`;

interface UseProcurementOptions {
  budgetId: string | null;
  bridges: BridgeSpan[];
  components: ComponentItem[];
  globalExtras: ExtraItem[];
}

export function useProcurement({
  budgetId,
  bridges,
  components,
  globalExtras,
}: UseProcurementOptions) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Map<Key, ProcurementRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [savingCount, setSavingCount] = useState(0);

  const timers = useRef<Map<Key, ReturnType<typeof setTimeout>>>(new Map());

  // Lista canônica de materiais derivada do orçamento atual.
  const canonical = useMemo<MaterialRow[]>(
    () => buildMaterialsList(bridges, components, globalExtras),
    [bridges, components, globalExtras]
  );

  // Carrega do banco e faz merge com a lista canônica.
  const loadAndSync = useCallback(async () => {
    if (!budgetId || !user) {
      // Sem orçamento salvo: usa apenas a lista canônica em memória.
      const map = new Map<Key, ProcurementRow>();
      canonical.forEach((m) => {
        const k = rowKey(m.bridgeKey, m.componentId);
        map.set(k, {
          budget_id: "",
          user_id: user?.id || "",
          bridge_key: m.bridgeKey,
          bridge_name: m.bridgeName,
          category: m.category,
          component_id: m.componentId,
          component_name: m.componentName,
          unit: m.unit,
          qty: m.qty,
          unit_price_ref: m.unitPrice,
          total_ref: m.total,
          purchase_status: "nao",
          amount_paid: 0,
          supplier: "",
          purchase_date: null,
          delivery_status: "nao",
          delivery_date: null,
          notes: "",
          purchase_url: "",
          original_currency: "BRL",
          original_unit_price: m.unitPrice,
          qty_per_sensor: 0,
          in_scope: true,
        });
      });
      setRows(map);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("procurement_items")
      .select("*")
      .eq("budget_id", budgetId);

    if (error) {
      setLoading(false);
      return;
    }

    const stored = new Map<Key, ProcurementRow>();
    (data || []).forEach((r: any) => {
      stored.set(rowKey(r.bridge_key, r.component_id), r as ProcurementRow);
    });

    const canonicalKeys = new Set<Key>();
    const toUpsert: ProcurementRow[] = [];
    const merged = new Map<Key, ProcurementRow>();

    canonical.forEach((m) => {
      const k = rowKey(m.bridgeKey, m.componentId);
      canonicalKeys.add(k);
      const existing = stored.get(k);
      // Preserva preço de referência editado pelo usuário (mantém existing.unit_price_ref).
      const unitPrice = existing ? Number(existing.unit_price_ref) : m.unitPrice;
      const total = Math.round(m.qty * unitPrice * 100) / 100;
      const base: ProcurementRow = existing
        ? {
            ...existing,
            bridge_name: m.bridgeName,
            category: m.category,
            component_name: m.componentName,
            unit: m.unit,
            qty: m.qty,
            unit_price_ref: unitPrice,
            total_ref: total,
            in_scope: true,
          }
        : {
            budget_id: budgetId,
            user_id: user.id,
            bridge_key: m.bridgeKey,
            bridge_name: m.bridgeName,
            category: m.category,
            component_id: m.componentId,
            component_name: m.componentName,
            unit: m.unit,
            qty: m.qty,
            unit_price_ref: m.unitPrice,
            total_ref: m.total,
            purchase_status: "nao",
            amount_paid: 0,
            supplier: "",
            purchase_date: null,
            delivery_status: "nao",
            delivery_date: null,
            notes: "",
            purchase_url: "",
            original_currency: "BRL",
            original_unit_price: m.unitPrice,
            qty_per_sensor: 0,
            in_scope: true,
          };



      merged.set(k, base);
      const needsSync =
        !existing ||
        existing.qty !== base.qty ||
        Number(existing.unit_price_ref) !== Number(base.unit_price_ref) ||
        Number(existing.total_ref) !== Number(base.total_ref) ||
        existing.bridge_name !== base.bridge_name ||
        existing.category !== base.category ||
        existing.component_name !== base.component_name ||
        existing.unit !== base.unit ||
        !existing.in_scope;
      if (needsSync) toUpsert.push(base);
    });

    // Itens fora de escopo (existem no banco mas não na lista atual).
    // Itens "CUSTOM-..." (adicionados manualmente) NUNCA são marcados como fora de escopo.
    const outOfScope: ProcurementRow[] = [];
    stored.forEach((r, k) => {
      if (!canonicalKeys.has(k)) {
        const isCustom = r.component_id.startsWith("CUSTOM-") || r.bridge_key === SENSOR_PROD_KEY;
        if (isCustom) {
          merged.set(k, { ...r, in_scope: true });
          if (!r.in_scope) toUpsert.push({ ...r, in_scope: true });
        } else {
          const updated = { ...r, in_scope: false };
          merged.set(k, updated);
          outOfScope.push(updated);
          if (r.in_scope) toUpsert.push(updated);
        }
      }
    });

    if (toUpsert.length > 0) {
      await supabase
        .from("procurement_items")
        .upsert(toUpsert as any, { onConflict: "budget_id,bridge_key,component_id" });
    }

    setRows(merged);
    setLoading(false);
  }, [budgetId, user, canonical]);

  useEffect(() => {
    loadAndSync();
  }, [loadAndSync]);

  const flushSave = useCallback(
    async (key: Key, row: ProcurementRow) => {
      if (!budgetId || !user) return;
      setSavingCount((n) => n + 1);
      const payload = { ...row, budget_id: budgetId, user_id: user.id };
      await supabase
        .from("procurement_items")
        .upsert(payload as any, { onConflict: "budget_id,bridge_key,component_id" });
      setSavingCount((n) => Math.max(0, n - 1));
    },
    [budgetId, user]
  );

  const updateRow = useCallback(
    (bridgeKey: string, componentId: string, patch: Partial<ProcurementEditable>) => {
      const k = rowKey(bridgeKey, componentId);
      setRows((prev) => {
        const current = prev.get(k);
        if (!current) return prev;
        const next = new Map(prev);
        const updated = { ...current, ...patch };
        // Recalcula total quando preço unitário muda; ajusta preço quando total é editado.
        if (patch.unit_price_ref !== undefined) {
          updated.total_ref = Math.round(Number(updated.qty) * Number(updated.unit_price_ref) * 100) / 100;
        } else if (patch.total_ref !== undefined) {
          const q = Number(updated.qty) || 0;
          updated.unit_price_ref = q > 0 ? Math.round((Number(updated.total_ref) / q) * 100) / 100 : 0;
        }
        next.set(k, updated);

        // debounce save
        const t = timers.current.get(k);
        if (t) clearTimeout(t);
        timers.current.set(
          k,
          setTimeout(() => {
            flushSave(k, updated);
            timers.current.delete(k);
          }, 600)
        );

        return next;
      });
    },
    [flushSave]
  );

  const addCustomItem = useCallback(
    async (input: {
      bridgeKey: string;
      bridgeName: string;
      category: string;
      componentName: string;
      unit: string;
      qty: number;
      unitPrice: number;
    }) => {
      if (!budgetId || !user) return;
      const componentId = `CUSTOM-${crypto.randomUUID().slice(0, 8)}`;
      const total = Math.round(input.qty * input.unitPrice * 100) / 100;
      const row: ProcurementRow = {
        budget_id: budgetId,
        user_id: user.id,
        bridge_key: input.bridgeKey,
        bridge_name: input.bridgeName,
        category: input.category || "Itens Adicionais",
        component_id: componentId,
        component_name: input.componentName,
        unit: input.unit || "Unid.",
        qty: input.qty,
        unit_price_ref: input.unitPrice,
        total_ref: total,
        purchase_status: "nao",
        amount_paid: 0,
        supplier: "",
        purchase_date: null,
        delivery_status: "nao",
        delivery_date: null,
        notes: "",
        purchase_url: "",
        original_currency: "BRL",
        original_unit_price: input.unitPrice,
        qty_per_sensor: 0,
        in_scope: true,
      };
      setSavingCount((n) => n + 1);
      const { data } = await supabase
        .from("procurement_items")
        .insert(row as any)
        .select("*")
        .single();
      setSavingCount((n) => Math.max(0, n - 1));
      if (data) {
        setRows((prev) => {
          const next = new Map(prev);
          next.set(rowKey(input.bridgeKey, componentId), data as ProcurementRow);
          return next;
        });
      }
    },
    [budgetId, user]
  );

  const removeRow = useCallback(
    async (bridgeKey: string, componentId: string) => {
      if (!budgetId) return;
      const k = rowKey(bridgeKey, componentId);
      const t = timers.current.get(k);
      if (t) clearTimeout(t);
      timers.current.delete(k);
      setRows((prev) => {
        const next = new Map(prev);
        next.delete(k);
        return next;
      });
      await supabase
        .from("procurement_items")
        .delete()
        .eq("budget_id", budgetId)
        .eq("bridge_key", bridgeKey)
        .eq("component_id", componentId);
    },
    [budgetId]
  );

  // Flush ao desmontar
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const list = useMemo(() => Array.from(rows.values()), [rows]);

  return {
    rows: list,
    loading,
    saving: savingCount > 0,
    updateRow,
    addCustomItem,
    removeRow,
    refresh: loadAndSync,
  };
}
