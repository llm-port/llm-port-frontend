import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("routes/admin.tsx", [
    route("/admin/containers", "pages/admin/ContainersPage.tsx"),
    route("/admin/containers/new", "pages/admin/CreateContainerPage.tsx"),
    route("/admin/containers/:id", "pages/admin/ContainerDetailPage.tsx"),
    route("/admin/images", "pages/admin/ImagesPage.tsx"),
    route("/admin/networks", "pages/admin/NetworksPage.tsx"),
    route("/admin/stacks", "pages/admin/StacksPage.tsx"),
    route("/admin/audit", "pages/admin/AuditLogPage.tsx"),
  ]),
] satisfies RouteConfig;
