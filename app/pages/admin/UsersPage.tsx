import { useEffect, useMemo, useState } from "react";
import { adminUsers, type AdminUser, type RbacRole } from "~/api/admin";
import { DataTable, type ColumnDef } from "~/components/DataTable";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [allUsers, allRoles] = await Promise.all([adminUsers.list(), adminUsers.listRoles()]);
      setUsers(allUsers);
      setRoles(allRoles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openEdit(user: AdminUser) {
    setEditing(user);
    setSelectedRoleIds(user.roles.map((role) => role.id));
  }

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  }

  async function saveRoles() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await adminUsers.setUserRoles(editing.id, selectedRoleIds);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update roles.");
    } finally {
      setSaving(false);
    }
  }

  const rolePermissionCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const role of roles) map[role.id] = role.permissions.length;
    return map;
  }, [roles]);

  const columns: ColumnDef<AdminUser>[] = [
    {
      key: "email",
      label: "User",
      sortable: true,
      sortValue: (u) => u.email,
      searchValue: (u) => u.email,
      render: (u) => (
        <>
          <Typography fontWeight={600}>{u.email}</Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {u.id}
          </Typography>
        </>
      ),
      minWidth: 320,
    },
    {
      key: "flags",
      label: "Flags",
      searchValue: (u) => `${u.is_active} ${u.is_superuser} ${u.is_verified}`,
      render: (u) => (
        <Stack direction="row" spacing={0.8}>
          {u.is_superuser && <Chip size="small" color="warning" label="Superuser" />}
          {u.is_active ? (
            <Chip size="small" color="success" label="Active" />
          ) : (
            <Chip size="small" color="default" label="Inactive" />
          )}
          {u.is_verified ? (
            <Chip size="small" color="info" label="Verified" />
          ) : (
            <Chip size="small" color="default" label="Unverified" />
          )}
        </Stack>
      ),
      minWidth: 260,
    },
    {
      key: "roles",
      label: "Roles",
      searchValue: (u) => u.roles.map((r) => r.name).join(" "),
      render: (u) => (
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          {u.roles.length ? (
            u.roles.map((r) => <Chip key={r.id} size="small" label={r.name} />)
          ) : (
            <Typography variant="body2" color="text.secondary">No roles</Typography>
          )}
        </Stack>
      ),
      minWidth: 260,
    },
    {
      key: "permissions",
      label: "Permissions",
      sortable: true,
      sortValue: (u) => u.permissions.length,
      searchValue: (u) => u.permissions.map((p) => `${p.resource}:${p.action}`).join(" "),
      render: (u) => <Typography>{u.permissions.length}</Typography>,
      minWidth: 120,
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (u) => (
        <Button size="small" variant="outlined" onClick={() => openEdit(u)}>
          Edit Roles
        </Button>
      ),
      minWidth: 140,
    },
  ];

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataTable
        title="User Management"
        rows={users}
        columns={columns}
        rowKey={(u) => u.id}
        loading={loading}
        onRefresh={load}
        emptyMessage="No users found."
        searchPlaceholder="Search users, roles, permissions…"
      />

      <Dialog open={!!editing} onClose={() => (saving ? undefined : setEditing(null))} fullWidth maxWidth="sm">
        <DialogTitle>Assign Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editing?.email}
          </Typography>
          <FormGroup>
            {roles.map((role) => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    disabled={saving}
                  />
                }
                label={`${role.name} (${rolePermissionCount[role.id] ?? 0} permissions)`}
              />
            ))}
          </FormGroup>
          {!roles.length && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">No roles available.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveRoles} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
