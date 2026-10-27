import { useEffect, useMemo, useState } from "react";

import useAuth from "../../hooks/useAuth";

import api from "../../services/api";

import {
  getPlatformUsers,
  setUserStatus,
  setUserRole,
  deletePlatformUser,
  USER_STATUS_META,
  USER_SOURCE_META,
  formatAdminRelative,
} from "../../data/adminData";

/* =========================================================
   ADMIN USERS
   ========================================================= */

function AdminUsers() {
  const { user } = useAuth();

  const [users, setUsers] = useState(() =>
    getPlatformUsers()
  );

  const [usingApi, setUsingApi] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [message, setMessage] = useState(null);

  const refresh = async () => {
    try {
      const data = await api.get("/users");

      setUsers(
        (data.users || []).map((item) => ({
          id: item.id,
          name: item.name,
          username: item.username,
          email: item.email || "",
          mobile: item.mobile,
          role: item.role || "USER",
          status: item.isActive
            ? "active"
            : "suspended",
          joinedAt: item.createdAt || null,
          lastActive: item.lastLoginAt || null,
          source: "registered",
        }))
      );

      setUsingApi(true);
    } catch {
      setUsingApi(false);

      setUsers(getPlatformUsers());
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const flash = (text, tone = "success") => {
    setMessage({ text, tone });

    window.setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  /* =======================================================
     FILTERING
     ======================================================= */

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let result = [...users];

    if (statusFilter !== "all") {
      result = result.filter(
        (item) => item.status === statusFilter
      );
    }

    if (search) {
      result = result.filter((item) =>
        [item.name, item.username, item.mobile, item.email]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return result;
  }, [users, searchTerm, statusFilter]);

  const activeCount = users.filter(
    (item) => item.status === "active"
  ).length;

  const adminCount = users.filter(
    (item) => item.role === "ADMIN"
  ).length;

  /* =======================================================
     ACTIONS
     ======================================================= */

  const handleStatusToggle = async (target) => {
    const nextStatus =
      target.status === "active"
        ? "suspended"
        : "active";

    try {
      if (usingApi) {
        const data = await api.put(
          `/users/${target.id}`,
          { isActive: nextStatus === "active" }
        );

        const updated = data.user;

        setUsers((previous) =>
          previous.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  status: updated
                    ? updated.isActive
                      ? "active"
                      : "suspended"
                    : nextStatus,
                }
              : item
          )
        );
      } else {
        setUserStatus(target.username, nextStatus);

        setUsers(getPlatformUsers());
      }

      flash(
        `${target.name} is now ${nextStatus}.`
      );
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  const handleRoleToggle = async (target) => {
    const nextRole =
      target.role === "ADMIN" ? "USER" : "ADMIN";

    try {
      if (usingApi) {
        const data = await api.put(
          `/users/${target.id}`,
          { role: nextRole }
        );

        const updated = data.user;

        setUsers((previous) =>
          previous.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  role: updated?.role || nextRole,
                }
              : item
          )
        );
      } else {
        setUserRole(target.username, nextRole);

        setUsers(getPlatformUsers());
      }

      flash(`${target.name} role set to ${nextRole}.`);
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  const handleDelete = async (target) => {
    const confirmed = window.confirm(
      `Remove ${target.name} (${target.username}) from the platform?`
    );

    if (!confirmed) {
      return;
    }

    try {
      if (usingApi) {
        await api.del(`/users/${target.id}`);

        setUsers((previous) =>
          previous.filter(
            (item) => item.id !== target.id
          )
        );
      } else {
        const result = deletePlatformUser(
          target.username
        );

        if (!result.success) {
          flash(result.message, "danger");

          return;
        }

        setUsers(getPlatformUsers());
      }

      flash(`${target.name} was removed.`);
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            USER MANAGEMENT
          </span>

          <h1>
            <i className="bi bi-people"></i>
            Users
          </h1>

          <p>
            {users.length} accounts on the platform ·{" "}
            {activeCount} active · {adminCount} admins
          </p>
        </div>
      </div>

      {/* ===================================================
          TOOLBAR
          =================================================== */}

      <div className="admin-toolbar">

        <div className="admin-search">
          <i className="bi bi-search"></i>

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by name, username or mobile..."
          />
        </div>

        <select
          className="admin-select"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>
        </select>

        <button
          type="button"
          className="admin-btn ghost"
          onClick={refresh}
        >
          <i className="bi bi-arrow-clockwise"></i>
          Refresh
        </button>

      </div>

      {/* ===================================================
          FEEDBACK MESSAGE
          =================================================== */}

      {message && (
        <div
          className={`admin-flash ${
            message.tone === "danger"
              ? "danger"
              : "success"
          }`}
        >
          <i
            className={`bi ${
              message.tone === "danger"
                ? "bi-exclamation-circle"
                : "bi-check-circle"
            }`}
          ></i>
          {message.text}
        </div>
      )}

      {/* ===================================================
          USERS TABLE
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-body flush">
          {filteredUsers.length === 0 ? (
            <div className="admin-empty">
              <i className="bi bi-people"></i>
              <h3>No Users Found</h3>
              <p>
                Try a different search term or
                status filter.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((item) => {
                    const statusMeta =
                      USER_STATUS_META[
                        item.status
                      ] ||
                      USER_STATUS_META.active;

                    const sourceMeta =
                      USER_SOURCE_META[
                        item.source
                      ] ||
                      USER_SOURCE_META.seed;

                    const isSelf =
                      item.username ===
                      user?.username;

                    const suspended =
                      item.status ===
                      "suspended";

                    return (
                      <tr key={item.username}>
                        <td>
                          <div className="admin-user-cell">
                            <span
                              className={`admin-user-avatar ${
                                suspended
                                  ? "suspended"
                                  : ""
                              }`}
                            >
                              {item.name
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <div className="admin-user-meta">
                              <strong>
                                {item.name}
                                {isSelf && (
                                  <span className="admin-user-you">
                                    (you)
                                  </span>
                                )}
                              </strong>

                              <span>
                                @{item.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.mobile || "—"}
                        </td>

                        <td>
                          <span
                            className={`admin-badge ${
                              item.role ===
                              "ADMIN"
                                ? "info"
                                : "muted"
                            }`}
                          >
                            <i className="bi bi-shield-lock"></i>
                            {item.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-badge ${
                              suspended
                                ? "danger"
                                : "success"
                            }`}
                          >
                            <i
                              className={`bi ${statusMeta.icon}`}
                            ></i>
                            {statusMeta.label}
                          </span>
                        </td>

                        <td>
                          <span className="admin-badge muted">
                            <i
                              className={`bi ${sourceMeta.icon}`}
                            ></i>
                            {sourceMeta.label}
                          </span>
                        </td>

                        <td>
                          {formatAdminRelative(
                            item.lastActive
                          )}
                        </td>

                        <td>
                          <div className="admin-table-actions">

                            <button
                              type="button"
                              className="admin-btn ghost small"
                              onClick={() =>
                                handleStatusToggle(
                                  item
                                )
                              }
                            >
                              <i
                                className={`bi ${
                                  suspended
                                    ? "bi-person-check"
                                    : "bi-person-slash"
                                }`}
                              ></i>
                              {suspended
                                ? "Activate"
                                : "Suspend"}
                            </button>

                            <button
                              type="button"
                              className="admin-btn ghost small"
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "You cannot change your own role"
                                  : ""
                              }
                              onClick={() =>
                                handleRoleToggle(
                                  item
                                )
                              }
                            >
                              <i className="bi bi-shield"></i>
                              {item.role ===
                              "ADMIN"
                                ? "Make User"
                                : "Make Admin"}
                            </button>

                            <button
                              type="button"
                              className="admin-btn danger small"
                              disabled={
                                isSelf ||
                                item.username ===
                                  "admin"
                              }
                              title={
                                item.username ===
                                "admin"
                                  ? "Primary admin cannot be deleted"
                                  : ""
                              }
                              onClick={() =>
                                handleDelete(item)
                              }
                            >
                              <i className="bi bi-trash3"></i>
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================
          NOTE
          =================================================== */}

      <p className="admin-note">
        <i className="bi bi-info-circle me-1"></i>
        Registered accounts are stored in the HydroGrow
        MongoDB database — changes here update the live
        platform.
      </p>

    </>
  );
}

export default AdminUsers;
