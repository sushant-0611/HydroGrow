import "../../assets/styles/about.css";

function About() {
  return (
    <div className="about-page">

      {/* =====================================================
          HERO SECTION
          ===================================================== */}

      <section className="about-hero">
          <div className="container">
            <div className="about-hero-content">

              <span className="about-eyebrow">
                <i className="bi bi-leaf-fill"></i>
                ABOUT HYDROGROW
              </span>

              <h1>
                Technology for
                <span> Smarter Cultivation</span>
              </h1>

              <p>
                HydroGrow is a digital hydroponics platform designed to
                transform growing data into meaningful insights, crop
                monitoring and intelligent cultivation decisions.
              </p>

            </div>
          </div>
        </section>


      {/* =====================================================
          PLATFORM INTRODUCTION
          ===================================================== */}

      <section
        className="about-intro"
        id="platform"
      >
        <div className="container">

          <div className="row align-items-center g-5">

            {/* LEFT VISUAL */}

            <div className="col-lg-6">

              <div className="about-platform-visual">

                <div className="about-visual-glow"></div>

                <div className="about-dashboard-window">

                  <div className="about-window-header">

                    <div className="about-window-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                    <span>
                      HydroGrow Dashboard
                    </span>

                    <i className="bi bi-three-dots"></i>

                  </div>


                  <div className="about-dashboard-content">

                    <div className="about-dashboard-title">
                      <div>
                        <small>LIVE MONITORING</small>
                        <strong>Growing Environment</strong>
                      </div>

                      <span className="about-live-status">
                        <i></i>
                        Live
                      </span>
                    </div>


                    <div className="about-sensor-grid">

                      <div className="about-sensor-box">
                        <div className="about-sensor-icon">
                          <i className="bi bi-droplet"></i>
                        </div>

                        <div>
                          <small>pH</small>
                          <strong>6.2</strong>
                        </div>
                      </div>


                      <div className="about-sensor-box">
                        <div className="about-sensor-icon">
                          <i className="bi bi-beaker"></i>
                        </div>

                        <div>
                          <small>EC</small>
                          <strong>1.8</strong>
                        </div>
                      </div>


                      <div className="about-sensor-box">
                        <div className="about-sensor-icon">
                          <i className="bi bi-thermometer-half"></i>
                        </div>

                        <div>
                          <small>Temperature</small>
                          <strong>25°C</strong>
                        </div>
                      </div>


                      <div className="about-sensor-box">
                        <div className="about-sensor-icon">
                          <i className="bi bi-moisture"></i>
                        </div>

                        <div>
                          <small>Humidity</small>
                          <strong>65%</strong>
                        </div>
                      </div>

                    </div>


                    <div className="about-dashboard-chart">

                      <div className="about-chart-header">
                        <span>Sensor Trend</span>
                        <small>Last 24 hours</small>
                      </div>

                      <div className="about-chart">
                        <svg
                          viewBox="0 0 500 145"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient
                              id="aboutChartFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#54a96f"
                                stopOpacity="0.28"
                              />

                              <stop
                                offset="100%"
                                stopColor="#54a96f"
                                stopOpacity="0"
                              />
                            </linearGradient>
                          </defs>

                          <path
                            d="M0,108 C35,96 45,102 75,82 C104,62 115,80 145,70 C177,59 186,67 215,48 C247,28 261,57 290,49 C318,42 335,59 361,37 C390,14 410,39 432,27 C459,14 475,24 500,11 L500,145 L0,145 Z"
                            fill="url(#aboutChartFill)"
                          />

                          <path
                            d="M0,108 C35,96 45,102 75,82 C104,62 115,80 145,70 C177,59 186,67 215,48 C247,28 261,57 290,49 C318,42 335,59 361,37 C390,14 410,39 432,27 C459,14 475,24 500,11"
                            fill="none"
                            stroke="#348755"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>

                    </div>

                  </div>

                </div>


                {/* FLOATING STATUS CARD */}

                <div className="about-floating-card about-floating-one">

                  <div className="about-floating-icon">
                    <i className="bi bi-check-lg"></i>
                  </div>

                  <div>
                    <strong>System Healthy</strong>
                    <span>All parameters normal</span>
                  </div>

                </div>


                <div className="about-floating-card about-floating-two">

                  <div className="about-floating-icon">
                    <i className="bi bi-graph-up-arrow"></i>
                  </div>

                  <div>
                    <strong>Crop Progress</strong>
                    <span>Day 24 of 42</span>
                  </div>

                </div>

              </div>

            </div>


            {/* RIGHT CONTENT */}

            <div className="col-lg-6">

              <div className="about-intro-content">

                <span className="about-section-label">
                  THE PLATFORM
                </span>

                <h2>
                  From sensor data to
                  <span> useful decisions.</span>
                </h2>

                <p>
                  Hydroponic cultivation depends on maintaining suitable
                  environmental and nutrient conditions. HydroGrow provides
                  a software layer that brings these measurements together
                  in one structured digital platform.
                </p>

                <p>
                  The platform is designed to collect sensor readings,
                  validate incoming data, visualize current conditions,
                  compare values with crop requirements and present useful
                  information to the grower.
                </p>


                <div className="about-check-list">

                  <div className="about-check-item">
                    <div className="about-check-icon">
                      <i className="bi bi-check2"></i>
                    </div>

                    <div>
                      <strong>Centralized Monitoring</strong>

                      <span>
                        View important growing parameters from a single
                        dashboard.
                      </span>
                    </div>
                  </div>


                  <div className="about-check-item">
                    <div className="about-check-icon">
                      <i className="bi bi-check2"></i>
                    </div>

                    <div>
                      <strong>Crop-Aware Analysis</strong>

                      <span>
                        Compare environmental and nutrient values with
                        crop-specific requirements.
                      </span>
                    </div>
                  </div>


                  <div className="about-check-item">
                    <div className="about-check-icon">
                      <i className="bi bi-check2"></i>
                    </div>

                    <div>
                      <strong>Actionable Alerts</strong>

                      <span>
                        Identify conditions that require attention before
                        they affect crop growth.
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =====================================================
          HOW HYDROGROW WORKS
          ===================================================== */}

      <section className="about-workflow">

        <div className="container">

          <div className="about-centered-heading">

            <span className="about-section-label">
              HOW HYDROGROW WORKS
            </span>

            <h2>
              A connected approach to
              <span> controlled cultivation.</span>
            </h2>

            <p>
              HydroGrow connects simulated sensor inputs, backend
              processing and the web dashboard into one continuous
              monitoring workflow.
            </p>

          </div>


          <div className="about-workflow-grid">

            {/* STEP 1 */}

            <div className="about-workflow-card">

              <div className="about-workflow-number">
                01
              </div>

              <div className="about-workflow-icon">
                <i className="bi bi-cpu"></i>
              </div>

              <h3>Input Data</h3>

              <p>
                Sensor values such as pH, EC, temperature, humidity,
                moisture and nutrients are provided to the platform.
              </p>

            </div>


            <div className="about-workflow-line">
              <i className="bi bi-arrow-right"></i>
            </div>


            {/* STEP 2 */}

            <div className="about-workflow-card">

              <div className="about-workflow-number">
                02
              </div>

              <div className="about-workflow-icon">
                <i className="bi bi-cloud-arrow-up"></i>
              </div>

              <h3>REST API</h3>

              <p>
                Incoming readings are transmitted through a structured
                REST API to the HydroGrow backend.
              </p>

            </div>


            <div className="about-workflow-line">
              <i className="bi bi-arrow-right"></i>
            </div>


            {/* STEP 3 */}

            <div className="about-workflow-card">

              <div className="about-workflow-number">
                03
              </div>

              <div className="about-workflow-icon">
                <i className="bi bi-diagram-3"></i>
              </div>

              <h3>Analysis</h3>

              <p>
                The backend validates readings and evaluates them against
                defined crop requirements and thresholds.
              </p>

            </div>


            <div className="about-workflow-line">
              <i className="bi bi-arrow-right"></i>
            </div>


            {/* STEP 4 */}

            <div className="about-workflow-card">

              <div className="about-workflow-number">
                04
              </div>

              <div className="about-workflow-icon">
                <i className="bi bi-display"></i>
              </div>

              <h3>Dashboard</h3>

              <p>
                Processed information is presented through monitoring,
                alerts, crop progress and automation interfaces.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CORE CAPABILITIES
          ===================================================== */}

      <section className="about-capabilities">

        <div className="container">

          <div className="about-centered-heading">

            <span className="about-section-label">
              PLATFORM CAPABILITIES
            </span>

            <h2>
              Built around the needs of
              <span> modern growers.</span>
            </h2>

            <p>
              HydroGrow combines monitoring, crop management and
              intelligent decision support in a unified interface.
            </p>

          </div>


          <div className="about-capability-grid">

            <div className="about-capability-card">

              <div className="about-capability-icon">
                <i className="bi bi-activity"></i>
              </div>

              <span>01</span>

              <h3>Live Monitoring</h3>

              <p>
                Monitor important hydroponic parameters and understand
                the current growing environment through a centralized
                dashboard.
              </p>

            </div>


            <div className="about-capability-card">

              <div className="about-capability-icon">
                <i className="bi bi-flower1"></i>
              </div>

              <span>02</span>

              <h3>Crop Management</h3>

              <p>
                Maintain crop-specific information, growing requirements,
                schedules and progress throughout the cultivation cycle.
              </p>

            </div>


            <div className="about-capability-card">

              <div className="about-capability-icon">
                <i className="bi bi-bell"></i>
              </div>

              <span>03</span>

              <h3>Smart Alerts</h3>

              <p>
                Identify abnormal readings and highlight parameters that
                move outside their defined operating ranges.
              </p>

            </div>


            <div className="about-capability-card">

              <div className="about-capability-icon">
                <i className="bi bi-sliders"></i>
              </div>

              <span>04</span>

              <h3>Automation Simulation</h3>

              <p>
                Simulate automated responses based on threshold conditions
                while developing and validating the software platform.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SOFTWARE IMPLEMENTATION
          ===================================================== */}

      <section className="about-implementation">

        <div className="container">

          <div className="about-implementation-box">

            <div className="about-implementation-content">

              <span className="about-section-label">
                CURRENT IMPLEMENTATION
              </span>

              <h2>
                Software-first development
                <span> with an Input Simulator.</span>
              </h2>

              <p>
                During the current implementation phase, HydroGrow is being
                developed as a software platform. An Input Simulator is used
                to represent the sensor hardware and generate realistic
                readings for testing the monitoring and decision-support
                workflow.
              </p>

              <p>
                The simulator communicates through the same REST API
                architecture planned for future hardware integration.
                This allows the web platform, backend services and
                threshold logic to be developed and tested independently
                of physical hardware.
              </p>


              <div className="about-implementation-points">

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Software-only development</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Input Simulator for sensor data</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>REST API based architecture</span>
                </div>

                <div>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Future hardware integration ready</span>
                </div>

              </div>

            </div>


            <div className="about-implementation-visual">

              <div className="implementation-node simulator-node">

                <div className="implementation-node-icon">
                  <i className="bi bi-cpu"></i>
                </div>

                <div>
                  <strong>Input Simulator</strong>
                  <span>Sensor readings</span>
                </div>

              </div>


              <div className="implementation-connector">
                <span>
                  REST API
                </span>
                <i className="bi bi-arrow-down"></i>
              </div>


              <div className="implementation-node backend-node">

                <div className="implementation-node-icon">
                  <i className="bi bi-server"></i>
                </div>

                <div>
                  <strong>HydroGrow Backend</strong>
                  <span>Validation & analysis</span>
                </div>

              </div>


              <div className="implementation-connector">
                <span>
                  Processed data
                </span>
                <i className="bi bi-arrow-down"></i>
              </div>


              <div className="implementation-node dashboard-node">

                <div className="implementation-node-icon">
                  <i className="bi bi-window"></i>
                </div>

                <div>
                  <strong>Web Dashboard</strong>
                  <span>Monitoring & decisions</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CLOSING CTA
          ===================================================== */}

      <section className="about-cta">

        <div className="container">

          <div className="about-cta-box">

            <div>

              <span className="about-section-label">
                HYDROGROW
              </span>

              <h2>
                Smarter data.
                <span> Better growing decisions.</span>
              </h2>

              <p>
                Explore the HydroGrow platform and understand how
                technology can support controlled hydroponic cultivation.
              </p>

            </div>


            <div className="about-cta-actions">

              <a
                href="/crops"
                className="about-primary-btn"
              >
                Explore Crops
                <i className="bi bi-arrow-right"></i>
              </a>

              <a
                href="/contact"
                className="about-secondary-btn"
              >
                Contact Us
                <i className="bi bi-arrow-right"></i>
              </a>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default About;