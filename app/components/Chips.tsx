/**
 * Shared chip components used across multiple admin pages.
 * Centralises colour/label mappings so they only need updating once.
 */
import Chip from "@mui/material/Chip";
import type { ContainerClass, ContainerPolicy } from "~/api/admin";

// ─────────────────────────────────────────────────────────────────────────────
// Container class chip
// ─────────────────────────────────────────────────────────────────────────────

const CLASS_CONFIG: Record<
  ContainerClass,
  { color: "error" | "warning" | "success" | "default"; label: string }
> = {
  SYSTEM_CORE: { color: "error", label: "SYSTEM_CORE" },
  SYSTEM_AUX: { color: "warning", label: "SYSTEM_AUX" },
  TENANT_APP: { color: "success", label: "TENANT_APP" },
  UNTRUSTED: { color: "default", label: "UNTRUSTED" },
};

export function ClassChip({ value }: { value: ContainerClass }) {
  const cfg = CLASS_CONFIG[value] ?? { color: "default" as const, label: value };
  return <Chip label={cfg.label} size="small" color={cfg.color} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Container state chip (running / paused / exited / etc.)
// ─────────────────────────────────────────────────────────────────────────────

function stateColor(state: string): "success" | "default" | "warning" | "info" {
  const s = state.toLowerCase();
  if (s === "running") return "success";
  if (s === "exited") return "default";
  if (s === "paused") return "warning";
  return "info";
}

export function StateChip({ value }: { value: string }) {
  return <Chip label={value} size="small" color={stateColor(value)} variant="outlined" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit result chip
// ─────────────────────────────────────────────────────────────────────────────

export function ResultChip({ value }: { value: "allow" | "deny" }) {
  return (
    <Chip
      label={value}
      size="small"
      color={value === "allow" ? "success" : "error"}
      variant="outlined"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Severity chip
// ─────────────────────────────────────────────────────────────────────────────

export function SeverityChip({ value }: { value: string }) {
  return (
    <Chip
      label={value}
      size="small"
      color={value === "high" ? "error" : "default"}
      variant="filled"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Container policy chip
// ─────────────────────────────────────────────────────────────────────────────

const POLICY_COLOR: Record<ContainerPolicy, "error" | "warning" | "success"> = {
  locked: "error",
  restricted: "warning",
  free: "success",
};

export function PolicyChip({ value }: { value: ContainerPolicy }) {
  return (
    <Chip label={value} size="small" color={POLICY_COLOR[value] ?? "default"} variant="outlined" />
  );
}
