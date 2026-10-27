import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/crops.css";

const IMAGE_BASE = "/images/crops";

const CROPS = [
  {
    id: 1,
    name: "Lettuce",
    category: "Leafy Green",
    scientificName: "Lactuca sativa",
    system: "NFT / DWC / Vertical",
    ph: "5.5 – 6.5",
    ec: "1.2 – 1.8",
    description:
      "A fast-growing leafy crop that performs very well in controlled hydroponic and vertical farming systems.",
    images: [
      `${IMAGE_BASE}/Lettuce1.jpg`,
      `${IMAGE_BASE}/Lettuce2.jpg`,
      `${IMAGE_BASE}/Lettuce3.jpg`,
      `${IMAGE_BASE}/Lettuce4.jpg`,
    ],
  },

  {
    id: 2,
    name: "Spinach",
    category: "Leafy Green",
    scientificName: "Spinacia oleracea",
    system: "NFT / DWC",
    ph: "5.5 – 6.5",
    ec: "1.8 – 2.3",
    description:
      "A nutrient-rich leafy crop suitable for cool controlled environments and soilless cultivation.",
    images: [
      `${IMAGE_BASE}/Spinach1.jpg`,
      `${IMAGE_BASE}/Spinach2.jpg`,
      `${IMAGE_BASE}/Spinach3.jpg`,
      `${IMAGE_BASE}/Spinach4.jpg`,
    ],
  },

  {
    id: 3,
    name: "Kale",
    category: "Leafy Green",
    scientificName: "Brassica oleracea",
    system: "NFT / DWC / Vertical",
    ph: "5.5 – 6.5",
    ec: "1.6 – 2.4",
    description:
      "A hardy leafy vegetable that can be grown efficiently in hydroponic nutrient solutions.",
    images: [
      `${IMAGE_BASE}/Kale1.jpg`,
      `${IMAGE_BASE}/Kale2.jpg`,
      `${IMAGE_BASE}/Kale3.jpg`,
      `${IMAGE_BASE}/Kale4.jpg`,
    ],
  },

  {
    id: 4,
    name: "Pak Choi / Bok Choy",
    category: "Leafy Vegetable",
    scientificName: "Brassica rapa",
    system: "NFT / DWC / Vertical",
    ph: "6.0 – 6.5",
    ec: "1.5 – 2.0",
    description:
      "A compact Asian leafy vegetable that adapts well to vertical and recirculating hydroponic systems.",
    images: [
      `${IMAGE_BASE}/Pak Choi Bok Choy1.jpg`,
      `${IMAGE_BASE}/Pak Choi Bok Choy2.jpg`,
      `${IMAGE_BASE}/Pak Choi Bok Choy3.jpg`,
      `${IMAGE_BASE}/Pak Choi Bok Choy4.jpg`,
    ],
  },

  {
    id: 5,
    name: "Arugula / Rocket",
    category: "Leafy Green",
    scientificName: "Eruca sativa",
    system: "NFT / DWC",
    ph: "6.0 – 7.0",
    ec: "0.8 – 1.4",
    description:
      "A quick-growing leafy green with a distinctive peppery flavour and short production cycle.",
    images: [
      `${IMAGE_BASE}/Arugula Rocket1.jpg`,
      `${IMAGE_BASE}/Arugula Rocket2.jpg`,
      `${IMAGE_BASE}/Arugula Rocket3.jpg`,
      `${IMAGE_BASE}/Arugula Rocket4.jpg`,
    ],
  },

  {
    id: 6,
    name: "Mustard Greens",
    category: "Leafy Green",
    scientificName: "Brassica juncea",
    system: "NFT / DWC / Vertical",
    ph: "6.0 – 6.5",
    ec: "1.2 – 2.0",
    description:
      "A fast-growing leafy crop that can be efficiently produced using controlled nutrient solutions.",
    images: [
      `${IMAGE_BASE}/Mustard Greens1.jpg`,
      `${IMAGE_BASE}/Mustard Greens2.jpg`,
      `${IMAGE_BASE}/Mustard Greens3.jpg`,
      `${IMAGE_BASE}/Mustard Greens4.jpg`,
    ],
  },

  {
    id: 7,
    name: "Basil",
    category: "Herb",
    scientificName: "Ocimum basilicum",
    system: "NFT / DWC / Vertical",
    ph: "5.5 – 6.5",
    ec: "1.0 – 1.6",
    description:
      "A popular culinary herb that grows vigorously in warm hydroponic and indoor farming environments.",
    images: [
      `${IMAGE_BASE}/Basil1.jpg`,
      `${IMAGE_BASE}/Basil2.jpg`,
      `${IMAGE_BASE}/Basil3.jpg`,
      `${IMAGE_BASE}/Basil4.jpg`,
    ],
  },

  {
    id: 8,
    name: "Mint",
    category: "Herb",
    scientificName: "Mentha",
    system: "NFT / DWC",
    ph: "5.5 – 6.5",
    ec: "1.2 – 2.0",
    description:
      "A vigorous herb that adapts well to soilless growing when moisture and nutrient levels are controlled.",
    images: [
      `${IMAGE_BASE}/Mint1.jpg`,
      `${IMAGE_BASE}/Mint2.jpg`,
      `${IMAGE_BASE}/Mint3.jpg`,
      `${IMAGE_BASE}/Mint4.jpg`,
    ],
  },

  {
    id: 9,
    name: "Parsley",
    category: "Herb",
    scientificName: "Petroselinum crispum",
    system: "NFT / DWC",
    ph: "5.5 – 6.5",
    ec: "0.8 – 1.8",
    description:
      "A culinary herb that can be grown continuously in a controlled hydroponic environment.",
    images: [
      `${IMAGE_BASE}/Parsley1.jpg`,
      `${IMAGE_BASE}/Parsley2.jpg`,
      `${IMAGE_BASE}/Parsley3.jpg`,
      `${IMAGE_BASE}/Parsley4.jpg`,
    ],
  },

  {
    id: 10,
    name: "Coriander / Cilantro",
    category: "Herb",
    scientificName: "Coriandrum sativum",
    system: "NFT / DWC / Vertical",
    ph: "6.0 – 6.7",
    ec: "1.2 – 1.8",
    description:
      "A widely used herb suitable for hydroponic production with consistent moisture and nutrient supply.",
    images: [
      `${IMAGE_BASE}/Coriander Cilantro1.jpg`,
      `${IMAGE_BASE}/Coriander Cilantro2.jpg`,
      `${IMAGE_BASE}/Coriander Cilantro3.jpg`,
      `${IMAGE_BASE}/Coriander Cilantro4.jpg`,
    ],
  },

  {
    id: 11,
    name: "Chives",
    category: "Herb",
    scientificName: "Allium schoenoprasum",
    system: "NFT / DWC",
    ph: "6.0 – 6.5",
    ec: "1.8 – 2.4",
    description:
      "A compact perennial herb that can be harvested repeatedly in controlled soilless systems.",
    images: [
      `${IMAGE_BASE}/Chives1.jpg`,
      `${IMAGE_BASE}/Chives2.jpg`,
      `${IMAGE_BASE}/Chives3.jpg`,
      `${IMAGE_BASE}/Chives4.jpg`,
    ],
  },

  {
    id: 12,
    name: "Tomato",
    category: "Fruit Vegetable",
    scientificName: "Solanum lycopersicum",
    system: "Dutch Bucket / Drip",
    ph: "5.5 – 6.5",
    ec: "2.0 – 5.0",
    description:
      "A high-value fruiting crop commonly grown in greenhouse hydroponics using drip or Dutch bucket systems.",
    images: [
      `${IMAGE_BASE}/Tomato1.jpg`,
      `${IMAGE_BASE}/Tomato2.jpg`,
      `${IMAGE_BASE}/Tomato3.jpg`,
      `${IMAGE_BASE}/Tomato4.jpg`,
    ],
  },

  {
    id: 13,
    name: "Cucumber",
    category: "Fruit Vegetable",
    scientificName: "Cucumis sativus",
    system: "Dutch Bucket / Drip",
    ph: "5.5 – 6.5",
    ec: "1.7 – 2.5",
    description:
      "A vigorous vine crop suited to greenhouse hydroponics with vertical support and controlled fertigation.",
    images: [
      `${IMAGE_BASE}/Cucumber1.jpg`,
      `${IMAGE_BASE}/Cucumber2.jpg`,
      `${IMAGE_BASE}/Cucumber3.jpg`,
      `${IMAGE_BASE}/Cucumber4.jpg`,
    ],
  },

  {
    id: 14,
    name: "Capsicum / Bell Pepper",
    category: "Fruit Vegetable",
    scientificName: "Capsicum annuum",
    system: "Dutch Bucket / Drip",
    ph: "5.5 – 6.5",
    ec: "1.8 – 2.8",
    description:
      "A fruiting crop well suited to controlled greenhouse hydroponics with precise nutrient management.",
    images: [
      `${IMAGE_BASE}/Capsicum Bell Pepper1.jpg`,
      `${IMAGE_BASE}/Capsicum Bell Pepper2.jpg`,
      `${IMAGE_BASE}/Capsicum Bell Pepper3.jpg`,
      `${IMAGE_BASE}/Capsicum Bell Pepper4.jpg`,
    ],
  },

  {
    id: 15,
    name: "Eggplant / Brinjal",
    category: "Fruit Vegetable",
    scientificName: "Solanum melongena",
    system: "Dutch Bucket / Drip",
    ph: "5.5 – 6.5",
    ec: "2.2 – 3.5",
    description:
      "A warm-season fruiting crop that can be cultivated successfully using controlled hydroponic systems.",
    images: [
      `${IMAGE_BASE}/Eggplant Brinjal1.jpg`,
      `${IMAGE_BASE}/Eggplant Brinjal2.jpg`,
      `${IMAGE_BASE}/Eggplant Brinjal3.jpg`,
      `${IMAGE_BASE}/Eggplant Brinjal4.jpg`,
    ],
  },

  {
    id: 16,
    name: "Strawberry",
    category: "Fruit",
    scientificName: "Fragaria × ananassa",
    system: "Vertical / NFT / Drip",
    ph: "5.5 – 6.5",
    ec: "1.0 – 1.8",
    description:
      "A popular hydroponic fruit crop especially suitable for vertical growing and protected cultivation.",
    images: [
      `${IMAGE_BASE}/Strawberry1.jpg`,
      `${IMAGE_BASE}/Strawberry2.jpg`,
      `${IMAGE_BASE}/Strawberry3.jpg`,
      `${IMAGE_BASE}/Strawberry4.jpg`,
    ],
  },

  {
    id: 17,
    name: "Broccoli",
    category: "Cruciferous",
    scientificName: "Brassica oleracea var. italica",
    system: "NFT / DWC",
    ph: "6.0 – 6.5",
    ec: "2.0 – 3.0",
    description:
      "A cool-season crop that can be grown in controlled hydroponic environments with sufficient space.",
    images: [
      `${IMAGE_BASE}/Broccoli1.jpg`,
      `${IMAGE_BASE}/Broccoli2.jpg`,
      `${IMAGE_BASE}/Broccoli3.jpg`,
      `${IMAGE_BASE}/Broccoli4.jpg`,
    ],
  },

  {
    id: 18,
    name: "Cauliflower",
    category: "Cruciferous",
    scientificName: "Brassica oleracea var. botrytis",
    system: "NFT / DWC",
    ph: "6.0 – 6.5",
    ec: "2.0 – 3.0",
    description:
      "A nutrient-demanding vegetable that benefits from stable environmental and nutrient conditions.",
    images: [
      `${IMAGE_BASE}/Cauliflower1.jpg`,
      `${IMAGE_BASE}/Cauliflower2.jpg`,
      `${IMAGE_BASE}/Cauliflower3.jpg`,
      `${IMAGE_BASE}/Cauliflower4.jpg`,
    ],
  },

  {
    id: 19,
    name: "Cabbage",
    category: "Cruciferous",
    scientificName: "Brassica oleracea var. capitata",
    system: "NFT / DWC",
    ph: "6.0 – 6.5",
    ec: "2.5 – 3.0",
    description:
      "A compact head-forming crop that can be cultivated using larger-space hydroponic systems.",
    images: [
      `${IMAGE_BASE}/Cabbage1.jpg`,
      `${IMAGE_BASE}/Cabbage2.jpg`,
      `${IMAGE_BASE}/Cabbage3.jpg`,
      `${IMAGE_BASE}/Cabbage4.jpg`,
    ],
  },

  {
    id: 20,
    name: "Radish",
    category: "Root Vegetable",
    scientificName: "Raphanus sativus",
    system: "DWC / Media Bed",
    ph: "6.0 – 7.0",
    ec: "1.6 – 2.2",
    description:
      "A short-cycle crop that can be grown without conventional soil using suitable hydroponic media.",
    images: [
      `${IMAGE_BASE}/Radish1.jpg`,
      `${IMAGE_BASE}/Radish2.jpg`,
      `${IMAGE_BASE}/Radish3.jpg`,
      `${IMAGE_BASE}/Radish4.jpg`,
    ],
  },

  {
    id: 21,
    name: "Carrot",
    category: "Root Vegetable",
    scientificName: "Daucus carota",
    system: "Media Bed / Deep Container",
    ph: "6.0 – 6.8",
    ec: "1.6 – 2.2",
    description:
      "A root crop that requires an appropriate growing medium and sufficient depth in soilless cultivation.",
    images: [
      `${IMAGE_BASE}/Carrot1.jpg`,
      `${IMAGE_BASE}/Carrot2.jpg`,
      `${IMAGE_BASE}/Carrot3.jpg`,
      `${IMAGE_BASE}/Carrot4.jpg`,
    ],
  },

  {
    id: 22,
    name: "Okra / Lady's Finger",
    category: "Fruit Vegetable",
    scientificName: "Abelmoschus esculentus",
    system: "Dutch Bucket / Drip",
    ph: "6.0 – 6.5",
    ec: "2.0 – 3.5",
    description:
      "A warm-season fruiting crop that can be grown in protected soilless systems with adequate support.",
    images: [
      `${IMAGE_BASE}/Okra Lady's Finger1.jpg`,
      `${IMAGE_BASE}/Okra Lady's Finger2.jpg`,
      `${IMAGE_BASE}/Okra Lady's Finger3.jpg`,
      `${IMAGE_BASE}/Okra Lady's Finger4.jpg`,
    ],
  },

  {
    id: 23,
    name: "Celery",
    category: "Stem Vegetable",
    scientificName: "Apium graveolens",
    system: "NFT / DWC",
    ph: "5.8 – 6.5",
    ec: "1.8 – 2.4",
    description:
      "A moisture-loving crop that responds well to stable water, nutrient and environmental conditions.",
    images: [
      `${IMAGE_BASE}/Celery1.jpg`,
      `${IMAGE_BASE}/Celery2.jpg`,
      `${IMAGE_BASE}/Celery3.jpg`,
      `${IMAGE_BASE}/Celery4.jpg`,
    ],
  },

  {
    id: 24,
    name: "Zucchini",
    category: "Fruit Vegetable",
    scientificName: "Cucurbita pepo",
    system: "Dutch Bucket / Drip",
    ph: "5.8 – 6.5",
    ec: "1.8 – 2.8",
    description:
      "A fast-growing fruiting crop suited to controlled hydroponic production with adequate space and support.",
    images: [
      `${IMAGE_BASE}/Zucchini1.jpg`,
      `${IMAGE_BASE}/Zucchini2.jpg`,
      `${IMAGE_BASE}/Zucchini3.jpg`,
      `${IMAGE_BASE}/Zucchini4.jpg`,
    ],
  },
];

const CATEGORIES = [
  "All",
  "Leafy Green",
  "Leafy Vegetable",
  "Herb",
  "Fruit Vegetable",
  "Fruit",
  "Cruciferous",
  "Root Vegetable",
  "Stem Vegetable",
];

/* =========================================================
   CROP IMAGE GALLERY
   ========================================================= */

function CropGallery({ crop }) {
  const [activeImage, setActiveImage] = useState(0);

  const nextImage = () => {
    setActiveImage(
      (current) => (current + 1) % crop.images.length
    );
  };

  const previousImage = () => {
    setActiveImage(
      (current) =>
        (current - 1 + crop.images.length) %
        crop.images.length
    );
  };

  return (
    <div className="crop-gallery">
      <img
        src={crop.images[activeImage]}
        alt={`${crop.name} hydroponic farming`}
        className="crop-gallery-main-image"
        loading="lazy"
      />

      <button
        type="button"
        className="crop-gallery-arrow crop-gallery-prev"
        onClick={previousImage}
        aria-label={`Previous ${crop.name} image`}
      >
        <i className="bi bi-chevron-left"></i>
      </button>

      <button
        type="button"
        className="crop-gallery-arrow crop-gallery-next"
        onClick={nextImage}
        aria-label={`Next ${crop.name} image`}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      <div className="crop-gallery-counter">
        {activeImage + 1} / {crop.images.length}
      </div>
    </div>
  );
}

/* =========================================================
   LOGIN REQUIRED MODAL
   ========================================================= */

function LoginRequiredModal({ onClose, onLogin }) {
  return (
    <div
      className="login-required-backdrop"
      onClick={onClose}
    >
      <div
        className="login-required-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="login-required-close"
          onClick={onClose}
          aria-label="Close login popup"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <div className="login-required-icon">
          <i className="bi bi-lock-fill"></i>
        </div>

        <span className="login-required-label">
          MEMBER ACCESS
        </span>

        <h2>Login to view complete details</h2>

        <p>
          Login or create an account to access complete crop
          information, growing requirements, recommended
          systems and crop-specific monitoring details.
        </p>

        <div className="login-required-actions">
          <button
            type="button"
            className="login-primary-btn"
            onClick={onLogin}
          >
            Login to Continue
            <i className="bi bi-arrow-right"></i>
          </button>

          <button
            type="button"
            className="login-secondary-btn"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN CROPS PAGE
   ========================================================= */

function Crops() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [search, setSearch] = useState("");

  const [loginRequired, setLoginRequired] =
    useState(false);

  const filteredCrops = CROPS.filter((crop) => {
    const matchesCategory =
      activeCategory === "All" ||
      crop.category === activeCategory;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      crop.name.toLowerCase().includes(searchText) ||
      crop.category.toLowerCase().includes(searchText) ||
      crop.scientificName
        .toLowerCase()
        .includes(searchText);

    return matchesCategory && matchesSearch;
  });

  const handleDetailsClick = () => {
    setLoginRequired(true);
  };

  const handleLogin = () => {
    setLoginRequired(false);
    navigate("/login");
  };

  return (
    <div className="crops-page">

      {/* =================================================
          HERO
          ================================================= */}

      <section className="crops-hero">
        <div className="container">
          <div className="crops-hero-content">

            <span className="crops-eyebrow">
              <i className="bi bi-leaf-fill"></i>
              HYDROPONIC CROP LIBRARY
            </span>

            <h1>
              Explore Crops for
              <span> Smart Growing</span>
            </h1>

            <p>
              Discover crops suitable for controlled
              hydroponic cultivation and explore their
              growing information through HydroGrow.
            </p>

          </div>
        </div>
      </section>

      {/* =================================================
          CROP LIBRARY
          ================================================= */}

      <section className="crops-library">
        <div className="container">

          <div className="crops-section-heading">

            <div>
              <span className="section-eyebrow">
                CROP COLLECTION
              </span>

              <h2>Explore Our Crops</h2>

              <p>
                Browse the HydroGrow crop collection and
                select a crop to learn more.
              </p>
            </div>

          </div>

          {/* SEARCH + FILTER */}

          <div className="crops-toolbar">

            <div className="crop-search">

              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search crop..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}

            </div>

            <div className="crop-filters">

              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    activeCategory === category
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveCategory(category)
                  }
                >
                  {category}
                </button>
              ))}

            </div>

          </div>

          {/* =================================================
              CROPS GRID
              ================================================= */}

          {filteredCrops.length > 0 ? (

            <div className="crops-grid">

              {filteredCrops.map((crop) => (

                <article
                  className="crop-card"
                  key={crop.id}
                >

                  {/* IMAGE */}

                  <div className="crop-card-image">

                    <CropGallery crop={crop} />

                  </div>

                  {/* CONTENT */}

                  <div className="crop-card-body">

                    <span className="crop-category">
                      {crop.category}
                    </span>

                    <h3>{crop.name}</h3>

                    <p className="crop-description">
                      {crop.description}
                    </p>

                    <button
                      type="button"
                      className="crop-details-btn"
                      onClick={handleDetailsClick}
                    >
                      <span>
                        View Complete Details
                      </span>

                      <i className="bi bi-arrow-right"></i>
                    </button>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            /* =================================================
               EMPTY STATE
               ================================================= */

            <div className="crops-empty">

              <div className="crops-empty-icon">
                <i className="bi bi-search"></i>
              </div>

              <h3>No crops found</h3>

              <p>
                Try searching with another crop name or
                choose a different category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
              >
                Show All Crops
              </button>

            </div>

          )}

        </div>
      </section>

      {/* =================================================
          LOGIN REQUIRED POPUP
          ================================================= */}

      {loginRequired && (
        <LoginRequiredModal
          onClose={() => setLoginRequired(false)}
          onLogin={handleLogin}
        />
      )}

    </div>
  );
}

export default Crops;