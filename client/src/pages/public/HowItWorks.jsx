import "../../assets/styles/howItWorks.css";

const steps = [
  {
    number: "01",
    icon: "bi-sliders",
    title: "Input Data",
    text: "Sensor readings are represented by the Input Simulator during the software-only implementation.",
  },
  {
    number: "02",
    icon: "bi-cloud-arrow-up",
    title: "REST API",
    text: "The simulator sends sensor data to the HydroGrow backend through REST API endpoints.",
  },
  {
    number: "03",
    icon: "bi-shield-check",
    title: "Validation & Analysis",
    text: "The backend validates incoming readings and evaluates them against crop-specific thresholds.",
  },
  {
    number: "04",
    icon: "bi-display",
    title: "Dashboard",
    text: "Processed information is displayed through monitoring dashboards, charts and crop progress views.",
  },
  {
    number: "05",
    icon: "bi-bell",
    title: "Alerts",
    text: "Warning and critical conditions generate alerts and recommendations for the user.",
  },
  {
    number: "06",
    icon: "bi-cpu",
    title: "Automation",
    text: "The system can simulate automatic actions based on configured threshold rules.",
  },
];

function HowItWorks() {
  return (
    <div className="how-it-works-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="hiw-hero">

        <div className="container">

          <div className="hiw-hero-content">

            <span className="hiw-eyebrow">
              <i className="bi bi-diagram-3-fill"></i>
              HOW HYDROGROW WORKS
            </span>

            <h1>
              From sensor input to
              <span> intelligent action</span>
            </h1>

            <p>
              HydroGrow follows a structured data flow that transforms
              sensor readings into meaningful monitoring information,
              alerts and simulated automated actions.
            </p>

            <div className="hiw-hero-flow">

              <div className="hiw-hero-node">
                <i className="bi bi-sliders"></i>
                <span>Input</span>
              </div>

              <i className="bi bi-arrow-right"></i>

              <div className="hiw-hero-node">
                <i className="bi bi-server"></i>
                <span>Process</span>
              </div>

              <i className="bi bi-arrow-right"></i>

              <div className="hiw-hero-node">
                <i className="bi bi-display"></i>
                <span>Monitor</span>
              </div>

              <i className="bi bi-arrow-right"></i>

              <div className="hiw-hero-node">
                <i className="bi bi-cpu"></i>
                <span>Action</span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          INTRO
          ===================================================== */}

      <section className="hiw-intro">

        <div className="container">

          <div className="row align-items-center g-5">

            <div className="col-lg-6">

              <div className="hiw-intro-content">

                <span className="hiw-section-label">
                  THE WORKFLOW
                </span>

                <h2>
                  One connected flow from
                  <span> data to decisions.</span>
                </h2>

                <p>
                  HydroGrow is designed around a simple but structured
                  information flow. Sensor readings enter the system,
                  are transmitted through the REST API, validated by
                  the backend and evaluated against crop requirements.
                </p>

                <p>
                  The processed information is then presented through
                  the web dashboard. Based on configured thresholds,
                  the platform can generate alerts and simulate
                  automated actions.
                </p>

                <div className="hiw-intro-points">

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Structured sensor data flow</span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Crop-specific threshold evaluation</span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Real-time style monitoring interface</span>
                  </div>

                  <div>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Alert and automation simulation</span>
                  </div>

                </div>

              </div>

            </div>


            <div className="col-lg-6">

              <div className="hiw-data-visual">

                <div className="hiw-data-card">

                  <div className="hiw-data-header">

                    <div>
                      <small>DATA FLOW</small>
                      <strong>HydroGrow Processing</strong>
                    </div>

                    <span className="hiw-live-badge">
                      <i></i>
                      ACTIVE
                    </span>

                  </div>


                  <div className="hiw-data-item">

                    <div className="hiw-data-icon">
                      <i className="bi bi-sliders"></i>
                    </div>

                    <div className="hiw-data-text">
                      <strong>Sensor Input</strong>
                      <span>
                        pH · EC · Temperature · Humidity
                      </span>
                    </div>

                    <i className="bi bi-check2 hiw-data-check"></i>

                  </div>


                  <div className="hiw-data-connector">
                    <span></span>
                  </div>


                  <div className="hiw-data-item">

                    <div className="hiw-data-icon">
                      <i className="bi bi-cloud-arrow-up"></i>
                    </div>

                    <div className="hiw-data-text">
                      <strong>REST API</strong>
                      <span>
                        Structured data transmission
                      </span>
                    </div>

                    <i className="bi bi-check2 hiw-data-check"></i>

                  </div>


                  <div className="hiw-data-connector">
                    <span></span>
                  </div>


                  <div className="hiw-data-item">

                    <div className="hiw-data-icon">
                      <i className="bi bi-shield-check"></i>
                    </div>

                    <div className="hiw-data-text">
                      <strong>Validation</strong>
                      <span>
                        Threshold and crop evaluation
                      </span>
                    </div>

                    <i className="bi bi-check2 hiw-data-check"></i>

                  </div>


                  <div className="hiw-data-connector">
                    <span></span>
                  </div>


                  <div className="hiw-data-item">

                    <div className="hiw-data-icon">
                      <i className="bi bi-display"></i>
                    </div>

                    <div className="hiw-data-text">
                      <strong>Dashboard</strong>
                      <span>
                        Monitoring and visualization
                      </span>
                    </div>

                    <i className="bi bi-check2 hiw-data-check"></i>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SIX STEP WORKFLOW
          ===================================================== */}

      <section className="hiw-steps">

        <div className="container">

          <div className="hiw-centered-heading">

            <span className="hiw-section-label">
              SIX STEP WORKFLOW
            </span>

            <h2>
              How the HydroGrow platform
              <span> processes information.</span>
            </h2>

            <p>
              Each stage has a defined role in moving sensor information
              from the input layer to monitoring, alerts and automation.
            </p>

          </div>


          <div className="hiw-step-grid">

            {steps.map((step, index) => (

              <div
                className="hiw-step-wrapper"
                key={step.number}
              >

                <div className="hiw-step-card">

                  <div className="hiw-step-number">
                    {step.number}
                  </div>

                  <div className="hiw-step-icon">
                    <i className={`bi ${step.icon}`}></i>
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>

                </div>

                {index < steps.length - 1 && (
                  <div className="hiw-step-connector">
                    <i className="bi bi-arrow-right"></i>
                  </div>
                )}

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* =====================================================
          ARCHITECTURE
          ===================================================== */}

      <section className="hiw-architecture">

        <div className="container">

          <div className="hiw-centered-heading">

            <span className="hiw-section-label">
              SYSTEM ARCHITECTURE
            </span>

            <h2>
              From simulated input to
              <span> web dashboard.</span>
            </h2>

            <p>
              The current software implementation uses an Input Simulator
              in place of physical sensor hardware while maintaining an
              architecture suitable for future hardware integration.
            </p>

          </div>


          <div className="hiw-architecture-box">

            <div className="hiw-architecture-flow">

              {/* INPUT */}

              <div className="hiw-architecture-node">

                <div className="hiw-architecture-icon">
                  <i className="bi bi-cpu"></i>
                </div>

                <span className="hiw-node-label">
                  INPUT
                </span>

                <h3>Input Simulator</h3>

                <p>
                  Simulated sensor readings
                </p>

              </div>


              <div className="hiw-architecture-arrow">
                <span>Sensor Data</span>
                <i className="bi bi-arrow-right"></i>
              </div>


              {/* API */}

              <div className="hiw-architecture-node">

                <div className="hiw-architecture-icon">
                  <i className="bi bi-cloud-arrow-up"></i>
                </div>

                <span className="hiw-node-label">
                  COMMUNICATION
                </span>

                <h3>REST API</h3>

                <p>
                  Data transmission layer
                </p>

              </div>


              <div className="hiw-architecture-arrow">
                <span>Request</span>
                <i className="bi bi-arrow-right"></i>
              </div>


              {/* BACKEND */}

              <div className="hiw-architecture-node">

                <div className="hiw-architecture-icon">
                  <i className="bi bi-server"></i>
                </div>

                <span className="hiw-node-label">
                  PROCESSING
                </span>

                <h3>Backend</h3>

                <p>
                  Validation & analysis
                </p>

              </div>


              <div className="hiw-architecture-arrow">
                <span>Store</span>
                <i className="bi bi-arrow-right"></i>
              </div>


              {/* DATABASE */}

              <div className="hiw-architecture-node">

                <div className="hiw-architecture-icon">
                  <i className="bi bi-database"></i>
                </div>

                <span className="hiw-node-label">
                  STORAGE
                </span>

                <h3>MongoDB</h3>

                <p>
                  Sensor and system data
                </p>

              </div>


              <div className="hiw-architecture-arrow">
                <span>Retrieve</span>
                <i className="bi bi-arrow-right"></i>
              </div>


              {/* DASHBOARD */}

              <div className="hiw-architecture-node">

                <div className="hiw-architecture-icon">
                  <i className="bi bi-display"></i>
                </div>

                <span className="hiw-node-label">
                  PRESENTATION
                </span>

                <h3>Dashboard</h3>

                <p>
                  Monitoring & insights
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ALERT + AUTOMATION
          ===================================================== */}

      <section className="hiw-response">

        <div className="container">

          <div className="row g-4">

            {/* ALERT */}

            <div className="col-lg-6">

              <div className="hiw-response-card">

                <div className="hiw-response-icon">
                  <i className="bi bi-bell"></i>
                </div>

                <div>

                  <span className="hiw-section-label">
                    RESPONSE 01
                  </span>

                  <h3>Alerts & Recommendations</h3>

                  <p>
                    When a monitored parameter moves outside its
                    configured range, HydroGrow can identify the
                    condition and present a warning or critical
                    notification to the user.
                  </p>

                  <div className="hiw-response-list">

                    <span>
                      <i className="bi bi-check2"></i>
                      Warning conditions
                    </span>

                    <span>
                      <i className="bi bi-check2"></i>
                      Critical conditions
                    </span>

                    <span>
                      <i className="bi bi-check2"></i>
                      User recommendations
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* AUTOMATION */}

            <div className="col-lg-6">

              <div className="hiw-response-card">

                <div className="hiw-response-icon">
                  <i className="bi bi-cpu"></i>
                </div>

                <div>

                  <span className="hiw-section-label">
                    RESPONSE 02
                  </span>

                  <h3>Automation Simulation</h3>

                  <p>
                    Configured threshold rules can be used to simulate
                    automatic system responses. This allows the software
                    logic to be tested before physical hardware
                    integration.
                  </p>

                  <div className="hiw-response-list">

                    <span>
                      <i className="bi bi-check2"></i>
                      Threshold-based actions
                    </span>

                    <span>
                      <i className="bi bi-check2"></i>
                      Automatic response simulation
                    </span>

                    <span>
                      <i className="bi bi-check2"></i>
                      Hardware-ready architecture
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
    </div>
  );
}

export default HowItWorks;