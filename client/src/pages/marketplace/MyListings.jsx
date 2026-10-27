import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import api from "../../services/api";

import { crops } from "../../data/cropData";

import "../../assets/styles/marketplace.css";

import {
  createListing,
  deleteListing,
  formatCurrency,
  formatDate,
  getListingStatusMeta,
  getMyListings,
  updateListing,
} from "../../data/marketplaceData";

/* =========================================================
   MY LISTINGS
   ========================================================= */

const UNITS = ["kg", "grams", "pieces", "crates", "bunches", "packs"];

const CROP_OPTIONS = crops
  .map((crop) => crop.name)
  .sort((a, b) => a.localeCompare(b));

function mapApiListing(product) {
  return {
    id: product.id,
    fromApi: true,
    name: product.title || product.cropName,
    description: product.description,
    price: product.price,
    unit: product.unit,
    stock:
      product.status === "SOLD_OUT"
        ? 0
        : product.quantity,
    status:
      product.status === "INACTIVE"
        ? "paused"
        : "active",
    image: product.image || null,
    icon: "bi-basket",
    harvestDate: product.harvestDate,
    createdAt: product.createdAt,
  };
}

function MyListings() {
  const { user } = useAuth();

  const owner = user?.username || user?.name || "";

  const [listings, setListings] = useState(() =>
    getMyListings(owner)
  );

  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    crop: "",
    quantity: "",
    unit: "kg",
    price: "",
    harvestDate: "",
    availableUntil: "",
    description: "",
  });

  const refresh = () => {
    setListings(getMyListings(owner));
  };

  const loadListings = async () => {
    try {
      const data = await api.get(
        "/marketplace/products/mine"
      );

      setListings(
        (data.products || []).map(
          mapApiListing
        )
      );
    } catch (error) {
      console.warn(
        "Listings unavailable, keeping local listings:",
        error.message
      );
    }
  };

  useEffect(() => {
    loadListings();
  }, [owner]);

  const flash = (text, tone = "success") => {
    setMessage({ text, tone });

    window.setTimeout(() => {
      setMessage(null);
    }, 3200);
  };

  const activeCount = listings.filter(
    (listing) =>
      getListingStatusMeta(listing).status === "active"
  ).length;

  const totalStock = listings.reduce(
    (total, listing) => total + (Number(listing.stock) || 0),
    0
  );

  const totalSold = listings.reduce(
    (total, listing) => total + (Number(listing.unitsSold) || 0),
    0
  );

  /* =======================================================
     FORM
     ======================================================= */

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      crop: "",
      quantity: "",
      unit: "kg",
      price: "",
      harvestDate: "",
      availableUntil: "",
      description: "",
    });
  };

  const handleCreate = async () => {
    const cropName = form.crop.trim();

    if (!cropName) {
      flash("Please select a crop.", "danger");

      return;
    }

    const quantity = Math.round(Number(form.quantity));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      flash("Please enter a valid quantity.", "danger");

      return;
    }

    const price = Number(form.price);

    if (!Number.isFinite(price) || price <= 0) {
      flash("Please enter a valid price.", "danger");

      return;
    }

    const details = [
      form.description.trim(),
      form.harvestDate &&
        `Harvest date: ${formatDate(form.harvestDate)}`,
      form.availableUntil &&
        `Available until: ${formatDate(form.availableUntil)}`,
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const data = await api.post(
        "/marketplace/products",
        {
          cropName,
          title: cropName,
          description: details,
          quantity,
          unit: form.unit,
          price,
          location: "",
          image: "",
          harvestDate: form.harvestDate,
        }
      );

      setListings((current) => [
        mapApiListing(data.product),
        ...current,
      ]);

      flash(
        `${cropName} is now listed on the HydroGrow marketplace.`
      );
    } catch (error) {
      if (!error.status) {
        createListing(
          {
            name: cropName,
            category: "produce",
            price,
            unit: form.unit,
            stock: quantity,
            description: details,
          },
          owner
        );

        refresh();
      }

      flash(error.message, "danger");
    }

    resetForm();
    setShowForm(false);
  };

  const handleToggleStatus = async (listing) => {
    const meta = getListingStatusMeta(listing);

    const pausing = meta.status !== "paused";

    if (!listing.fromApi) {
      updateListing(listing.id, {
        status: pausing ? "paused" : "active",
      });

      refresh();

      flash(
        pausing
          ? `${listing.name} listing paused.`
          : `${listing.name} listing is live again.`
      );

      return;
    }

    try {
      const data = await api.put(
        `/marketplace/products/${listing.id}`,
        { status: pausing ? "INACTIVE" : "AVAILABLE" }
      );

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id
            ? mapApiListing(data.product)
            : item
        )
      );

      flash(
        pausing
          ? `${listing.name} listing paused.`
          : `${listing.name} listing is live again.`
      );
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  const handleDelete = async (listing) => {
    const confirmed = window.confirm(
      `Remove the ${listing.name} listing from the marketplace?`
    );

    if (!confirmed) {
      return;
    }

    if (!listing.fromApi) {
      deleteListing(listing.id);

      refresh();

      flash(`${listing.name} listing removed.`);

      return;
    }

    try {
      await api.del(
        `/marketplace/products/${listing.id}`
      );

      setListings((current) =>
        current.filter(
          (item) => item.id !== listing.id
        )
      );

      flash(`${listing.name} listing removed.`);
    } catch (error) {
      flash(error.message, "danger");
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="marketplace-page">

      <div className="marketplace-subpage-header">

        <div>
          <span className="marketplace-eyebrow">
            SELLER DASHBOARD
          </span>

          <h1>
            <i className="bi bi-tags" />
            My Listings
          </h1>

          <p>
            Produce you are selling through the
            HydroGrow marketplace.
          </p>
        </div>

        <div className="marketplace-header-actions">

          <button
            type="button"
            className="marketplace-header-btn"
            onClick={() =>
              setShowForm((current) => !current)
            }
          >
            <i className="bi bi-plus-circle" />
            New Listing
          </button>

          <Link
            to="/marketplace"
            className="marketplace-header-btn"
          >
            <i className="bi bi-shop" />
            Marketplace
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
            <i className="bi bi-broadcast" />
            Active Listings
          </span>

          <strong>
            {activeCount}
          </strong>
        </div>

        <div className="marketplace-stat">
          <span>
            <i className="bi bi-box-seam" />
            Stock Available
          </span>

          <strong>
            {totalStock}
          </strong>
        </div>

        <div className="marketplace-stat">
          <span>
            <i className="bi bi-graph-up-arrow" />
            Units Sold
          </span>

          <strong>
            {totalSold}
          </strong>
        </div>

      </div>

      {showForm && (
        <section className="marketplace-sell-form">

          <div className="marketplace-form-heading">

            <div>
              <span>
                PRODUCE LISTING
              </span>

              <h2>
                Add Harvested Produce
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowForm(false)
              }
            >
              <i className="bi bi-x-lg" />
            </button>

          </div>

          <div className="marketplace-form-grid">

            <div className="marketplace-form-group">
              <label>
                Crop
              </label>

              <select
                value={form.crop}
                onChange={(event) =>
                  updateField(
                    "crop",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Crop
                </option>

                {CROP_OPTIONS.map(
                  (cropName) => (
                    <option
                      key={cropName}
                      value={cropName}
                    >
                      {cropName}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="marketplace-form-group">
              <label>
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  updateField(
                    "quantity",
                    event.target.value
                  )
                }
                placeholder="e.g. 10"
              />
            </div>

            <div className="marketplace-form-group">
              <label>
                Unit
              </label>

              <select
                value={form.unit}
                onChange={(event) =>
                  updateField(
                    "unit",
                    event.target.value
                  )
                }
              >
                {UNITS.map((unit) => (
                  <option
                    key={unit}
                    value={unit}
                  >
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="marketplace-form-group">
              <label>
                Price (₹ per {form.unit})
              </label>

              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) =>
                  updateField(
                    "price",
                    event.target.value
                  )
                }
                placeholder="e.g. 180"
              />
            </div>

            <div className="marketplace-form-group">
              <label>
                Harvest Date
              </label>

              <input
                type="date"
                value={form.harvestDate}
                onChange={(event) =>
                  updateField(
                    "harvestDate",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="marketplace-form-group">
              <label>
                Available Until
              </label>

              <input
                type="date"
                value={form.availableUntil}
                onChange={(event) =>
                  updateField(
                    "availableUntil",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="marketplace-form-group full">
              <label>
                Produce Description
              </label>

              <textarea
                rows="3"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe your harvested produce, cultivation method, quality, packaging, etc."
              />
            </div>

          </div>

          <div className="marketplace-form-actions">

            <button
              type="button"
              className="marketplace-form-cancel"
              onClick={() =>
                setShowForm(false)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="marketplace-form-submit"
              onClick={handleCreate}
            >
              <i className="bi bi-check-circle" />
              Publish Listing
            </button>

          </div>

        </section>
      )}

      {listings.length === 0 ? (
        <div className="marketplace-seller-empty">

          <div>
            <i className="bi bi-shop-window" />
          </div>

          <h3>
            No Produce Listings Yet
          </h3>

          <p>
            Create a listing to sell your harvest
            on the HydroGrow marketplace.
          </p>

          <button
            type="button"
            onClick={() =>
              setShowForm(true)
            }
          >
            Add Your First Listing
          </button>

        </div>
      ) : (
        <div className="marketplace-listings-grid">

          {listings.map((listing) => {
            const meta =
              getListingStatusMeta(listing);

            return (
              <article
                className="marketplace-listing-card"
                key={listing.id}
              >

                <div className="marketplace-listing-top">

                  <div className="marketplace-listing-icon">
                    <i
                      className={`bi ${listing.icon || "bi-basket"}`}
                    />
                  </div>

                  <div>
                    <h3>
                      {listing.name}
                    </h3>

                    <span
                      className={`marketplace-status-badge ${meta.status}`}
                    >
                      <i
                        className={`bi ${meta.icon}`}
                      />
                      {meta.label}
                    </span>
                  </div>

                </div>

                <p className="marketplace-listing-desc">
                  {listing.description ||
                    "No description provided."}
                </p>

                <div className="marketplace-listing-stats">
                  <div>
                    <span>
                      Price
                    </span>

                    <strong>
                      {formatCurrency(listing.price)}

                      <small>
                        /{listing.unit}
                      </small>
                    </strong>
                  </div>

                  <div>
                    <span>
                      Stock
                    </span>

                    <strong>
                      {listing.stock}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Sold
                    </span>

                    <strong>
                      {listing.unitsSold || 0}
                    </strong>
                  </div>
                </div>

                <footer className="marketplace-listing-footer">
                  <small>
                    Listed {formatDate(listing.createdAt)}
                  </small>

                  <div className="marketplace-listing-actions">

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(
                          listing
                        )
                      }
                    >
                      <i
                        className={`bi ${
                          meta.status === "paused"
                            ? "bi-play-circle"
                            : "bi-pause-circle"
                        }`}
                      />
                      {meta.status === "paused"
                        ? "Resume"
                        : "Pause"}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        handleDelete(listing)
                      }
                    >
                      <i className="bi bi-trash3" />
                      Delete
                    </button>

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

export default MyListings;
