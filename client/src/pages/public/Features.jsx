import "../../assets/styles/features.css";

const features = [
  {
    id: "01",
    icon: "bi-speedometer2",
    category: "MONITORING",
    title: "Live Monitoring",
    text: "View current hydroponic environment parameters from a centralized dashboard.",
  },
  {
    id: "02",
    icon: "bi-droplet-half",
    category: "NUTRIENTS",
    title: "Nutrient Monitoring",
    text: "Track pH, EC and nutrient-related parameters for better crop management.",
  },
  {
    id: "03",
    icon: "bi-thermometer-half",
    category: "ENVIRONMENT",
    title: "Environment Monitoring",
    text: "Monitor temperature, humidity, moisture and lighting conditions.",
  },
  {
    id: "04",
    icon: "bi-bell",
    category: "ALERTS",
    title: "Intelligent Alerts",
    text: "Generate warning and critical alerts when readings move outside crop requirements.",
  },
  {
    id: "05",
    icon: "bi-calendar3",
    category: "CROP MANAGEMENT",
    title: "Crop Scheduling",
    text: "Maintain crop-specific growth schedules and development milestones.",
  },
  {
    id: "06",
    icon: "bi-graph-up",
    category: "CROP MANAGEMENT",
    title: "Growth Tracking",
    text: "Visualize crop progress and compare current growth against expected stages.",
  },
  {
    id: "07",
    icon: "bi-cpu",
    category: "AUTOMATION",
    title: "Automation Simulation",
    text: "Simulate automatic actions according to predefined thresholds and system rules.",
  },
  {
    id: "08",
    icon: "bi-controller",
    category: "CONTROL",
    title: "Manual Control",
    text: "Provide a software interface for manual automation control during simulation.",
  },
  {
    id: "09",
    icon: "bi-shop",
    category: "MARKETPLACE",
    title: "Marketplace",
    text: "Provide a platform for hydroponic products, listings and future produce transactions.",
  },
];

const featureGroups = [
  {
    icon: "bi-activity",
    title: "Monitor",
    text: "Understand the current growing environment through centralized sensor monitoring.",
  },
  {
    icon: "bi-flower1",
    title: "Manage",
    text: "Organize crop information, schedules and growth progress throughout the cultivation cycle.",
  },
  {
    icon: "bi-lightning-charge",
    title: "Respond",
    text: "Use alerts and simulated automation rules to identify and respond to changing conditions.",
  },
];

function Features() {
  return (
    <div className="features-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="features-hero">

        <div className="container">

          <div className="features-hero-content">

            <span className="features-eyebrow">
              <i className="bi bi-grid-1x2-fill"></i>
              HYDROGROW FEATURES
            </span>

            <h1>
              Everything you need for
              <span> smarter cultivation.</span>
            </h1>

            <p>
              HydroGrow combines monitoring, crop management, alerts,
              automation simulation and marketplace capabilities into
              one connected digital platform.
            </p>

            <div className="features-hero-stats">

              <div>
                <strong>09</strong>
                <span>Core Features</span>
              </div>

              <div className="features-stat-divider"></div>

              <div>
                <strong>24</strong>
                <span>Crop Profiles</span>
              </div>

              <div className="features-stat-divider"></div>

              <div>
                <strong>01</strong>
                <span>Unified Platform</span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE INTRO
          ===================================================== */}

      <section className="features-intro">

        <div className="container">

          <div className="features-intro-grid">

            <div className="features-intro-heading">

              <span className="features-section-label">
                PLATFORM CAPABILITIES
              </span>

              <h2>
                Designed around the
                <span> complete growing cycle.</span>
              </h2>

            </div>

            <div className="features-intro-text">

              <p>
                HydroGrow brings important hydroponic management functions
                into a single software environment. Each module is designed
                to support a specific part of the growing workflow while
                sharing the same platform data.
              </p>

            </div>

          </div>


          <div className="features-group-grid">

            {featureGroups.map((group) => (
              <div
                className="features-group-card"
                key={group.title}
              >

                <div className="features-group-icon">
                  <i className={`bi ${group.icon}`}></i>
                </div>

                <div>

                  <h3>{group.title}</h3>

                  <p>{group.text}</p>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          ALL FEATURES
          ===================================================== */}

      <section className="features-library">

        <div className="container">

          <div className="features-heading">

            <div>

              <span className="features-section-label">
                CORE FEATURES
              </span>

              <h2>
                One platform.
                <span> Multiple capabilities.</span>
              </h2>

            </div>

            <p>
              Explore the major software modules that make up the
              HydroGrow platform.
            </p>

          </div>


          <div className="features-grid">

            {features.map((feature) => (

              <article
                className="feature-card"
                key={feature.title}
              >

                <div className="feature-card-top">

                  <div className="feature-icon">
                    <i className={`bi ${feature.icon}`}></i>
                  </div>

                  <span className="feature-number">
                    {feature.id}
                  </span>

                </div>


                <span className="feature-category">
                  {feature.category}
                </span>


                <h3>{feature.title}</h3>


                <p>{feature.text}</p>


                <div className="feature-card-line"></div>


                <div className="feature-card-footer">

                  <span>
                    HydroGrow Module
                  </span>

                  <i className="bi bi-arrow-up-right"></i>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          DATA FLOW
          ===================================================== */}

      <section className="features-flow">

        <div className="container">

          <div className="features-centered-heading">

            <span className="features-section-label">
              CONNECTED WORKFLOW
            </span>

            <h2>
              From input data to
              <span> growing decisions.</span>
            </h2>

            <p>
              HydroGrow connects data collection, processing, monitoring
              and action through a structured software workflow.
            </p>

          </div>


          <div className="features-flow-wrapper">

            <div className="features-flow-item">

              <div className="features-flow-icon">
                <i className="bi bi-cpu"></i>
              </div>

              <strong>Input</strong>

              <span>
                Sensor data
              </span>

            </div>


            <div className="features-flow-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>


            <div className="features-flow-item">

              <div className="features-flow-icon">
                <i className="bi bi-cloud-arrow-up"></i>
              </div>

              <strong>API</strong>

              <span>
                Data transfer
              </span>

            </div>


            <div className="features-flow-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>


            <div className="features-flow-item">

              <div className="features-flow-icon">
                <i className="bi bi-diagram-3"></i>
              </div>

              <strong>Analysis</strong>

              <span>
                Validation
              </span>

            </div>


            <div className="features-flow-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>


            <div className="features-flow-item">

              <div className="features-flow-icon">
                <i className="bi bi-display"></i>
              </div>

              <strong>Dashboard</strong>

              <span>
                Visualization
              </span>

            </div>


            <div className="features-flow-arrow">
              <i className="bi bi-arrow-right"></i>
            </div>


            <div className="features-flow-item">

              <div className="features-flow-icon">
                <i className="bi bi-lightning-charge"></i>
              </div>

              <strong>Action</strong>

              <span>
                Alerts & automation
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURE HIGHLIGHT
          ===================================================== */}

      <section className="features-highlight">

        <div className="container">

          <div className="features-highlight-box">

            <div className="features-highlight-content">

              <span className="features-section-label">
                SOFTWARE-FIRST PLATFORM
              </span>

              <h2>
                Built for monitoring,
                <span> ready for integration.</span>
              </h2>

              <p>
                The current HydroGrow implementation uses an Input
                Simulator to generate sensor readings. The same REST API
                architecture is designed to support future hardware
                integration without changing the core monitoring workflow.
              </p>


              <div className="features-highlight-points">

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Input Simulator based testing</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>REST API communication</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Threshold-based analysis</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Future hardware integration</span>
                </div>

              </div>

            </div>


            <div className="features-highlight-visual">

              <div className="highlight-dashboard">

                <div className="highlight-dashboard-header">

                  <div>
                    <small>HYDROGROW</small>
                    <strong>System Overview</strong>
                  </div>

                  <span>
                    <i></i>
                    ACTIVE
                  </span>

                </div>


                <div className="highlight-status-row">

                  <div className="highlight-status-card">

                    <i className="bi bi-droplet"></i>

                    <div>
                      <small>pH</small>
                      <strong>6.2</strong>
                    </div>

                  </div>


                  <div className="highlight-status-card">

                    <i className="bi bi-beaker"></i>

                    <div>
                      <small>EC</small>
                      <strong>1.8</strong>
                    </div>

                  </div>

                </div>


                <div className="highlight-status-row">

                  <div className="highlight-status-card">

                    <i className="bi bi-thermometer-half"></i>

                    <div>
                      <small>Temperature</small>
                      <strong>25°C</strong>
                    </div>

                  </div>


                  <div className="highlight-status-card">

                    <i className="bi bi-moisture"></i>

                    <div>
                      <small>Humidity</small>
                      <strong>65%</strong>
                    </div>

                  </div>

                </div>


                <div className="highlight-progress">

                  <div className="highlight-progress-header">

                    <span>Crop Growth</span>

                    <strong>57%</strong>

                  </div>

                  <div className="highlight-progress-track">

                    <span></span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
          ===================================================== */}

      <section className="features-cta">

        <div className="container">

          <div className="features-cta-box">

            <div>

              <span className="features-section-label">
                EXPLORE HYDROGROW
              </span>

              <h2>
                Explore what the platform
                <span> can do.</span>
              </h2>

              <p>
                Discover the crop library, understand the platform
                workflow and see how HydroGrow brings hydroponic
                management into one digital environment.
              </p>

            </div>


            <div className="features-cta-actions">

              <a
                href="/crops"
                className="features-primary-btn"
              >
                Explore Crops
                <i className="bi bi-arrow-right"></i>
              </a>

              <a
                href="/how-it-works"
                className="features-secondary-btn"
              >
                How It Works
                <i className="bi bi-arrow-right"></i>
              </a>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Features;