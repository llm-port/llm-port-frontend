/**
 * Admin → LLM → Download Jobs list page.
 */
import { useState, useEffect } from "react";
import {
  jobs,
  models as modelApi,
  type DownloadJob,
  type DownloadJobStatus,
  type Model,
} from "~/api/llm";
import { DataTable, type ColumnDef } from "~/components/DataTable";
import { JobStatusChip } from "~/components/Chips";

import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import CancelIcon from "@mui/icons-material/Cancel";
import ReplayIcon from "@mui/icons-material/Replay";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "canceled", label: "Canceled" },
];

export default function JobsPage() {
  const [data, setData] = useState<DownloadJob[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const modelMap = Object.fromEntries(modelsList.map((m) => [m.id, m]));

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [j, m] = await Promise.all([
        jobs.list(statusFilter ? (statusFilter as DownloadJobStatus) : undefined),
        modelApi.list(),
      ]);
      setData(j);
      setModelsList(m);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  // Auto-refresh running jobs every 5s
  useEffect(() => {
    const hasActive = data.some((j) => j.status === "running" || j.status === "queued");
    if (!hasActive) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [data]);

  async function handleCancel(id: string) {
    try {
      await jobs.cancel(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  async function handleRetry(id: string) {
    try {
      await jobs.retry(id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Retry failed.");
    }
  }

  const columns: ColumnDef<DownloadJob>[] = [
    {
      key: "model",
      label: "Model",
      sortable: true,
      sortValue: (j) => modelMap[j.model_id]?.display_name ?? "",
      searchValue: (j) => modelMap[j.model_id]?.display_name ?? j.model_id,
      render: (j) => (
        <Typography variant="body2" fontSize="0.85rem" fontWeight={500}>
          {modelMap[j.model_id]?.display_name ?? j.model_id.slice(0, 8)}
        </Typography>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      sortValue: (j) => j.status,
      render: (j) => <JobStatusChip value={j.status} />,
    },
    {
      key: "progress",
      label: "Progress",
      sortable: true,
      sortValue: (j) => j.progress,
      render: (j) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 140 }}>
          <LinearProgress
            variant="determinate"
            value={j.progress}
            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
            {j.progress}%
          </Typography>
        </Stack>
      ),
    },
    {
      key: "error",
      label: "Error",
      searchValue: (j) => j.error_message ?? "",
      render: (j) =>
        j.error_message ? (
          <Tooltip title={j.error_message}>
            <Typography
              variant="body2"
              color="error"
              fontSize="0.75rem"
              sx={{
                maxWidth: 250,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {j.error_message}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.disabled" fontSize="0.8rem">
            —
          </Typography>
        ),
    },
    {
      key: "created_at",
      label: "Started",
      sortable: true,
      sortValue: (j) => j.created_at,
      render: (j) => (
        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
          {new Date(j.created_at).toLocaleString()}
        </Typography>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (j) => {
        const cancelable = j.status === "queued" || j.status === "running";
        const retryable = j.status === "queued" || j.status === "failed" || j.status === "canceled";
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {retryable && (
              <Tooltip title="Retry">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRetry(j.id);
                  }}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {cancelable && (
              <Tooltip title="Cancel">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleCancel(j.id);
                  }}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data}
      rowKey={(j) => j.id}
      loading={loading}
      error={error}
      title="Download Jobs"
      emptyMessage="No download jobs."
      onRefresh={load}
      searchPlaceholder="Search jobs…"
      columnFilters={[
        {
          label: "Status",
          value: statusFilter,
          options: STATUS_OPTIONS,
          onChange: setStatusFilter,
        },
      ]}
    />
  );
}
