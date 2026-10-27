import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api from "../services/api";

import { useAuth } from "./AuthContext";

const CropContext = createContext(null);

const STORAGE_KEY = "hydrogrow_user_crops";
const ACTIVE_CROP_KEY = "hydrogrow_active_crop";

// =====================================================
// READ STORED CROPS
// =====================================================

function readStoredCrops() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

// =====================================================
// READ ACTIVE CROP
// =====================================================

function readActiveCrop() {
  try {
    return (
      localStorage.getItem(
        ACTIVE_CROP_KEY
      ) || null
    );
  } catch {
    return null;
  }
}

// =====================================================
// CROP PROVIDER
// =====================================================

export function CropProvider({
  children,
}) {
  const { user } = useAuth();

  const [
    selectedCrops,
    setSelectedCrops,
  ] = useState(readStoredCrops);

  const [
    activeCropId,
    setActiveCropId,
  ] = useState(readActiveCrop);

  const cropsRef = useRef(selectedCrops);

  cropsRef.current = selectedCrops;

  // ===================================================
  // HYDRATE FROM BACKEND ON SIGN-IN
  // ===================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        const data = await api.get("/farm");

        if (cancelled || !Array.isArray(data.crops)) {
          return;
        }

        setSelectedCrops(data.crops);

        setActiveCropId((current) => {
          if (
            current &&
            data.crops.some((item) => item.id === current)
          ) {
            return current;
          }

          return data.crops.length > 0
            ? data.crops[0].id
            : null;
        });
      } catch {
        // backend offline — keep localStorage data
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ===================================================
  // SAVE SELECTED CROPS
  // ===================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(selectedCrops)
      );
    } catch (error) {
      console.error(
        "Unable to save HydroGrow crops:",
        error
      );
    }
  }, [selectedCrops]);

  // ===================================================
  // SAVE ACTIVE CROP
  // ===================================================

  useEffect(() => {
    try {
      if (activeCropId) {
        localStorage.setItem(
          ACTIVE_CROP_KEY,
          activeCropId
        );
      } else {
        localStorage.removeItem(
          ACTIVE_CROP_KEY
        );
      }
    } catch (error) {
      console.error(
        "Unable to save active crop:",
        error
      );
    }
  }, [activeCropId]);

  // ===================================================
  // ACTIVE CROP
  // ===================================================

  const activeCrop = useMemo(() => {
    return (
      selectedCrops.find(
        (item) =>
          item.id === activeCropId
      ) || null
    );
  }, [
    selectedCrops,
    activeCropId,
  ]);

  // ===================================================
  // ADD CROP
  // ===================================================

  const addCrop = (
    crop,
    setupData = {}
  ) => {
    if (!crop?.id) {
      return {
        success: false,
        message: "Invalid crop.",
      };
    }

    // -----------------------------------------------
    // CHECK DUPLICATE CROP
    // -----------------------------------------------

    const existingCrop =
      selectedCrops.find(
        (item) =>
          item.cropId === crop.id
      );

    if (existingCrop) {
      setActiveCropId(
        existingCrop.id
      );

      return {
        success: false,
        message: `${crop.name} is already added to My Farm.`,
        alreadyExists: true,
        crop: existingCrop,
      };
    }

    // -----------------------------------------------
    // NORMALIZE PLANT COUNT
    // -----------------------------------------------

    const numericPlantCount =
      Number(
        setupData.plantCount
      );

    const finalPlantCount =
      Number.isFinite(
        numericPlantCount
      ) &&
      numericPlantCount > 0
        ? numericPlantCount
        : 1;

    // -----------------------------------------------
    // FARM CROP OBJECT
    // -----------------------------------------------

    const farmCrop = {
      id: `FARM-CROP-${Date.now()}`,

      cropId: crop.id,

      name: crop.name,

      category: crop.category,

      scientificName:
        crop.scientificName,

      cropType:
        crop.cropType || "",

      hydroponicSystem:
        crop.hydroponicSystem || "",

      growthCycle:
        crop.growthCycle || "",

      harvestStart:
        crop.harvestStart || "",

      difficulty:
        crop.difficulty || "",

      demand:
        crop.demand || "",

      phase:
        crop.phase || "",

      description:
        crop.description || "",

      harvestGuidance:
        crop.harvestGuidance || "",

      // ---------------------------------------------
      // FARM SETTINGS
      // ---------------------------------------------

      farmUnit:
        setupData.farmUnit?.trim() ||
        "My Farm",

      plantCount:
        finalPlantCount,

      plantingDate:
        setupData.plantingDate ||
        new Date()
          .toISOString()
          .split("T")[0],

      notes:
        setupData.notes?.trim() ||
        "",

      // ---------------------------------------------
      // CROP STATUS
      // ---------------------------------------------

      status: "healthy",

      // ---------------------------------------------
      // DEVICE / SIMULATOR
      // ---------------------------------------------

      device: {
        deviceId:
          setupData.deviceId ||
          "HYDROGROW-SIM-001",

        source:
          setupData.source ||
          "INPUT_SIMULATOR",

        connected: false,

        lastUpdate: null,
      },

      // ---------------------------------------------
      // AUTOMATION
      // ---------------------------------------------

      automation: {
        mode:
          setupData.automationMode ||
          "automatic",

        enabled: true,

        lastAction: null,

        lastActionAt: null,
      },

      // ---------------------------------------------
      // GROWTH
      // ---------------------------------------------

      growth: {
        currentDay: 1,

        currentStage:
          "Seed / Germination",

        estimatedDaysRemaining:
          crop.growthCycle
            ? Math.max(
                Number(
                  String(
                    crop.growthCycle
                  ).split("-")[1]
                ) || 0,
                0
              )
            : 0,

        harvestReady: false,

        lastUpdated:
          new Date().toISOString(),
      },

      // ---------------------------------------------
      // ALERTS
      // ---------------------------------------------

      alerts: {
        activeCount: 0,

        criticalCount: 0,

        warningCount: 0,

        lastAlert: null,
      },

      // ---------------------------------------------
      // TIMESTAMPS
      // ---------------------------------------------

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    };

    // -----------------------------------------------
    // ADD TO SELECTED CROPS
    // -----------------------------------------------

    setSelectedCrops(
      (current) => [
        ...current,
        farmCrop,
      ]
    );

    // -----------------------------------------------
    // MAKE NEW CROP ACTIVE
    // -----------------------------------------------

    setActiveCropId(
      farmCrop.id
    );

    // -----------------------------------------------
    // SYNC TO BACKEND
    // -----------------------------------------------

    api
      .post("/farm", {
        cropId: crop.id,
        setup: {
          farmUnit: setupData.farmUnit,
          plantCount: setupData.plantCount,
          plantingDate: setupData.plantingDate,
          notes: setupData.notes,
          deviceId: setupData.deviceId,
          source: setupData.source,
          automationMode: setupData.automationMode,
        },
      })
      .then((data) => {
        const serverCrop = data.crop;

        setSelectedCrops((current) =>
          current.map((item) =>
            item.id === farmCrop.id ? serverCrop : item
          )
        );

        setActiveCropId((current) =>
          current === farmCrop.id ? serverCrop.id : current
        );
      })
      .catch(async (error) => {
        if (error.status === 409) {
          try {
            const fresh = await api.get("/farm");

            setSelectedCrops(fresh.crops);

            setActiveCropId(
              fresh.crops.length > 0 ? fresh.crops[0].id : null
            );
          } catch {
            // backend offline
          }
        }
      });

    return {
      success: true,

      message: `${crop.name} has been added to My Farm.`,

      crop: farmCrop,
    };
  };

  // ===================================================
  // REMOVE CROP
  // ===================================================

  const removeCrop = (
    farmCropId
  ) => {
    if (!farmCropId) {
      return false;
    }

    setSelectedCrops(
      (current) => {
        const remainingCrops =
          current.filter(
            (item) =>
              item.id !==
              farmCropId
          );

        // -------------------------------------------
        // IF ACTIVE CROP WAS REMOVED
        // -------------------------------------------

        if (
          activeCropId ===
          farmCropId
        ) {
          if (
            remainingCrops.length >
            0
          ) {
            setActiveCropId(
              remainingCrops[0].id
            );
          } else {
            setActiveCropId(null);
          }
        }

        return remainingCrops;
      }
    );

    if (!String(farmCropId).startsWith("FARM-CROP-")) {
      api
        .del(`/farm/${farmCropId}`)
        .catch(() => {
          // backend offline — removal is local for now
        });
    }

    return true;
  };

  // ===================================================
  // SELECT ACTIVE CROP
  // ===================================================

  const selectActiveCrop = (
    farmCropId
  ) => {
    if (!farmCropId) {
      return false;
    }

    const exists =
      selectedCrops.some(
        (item) =>
          item.id === farmCropId
      );

    if (!exists) {
      return false;
    }

    setActiveCropId(
      farmCropId
    );

    return true;
  };

  // ===================================================
  // UPDATE FARM CROP
  // ===================================================

  const updateFarmCrop = (
    farmCropId,
    updates = {}
  ) => {
    if (!farmCropId) {
      return false;
    }

    setSelectedCrops(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            farmCropId
              ? {
                  ...item,

                  ...updates,

                  updatedAt:
                    new Date().toISOString(),
                }
              : item
        )
    );

    if (!String(farmCropId).startsWith("FARM-CROP-")) {
      const payload = {};

      for (const key of [
        "notes",
        "farmUnit",
        "plantCount",
        "status",
        "device",
        "automation",
        "growth",
      ]) {
        if (updates[key] !== undefined) {
          payload[key] = updates[key];
        }
      }

      if (Object.keys(payload).length > 0) {
        api
          .patch(`/farm/${farmCropId}`, payload)
          .catch(() => {
            // backend offline — update stays local
          });
      }
    }

    return true;
  };

  // ===================================================
  // UPDATE DEVICE STATUS
  // ===================================================

  const updateDeviceStatus = (
    farmCropId,
    deviceUpdates = {}
  ) => {
    if (!farmCropId) {
      return false;
    }

    const current = cropsRef.current.find(
      (item) => item.id === farmCropId
    );

    if (!current) {
      return false;
    }

    return updateFarmCrop(
      farmCropId,
      {
        device: {
          ...(current.device || {}),

          ...deviceUpdates,
        },
      }
    );
  };

  // ===================================================
  // UPDATE AUTOMATION
  // ===================================================

  const updateAutomation = (
    farmCropId,
    automationUpdates = {}
  ) => {
    if (!farmCropId) {
      return false;
    }

    const current = cropsRef.current.find(
      (item) => item.id === farmCropId
    );

    if (!current) {
      return false;
    }

    return updateFarmCrop(
      farmCropId,
      {
        automation: {
          ...(current.automation ||
            {}),

          ...automationUpdates,
        },
      }
    );
  };

  // ===================================================
  // UPDATE CROP GROWTH
  // ===================================================

  const updateCropGrowth = (
    farmCropId,
    growthUpdates = {}
  ) => {
    if (!farmCropId) {
      return false;
    }

    const current = cropsRef.current.find(
      (item) => item.id === farmCropId
    );

    if (!current) {
      return false;
    }

    return updateFarmCrop(
      farmCropId,
      {
        growth: {
          ...(current.growth ||
            {}),

          ...growthUpdates,

          lastUpdated:
            new Date().toISOString(),
        },
      }
    );
  };

  // ===================================================
  // UPDATE CROP STATUS
  // ===================================================

  const updateCropStatus = (
    farmCropId,
    status,
    alertUpdates = {}
  ) => {
    if (!farmCropId) {
      return false;
    }

    const current = cropsRef.current.find(
      (item) => item.id === farmCropId
    );

    if (!current) {
      return false;
    }

    return updateFarmCrop(
      farmCropId,
      {
        status:
          status ||
          current.status,

        alerts: {
          ...(current.alerts ||
            {}),

          ...alertUpdates,
        },
      }
    );
  };

  // ===================================================
  // UPDATE NOTES
  // ===================================================

  const updateCropNotes = (
    farmCropId,
    notes
  ) => {
    return updateFarmCrop(
      farmCropId,
      {
        notes:
          typeof notes === "string"
            ? notes.trim()
            : "",
      }
    );
  };

  // ===================================================
  // CLEAR ALL CROPS
  // ===================================================

  const clearAllCrops = () => {
    setSelectedCrops([]);
    setActiveCropId(null);
  };

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value = {
    // -----------------------------------------------
    // STATE
    // -----------------------------------------------

    selectedCrops,

    activeCrop,

    activeCropId,

    hasSelectedCrops:
      selectedCrops.length > 0,

    cropCount:
      selectedCrops.length,

    // -----------------------------------------------
    // CROP MANAGEMENT
    // -----------------------------------------------

    addCrop,

    removeCrop,

    selectActiveCrop,

    updateFarmCrop,

    // -----------------------------------------------
    // DEVICE
    // -----------------------------------------------

    updateDeviceStatus,

    // -----------------------------------------------
    // AUTOMATION
    // -----------------------------------------------

    updateAutomation,

    // -----------------------------------------------
    // GROWTH
    // -----------------------------------------------

    updateCropGrowth,

    // -----------------------------------------------
    // STATUS / ALERTS
    // -----------------------------------------------

    updateCropStatus,

    // -----------------------------------------------
    // NOTES
    // -----------------------------------------------

    updateCropNotes,

    // -----------------------------------------------
    // RESET
    // -----------------------------------------------

    clearAllCrops,
  };

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <CropContext.Provider
      value={value}
    >
      {children}
    </CropContext.Provider>
  );
}

// =====================================================
// USE CROP HOOK
// =====================================================

export function useCrop() {
  const context =
    useContext(CropContext);

  if (!context) {
    throw new Error(
      "useCrop must be used inside CropProvider."
    );
  }

  return context;
}

export default CropContext;