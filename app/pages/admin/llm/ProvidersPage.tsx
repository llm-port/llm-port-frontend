/**
 * Admin → LLM → Providers list page.
 */
import { useState, useEffect } from "react";
import { providers, type Provider, type ProviderType, type CreateProviderPayload } from "~/api/llm";
import { DataTable, type ColumnDef } from "~/components/DataTable";
import { EngineChip } from "~/components/Chips";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const PROVIDER_TYPES: ProviderType[] = ["vllm", "llamacpp", "tgi", "ollama"];

export default function ProvidersPage() {
  const [data, setData] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<ProviderType>("vllm");

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<Provider | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await providers.list());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load providers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await providers.create({ name: createName, type: createType });
      setShowCreate(false);
      setCreateName("");
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Create failed.");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    try {
      await providers.update(editTarget.id, { name: editName });
      setEditTarget(null);
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this provider? This will fail if runtimes still reference it.")) return;
    try {
      await providers.delete(id);
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const columns: ColumnDef<Provider>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortValue: (p) => p.name,
      searchValue: (p) => p.name,
      render: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.name}
        </Typography>
      ),
    },
    {
      key: "type",
      label: "Engine",
      sortable: true,
      sortValue: (p) => p.type,
      searchValue: (p) => p.type,
      render: (p) => <EngineChip value={p.type} />,
    },
    {
      key: "target",
      label: "Target",
      sortable: true,
      sortValue: (p) => p.target,
      render: (p) => (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {p.target}
        </Typography>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      sortValue: (p) => p.created_at,
      render: (p) => (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {new Date(p.created_at).toLocaleString()}
        </Typography>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (p) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditTarget(p);
                setEditName(p.name);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete(p.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data}
        rowKey={(p) => p.id}
        loading={loading}
        error={error}
        title="LLM Providers"
        emptyMessage="No providers configured yet."
        onRefresh={load}
        searchPlaceholder="Search providers…"
        toolbarActions={
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreate(true)}
          >
            Add Provider
          </Button>
        }
      />

      {/* Create dialog */}
      <Dialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleCreate}>
          <DialogTitle>New Provider</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
            <TextField
              label="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Engine</InputLabel>
              <Select
                value={createType}
                label="Engine"
                onChange={(e) => setCreateType(e.target.value as ProviderType)}
              >
                {PROVIDER_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleUpdate}>
          <DialogTitle>Edit Provider</DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <TextField
              label="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              autoFocus
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
