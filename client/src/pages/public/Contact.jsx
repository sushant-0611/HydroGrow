import { useState } from "react";
import "../../assets/styles/contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-page">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="contact-hero">

        <div className="container">

          <div className="contact-hero-content">

            <span className="contact-eyebrow">
              <i className="bi bi-chat-dots-fill"></i>
              CONTACT HYDROGROW
            </span>

            <h1>
              Let’s grow
              <span> smarter together</span>
            </h1>

            <p>
              Have a question about HydroGrow, the platform or our
              hydroponic technology project? We would be happy to
              hear from you.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT SECTION
          ===================================================== */}

      <section className="contact-main">

        <div className="container">

          <div className="row g-5">

            {/* =================================================
                LEFT INFORMATION
                ================================================= */}

            <div className="col-lg-5">

              <div className="contact-info-wrapper">

                <span className="contact-section-label">
                  GET IN TOUCH
                </span>

                <h2>
                  Let’s start a
                  <span> conversation.</span>
                </h2>

                <p className="contact-intro-text">
                  Whether you want to learn more about HydroGrow,
                  understand the platform architecture or discuss
                  the project, send us a message through the form.
                </p>


                {/* EMAIL */}

                <div className="contact-info-item">

                  <div className="contact-info-icon">
                    <i className="bi bi-envelope"></i>
                  </div>

                  <div className="contact-info-content">

                    <small>Email</small>

                    <a href="mailto:hydrogrow.project@gmail.com">
                      hydrogrow.project@gmail.com
                    </a>

                    <span>
                      Project and platform enquiries
                    </span>

                  </div>

                </div>


                {/* PLATFORM */}

                <div className="contact-info-item">

                  <div className="contact-info-icon">
                    <i className="bi bi-globe2"></i>
                  </div>

                  <div className="contact-info-content">

                    <small>Platform</small>

                    <strong>
                      HydroGrow
                    </strong>

                    <span>
                      Intelligent Hydroponics Monitoring & Automation
                    </span>

                  </div>

                </div>


                {/* PROJECT STATUS */}

                <div className="contact-info-item">

                  <div className="contact-info-icon">
                    <i className="bi bi-code-square"></i>
                  </div>

                  <div className="contact-info-content">

                    <small>Development</small>

                    <strong>
                      Software Platform
                    </strong>

                    <span>
                      Input Simulator + REST API architecture
                    </span>

                  </div>

                </div>


                {/* RESPONSE */}

                <div className="contact-info-item">

                  <div className="contact-info-icon">
                    <i className="bi bi-clock"></i>
                  </div>

                  <div className="contact-info-content">

                    <small>Availability</small>

                    <strong>
                      Project Support
                    </strong>

                    <span>
                      Questions are welcome anytime
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                RIGHT FORM
                ================================================= */}

            <div className="col-lg-7">

              <div className="contact-form-card">

                <div className="contact-form-header">

                  <div>

                    <span className="contact-form-label">
                      SEND A MESSAGE
                    </span>

                    <h3>
                      How can we help?
                    </h3>

                    <p>
                      Fill in the details below and send your
                      message to the HydroGrow project team.
                    </p>

                  </div>

                  <div className="contact-form-header-icon">
                    <i className="bi bi-send"></i>
                  </div>

                </div>


                {/* =================================================
                    SUCCESS MESSAGE
                    ================================================= */}

                {submitted && (

                  <div className="contact-success">

                    <div className="contact-success-icon">
                      <i className="bi bi-check-lg"></i>
                    </div>

                    <div>

                      <strong>
                        Message received
                      </strong>

                      <p>
                        Thank you for contacting HydroGrow.
                        Your message has been recorded successfully.
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      aria-label="Close success message"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>

                  </div>

                )}


                <form onSubmit={handleSubmit}>

                  <div className="row g-4">

                    {/* NAME */}

                    <div className="col-md-6">

                      <label
                        htmlFor="contact-name"
                        className="contact-form-label"
                      >
                        Your Name
                      </label>

                      <div className="contact-input-wrapper">

                        <i className="bi bi-person"></i>

                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          required
                        />

                      </div>

                    </div>


                    {/* EMAIL */}

                    <div className="col-md-6">

                      <label
                        htmlFor="contact-email"
                        className="contact-form-label"
                      >
                        Email Address
                      </label>

                      <div className="contact-input-wrapper">

                        <i className="bi bi-envelope"></i>

                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          required
                        />

                      </div>

                    </div>


                    {/* SUBJECT */}

                    <div className="col-12">

                      <label
                        htmlFor="contact-subject"
                        className="contact-form-label"
                      >
                        Subject
                      </label>

                      <div className="contact-input-wrapper">

                        <i className="bi bi-chat-left-text"></i>

                        <input
                          id="contact-subject"
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What would you like to discuss?"
                          required
                        />

                      </div>

                    </div>


                    {/* MESSAGE */}

                    <div className="col-12">

                      <label
                        htmlFor="contact-message"
                        className="contact-form-label"
                      >
                        Message
                      </label>

                      <div className="contact-input-wrapper contact-textarea-wrapper">

                        <i className="bi bi-pencil-square"></i>

                        <textarea
                          id="contact-message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows="6"
                          placeholder="Write your message here..."
                          required
                        ></textarea>

                      </div>

                    </div>


                    {/* SUBMIT */}

                    <div className="col-12">

                      <button
                        type="submit"
                        className="contact-submit-btn"
                      >
                        <span>
                          Send Message
                        </span>

                        <i className="bi bi-arrow-right"></i>
                      </button>

                    </div>

                  </div>

                </form>


                <div className="contact-form-footer">

                  <i className="bi bi-shield-check"></i>

                  <span>
                    Your information is used only for responding
                    to your enquiry.
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Contact;