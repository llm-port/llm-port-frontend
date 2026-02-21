/**
 * DataTable — reusable MUI data table with built-in:
 *  - global text search (matches against `searchValue()` per column)
 *  - click-to-sort on any column marked `sortable: true`
 *  - declarative column filter dropdowns rendered in the toolbar
 *  - loading, error, and empty states
 *  - sticky header + scrollable body that fits into flex containers
 */
import { useState, useMemo } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import ClearIcon from "@mui/icons-material/Clear";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single column definition. */
export interface ColumnDef<T> {
  /** Unique key — used as sort key and React key. */
  key: string;
  /** Header label. */
  label: string;
  /** If true, clicking the header toggles ascending/descending sort. */
  sortable?: boolean;
  /** Text alignment for both header and cells. Defaults to "left". */
  align?: "left" | "center" | "right";
  /** Renders the cell content for a given row. */
  render: (row: T) => React.ReactNode;
  /**
   * Returns a string used by the global search filter.
   * If omitted the column is excluded from search.
   */
  searchValue?: (row: T) => string;
  /**
   * Returns a comparable primitive used by client-side sorting.
   * Required when `sortable: true`.
   */
  sortValue?: (row: T) => string | number;
  /** Optional min-width hint passed to the <TableCell>. */
  minWidth?: number | string;
}

/** A declarative column-filter dropdown shown in the toolbar. */
export interface ColumnFilter {
  /** Visible label on the Select. */
  label: string;
  /** Current selected value for single-select (empty string = "all"). */
  value: string;
  /** Available options. */
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  minWidth?: number;
  /** Enable multi-select with checkboxes. */
  multi?: boolean;
  /** Current selected values for multi-select (empty array = all). */
  multiValue?: string[];
  onMultiChange?: (values: string[]) => void;
}

export interface DataTableProps<T> {
  /** Column definitions. */
  columns: ColumnDef<T>[];
  /** Source data. */
  rows: T[];
  /** Must return a unique stable string for each row (used as React key). */
  rowKey: (row: T) => string;
  /** While true, a centred spinner replaces the table body. */
  loading?: boolean;
  /** Non-null shows a red error banner above the table. */
  error?: string | null;
  /** Text shown when the filtered result set is empty. */
  emptyMessage?: string;
  /** Title displayed on the left side of the toolbar. */
  title?: React.ReactNode;
  /** Additional controls rendered on the right side of the toolbar (buttons, etc.). */
  toolbarActions?: React.ReactNode;
  /** Column-filter dropdowns rendered between the search box and actions. */
  columnFilters?: ColumnFilter[];
  /** Called when the user clicks the refresh icon. */
  onRefresh?: () => void;
  /** Placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Row click handler. */
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyMessage = "No data.",
  title,
  toolbarActions,
  columnFilters = [],
  onRefresh,
  searchPlaceholder = "Search…",
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Sorting ──────────────────────────────────────────────────────────────
  function handleSortClick(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // ── Filtered + sorted rows ────────────────────────────────────────────────
  const displayRows = useMemo(() => {
    let result = rows;

    // Global search
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((row) =>
        columns.some(
          (col) =>
            col.searchValue &&
            col.searchValue(row).toLowerCase().includes(q),
        ),
      );
    }

    // Sort
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const sv = col.sortValue;
        result = [...result].sort((a, b) => {
          const av = sv(a);
          const bv = sv(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [rows, search, sortKey, sortDir, columns]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          {/* Left: title */}
          <Box sx={{ flexShrink: 0 }}>
            {typeof title === "string" ? (
              <Typography variant="h5">{title}</Typography>
            ) : (
              title
            )}
          </Box>

          {/* Right: search + filters + actions + refresh */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ pt: "6px" }}>
            {/* Global search */}
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")} edge="end">
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            {/* Column filters */}
            {columnFilters.map((f) =>
              f.multi ? (
                // ── Multi-select with checkboxes ──────────────────────────
                <FormControl key={f.label} size="small" sx={{ minWidth: f.minWidth ?? 160 }}>
                  <InputLabel>{f.label}</InputLabel>
                  <Select
                    multiple
                    value={f.multiValue ?? []}
                    label={f.label}
                    onChange={(e) => {
                      const val = e.target.value as string[];
                      f.onMultiChange?.(val);
                    }}
                    renderValue={(selected) => {
                      if (!selected.length || selected.length === f.options.length) return "All";
                      if (selected.length <= 2) return selected.join(", ");
                      return `${selected.length} selected`;
                    }}
                  >
                    {f.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} dense>
                        <Checkbox
                          size="small"
                          checked={(f.multiValue ?? []).includes(opt.value)}
                          sx={{ py: 0 }}
                        />
                        <ListItemText
                          primary={opt.label}
                          primaryTypographyProps={{ fontSize: "0.85rem" }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                // ── Single-select ─────────────────────────────────────────
                <FormControl key={f.label} size="small" sx={{ minWidth: f.minWidth ?? 140 }}>
                  <InputLabel>{f.label}</InputLabel>
                  <Select
                    value={f.value}
                    label={f.label}
                    onChange={(e) => f.onChange?.(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {f.options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ),
            )}

            {/* Caller-supplied actions */}
            {toolbarActions}

            {/* Refresh */}
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {!loading && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ flexGrow: 1, overflow: "auto" }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align ?? "left"}
                    style={{ minWidth: col.minWidth }}
                    sortDirection={sortKey === col.key ? sortDir : false}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sortKey === col.key}
                        direction={sortKey === col.key ? sortDir : "asc"}
                        onClick={() => handleSortClick(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {displayRows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} align={col.align ?? "left"}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
