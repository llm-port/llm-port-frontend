/**
 * Admin → LLM → Runtime detail page.
 * Shows runtime metadata, health status, and live logs.
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  runtimes,
  providers as provApi,
  models as modelApi,
  type Runtime,
  type RuntimeHealth,
  type Provider,
  type Model,
} from "~/api/llm";
import { RuntimeStatusChip, EngineChip } from "~/components/Chips";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";

export default function RuntimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rt, setRt] = useState<Runtime | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [health, setHealth] = useState<RuntimeHealth | null>(null);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const r = await runtimes.get(id);
      setRt(r);
      const [p, m] = await Promise.all([
        provApi.get(r.provider_id),
        modelApi.get(r.model_id),
      ]);
      setProvider(p);
      setModel(m);

      // Health & logs only if running
      if (r.status === "running") {
        try {
          setHealth(await runtimes.health(id));
        } catch {
          setHealth(null);
        }
        try {
          const logRes = await runtimes.fetchLogs(id, 300);
          setLogs(await logRes.text());
        } catch {
          setLogs("");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load runtime.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  async function handleAction(action: "start" | "stop" | "restart") {
    if (!id) return;
    try {
      await runtimes[action](id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function handleDelete() {
    if (!id || !confirm("Delete this runtime?")) return;
    try {
      await runtimes.delete(id);
      navigate("/admin/llm/runtimes");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error || !rt) {
    return <Alert severity="error">{error ?? "Runtime not found."}</Alert>;
  }

  const isRunning = rt.status === "running";
  const isStopped = rt.status === "stopped" || rt.status === "error";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, height: "100%", overflow: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/llm/runtimes")}
        >
          Runtimes
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {rt.name}
        </Typography>
        <RuntimeStatusChip value={rt.status} />
        <Stack direction="row" spacing={1}>
          {isStopped && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={() => handleAction("start")}
            >
              Start
            </Button>
          )}
          {isRunning && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<StopIcon />}
                onClick={() => handleAction("stop")}
              >
                Stop
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="info"
                startIcon={<RestartAltIcon />}
                onClick={() => handleAction("restart")}
              >
                Restart
              </Button>
            </>
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={isRunning}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {/* Metadata card */}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" flexWrap="wrap" gap={4}>
            <MetaField label="Provider" value={provider?.name ?? rt.provider_id.slice(0, 8)} />
            {provider && (
              <Box>
                <Typography variant="caption" color="text.secondary">Engine</Typography>
                <Box mt={0.5}><EngineChip value={provider.type} /></Box>
              </Box>
            )}
            <MetaField label="Model" value={model?.display_name ?? rt.model_id.slice(0, 8)} />
            <MetaField label="OpenAI Compat" value={rt.openai_compat ? "Yes" : "No"} />
            {rt.endpoint_url && <MetaField label="Endpoint" value={rt.endpoint_url} mono />}
            {rt.container_ref && <MetaField label="Container" value={rt.container_ref.slice(0, 12)} mono />}
            <MetaField label="Created" value={new Date(rt.created_at).toLocaleString()} />
          </Stack>
        </CardContent>
      </Card>

      {/* Health card */}
      {isRunning && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              {health ? (
                <>
                  {health.healthy ? (
                    <Chip icon={<FavoriteIcon />} label="Healthy" color="success" size="small" />
                  ) : (
                    <Chip icon={<HeartBrokenIcon />} label="Unhealthy" color="error" size="small" />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {health.detail}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  Health check unavailable.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {isRunning && (
        <Box sx={{ flexGrow: 1, minHeight: 200 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Container Logs (last 300 lines)
          </Typography>
          <Box
            ref={logRef}
            component="pre"
            sx={{
              bgcolor: "grey.900",
              color: "grey.100",
              p: 2,
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: "0.75rem",
              lineHeight: 1.6,
              overflow: "auto",
              maxHeight: 400,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {logs || "No logs available."}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function MetaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography
        variant="body2"
        fontWeight={500}
        fontFamily={mono ? "monospace" : undefined}
        fontSize={mono ? "0.8rem" : undefined}
      >
        {value}
      </Typography>
    </Box>
  );
}
