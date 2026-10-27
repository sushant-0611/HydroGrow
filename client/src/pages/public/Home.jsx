import { Link } from "react-router-dom";
import "../../assets/styles/home.css";

function Home() {
  return (
    <div className="home-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="home-hero">
        <div className="container">

          <div className="row align-items-center g-5">

            {/* HERO CONTENT */}

            <div className="col-lg-7">

              <div className="home-hero-content">

                <span className="home-eyebrow">
                  <i className="bi bi-stars"></i>
                  INTELLIGENT HYDROPONICS PLATFORM
                </span>

                <h1>
                  Grow Smarter.
                  <span>Grow Better.</span>
                </h1>

                <p>
                  HydroGrow brings hydroponic monitoring, crop management,
                  growth tracking, alerts and automation simulation together
                  in one intelligent digital platform.
                </p>

                <div className="home-hero-actions">

                  <Link
                    to="/register"
                    className="home-primary-btn"
                  >
                    Get Started
                    <i className="bi bi-arrow-right"></i>
                  </Link>

                  <Link
                    to="/how-it-works"
                    className="home-secondary-btn"
                  >
                    <i className="bi bi-play-circle"></i>
                    How It Works
                  </Link>

                </div>


                {/* HERO STATS */}

                <div className="home-hero-stats">

                  <div className="home-stat">
                    <strong>24+</strong>
                    <span>Crop Profiles</span>
                  </div>

                  <div className="home-stat-divider"></div>

                  <div className="home-stat">
                    <strong>24/7</strong>
                    <span>Monitoring</span>
                  </div>

                  <div className="home-stat-divider"></div>

                  <div className="home-stat">
                    <strong>Smart</strong>
                    <span>Alerts</span>
                  </div>

                </div>

              </div>

            </div>


            {/* HERO DASHBOARD */}

            <div className="col-lg-5">

              <div className="home-dashboard-wrapper">

                <div className="home-dashboard-glow"></div>

                <div className="home-dashboard-card">

                  {/* HEADER */}

                  <div className="home-dashboard-header">

                    <div className="home-dashboard-title">

                      <span>
                        HYDROGROW MONITOR
                      </span>

                      <h3>
                        System Overview
                      </h3>

                    </div>

                    <div className="home-online-status">
                      <i></i>
                      Online
                    </div>

                  </div>


                  {/* SYSTEM INFO */}

                  <div className="home-system-row">

                    <div>
                      <span>Selected Crop</span>
                      <strong>
                        <i className="bi bi-flower1"></i>
                        Lettuce
                      </strong>
                    </div>

                    <div className="home-system-date">
                      <span>Growth Stage</span>
                      <strong>Day 24 / 35</strong>
                    </div>

                  </div>


                  {/* SENSOR GRID */}

                  <div className="home-sensor-grid">

                    <Sensor
                      icon="bi-droplet-half"
                      label="pH Level"
                      value="6.2"
                      status="Optimal"
                    />

                    <Sensor
                      icon="bi-beaker"
                      label="EC"
                      value="1.8"
                      status="Optimal"
                    />

                    <Sensor
                      icon="bi-thermometer-half"
                      label="Temperature"
                      value="25°C"
                      status="Optimal"
                    />

                    <Sensor
                      icon="bi-moisture"
                      label="Humidity"
                      value="65%"
                      status="Optimal"
                    />

                  </div>


                  {/* GROWTH */}

                  <div className="home-growth-card">

                    <div className="home-growth-header">

                      <div>
                        <span>Crop Growth Progress</span>
                        <strong>Healthy Development</strong>
                      </div>

                      <b>68%</b>

                    </div>

                    <div className="home-growth-progress">

                      <div
                        className="home-growth-progress-bar"
                        style={{ width: "68%" }}
                      ></div>

                    </div>

                    <div className="home-growth-footer">

                      <span>
                        <i className="bi bi-calendar3"></i>
                        Day 24 of 35
                      </span>

                      <span>
                        Harvest in 11 days
                      </span>

                    </div>

                  </div>


                  {/* BOTTOM STATUS */}

                  <div className="home-dashboard-footer">

                    <div>
                      <i className="bi bi-check-circle-fill"></i>
                      All parameters within range
                    </div>

                    <span>
                      Updated just now
                    </span>

                  </div>

                </div>


                {/* FLOATING ALERT */}

                <div className="home-floating-alert">

                  <div className="home-floating-alert-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>

                  <div>
                    <strong>System Healthy</strong>
                    <span>No critical alerts</span>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          PLATFORM INTRO
          ===================================================== */}

      <section className="home-intro">

        <div className="container">

          <div className="home-centered-heading">

            <span className="home-section-label">
              ONE PLATFORM
            </span>

            <h2>
              Everything your
              <span> smart farm needs.</span>
            </h2>

            <p>
              HydroGrow connects sensor data, crop requirements,
              monitoring and decision support into a unified digital
              experience for hydroponic cultivation.
            </p>

          </div>


          <div className="home-feature-grid">

            <Feature
              icon="bi-speedometer2"
              title="Real-Time Monitoring"
              text="Monitor pH, EC, temperature, humidity, moisture, nutrients and light conditions from a centralized dashboard."
            />

            <Feature
              icon="bi-flower1"
              title="Crop Management"
              text="Explore crop requirements, growing parameters, schedules and development information."
            />

            <Feature
              icon="bi-bell"
              title="Smart Alerts"
              text="Identify abnormal conditions and receive clear alerts when values move outside defined ranges."
            />

            <Feature
              icon="bi-graph-up-arrow"
              title="Growth Tracking"
              text="Follow crop progress through growth cycles, milestones and cultivation schedules."
            />

            <Feature
              icon="bi-cpu"
              title="Automation"
              text="Simulate automatic responses based on crop-specific thresholds and operating conditions."
            />

            <Feature
              icon="bi-shop"
              title="Marketplace"
              text="Support a future ecosystem for hydroponic products and harvested produce."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          WORKFLOW
          ===================================================== */}

      <section className="home-workflow">

        <div className="container">

          <div className="home-centered-heading">

            <span className="home-section-label">
              SIMPLE WORKFLOW
            </span>

            <h2>
              From input data to
              <span> growing decisions.</span>
            </h2>

            <p>
              HydroGrow follows a structured data flow that turns
              incoming sensor values into understandable information.
            </p>

          </div>


          <div className="home-flow">

            <FlowStep
              number="01"
              icon="bi-cpu"
              title="Input"
              text="Sensor readings"
            />

            <FlowConnector />

            <FlowStep
              number="02"
              icon="bi-cloud-arrow-up"
              title="REST API"
              text="Data transmission"
            />

            <FlowConnector />

            <FlowStep
              number="03"
              icon="bi-diagram-3"
              title="Analysis"
              text="Validation & thresholds"
            />

            <FlowConnector />

            <FlowStep
              number="04"
              icon="bi-display"
              title="Dashboard"
              text="Insights & alerts"
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          MONITORING PREVIEW
          ===================================================== */}

      <section className="home-monitoring">

        <div className="container">

          <div className="row align-items-center g-5">

            <div className="col-lg-6">

              <div className="home-monitoring-content">

                <span className="home-section-label">
                  DATA-DRIVEN CULTIVATION
                </span>

                <h2>
                  Understand your growing
                  <span> environment at a glance.</span>
                </h2>

                <p>
                  HydroGrow organizes important hydroponic parameters
                  into a simple monitoring interface so growers can
                  understand system conditions without navigating
                  complicated tools.
                </p>

                <div className="home-monitoring-points">

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>
                      Monitor environmental conditions
                    </span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>
                      Track nutrient-related parameters
                    </span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>
                      Compare readings with crop thresholds
                    </span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>
                      Identify conditions requiring attention
                    </span>
                  </div>

                </div>

                <Link
                  to="/features"
                  className="home-text-link"
                >
                  Explore platform capabilities
                  <i className="bi bi-arrow-right"></i>
                </Link>

              </div>

            </div>


            <div className="col-lg-6">

              <div className="home-monitoring-panel">

                <div className="home-panel-header">

                  <div>
                    <span>LIVE PARAMETERS</span>
                    <strong>Growing Environment</strong>
                  </div>

                  <div className="home-panel-status">
                    <i></i>
                    Normal
                  </div>

                </div>


                <div className="home-parameter-list">

                  <Parameter
                    icon="bi-droplet"
                    name="pH"
                    value="6.2"
                    range="5.5 – 6.5"
                    percent="78%"
                  />

                  <Parameter
                    icon="bi-beaker"
                    name="EC"
                    value="1.8 mS/cm"
                    range="1.2 – 2.2"
                    percent="72%"
                  />

                  <Parameter
                    icon="bi-thermometer-half"
                    name="Temperature"
                    value="25°C"
                    range="20 – 28°C"
                    percent="68%"
                  />

                  <Parameter
                    icon="bi-moisture"
                    name="Humidity"
                    value="65%"
                    range="50 – 80%"
                    percent="61%"
                  />

                </div>


                <div className="home-panel-note">

                  <div className="home-panel-note-icon">
                    <i className="bi bi-shield-check"></i>
                  </div>

                  <div>
                    <strong>System condition is stable</strong>

                    <span>
                      Current values are within the selected crop's
                      recommended operating range.
                    </span>
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

      <section className="home-cta">

        <div className="container">

          <div className="home-cta-card">

            <div className="home-cta-content">

              <span className="home-section-label">
                START YOUR SMART FARM
              </span>

              <h2>
                Turn your hydroponic system into a
                <span> data-driven farm.</span>
              </h2>

              <p>
                Monitor conditions, understand crop requirements and
                make informed growing decisions from one platform.
              </p>

            </div>


            <div className="home-cta-actions">

              <Link
                to="/register"
                className="home-cta-primary"
              >
                Create Account
                <i className="bi bi-arrow-right"></i>
              </Link>

              <Link
                to="/crops"
                className="home-cta-secondary"
              >
                Explore Crops
                <i className="bi bi-flower1"></i>
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}


/* =========================================================
   SENSOR COMPONENT
   ========================================================= */

function Sensor({
  icon,
  label,
  value,
  status,
}) {
  return (
    <div className="home-sensor-card">

      <div className="home-sensor-top">

        <div className="home-sensor-icon">
          <i className={`bi ${icon}`}></i>
        </div>

        <span className="home-sensor-status">
          {status}
        </span>

      </div>

      <span className="home-sensor-label">
        {label}
      </span>

      <strong className="home-sensor-value">
        {value}
      </strong>

    </div>
  );
}


/* =========================================================
   FEATURE COMPONENT
   ========================================================= */

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="home-feature-card">

      <div className="home-feature-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <span className="home-feature-number">
        +
      </span>

      <h3>{title}</h3>

      <p>{text}</p>

      <div className="home-feature-arrow">
        <i className="bi bi-arrow-up-right"></i>
      </div>

    </div>
  );
}


/* =========================================================
   FLOW STEP
   ========================================================= */

function FlowStep({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div className="home-flow-step">

      <span className="home-flow-number">
        {number}
      </span>

      <div className="home-flow-icon">
        <i className={`bi ${icon}`}></i>
      </div>

      <strong>{title}</strong>

      <span>{text}</span>

    </div>
  );
}


/* =========================================================
   FLOW CONNECTOR
   ========================================================= */

function FlowConnector() {
  return (
    <div className="home-flow-connector">
      <i className="bi bi-arrow-right"></i>
    </div>
  );
}


/* =========================================================
   PARAMETER
   ========================================================= */

function Parameter({
  icon,
  name,
  value,
  range,
  percent,
}) {
  return (
    <div className="home-parameter">

      <div className="home-parameter-top">

        <div className="home-parameter-name">

          <div className="home-parameter-icon">
            <i className={`bi ${icon}`}></i>
          </div>

          <div>
            <strong>{name}</strong>
            <span>{range}</span>
          </div>

        </div>

        <strong className="home-parameter-value">
          {value}
        </strong>

      </div>


      <div className="home-parameter-bar">

        <div
          className="home-parameter-fill"
          style={{ width: percent }}
        ></div>

      </div>

    </div>
  );
}


export default Home;