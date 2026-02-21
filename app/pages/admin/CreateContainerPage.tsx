/**
 * Admin → Create Container.
 * Guided form to create a new Docker container with classification,
 * port bindings, environment variables, and volume binds.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  containers,
  networks,
  type ContainerClass,
  type ContainerPolicy,
  type PortBinding,
} from "~/api/admin";
import { ClassChip, PolicyChip } from "~/components/Chips";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

interface EnvRow {
  key: string;
  value: string;
}

interface VolumeRow {
  host: string;
  container: string;
}

const CLASS_OPTIONS: ContainerClass[] = [
  "SYSTEM_CORE",
  "SYSTEM_AUX",
  "TENANT_APP",
  "UNTRUSTED",
];
const POLICY_OPTIONS: ContainerPolicy[] = ["free", "restricted", "locked"];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      letterSpacing={1.2}
      sx={{ mb: 1.5, display: "block" }}
    >
      {children}
    </Typography>
  );
}

export default function CreateContainerPage() {
  const navigate = useNavigate();

  // ── Form state ────────────────────────────────────────────────────────────
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [containerClass, setContainerClass] = useState<ContainerClass>("UNTRUSTED");
  const [policy, setPolicy] = useState<ContainerPolicy>("free");
  const [ownerScope, setOwnerScope] = useState("platform");
  const [autoStart, setAutoStart] = useState(false);
  const [network, setNetwork] = useState("");
  const [cmdRaw, setCmdRaw] = useState("");
  const [ports, setPorts] = useState<PortBinding[]>([]);
  const [envRows, setEnvRows] = useState<EnvRow[]>([]);
  const [volumeRows, setVolumeRows] = useState<VolumeRow[]>([]);

  // ── Submit state ──────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Network options ───────────────────────────────────────────────────────
  const [networkOptions, setNetworkOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    networks
      .list()
      .then((nets) => setNetworkOptions(nets.map((n) => ({ id: n.id, name: n.name }))))
      .catch(() => {});
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function addPort() {
    setPorts((p) => [...p, { host_port: "", container_port: "" }]);
  }
  function updatePort(index: number, field: keyof PortBinding, value: string) {
    setPorts((p) => p.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }
  function removePort(index: number) {
    setPorts((p) => p.filter((_, i) => i !== index));
  }

  function addEnv() {
    setEnvRows((r) => [...r, { key: "", value: "" }]);
  }
  function updateEnv(index: number, field: keyof EnvRow, value: string) {
    setEnvRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeEnv(index: number) {
    setEnvRows((r) => r.filter((_, i) => i !== index));
  }

  function addVolume() {
    setVolumeRows((r) => [...r, { host: "", container: "" }]);
  }
  function updateVolume(index: number, field: keyof VolumeRow, value: string) {
    setVolumeRows((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }
  function removeVolume(index: number) {
    setVolumeRows((r) => r.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const cmd = cmdRaw.trim()
        ? cmdRaw
            .trim()
            .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
            ?.map((s) => s.replace(/^["']|["']$/g, "")) ?? []
        : undefined;

      const validPorts = ports.filter((p) => p.host_port && p.container_port);
      const validEnv = envRows
        .filter((r) => r.key.trim())
        .map((r) => `${r.key.trim()}=${r.value}`);
      const validVolumes = volumeRows
        .filter((r) => r.host.trim() && r.container.trim())
        .map((r) => `${r.host.trim()}:${r.container.trim()}`);

      const result = await containers.create({
        image: image.trim(),
        name: name.trim() || undefined,
        container_class: containerClass,
        owner_scope: ownerScope.trim() || "platform",
        policy,
        auto_start: autoStart,
        ports: validPorts.length ? validPorts : undefined,
        env: validEnv.length ? validEnv : undefined,
        cmd,
        network: network || undefined,
        volumes: validVolumes.length ? validVolumes : undefined,
      });

      // Navigate to the new container's detail page
      navigate(`/admin/containers/${result.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to containers">
            <IconButton size="small" onClick={() => navigate("/admin/containers")}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h5">Create Container</Typography>
        </Stack>
      </Box>

      {/* Scrollable form */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ pb: 4 }}>
          <Grid container spacing={2.5} alignItems="flex-start">

            {/* ── LEFT COLUMN — main config ───────────────────────── */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={2.5}>

                {/* Image & Identity */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <SectionHeader>Image &amp; Identity</SectionHeader>
                  <Stack spacing={2}>
                    <TextField
                      label="Image"
                      required
                      fullWidth
                      placeholder="nginx:latest"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      helperText="Name and tag of the image to run."
                      autoFocus
                    />
                    <TextField
                      label="Container Name"
                      fullWidth
                      placeholder="my-service  (leave blank for Docker-generated name)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                      label="Command Override"
                      fullWidth
                      placeholder='/bin/sh -c "echo hello"'
                      value={cmdRaw}
                      onChange={(e) => setCmdRaw(e.target.value)}
                      helperText="Shell-style command to override the image's default CMD (optional)."
                      inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                    />
                  </Stack>
                </Paper>

                {/* Port Bindings */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <SectionHeader>Port Bindings</SectionHeader>
                    <Button size="small" startIcon={<AddIcon />} onClick={addPort}>
                      Add
                    </Button>
                  </Stack>
                  {ports.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No port bindings. Click Add to expose ports.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {ports.map((p, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Host Port"
                            size="small"
                            placeholder="8080"
                            value={p.host_port}
                            onChange={(e) => updatePort(i, "host_port", e.target.value)}
                            sx={{ width: 110 }}
                          />
                          <Typography color="text.secondary">→</Typography>
                          <TextField
                            label="Container Port"
                            size="small"
                            placeholder="80/tcp"
                            value={p.container_port}
                            onChange={(e) => updatePort(i, "container_port", e.target.value)}
                            sx={{ width: 130 }}
                          />
                          <Chip
                            label={
                              p.host_port && p.container_port
                                ? `${p.host_port}:${p.container_port}`
                                : "incomplete"
                            }
                            size="small"
                            variant="outlined"
                            color={p.host_port && p.container_port ? "primary" : "default"}
                            sx={{ fontFamily: "monospace", flexShrink: 0 }}
                          />
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => removePort(i)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Paper>

                {/* Environment Variables */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <SectionHeader>Environment Variables</SectionHeader>
                    <Button size="small" startIcon={<AddIcon />} onClick={addEnv}>
                      Add
                    </Button>
                  </Stack>
                  {envRows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No environment variables.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {envRows.map((row, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Key"
                            size="small"
                            placeholder="POSTGRES_HOST"
                            value={row.key}
                            onChange={(e) => updateEnv(i, "key", e.target.value)}
                            sx={{ flex: 1 }}
                            inputProps={{ style: { fontFamily: "monospace" } }}
                          />
                          <Typography color="text.secondary">=</Typography>
                          <TextField
                            label="Value"
                            size="small"
                            placeholder="localhost"
                            value={row.value}
                            onChange={(e) => updateEnv(i, "value", e.target.value)}
                            sx={{ flex: 2 }}
                            inputProps={{ style: { fontFamily: "monospace" } }}
                          />
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => removeEnv(i)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Paper>

                {/* Volume Mounts */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <SectionHeader>Volume Mounts</SectionHeader>
                    <Button size="small" startIcon={<AddIcon />} onClick={addVolume}>
                      Add
                    </Button>
                  </Stack>
                  {volumeRows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No volume mounts.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {volumeRows.map((row, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            label="Host Path"
                            size="small"
                            placeholder="/data/app"
                            value={row.host}
                            onChange={(e) => updateVolume(i, "host", e.target.value)}
                            sx={{ flex: 1 }}
                            inputProps={{ style: { fontFamily: "monospace" } }}
                          />
                          <Typography color="text.secondary">:</Typography>
                          <TextField
                            label="Container Path"
                            size="small"
                            placeholder="/var/app"
                            value={row.container}
                            onChange={(e) => updateVolume(i, "container", e.target.value)}
                            sx={{ flex: 1 }}
                            inputProps={{ style: { fontFamily: "monospace" } }}
                          />
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => removeVolume(i)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Paper>

              </Stack>
            </Grid>

            {/* ── RIGHT COLUMN — classification + runtime + actions ── */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={2.5} sx={{ position: { lg: "sticky" }, top: { lg: 0 } }}>

                {/* Classification & Policy */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <SectionHeader>Classification &amp; Policy</SectionHeader>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Class
                      </Typography>
                      <ToggleButtonGroup
                        value={containerClass}
                        exclusive
                        onChange={(_, v) => { if (v) setContainerClass(v as ContainerClass); }}
                        size="small"
                        sx={{ flexWrap: "wrap", gap: 0.5 }}
                      >
                        {CLASS_OPTIONS.map((cls) => (
                          <ToggleButton
                            key={cls}
                            value={cls}
                            sx={{ gap: 0.75, px: 1.5, textTransform: "none" }}
                          >
                            <ClassChip value={cls} />
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Policy
                      </Typography>
                      <ToggleButtonGroup
                        value={policy}
                        exclusive
                        onChange={(_, v) => { if (v) setPolicy(v as ContainerPolicy); }}
                        size="small"
                      >
                        {POLICY_OPTIONS.map((p) => (
                          <ToggleButton
                            key={p}
                            value={p}
                            sx={{ gap: 0.75, px: 1.5, textTransform: "none" }}
                          >
                            <PolicyChip value={p} />
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    <TextField
                      label="Owner Scope"
                      fullWidth
                      value={ownerScope}
                      onChange={(e) => setOwnerScope(e.target.value)}
                      helperText="Team or unit that owns this container."
                    />
                  </Stack>
                </Paper>

                {/* Runtime Options */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <SectionHeader>Runtime Options</SectionHeader>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoStart}
                          onChange={(e) => setAutoStart(e.target.checked)}
                        />
                      }
                      label="Start immediately after creation"
                    />
                    <TextField
                      select
                      label="Network"
                      fullWidth
                      value={network}
                      onChange={(e) => setNetwork(e.target.value)}
                      helperText="Optional — defaults to bridge."
                    >
                      <MenuItem value="">
                        <em>Default (bridge)</em>
                      </MenuItem>
                      {networkOptions.map((n) => (
                        <MenuItem key={n.id} value={n.name}>
                          {n.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </Paper>

                {/* Submit */}
                <Paper variant="outlined" sx={{ p: 3 }}>
                  {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {submitError}
                    </Alert>
                  )}
                  <Stack spacing={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={submitting || !image.trim()}
                      startIcon={submitting ? <CircularProgress size={18} /> : <RocketLaunchIcon />}
                    >
                      {submitting ? "Creating…" : autoStart ? "Create & Start" : "Create Container"}
                    </Button>
                    <Divider sx={{ my: 0.5 }} />
                    <Button
                      variant="text"
                      fullWidth
                      onClick={() => navigate("/admin/containers")}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Paper>

              </Stack>
            </Grid>

          </Grid>
        </Box>
      </Box>
    </Box>
  );}