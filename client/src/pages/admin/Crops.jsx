import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

import { crops } from "../../data/cropData";

/* =========================================================
   ADMIN CROPS
   ========================================================= */

const DIFFICULTY_TONE = {
  Easy: "success",
  Moderate: "warning",
  Intermediate: "warning",
  Hard: "danger",
  Advanced: "danger",
};

function AdminCrops() {
  const [cropList, setCropList] = useState(crops);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  useEffect(() => {
    let cancelled = false;

    const loadCrops = async () => {
      try {
        const data = await api.get("/crops");

        if (cancelled) {
          return;
        }

        if (
          Array.isArray(data?.crops) &&
          data.crops.length > 0
        ) {
          setCropList(data.crops);
        }
      } catch {
        // backend offline — keep local cropData
      }
    };

    loadCrops();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          cropList.map((crop) => crop.category)
        ),
      ].sort(),
    [cropList]
  );

  const filteredCrops = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let result = [...cropList];

    if (categoryFilter !== "all") {
      result = result.filter(
        (crop) => crop.category === categoryFilter
      );
    }

    if (search) {
      result = result.filter((crop) =>
        [
          crop.id,
          crop.name,
          crop.scientificName,
          crop.category,
          crop.hydroponicSystem,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return result;
  }, [cropList, searchTerm, categoryFilter]);

  return (
    <>
      {/* ===================================================
          PAGE HEADER
          =================================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            CROP KNOWLEDGE BASE
          </span>

          <h1>
            <i className="bi bi-flower1"></i>
            Crops
          </h1>

          <p>
            {cropList.length} crops tracked by
            HydroGrow — growing parameters,
            difficulty and market demand at a glance.
          </p>
        </div>

        <div className="admin-page-actions">
          <Link
            to="/crops"
            className="admin-btn ghost"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            Public Gallery
          </Link>
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
            placeholder="Search crop, scientific name, system..."
          />
        </div>

        <select
          className="admin-select"
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          <option value="all">
            All categories
          </option>

          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        <span className="admin-badge muted">
          <i className="bi bi-collection"></i>
          {filteredCrops.length} shown
        </span>

      </div>

      {/* ===================================================
          CROPS TABLE
          =================================================== */}

      <div className="admin-card">
        <div className="admin-card-body flush">
          {filteredCrops.length === 0 ? (
            <div className="admin-empty">
              <i className="bi bi-flower1"></i>
              <h3>No Crops Found</h3>
              <p>
                Try a different search term or
                category.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Category</th>
                    <th>System</th>
                    <th>Growth Cycle</th>
                    <th>pH / EC</th>
                    <th>Difficulty</th>
                    <th>Demand</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCrops.map((crop) => (
                    <tr key={crop.id}>
                      <td>
                        <div className="admin-user-meta">
                          <strong>
                            {crop.name}
                          </strong>

                          <span>
                            {crop.id} ·{" "}
                            <em>
                              {crop.scientificName}
                            </em>
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-badge muted">
                          {crop.category}
                        </span>
                      </td>

                      <td>
                        {crop.hydroponicSystem}
                      </td>

                      <td>
                        {crop.growthCycle}
                      </td>

                      <td>
                        {crop.ph} / {crop.ec}
                      </td>

                      <td>
                        <span
                          className={`admin-badge ${
                            DIFFICULTY_TONE[
                              crop.difficulty
                            ] || "muted"
                          }`}
                        >
                          {crop.difficulty}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-badge ${
                            crop.demand === "High"
                              ? "success"
                              : "muted"
                          }`}
                        >
                          {crop.demand}
                        </span>
                      </td>

                      <td>
                        <Link
                          to={`/crops/${crop.id}`}
                          className="admin-btn ghost small"
                        >
                          Details
                          <i className="bi bi-arrow-right"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </>
  );
}

export default AdminCrops;
