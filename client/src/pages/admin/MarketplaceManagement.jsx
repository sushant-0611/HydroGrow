import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

import {
  getAllListings,
  getAllOrders,
  updateOrderStatus,
  getListingStatusMeta,
  getOrderStatusMeta,
  formatCurrency,
  formatRelativeDate,
} from "../../data/marketplaceData";

import { formatAdminRelative } from "../../data/adminData";

/* =========================================================
   ADMIN MARKETPLACE MANAGEMENT
   ========================================================= */

function normalizeOrder(order) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    status: String(order.status || "PENDING").toLowerCase(),
    buyer: order.buyerName,
    seller: order.sellerName,
    itemsText: [
      order.productTitle || order.cropName || "Item",
      `×${order.quantity ?? 0}`,
      order.unit || "",
    ]
      .join(" ")
      .trim(),
    total: order.totalPrice,
    placedAt: order.createdAt,
  };
}

const LISTING_STATUS_MAP = {
  AVAILABLE: "active",
  INACTIVE: "paused",
  SOLD_OUT: "soldout",
};

function normalizeListing(product) {
  return {
    id: product.id || product._id,
    name: product.title,
    categoryName: product.cropName || "",
    seller: product.sellerName || "",
    price: product.price,
    unit: product.unit,
    stock: product.quantity,
    status:
      LISTING_STATUS_MAP[product.status] ||
      String(product.status || "").toLowerCase(),
    createdAt: product.createdAt,
    ownerId: product.sellerId || product.seller?.id || null,
  };
}

function AdminMarketplace() {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);

  const [apiStats, setApiStats] = useState(null);
  const [apiConnected, setApiConnected] =
    useState(false);

  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState("listings");

  const reload = useCallback(async () => {
    try {
      const data = await api.get(
        "/marketplace/admin/overview"
      );

      setListings(
        Array.isArray(data?.products)
          ? data.products.map(normalizeListing)
          : []
      );

      setOrders(
        Array.isArray(data?.orders)
          ? data.orders.map(normalizeOrder)
          : []
      );

      setApiStats(data?.stats || null);
      setApiConnected(true);
    } catch {
      setListings(getAllListings());
      setOrders(getAllOrders());

      setApiStats(null);
      setApiConnected(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const flash = (text, tone = "success") => {
    setMessage({ text, tone });

    window.setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  /* =======================================================
     LISTING ACTIONS
     ======================================================= */

  const toggleListingStatus = async (listing) => {
    const nextStatus =
      listing.status === "paused"
        ? "active"
        : "paused";

    try {
      await api.patch(
        `/marketplace/admin/products/${listing.id}`,
        { status: nextStatus }
      );

      reload();
      flash(`${listing.name} is now ${nextStatus}.`);
    } catch (error) {
      flash(
        error.message ||
          "Could not update the listing status.",
        "danger"
      );
    }
  };

  const handleDeleteListing = async (listing) => {
    const confirmed = window.confirm(
      `Delete listing "${listing.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.del(
        `/marketplace/admin/products/${listing.id}`
      );

      reload();
      flash(`${listing.name} was deleted.`);
    } catch (error) {
      flash(
        error.message || "Could not delete the listing.",
        "danger"
      );
    }
  };

  /* =======================================================
     ORDER ACTIONS
     ======================================================= */

  const handleOrderStatus = async (order, status) => {
    if (status === order.status) {
      return;
    }

    if (apiConnected) {
      try {
        await api.patch(
          `/marketplace/orders/${order.id}/status`,
          {
            status:
              status === "placed"
                ? "PENDING"
                : status.toUpperCase(),
          }
        );
      } catch {
        flash("Could not update that order.", "danger");

        return;
      }

      await reload();

      flash(
        `Order ${
          order.orderNumber || order.id
        } marked as ${status}.`
      );

      return;
    }

    const updated = updateOrderStatus(
      order.id,
      status
    );

    if (!updated) {
      flash("Could not update that order.", "danger");

      return;
    }

    reload();
    flash(
      `Order ${order.id} marked as ${status}.`
    );
  };

  /* =======================================================
     DERIVED
     ======================================================= */

  const activeListings = listings.filter(
    (listing) => listing.status !== "paused"
  ).length;

  const growerListings = listings.filter(
    (listing) => listing.ownerId
  ).length;

  const grossRevenue = orders
    .filter((order) => order.status !== "cancelled")
    .reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

  const pendingOrders = orders.filter(
    (order) =>
      order.status === "pending" ||
      order.status === "placed"
  ).length;

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            MARKETPLACE OPERATIONS
          </span>

          <h1>
            <i className="bi bi-shop"></i>
            Marketplace
          </h1>

          <p>
            Moderate grower listings and manage the
            order lifecycle across the platform.
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn ghost"
            onClick={reload}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Refresh
          </button>

          <Link
            to="/marketplace"
            className="admin-btn primary"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            Open Storefront
          </Link>
        </div>
      </div>

      {/* ===================================================
          STATS
          =================================================== */}

      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <span className="admin-stat-icon">
            <i className="bi bi-tags"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {apiStats
                ? apiStats.products
                : listings.length}
            </span>

            <span className="admin-stat-label">
              Total Listings
            </span>

            <span className="admin-stat-sub">
              {apiStats
                ? "HydroGrow catalog products"
                : `${growerListings} grower-created`}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon info">
            <i className="bi bi-check-circle"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {apiStats
                ? apiStats.available
                : activeListings}
            </span>

            <span className="admin-stat-label">
              Live Listings
            </span>

            <span className="admin-stat-sub">
              Visible to buyers
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon warn">
            <i className="bi bi-bag-check"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {apiStats
                ? apiStats.orders
                : orders.length}
            </span>

            <span className="admin-stat-label">
              Orders
            </span>

            <span className="admin-stat-sub">
              {pendingOrders} awaiting shipment
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icon dark">
            <i className="bi bi-currency-rupee"></i>
          </span>

          <div className="admin-stat-body">
            <span className="admin-stat-value">
              {formatCurrency(
                apiStats
                  ? apiStats.revenue
                  : grossRevenue
              )}
            </span>

            <span className="admin-stat-label">
              Gross Value
            </span>

            <span className="admin-stat-sub">
              Excluding cancellations
            </span>
          </div>
        </div>

      </div>

      {/* ===================================================
          TABS
          =================================================== */}

      <div className="admin-toolbar">

        <button
          type="button"
          className={`admin-btn ${
            tab === "listings"
              ? "primary"
              : "ghost"
          }`}
          onClick={() => setTab("listings")}
        >
          <i className="bi bi-tags"></i>
          Listings ({listings.length})
        </button>

        <button
          type="button"
          className={`admin-btn ${
            tab === "orders" ? "primary" : "ghost"
          }`}
          onClick={() => setTab("orders")}
        >
          <i className="bi bi-bag-check"></i>
          Orders ({orders.length})
        </button>

        {message && (
          <span
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
                  : "bi-info-circle"
              }`}
            ></i>
            {message.text}
          </span>
        )}

      </div>

      {/* ===================================================
          LISTINGS TABLE
          =================================================== */}

      {tab === "listings" && (
        <div className="admin-card">
          <div className="admin-card-body flush">
            {listings.length === 0 ? (
              <div className="admin-empty">
                <i className="bi bi-tags"></i>
                <h3>No Listings</h3>
                <p>
                  Marketplace listings will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Seller</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {listings.map((listing) => {
                      const meta =
                        getListingStatusMeta(
                          listing
                        );

                      return (
                        <tr key={listing.id}>
                          <td>
                            <div className="admin-user-meta">
                              <strong>
                                {listing.name}
                              </strong>

                              <span>
                                {listing.id} ·{" "}
                                {listing.categoryName ||
                                  listing.category}
                              </span>
                            </div>
                          </td>

                          <td>
                            {listing.seller ||
                              listing.ownerName ||
                              "HydroGrow"}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                listing.price
                              )}
                            </strong>{" "}
                            <span className="admin-price-unit">
                              /{" "}
                              {listing.unit}
                            </span>
                          </td>

                          <td>
                            {listing.stock}
                          </td>

                          <td>
                            <span
                              className={`admin-badge ${
                                listing.status ===
                                "active"
                                  ? "success"
                                  : listing.status ===
                                    "paused"
                                    ? "warning"
                                    : "danger"
                              }`}
                            >
                              <i
                                className={`bi ${meta?.icon}`}
                              ></i>
                              {meta?.label ||
                                listing.status}
                            </span>
                          </td>

                          <td>
                            {formatAdminRelative(
                              listing.createdAt
                            )}
                          </td>

                          <td>
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                className="admin-btn ghost small"
                                disabled={
                                  !listing.ownerId
                                }
                                title={
                                  listing.ownerId
                                    ? ""
                                    : "Catalog product — managed by HydroGrow"
                                }
                                onClick={() =>
                                  toggleListingStatus(
                                    listing
                                  )
                                }
                              >
                                <i
                                  className={`bi ${
                                    listing.status ===
                                    "paused"
                                      ? "bi-play-circle"
                                      : "bi-pause-circle"
                                  }`}
                                ></i>
                                {listing.status ===
                                "paused"
                                  ? "Activate"
                                  : "Pause"}
                              </button>

                              <button
                                type="button"
                                className="admin-btn danger small"
                                disabled={
                                  !listing.ownerId
                                }
                                title={
                                  listing.ownerId
                                    ? ""
                                    : "Catalog product — managed by HydroGrow"
                                }
                                onClick={() =>
                                  handleDeleteListing(
                                    listing
                                  )
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
      )}

      {/* ===================================================
          ORDERS TABLE
          =================================================== */}

      {tab === "orders" && (
        <div className="admin-card">
          <div className="admin-card-body flush">
            {orders.length === 0 ? (
              <div className="admin-empty">
                <i className="bi bi-bag"></i>
                <h3>No Orders Yet</h3>
                <p>
                  Customer orders will appear here.
                </p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Placed</th>
                      <th>Update</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => {
                      const meta =
                        getOrderStatusMeta(
                          order.status
                        );

                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>
                              {order.orderNumber ||
                                order.id}
                            </strong>
                          </td>

                          <td>
                            {order.buyer ||
                              order.ownerName}
                            {order.seller
                              ? ` → ${order.seller}`
                              : ""}
                          </td>

                          <td>
                            {order.items
                              ? order.items
                                  .map(
                                    (item) =>
                                      `${item.name} ×${item.quantity}`
                                  )
                                  .join(", ")
                              : order.itemsText}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                order.total
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`admin-badge ${
                                order.status ===
                                "delivered"
                                  ? "success"
                                  : order.status ===
                                    "cancelled"
                                    ? "danger"
                                    : order.status ===
                                      "shipped"
                                      ? "info"
                                      : "warning"
                              }`}
                            >
                              <i
                                className={`bi ${meta?.icon}`}
                              ></i>
                              {meta?.label ||
                                order.status}
                            </span>
                          </td>

                          <td>
                            {formatRelativeDate(
                              order.placedAt
                            )}
                          </td>

                          <td>
                            <select
                              className="admin-select small"
                              value={
                                order.status
                              }
                              onChange={(
                                event
                              ) =>
                                handleOrderStatus(
                                  order,
                                  event.target
                                    .value
                                )
                              }
                            >
                              <option value="placed">
                                Placed
                              </option>

                              <option value="confirmed">
                                Confirmed
                              </option>

                              <option value="shipped">
                                Shipped
                              </option>

                              <option value="delivered">
                                Delivered
                              </option>

                              <option value="cancelled">
                                Cancelled
                              </option>
                            </select>
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
      )}

    </>
  );
}

export default AdminMarketplace;
