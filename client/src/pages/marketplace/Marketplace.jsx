import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import api from "../../services/api";

import { crops } from "../../data/cropData";

import {
  CATEGORIES,
  createListing,
  formatDate,
  getAllListings,
  getMyListings,
  getProducts,
  placeOrder,
} from "../../data/marketplaceData";

import "../../assets/styles/marketplace.css";

/* =========================================================
   SELL FORM OPTIONS
   ========================================================= */

const CROP_OPTIONS = crops
  .map((crop) => crop.name)
  .sort((a, b) => a.localeCompare(b));

/* =========================================================
   API MAPPERS
   ========================================================= */

function mapApiProduct(product) {
  return {
    id: product.id,
    name: product.title || product.cropName,
    category: "produce",
    categoryName: "Fresh Produce",
    price: product.price,
    unit: product.unit,
    seller: product.seller
      ? product.seller.name ||
        product.seller.username
      : "HydroGrow Seller",
    stock:
      product.status === "AVAILABLE"
        ? product.quantity
        : 0,
    image: product.image || null,
    icon: "bi-basket",
    description: product.description,
    tags: product.location
      ? [product.location]
      : [],
  };
}

function mapApiListing(product) {
  return {
    id: product.id,
    name: product.title || product.cropName,
    price: product.price,
    unit: product.unit,
    stock:
      product.status === "AVAILABLE"
        ? product.quantity
        : 0,
    status: "active",
    icon: "bi-basket",
  };
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Marketplace() {
  const { user } = useAuth();

  const navigate = useNavigate();

  const owner = user?.username || user?.name || "";

  const [products, setProducts] = useState(() => [
    ...getProducts(),
    ...getAllListings(),
  ]);

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [cart, setCart] = useState([]);

  const [wishlist, setWishlist] =
    useState([]);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [showCart, setShowCart] =
    useState(false);

  const [activeView, setActiveView] =
    useState("buy");

  const [sortBy, setSortBy] =
    useState("featured");

  /* =======================================================
     FILTER PRODUCTS
     ======================================================= */

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (
      activeCategory !==
      "all"
    ) {
      result = result.filter(
        (product) =>
          product.category ===
          activeCategory
      );
    }

    const search =
      searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter(
        (product) => {
          const searchable = [
            product.name,
            product.categoryName,
            product.seller,
            product.description,
            ...(product.tags || []),
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            search
          );
        }
      );
    }

    if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          a.price - b.price
      );
    }

    if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          b.price - a.price
      );
    }

    if (sortBy === "rating") {
      result.sort(
        (a, b) =>
          b.rating - a.rating
      );
    }

    return result;
  }, [
    activeCategory,
    searchTerm,
    sortBy,
    products,
  ]);

  /* =======================================================
     CART
     ======================================================= */

  const addToCart = (
    product
  ) => {
    setCart((current) => {
      const existing =
        current.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        return current.map(
          (item) =>
            item.id ===
            product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (
    productId,
    quantity
  ) => {
    if (quantity <= 0) {
      setCart((current) =>
        current.filter(
          (item) =>
            item.id !==
            productId
        )
      );

      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  };

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      item.price *
        item.quantity,
    0
  );

  /* =======================================================
     WISHLIST
     ======================================================= */

  const toggleWishlist = (
    productId
  ) => {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter(
            (id) =>
              id !== productId
          )
        : [...current, productId]
    );
  };

  /* =======================================================
     FETCH PRODUCTS
     ======================================================= */

  const loadProducts = async () => {
    try {
      const data = await api.get(
        "/marketplace/products"
      );

      setProducts(
        (data.products || []).map(
          mapApiProduct
        )
      );
    } catch (error) {
      console.warn(
        "Marketplace unavailable, keeping demo catalogue:",
        error.message
      );
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleListingCreated = (product) => {
    setProducts((current) => [
      product,
      ...current,
    ]);
  };

  /* =======================================================
     ORDERS
     ======================================================= */

  const handleCheckout = async () => {
    const failures = [];

    for (const item of cart) {
      try {
        await api.post(
          "/marketplace/orders",
          {
            productId: item.id,
            quantity: item.quantity,
            deliveryAddress:
              "HydroGrow Registered Address",
            note: "",
          }
        );
      } catch (error) {
        if (error.status) {
          failures.push(
            `${item.name}: ${error.message}`
          );

          continue;
        }

        placeOrder(
          item,
          item.quantity,
          owner
        );
      }
    }

    if (failures.length > 0) {
      window.alert(
        failures.join("\n")
      );

      return;
    }

    setCart([]);
    setShowCart(false);
    navigate("/marketplace/orders");
  };

  const handleBuyNow = async (product) => {
    try {
      await api.post(
        "/marketplace/orders",
        {
          productId: product.id,
          quantity: 1,
          deliveryAddress:
            "HydroGrow Registered Address",
          note: "",
        }
      );
    } catch (error) {
      if (error.status) {
        window.alert(error.message);

        return;
      }

      placeOrder(product, 1, owner);
    }

    setSelectedProduct(null);
    navigate("/marketplace/orders");
  };

  /* =======================================================
     EMPTY / SELL VIEW
     ======================================================= */

  return (
    <div className="marketplace-page">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="marketplace-header">

        <div>
          <span className="marketplace-eyebrow">
            HYDROGROW MARKETPLACE
          </span>

          <h1>
            <i className="bi bi-shop" />
            Marketplace
          </h1>

          <p>
            Buy hydroponic supplies or sell
            your fresh farm produce.
          </p>
        </div>

        <div className="marketplace-header-actions">

          <button
            type="button"
            className="marketplace-header-btn"
            onClick={() =>
              setShowCart(true)
            }
          >
            <i className="bi bi-cart3" />

            <span>
              Cart
            </span>

            {cartCount > 0 && (
              <b>
                {cartCount}
              </b>
            )}
          </button>

          <Link
            to="/marketplace/listings"
            className="marketplace-header-btn"
          >
            <i className="bi bi-tags" />
            My Listings
          </Link>

          <Link
            to="/marketplace/orders"
            className="marketplace-header-btn"
          >
            <i className="bi bi-receipt" />
            Orders
          </Link>

          <Link
            to="/my-farm"
            className="marketplace-header-btn"
          >
            <i className="bi bi-house" />
            My Farm
          </Link>

        </div>

      </div>

      {/* ===================================================
          BUY / SELL SWITCH
          =================================================== */}

      <div className="marketplace-mode">

        <button
          type="button"
          className={
            activeView === "buy"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("buy")
          }
        >
          <i className="bi bi-bag" />
          Buy Supplies
        </button>

        <button
          type="button"
          className={
            activeView === "sell"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("sell")
          }
        >
          <i className="bi bi-shop-window" />
          Sell Produce
        </button>

      </div>

      {/* ===================================================
          SELL VIEW
          =================================================== */}

      {activeView === "sell" ? (
        <SellProduceView
          onListingCreated={
            handleListingCreated
          }
        />
      ) : (
        <>
          {/* ===============================================
              SEARCH
              =============================================== */}

          <div className="marketplace-search-row">

            <div className="marketplace-search">

              <i className="bi bi-search" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search seeds, nutrients, sensors, pumps, lights..."
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  <i className="bi bi-x" />
                </button>
              )}

            </div>

            <select
              className="marketplace-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >
              <option value="featured">
                Featured
              </option>

              <option value="rating">
                Top Rated
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>
            </select>

          </div>

          {/* ===============================================
              CATEGORIES
              =============================================== */}

          <div className="marketplace-categories">

            {CATEGORIES.map(
              (category) => (
                <button
                  type="button"
                  key={category.id}
                  className={
                    activeCategory ===
                    category.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveCategory(
                      category.id
                    )
                  }
                >
                  <span>
                    <i
                      className={`bi ${category.icon}`}
                    />
                  </span>

                  {category.name}
                </button>
              )
            )}

          </div>

          {/* ===============================================
              PRODUCT HEADER
              =============================================== */}

          <div className="marketplace-products-header">

            <div>
              <h2>
                {activeCategory ===
                "all"
                  ? "Hydroponic Supplies"
                  : CATEGORIES.find(
                      (category) =>
                        category.id ===
                        activeCategory
                    )?.name}
              </h2>

              <p>
                {filteredProducts.length}{" "}
                product
                {filteredProducts.length !==
                1
                  ? "s"
                  : ""}{" "}
                available
              </p>
            </div>

            <span className="marketplace-result-status">
              <i className="bi bi-shield-check" />
              HydroGrow Marketplace
            </span>

          </div>

          {/* ===============================================
              PRODUCT GRID
              =============================================== */}

          {filteredProducts.length >
          0 ? (
            <div className="marketplace-product-grid">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlist.includes(
                      product.id
                    )}
                    onWishlist={() =>
                      toggleWishlist(
                        product.id
                      )
                    }
                    onAddToCart={() =>
                      addToCart(
                        product
                      )
                    }
                    onView={() =>
                      setSelectedProduct(
                        product
                      )
                    }
                  />
                )
              )}

            </div>
          ) : (
            <div className="marketplace-no-results">

              <div>
                <i className="bi bi-search" />
              </div>

              <h3>
                No Products Found
              </h3>

              <p>
                Try a different search
                term or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory(
                    "all"
                  );
                }}
              >
                Clear Filters
              </button>

            </div>
          )}
        </>
      )}

      {/* ===================================================
          PRODUCT MODAL
          =================================================== */}

      {selectedProduct && (
        <ProductModal
          product={
            selectedProduct
          }
          isWishlisted={wishlist.includes(
            selectedProduct.id
          )}
          onWishlist={() =>
            toggleWishlist(
              selectedProduct.id
            )
          }
          onAddToCart={() => {
            addToCart(
              selectedProduct
            );
            setSelectedProduct(
              null
            );
          }}
          onBuyNow={() =>
            handleBuyNow(
              selectedProduct
            )
          }
          onClose={() =>
            setSelectedProduct(
              null
            )
          }
        />
      )}

      {/* ===================================================
          CART DRAWER
          =================================================== */}

      {showCart && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          onClose={() =>
            setShowCart(false)
          }
          onQuantityChange={
            updateCartQuantity
          }
          onCheckout={handleCheckout}
        />
      )}

    </div>
  );
}

/* =========================================================
   PRODUCT CARD
   ========================================================= */

function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onAddToCart,
  onView,
}) {
  return (
    <article className="marketplace-product-card">

      <div className="marketplace-product-image">

        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
          />
        ) : (
          <div className="marketplace-product-placeholder">
            <i
              className={`bi ${product.icon}`}
            />
          </div>
        )}

        <span className="marketplace-category-badge">
          {product.categoryName}
        </span>

        <button
          type="button"
          className={`marketplace-wishlist ${
            isWishlisted
              ? "active"
              : ""
          }`}
          onClick={onWishlist}
          aria-label="Wishlist"
        >
          <i
            className={`bi ${
              isWishlisted
                ? "bi-heart-fill"
                : "bi-heart"
            }`}
          />
        </button>

      </div>

      <div className="marketplace-product-body">

        <div className="marketplace-product-seller">
          <i className="bi bi-person-circle" />
          {product.seller}
        </div>

        <button
          type="button"
          className="marketplace-product-name"
          onClick={onView}
        >
          {product.name}
        </button>

        <p className="marketplace-product-description">
          {product.description}
        </p>

        <div className="marketplace-rating">

          {product.rating != null ? (
            <>
              <span>
                <i className="bi bi-star-fill" />
                {product.rating}
              </span>

              <small>
                ({product.reviews}{" "}
                reviews)
              </small>
            </>
          ) : (
            <span className="marketplace-new-flag">
              <i className="bi bi-stars" />
              Fresh from the farm
            </span>
          )}

        </div>

        <div className="marketplace-product-footer">

          <div>
            <strong>
              ₹{product.price.toLocaleString(
                "en-IN"
              )}
            </strong>

            <span>
              / {product.unit}
            </span>
          </div>

          <span
            className={
              product.stock > 0
                ? "stock available"
                : "stock unavailable"
            }
          >
            {product.stock > 0
              ? `${product.stock} in stock`
              : "Out of stock"}
          </span>

        </div>

        <div className="marketplace-card-actions">

          <button
            type="button"
            className="marketplace-view-btn"
            onClick={onView}
          >
            View Details
          </button>

          <button
            type="button"
            className="marketplace-cart-btn"
            disabled={
              product.stock <= 0
            }
            onClick={onAddToCart}
          >
            <i className="bi bi-cart-plus" />
            Add
          </button>

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function ProductModal({
  product,
  isWishlisted,
  onWishlist,
  onAddToCart,
  onBuyNow,
  onClose,
}) {
  return (
    <div
      className="marketplace-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="marketplace-product-modal">

        <button
          type="button"
          className="marketplace-modal-close"
          onClick={onClose}
        >
          <i className="bi bi-x-lg" />
        </button>

        <div className="marketplace-modal-image">

          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
            />
          ) : (
            <div className="marketplace-product-placeholder">
              <i
                className={`bi ${product.icon}`}
              />
            </div>
          )}

        </div>

        <div className="marketplace-modal-content">

          <span className="marketplace-modal-category">
            {product.categoryName}
          </span>

          <h2>
            {product.name}
          </h2>

          <div className="marketplace-modal-rating">
            {product.rating != null ? (
              <>
                <i className="bi bi-star-fill" />
                {product.rating}

                <span>
                  {product.reviews} reviews
                </span>
              </>
            ) : (
              <span className="marketplace-new-flag">
                <i className="bi bi-stars" />
                Fresh from the farm
              </span>
            )}
          </div>

          <p>
            {product.description}
          </p>

          <div className="marketplace-tags">
            {product.tags?.map(
              (tag) => (
                <span key={tag}>
                  {tag}
                </span>
              )
            )}
          </div>

          <div className="marketplace-modal-seller">
            <span>
              Seller
            </span>

            <strong>
              {product.seller}
            </strong>
          </div>

          <div className="marketplace-modal-price">
            <strong>
              ₹{product.price.toLocaleString(
                "en-IN"
              )}
            </strong>

            <span>
              / {product.unit}
            </span>
          </div>

          <div className="marketplace-modal-stock">
            <i className="bi bi-box-seam" />

            {product.stock > 0
              ? `${product.stock} units currently available`
              : "Currently out of stock"}
          </div>

          <div className="marketplace-modal-actions">

            <button
              type="button"
              className={`marketplace-modal-wishlist ${
                isWishlisted
                  ? "active"
                  : ""
              }`}
              onClick={onWishlist}
            >
              <i
                className={`bi ${
                  isWishlisted
                    ? "bi-heart-fill"
                    : "bi-heart"
                }`}
              />
            </button>

            <button
              type="button"
              className="marketplace-modal-buy"
              disabled={
                product.stock <= 0
              }
              onClick={onBuyNow}
            >
              <i className="bi bi-lightning-charge" />
              Buy Now
            </button>

            <button
              type="button"
              className="marketplace-modal-cart"
              disabled={
                product.stock <= 0
              }
              onClick={onAddToCart}
            >
              <i className="bi bi-cart-plus" />
              Add to Cart
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   CART DRAWER
   ========================================================= */

function CartDrawer({
  cart,
  total,
  onClose,
  onQuantityChange,
  onCheckout,
}) {
  return (
    <div
      className="marketplace-drawer-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside className="marketplace-cart-drawer">

        <div className="marketplace-drawer-header">

          <div>
            <span>
              HYDROGROW
            </span>

            <h2>
              Shopping Cart
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>

        </div>

        <div className="marketplace-cart-body">

          {cart.length === 0 ? (
            <div className="marketplace-cart-empty">

              <div>
                <i className="bi bi-cart3" />
              </div>

              <h3>
                Your Cart is Empty
              </h3>

              <p>
                Add hydroponic products
                to continue.
              </p>

            </div>
          ) : (
            cart.map((item) => (
              <div
                className="marketplace-cart-item"
                key={item.id}
              >

                <div className="marketplace-cart-image">

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  ) : (
                    <i
                      className={`bi ${item.icon}`}
                    />
                  )}

                </div>

                <div className="marketplace-cart-item-content">

                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    ₹{item.price.toLocaleString(
                      "en-IN"
                    )}
                  </span>

                  <div className="marketplace-quantity">

                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(
                          item.id,
                          item.quantity -
                            1
                        )
                      }
                    >
                      −
                    </button>

                    <b>
                      {item.quantity}
                    </b>

                    <button
                      type="button"
                      onClick={() =>
                        onQuantityChange(
                          item.id,
                          item.quantity +
                            1
                        )
                      }
                    >
                      +
                    </button>

                  </div>

                </div>

              </div>
            ))
          )}

        </div>

        {cart.length > 0 && (
          <div className="marketplace-cart-footer">

            <div>
              <span>
                Subtotal
              </span>

              <strong>
                ₹{total.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <button
              type="button"
              className="marketplace-checkout-btn"
              onClick={onCheckout}
            >
              Place Order
              <i className="bi bi-arrow-right" />
            </button>

            <small>
              Orders are recorded instantly as
              Cash on Delivery. Payment gateway
              arrives with the HydroGrow backend.
            </small>

          </div>
        )}

      </aside>
    </div>
  );
}

/* =========================================================
   SELL PRODUCE VIEW
   ========================================================= */

function SellProduceView({
  onListingCreated,
}) {
  const { user } = useAuth();

  const navigate = useNavigate();

  const owner =
    user?.username || user?.name || "";

  const [showForm, setShowForm] =
    useState(false);

  const [myListings, setMyListings] = useState(
    () => getMyListings(owner)
  );

  useEffect(() => {
    let mounted = true;

    api
      .get("/marketplace/products/mine")
      .then((data) => {
        if (mounted) {
          setMyListings(
            (data.products || []).map(
              mapApiListing
            )
          );
        }
      })
      .catch((error) => {
        console.warn(
          "Seller listings unavailable, keeping local listings:",
          error.message
        );
      });

    return () => {
      mounted = false;
    };
  }, [owner]);

  const activeCount = myListings.filter(
    (listing) =>
      listing.status === "active" &&
      (Number(listing.stock) || 0) > 0
  ).length;

  return (
    <div className="marketplace-sell">

      <section className="marketplace-sell-hero">

        <div className="marketplace-sell-hero-content">

          <span>
            SELL YOUR HARVEST
          </span>

          <h2>
            Turn your hydroponic harvest
            into a marketplace listing.
          </h2>

          <p>
            Create a produce listing with
            crop information, quantity,
            harvest date and selling price.
          </p>

          <button
            type="button"
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
          >
            <i className="bi bi-plus-circle" />
            Create Produce Listing
          </button>

        </div>

        <div className="marketplace-sell-hero-icon">
          <i className="bi bi-basket2" />
        </div>

      </section>

      {showForm ? (
        <SellProduceForm
          onCancel={() =>
            setShowForm(false)
          }
          onCreated={(product) => {
            onListingCreated(product);
            navigate(
              "/marketplace/listings"
            );
          }}
        />
      ) : (
        <div className="marketplace-seller-dashboard">

          <div className="marketplace-seller-heading">
            <div>
              <h2>
                My Listings
              </h2>

              <p>
                Manage produce you want
                to sell through HydroGrow.
              </p>
            </div>

            <span>
              {activeCount} Active Listing
              {activeCount !== 1 ? "s" : ""}
            </span>
          </div>

          {myListings.length === 0 ? (
            <div className="marketplace-seller-empty">

              <div>
                <i className="bi bi-shop-window" />
              </div>

              <h3>
                No Produce Listings Yet
              </h3>

              <p>
                Your harvested crop listings
                will appear here.
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
            <div className="marketplace-seller-preview">

              {myListings
                .slice(0, 3)
                .map((listing) => (
                  <div
                    className="marketplace-seller-preview-item"
                    key={listing.id}
                  >
                    <i
                      className={`bi ${listing.icon || "bi-basket"}`}
                    />

                    <div>
                      <strong>
                        {listing.name}
                      </strong>

                      <small>
                        ₹{Number(
                          listing.price
                        ).toLocaleString(
                          "en-IN"
                        )}{" "}
                        / {listing.unit} ·{" "}
                        {listing.stock} in
                        stock
                      </small>
                    </div>

                    <span
                      className={`marketplace-status-badge ${
                        (Number(listing.stock) || 0) > 0
                          ? listing.status
                          : "sold-out"
                      }`}
                    >
                      {(Number(
                        listing.stock
                      ) || 0) > 0
                        ? listing.status ===
                          "paused"
                          ? "Paused"
                          : "Active"
                        : "Sold Out"}
                    </span>

                  </div>
                ))}

              <Link
                to="/marketplace/listings"
                className="marketplace-seller-manage"
              >
                <i className="bi bi-gear" />
                Manage All Listings
              </Link>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   SELL FORM
   ========================================================= */

function SellProduceForm({
  onCancel,
  onCreated,
}) {
  const { user } = useAuth();

  const owner =
    user?.username || user?.name || "";

  const [form, setForm] = useState({
    crop: "",
    quantity: "",
    unit: "kg",
    price: "",
    harvestDate: "",
    availableUntil: "",
    description: "",
  });

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const cropName = form.crop.trim();

    if (!cropName) {
      window.alert(
        "Please select a crop."
      );

      return;
    }

    const quantity = Math.round(
      Number(form.quantity)
    );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      window.alert(
        "Please enter a valid quantity."
      );

      return;
    }

    const price = Number(form.price);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      window.alert(
        "Please enter a valid price."
      );

      return;
    }

    const details = [
      form.description.trim(),
      form.harvestDate &&
        `Harvest date: ${formatDate(
          form.harvestDate
        )}`,
      form.availableUntil &&
        `Available until: ${formatDate(
          form.availableUntil
        )}`,
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

      onCreated(
        mapApiProduct(data.product)
      );
    } catch (error) {
      window.alert(error.message);

      const listing = createListing(
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

      onCreated({
        ...listing,
        seller: owner,
      });
    }
  };

  return (
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
          onClick={onCancel}
        >
          <i className="bi bi-x-lg" />
        </button>

      </div>

      <div className="marketplace-form-grid">

        <div className="marketplace-form-group">
          <label>
            Crop Name
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
            <option>
              kg
            </option>
            <option>
              grams
            </option>
            <option>
              pieces
            </option>
            <option>
              crates
            </option>
          </select>
        </div>

        <div className="marketplace-form-group">
          <label>
            Price
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
            placeholder="₹ Price"
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
            rows="4"
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
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="button"
          className="marketplace-form-submit"
          onClick={handleSubmit}
        >
          <i className="bi bi-check-circle" />
          Create Listing
        </button>

      </div>

    </section>
  );
}