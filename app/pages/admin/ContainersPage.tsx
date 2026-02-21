/**
 * Admin → Containers list page.
 * Powered by the shared DataTable with search, sort, and class filtering.
 */
import { useState, useEffect } from "react";
import { Link as RouterLink, useOutletContext, useNavigate } from "react-router";
import {
  containers,
  canStop,
  canDelete,
  canPause,
  type ContainerSummary,
} from "~/api/admin";
import { DataTable, type ColumnDef } from "~/components/DataTable";
import { ClassChip, StateChip } from "~/components/Chips";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import PauseIcon from "@mui/icons-material/Pause";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface AdminContext {
  rootModeActive: boolean;
}

const CLASS_OPTIONS: { value: string; label: string }[] = [
  { value: "SYSTEM_CORE", label: "SYSTEM_CORE" },
  { value: "SYSTEM_AUX", label: "SYSTEM_AUX" },
  { value: "TENANT_APP", label: "TENANT_APP" },
  { value: "UNTRUSTED", label: "UNTRUSTED" },
];

export default function ContainersPage() {
  const { rootModeActive } = useOutletContext<AdminContext>();
  const navigate = useNavigate();
  const [data, setData] = useState<ContainerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterClasses, setFilterClasses] = useState<string[]>(
    CLASS_OPTIONS.map((o) => o.value),
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await containers.list());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load containers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(
    id: string,
    action: "start" | "stop" | "restart" | "pause" | "unpause",
  ) {
    setActionLoading(`${id}-${action}`);
    try {
      await containers.lifecycle(id, action);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this container?")) return;
    setActionLoading(`${id}-delete`);
    try {
      await containers.delete(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const columns: ColumnDef<ContainerSummary>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      sortValue: (c) => c.name,
      searchValue: (c) => `${c.name} ${c.id}`,
      render: (c) => (
        <>
          <Link
            component={RouterLink}
            to={`/admin/containers/${c.id}`}
            underline="hover"
            color="primary.light"
            fontWeight={600}
            sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
          >
            {c.name}
          </Link>
          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            fontFamily="monospace"
          >
            {c.id.slice(0, 12)}
          </Typography>
        </>
      ),
    },
    {
      key: "image",
      label: "Image",
      sortable: true,
      sortValue: (c) => c.image,
      searchValue: (c) => c.image,
      render: (c) => (
        <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
          {c.image}
        </Typography>
      ),
    },
    {
      key: "state",
      label: "State",
      sortable: true,
      sortValue: (c) => c.state,
      searchValue: (c) => c.state,
      render: (c) => (
        <>
          <StateChip value={c.state} />
          <Typography variant="caption" display="block" color="text.secondary">
            {c.status}
          </Typography>
        </>
      ),
    },
    {
      key: "container_class",
      label: "Class",
      sortable: true,
      sortValue: (c) => c.container_class,
      searchValue: (c) => c.container_class,
      render: (c) => <ClassChip value={c.container_class} />,
    },
    {
      key: "owner_scope",
      label: "Scope",
      sortable: true,
      sortValue: (c) => c.owner_scope,
      searchValue: (c) => c.owner_scope,
      render: (c) => (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {c.owner_scope}
        </Typography>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (c) => {
        const busy = !!actionLoading?.startsWith(c.id);
        const isRunning = c.state.toLowerCase() === "running";
        const isPaused = c.state.toLowerCase() === "paused";
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {!isRunning && !isPaused && (
              <Tooltip title="Start">
                <IconButton
                  size="small"
                  color="success"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleAction(c.id, "start");
                  }}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(isRunning || isPaused) && canStop(c.container_class, rootModeActive) && (
              <Tooltip title="Stop">
                <IconButton
                  size="small"
                  color="warning"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleAction(c.id, "stop");
                  }}
                >
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isRunning && canPause(c.container_class, rootModeActive) && (
              <Tooltip title="Pause">
                <IconButton
                  size="small"
                  color="info"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleAction(c.id, "pause");
                  }}
                >
                  <PauseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isPaused && (
              <Tooltip title="Unpause">
                <IconButton
                  size="small"
                  color="success"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleAction(c.id, "unpause");
                  }}
                >
                  <PlayCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isRunning && (
              <Tooltip title="Restart">
                <IconButton
                  size="small"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleAction(c.id, "restart");
                  }}
                >
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDelete(c.container_class, rootModeActive) && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(c.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Details">
              <IconButton
                size="small"
                component={RouterLink}
                to={`/admin/containers/${c.id}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <DataTable
      title="Containers"
      columns={columns}
      rows={data.filter((c) => filterClasses.includes(c.container_class))}
      rowKey={(c) => c.id}
      loading={loading}
      error={error}
      emptyMessage="No containers found."
      onRefresh={load}
      searchPlaceholder="Search name, image, state…"
      toolbarActions={
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => navigate("/admin/containers/new")}
        >
          Create
        </Button>
      }
      columnFilters={[
        {
          label: "Class",
          value: "",
          multi: true,
          multiValue: filterClasses,
          onMultiChange: setFilterClasses,
          options: CLASS_OPTIONS,
          minWidth: 180,
        },
      ]}
    />
  );
}
