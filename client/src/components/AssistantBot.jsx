import { useEffect, useRef, useState } from "react";

import api from "../services/api";

import "../assets/styles/assistant.css";

const WELCOME_TEXT =
  "Hi! I'm your HydroGrow farm assistant. Ask me about your farm, crops, growth verification, sensors, alerts, marketplace or automation.";

const WELCOME_SUGGESTIONS = [
  "My farm",
  "Sensor status",
  "Growth verification",
  "Tomato requirements",
];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: WELCOME_TEXT,
  suggestions: WELCOME_SUGGESTIONS,
};

function AssistantBot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);

  const bodyRef = useRef(null);

  const inputRef = useRef(null);

  const toggleOpen = () => {
    setOpen((current) => !current);
  };

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!bodyRef.current) return;

    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, sending, open]);

  const sendMessage = async (value) => {
    const message = String(value ?? input).trim();

    if (!message || sending) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: message,
      },
    ]);

    setInput("");
    setSending(true);

    try {
      const data = await api.post(
        "/assistant/message",
        { message },
        { auth: true }
      );

      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.reply,
          suggestions: Array.isArray(data.suggestions)
            ? data.suggestions
            : [],
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          text:
            error?.message ||
            "I can't reach the HydroGrow server right now. Please check the backend on port 5000.",
          suggestions: WELCOME_SUGGESTIONS,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    sendMessage();
  };

  return (
    <div className={`hga-root ${open ? "is-open" : ""}`}>
      <section
        className={`hga-panel ${open ? "open" : ""}`}
        role="dialog"
        aria-label="HydroGrow assistant"
        aria-hidden={!open}
      >
        <header className="hga-header">
          <div className="hga-avatar">
            <img
              src="/images/assistant/assistant-bot.png"
              alt="HydroGrow assistant"
            />

            <span className="hga-online-dot"></span>
          </div>

          <div className="hga-identity">
            <strong>HydroGrow Assistant</strong>

            <span>Farm &amp; crop support · live data</span>
          </div>

          <button
            type="button"
            className="hga-close"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </header>

        <div className="hga-body" ref={bodyRef}>
          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;

            return (
              <div
                key={message.id}
                className={`hga-message ${message.role}`}
              >
                <div className="hga-bubble">{message.text}</div>

                {message.role === "assistant" &&
                  isLast &&
                  !sending &&
                  message.suggestions?.length > 0 && (
                    <div className="hga-suggestions">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="hga-chip"
                          onClick={() => sendMessage(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            );
          })}

          {sending && (
            <div className="hga-message assistant">
              <div className="hga-bubble hga-typing" aria-label="Assistant is typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="hga-footer">
          <form onSubmit={handleSubmit} className="hga-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();

                  sendMessage();
                }
              }}
              placeholder="Ask about your farm or crops..."
              aria-label="Message the HydroGrow assistant"
              maxLength={500}
              autoComplete="off"
            />

            <button
              type="submit"
              className="hga-send"
              disabled={!input.trim() || sending}
              aria-label="Send message"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>

          <small>Answers use your live HydroGrow data.</small>
        </div>
      </section>

      <button
        type="button"
        className="hga-launcher"
        onClick={toggleOpen}
        aria-label={
          open ? "Close HydroGrow assistant" : "Open HydroGrow assistant"
        }
        aria-expanded={open}
        title="HydroGrow Assistant"
      >
        <span className="hga-launcher-face">
          <img
            src="/images/assistant/assistant-bot.png"
            alt=""
            aria-hidden="true"
          />
        </span>

        {open ? (
          <span className="hga-launcher-icon">
            <i className="bi bi-chevron-down"></i>
          </span>
        ) : (
          <span className="hga-launcher-dot"></span>
        )}
      </button>
    </div>
  );
}

export default AssistantBot;
