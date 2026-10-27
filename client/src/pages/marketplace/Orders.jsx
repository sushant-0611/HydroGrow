import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import api from "../../services/api";

import "../../assets/styles/marketplace.css";

import {
  formatCurrency,
  formatDateTime,
  getOrderStatusMeta,
  getOrderTimeline,
  getOrders,
  updateOrderStatus,
} from "../../data/marketplaceData";

/* =========================================================
   MY ORDERS
   ========================================================= */

const ORDER_STATUS_MAP = {
  PENDING: "placed",
  CONFIRMED: "placed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

const NEXT_SELLER_STATUS = {
  PENDING: { status: "CONFIRMED", label: "Confirm Order" },
  CONFIRMED: { status: "SHIPPED", label: "Mark Shipped" },
  SHIPPED: { status: "DELIVERED", label: "Mark Delivered" },
};

function formatOrderAddress(order) {
  if (typeof order.address === "string") {
    return order.address || "Address not provided";
  }

  return [
    order.address?.line1,
    order.address?.city ||
      order.address?.line2,
  ]
    .filter(Boolean)
    .join(", ");
}

function mapApiOrder(order, role) {
  const history = Array.isArray(
    order.statusHistory
  )
    ? order.statusHistory
    : [];

  const statusAt = (status) =>
    (
      history.find(
        (entry) => entry.status === status
      ) || {}
    ).at;

  const next =
    role === "seller"
      ? NEXT_SELLER_STATUS[order.status]
      : null;

  return {
    id: order.orderNumber || order._id,
    apiId: order._id,
    role,
    placedAt: order.createdAt,
    shippedAt: statusAt("SHIPPED"),
    deliveredAt: statusAt("DELIVERED"),
    status:
      ORDER_STATUS_MAP[order.status] ||
      "placed",
    items: [
      {
        id: order.productId,
        name: order.productTitle,
        seller:
          role === "seller"
            ? "Your listing"
            : "HydroGrow Marketplace",
        price: order.pricePerUnit,
        unit: order.unit,
        quantity: order.quantity,
      },
    ],
    subtotal: order.totalPrice,
    shipping: 0,
    total: order.totalPrice,
    paymentMethod: "Cash on Delivery",
    address:
      order.deliveryAddress ||
      "Address not provided",
    nextStatus: next ? next.status : null,
    nextLabel: next ? next.label : null,
    cancellable:
      role === "buyer" &&
      (order.status === "PENDING" ||
        order.status === "CONFIRMED"),
  };
}

function Orders() {
  const { user } = useAuth();

  const owner = user?.username || user?.name || "";

  const [orders, setOrders] = useState(() =>
    getOrders(owner)
  );

  const [message, setMessage] = useState(null);

  const refresh = () => {
    setOrders(getOrders(owner));
  };

  const flash = (text, tone = "success") => {
    setMessage({ text, tone });

    window.setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  /* =======================================================
     FETCH ORDERS
     ======================================================= */

  const loadOrders = async () => {
    const [buyerResult, sellerResult] =
      await Promise.allSettled([
        api.get("/marketplace/orders/buyer"),
        api.get("/marketplace/orders/seller"),
      ]);

    if (
      buyerResult.status === "rejected" &&
      sellerResult.status === "rejected"
    ) {
      console.warn(
        "Orders unavailable, keeping demo orders:",
        buyerResult.reason?.message
      );

      return;
    }

    const buyerOrders =
      buyerResult.status === "fulfilled"
        ? (buyerResult.value.orders || []).map(
            (order) => mapApiOrder(order, "buyer")
          )
        : [];

    const sellerOrders =
      sellerResult.status === "fulfilled"
        ? (sellerResult.value.orders || []).map(
            (order) => mapApiOrder(order, "seller")
          )
        : [];

    setOrders(
      [...buyerOrders, ...sellerOrders].sort(
        (a, b) =>
          String(b.placedAt || "").localeCompare(
            String(a.placedAt || "")
          )
      )
    );
  };

  useEffect(() => {
    loadOrders();
  }, [owner]);

  const applyOrderUpdate = (order) => {
    setOrders((current) =>
      current.map((item) =>
        item.apiId === order._id
          ? mapApiOrder(order, item.role)
          : item
      )
    );
  };

  const handleCancel = async (order) => {
    const confirmed = window.confirm(
      `Cancel order ${order.id}? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    if (!order.apiId) {
      const updated = updateOrderStatus(
        order.id,
        "cancelled"
      );

      if (!updated) {
        flash("Order could not be cancelled.", "danger");

        return;
      }

      refresh();

      flash(`Order ${order.id} was cancelled.`);

      return;
    }

    try {
      const data = await api.patch(
        `/marketplace/orders/${order.apiId}/status`,
        { status: "CANCELLED" }
      );

      applyOrderUpdate(data.order);

      flash(`Order ${order.id} was cancelled.`);
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  const handleAdvance = async (order) => {
    try {
      const data = await api.patch(
        `/marketplace/orders/${order.apiId}/status`,
        { status: order.nextStatus }
      );

      applyOrderUpdate(data.order);

      flash(
        data.message ||
          `Order ${order.id} updated.`
      );
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  const placedCount = orders.filter(
    (order) => order.status === "placed"
  ).length;

  const inTransitCount = orders.filter(
    (order) => order.status === "shipped"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="marketplace-page">

      <div className="marketplace-subpage-header">

        <div>
          <span className="marketplace-eyebrow">
            PURCHASE HISTORY
          </span>

          <h1>
            <i className="bi bi-receipt" />
            My Orders
          </h1>

          <p>
            Track supplies and produce you have
            ordered from the marketplace.
          </p>
        </div>

        <div className="marketplace-header-actions">

          <Link
            to="/marketplace"
            className="marketplace-header-btn"
          >
            <i className="bi bi-bag" />
            Continue Shopping
          </Link>

        </div>

      </div>

      {message && (
        <div
          className={`marketplace-flash ${
            message.tone
          }`}
        >
          <i
            className={`bi ${
              message.tone === "danger"
                ? "bi-exclamation-circle"
                : "bi-check-circle"
            }`}
          />
          {message.text}
        </div>
      )}

      <div className="marketplace-stat-row">

        <div className="marketplace-stat">
          <span>
            <i className="bi bi-bag-check" />
            Awaiting Shipment
          </span>

          <strong>
            {placedCount}
          </strong>
        </div>

        <div className="marketplace-stat">
          <span>
            <i className="bi bi-truck" />
            In Transit
          </span>

          <strong>
            {inTransitCount}
          </strong>
        </div>

        <div className="marketplace-stat">
          <span>
            <i className="bi bi-house-check" />
            Delivered
          </span>

          <strong>
            {deliveredCount}
          </strong>
        </div>

      </div>

      {orders.length === 0 ? (
        <div className="marketplace-seller-empty">

          <div>
            <i className="bi bi-receipt-cutoff" />
          </div>

          <h3>
            No Orders Yet
          </h3>

          <p>
            Orders you place on the HydroGrow
            marketplace will appear here.
          </p>

          <Link
            to="/marketplace"
            className="marketplace-orders-empty-btn"
          >
            Browse Marketplace
          </Link>

        </div>
      ) : (
        <div className="marketplace-orders-grid">

          {orders.map((order) => {
            const status =
              getOrderStatusMeta(order.status);

            const timeline =
              getOrderTimeline(order);

            const cancellable =
              order.cancellable ??
              order.status === "placed";

            return (
              <article
                className="marketplace-order-card"
                key={order.id}
              >

                <header className="marketplace-order-head">

                  <div>
                    <span>
                      ORDER
                    </span>

                    <h2>
                      {order.id}
                    </h2>

                    <small>
                      Placed{" "}
                      {formatDateTime(order.placedAt)}
                    </small>
                  </div>

                  <span
                    className={`marketplace-status-badge ${order.status}`}
                  >
                    <i
                      className={`bi ${status.icon}`}
                    />
                    {status.label}
                  </span>

                </header>

                <div className="marketplace-order-body">

                  <div className="marketplace-order-items">

                    {order.items.map((item) => (
                      <div
                        className="marketplace-order-item"
                        key={item.id}
                      >

                        <div className="marketplace-order-item-image">

                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                            />
                          ) : (
                            <i
                              className={`bi ${item.icon || "bi-box-seam"}`}
                            />
                          )}

                        </div>

                        <div>
                          <strong>
                            {item.name}
                          </strong>

                          <small>
                            {item.seller} · ₹
                            {item.price.toLocaleString(
                              "en-IN"
                            )}{" "}
                            / {item.unit}
                          </small>
                        </div>

                        <span className="marketplace-order-item-qty">
                          ×{item.quantity}
                        </span>

                      </div>
                    ))}

                  </div>

                  <div className="marketplace-order-summary">

                    <div>
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {formatCurrency(
                          order.subtotal
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Shipping
                      </span>

                      <strong>
                        {order.shipping === 0
                          ? "Free"
                          : formatCurrency(
                              order.shipping
                            )}
                      </strong>
                    </div>

                    <div className="marketplace-order-total">
                      <span>
                        Total
                      </span>

                      <strong>
                        {formatCurrency(order.total)}
                      </strong>
                    </div>

                    <small className="marketplace-order-payment">
                      <i className="bi bi-cash-coin" />
                      {order.paymentMethod}
                    </small>

                  </div>

                </div>

                <div className="marketplace-timeline">

                  {timeline.map((step) => (
                    <div
                      className={`marketplace-timeline-step ${
                        step.confirmed
                          ? "confirmed"
                          : ""
                      } ${
                        order.status === "cancelled"
                          ? "void"
                          : ""
                      }`}
                      key={step.key}
                    >
                      <span className="marketplace-timeline-dot">
                        <i
                          className={`bi ${step.icon}`}
                        />
                      </span>

                      <strong>
                        {step.label}
                      </strong>

                      <small>
                        {order.status === "cancelled"
                          ? "—"
                          : formatDateTime(step.at)}
                      </small>

                      <p>
                        {order.status === "cancelled"
                          ? "Order cancelled."
                          : step.note}
                      </p>
                    </div>
                  ))}

                </div>

                <footer className="marketplace-order-footer">

                  <small>
                    <i className="bi bi-geo-alt" />
                    Deliver to:{" "}
                    {formatOrderAddress(order)}
                  </small>

                  <div>

                    {order.nextStatus && (
                      <button
                        type="button"
                        className="marketplace-order-cancel"
                        onClick={() =>
                          handleAdvance(order)
                        }
                      >
                        <i className="bi bi-arrow-right-circle" />
                        {order.nextLabel}
                      </button>
                    )}

                    {cancellable && (
                      <button
                        type="button"
                        className="marketplace-order-cancel"
                        onClick={() =>
                          handleCancel(order)
                        }
                      >
                        <i className="bi bi-x-circle" />
                        Cancel Order
                      </button>
                    )}

                  </div>

                </footer>

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default Orders;
