import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { crops } from "../../data/cropData";

import "../../assets/styles/crop-selection.css";

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
    <div className="crop-selection-gallery">
      <img
        src={crop.images[activeImage]}
        alt={`${crop.name} hydroponic cultivation`}
        className="crop-selection-image"
        loading="lazy"
      />

      <button
        type="button"
        className="crop-selection-gallery-btn crop-selection-gallery-prev"
        onClick={previousImage}
        aria-label={`Previous ${crop.name} image`}
      >
        <i className="bi bi-chevron-left"></i>
      </button>

      <button
        type="button"
        className="crop-selection-gallery-btn crop-selection-gallery-next"
        onClick={nextImage}
        aria-label={`Next ${crop.name} image`}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      <div className="crop-selection-image-counter">
        {activeImage + 1} / {crop.images.length}
      </div>
    </div>
  );
}

function CropSelection() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [phase, setPhase] = useState("All");

  const categories = useMemo(() => {
    return ["All", ...new Set(crops.map((crop) => crop.category))];
  }, []);

  const difficulties = useMemo(() => {
    return ["All", ...new Set(crops.map((crop) => crop.difficulty))];
  }, []);

  const phases = useMemo(() => {
    return [
      "All",
      ...new Set(
        crops.map((crop) => crop.hydroGrowStatus)
      ),
    ];
  }, []);

  const filteredCrops = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return crops.filter((crop) => {
      const matchesSearch =
        !search ||
        crop.name.toLowerCase().includes(search) ||
        crop.scientificName.toLowerCase().includes(search) ||
        crop.category.toLowerCase().includes(search) ||
        crop.cropType.toLowerCase().includes(search);

      const matchesCategory =
        category === "All" ||
        crop.category === category;

      const matchesDifficulty =
        difficulty === "All" ||
        crop.difficulty === difficulty;

      const matchesPhase =
        phase === "All" ||
        crop.hydroGrowStatus === phase;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesPhase
      );
    });
  }, [searchTerm, category, difficulty, phase]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategory("All");
    setDifficulty("All");
    setPhase("All");
  };

  return (
    <section className="crop-selection-page">
      <div className="container">

        {/* PAGE HEADER */}
        <div className="crop-selection-header">
          <div>
            <span className="crop-selection-label">
              CROP MANAGEMENT
            </span>

            <h1>
              Select a crop to
              <span> manage and monitor</span>
            </h1>

            <p>
              Explore the HydroGrow crop dataset and select a
              crop to view its growing requirements, sensor
              conditions, schedule and growth tracking.
            </p>
          </div>

          <div className="crop-selection-summary">
            <div className="crop-summary-icon">
              <i className="bi bi-flower1"></i>
            </div>

            <div>
              <strong>{crops.length}</strong>
              <span>Available Crops</span>
            </div>
          </div>
        </div>

        {/* FILTER PANEL */}
        <div className="crop-selection-filter-panel">

          <div className="crop-selection-search">
            <i className="bi bi-search"></i>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search crop, scientific name or category..."
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          <div className="crop-selection-filters">

            <div className="crop-filter-group">
              <label>Category</label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="crop-filter-group">
              <label>Difficulty</label>

              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value)
                }
              >
                {difficulties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="crop-filter-group">
              <label>HydroGrow Phase</label>

              <select
                value={phase}
                onChange={(event) =>
                  setPhase(event.target.value)
                }
              >
                {phases.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="crop-reset-btn"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Reset
            </button>

          </div>
        </div>

        {/* RESULTS BAR */}
        <div className="crop-selection-results-bar">
          <div>
            <strong>{filteredCrops.length}</strong>
            <span>
              {filteredCrops.length === 1
                ? " crop found"
                : " crops found"}
            </span>
          </div>

          {(searchTerm ||
            category !== "All" ||
            difficulty !== "All" ||
            phase !== "All") && (
            <span className="crop-filter-active">
              Filters applied
            </span>
          )}
        </div>

        {/* CROP GRID */}
        {filteredCrops.length > 0 ? (
          <div className="crop-selection-grid">

            {filteredCrops.map((crop) => (
              <article
                className="crop-selection-card"
                key={crop.id}
              >

                {/* IMAGE */}
                <CropGallery crop={crop} />

                {/* CONTENT */}
                <div className="crop-selection-card-body">

                  <div className="crop-selection-card-top">

                    <span className="crop-category-badge">
                      {crop.category}
                    </span>

                    <span
                      className={`crop-difficulty-badge crop-difficulty-${crop.difficulty.toLowerCase()}`}
                    >
                      {crop.difficulty}
                    </span>

                  </div>

                  <h2>{crop.name}</h2>

                  <p className="crop-scientific-name">
                    {crop.scientificName}
                  </p>

                  <p className="crop-short-description">
                    {crop.description}
                  </p>

                  {/* BASIC REQUIREMENTS */}
                  <div className="crop-basic-requirements">

                    <div className="crop-requirement-item">
                      <i className="bi bi-calendar3"></i>

                      <div>
                        <span>Growth Cycle</span>
                        <strong>
                          {crop.growthCycle}
                        </strong>
                      </div>
                    </div>

                    <div className="crop-requirement-item">
                      <i className="bi bi-basket3"></i>

                      <div>
                        <span>Harvest Start</span>
                        <strong>
                          {crop.harvestStart}
                        </strong>
                      </div>
                    </div>

                    <div className="crop-requirement-item">
                      <i className="bi bi-droplet"></i>

                      <div>
                        <span>pH</span>
                        <strong>{crop.ph}</strong>
                      </div>
                    </div>

                    <div className="crop-requirement-item">
                      <i className="bi bi-moisture"></i>

                      <div>
                        <span>EC</span>
                        <strong>{crop.ec}</strong>
                      </div>
                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="crop-card-footer">

                    <div className="crop-demand">
                      <span>Demand</span>

                      <strong>
                        {crop.demand}
                      </strong>
                    </div>

                    <span className="crop-phase-text">
                      {crop.hydroGrowStatus}
                    </span>

                  </div>

                  {/* ACTION */}
                  <button
                    type="button"
                    className="crop-details-btn"
                    onClick={() =>
                      navigate(`/crops/${crop.id}`)
                    }
                  >
                    View Crop Details
                    <i className="bi bi-arrow-right"></i>
                  </button>

                </div>
              </article>
            ))}

          </div>
        ) : (
          /* EMPTY STATE */
          <div className="crop-selection-empty">

            <div className="crop-empty-icon">
              <i className="bi bi-search"></i>
            </div>

            <h3>No crops found</h3>

            <p>
              No crop matches the selected search and
              filter conditions.
            </p>

            <button
              type="button"
              onClick={resetFilters}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              Clear Filters
            </button>

          </div>
        )}

      </div>
    </section>
  );
}

export default CropSelection;