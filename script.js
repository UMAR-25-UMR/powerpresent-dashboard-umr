class PowerPresentDashboard {
  constructor() {
    this.isRecording = false;
    this.recognition = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSpeechRecognition();
    this.setupCharacterCounter();
    this.populateSlidePreviews();
    this.setupDropdowns();
    this.switchInputMode("ai"); // default
    this.renderExampleCards();
  }

  setupEventListeners() {
    document.querySelectorAll(".option-card").forEach((card) => {
      card.addEventListener("click", () => this.selectOption(card));
    });

    document.getElementById("shuffle-btn")?.addEventListener("click", () => this.renderExampleCards());
  }

  setupSpeechRecognition() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const topicInput = document.getElementById("topicInput");
        if (topicInput) {
          topicInput.value = transcript;
          this.updateCharacterCount();
        }
        this.stopVoiceRecording();
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.stopVoiceRecording();
      };

      this.recognition.onend = () => {
        this.stopVoiceRecording();
      };
    }
  }

  setupCharacterCounter() {
    const topicInput = document.getElementById("topicInput");
    if (topicInput) {
      topicInput.addEventListener("input", () => this.updateCharacterCount());
    }
  }

  updateCharacterCount() {
    const topicInput = document.getElementById("topicInput");
    const characterCount = document.querySelector(".character-count");
    if (!topicInput || !characterCount) return;
    const count = topicInput.value.length;
    characterCount.textContent = `${count} / 200`;
    if (count > 200) {
      characterCount.style.color = "#ef4444";
    } else if (count > 180) {
      characterCount.style.color = "#f59e0b";
    } else if (count > 150) {
      characterCount.style.color = "#3b82f6";
    } else {
      characterCount.style.color = "#9ca3af";
    }
  }

  selectOption(selectedCard) {
    document.querySelectorAll(".option-card").forEach((c) => c.classList.remove("active"));
    selectedCard.classList.add("active");
    const mode = selectedCard.dataset.mode || "ai";
    this.switchInputMode(mode);
    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) generateBtn.onclick = () => this.generatePresentation();
  }

  switchInputMode(mode) {
    const container = document.getElementById("dynamic-input-area");
    if (!container) return;
    container.innerHTML = "";

    if (mode === "ai") {
      container.innerHTML = `
        <div class="input-wrapper" data-mode="ai">
          <i class="fas fa-search input-icon"></i>
          <input 
            type="text" 
            placeholder="Describe your presentation topic (e.g., The future of AI)"
            class="topic-input"
            id="topicInput"
          >
          <button class="voice-btn" id="voiceBtn" title="Voice Input">
            <i class="fas fa-microphone"></i>
          </button>
        </div>
      `;
      document.getElementById("voiceBtn")?.addEventListener("click", () => this.toggleVoiceRecording());
      const topicInput = document.getElementById("topicInput");
      topicInput?.addEventListener("focus", () => this.onInputFocus());
      topicInput?.addEventListener("blur", () => this.onInputBlur());
      topicInput?.addEventListener("input", () => this.updateCharacterCount());
    } else if (mode === "upload") {
      container.innerHTML = `
        <div class="input-wrapper" data-mode="upload">
          <label class="file-upload-wrapper">
            <i class="fas fa-upload input-icon" style="left:8px;"></i>
            <input type="file" id="uploadFileInput" style="padding-left: 32px;" />
          </label>
        </div>
      `;
    } else if (mode === "paste") {
      container.innerHTML = `
        <div class="input-wrapper" data-mode="paste">
          <textarea id="pasteTextArea" placeholder="Paste your text here..." rows="3" style="width:100%; padding:12px; border-radius:8px; background: rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; resize: vertical;"></textarea>
        </div>
      `;
    } else if (mode === "links") {
      container.innerHTML = `
        <div class="input-wrapper" data-mode="links">
          <div id="links-container">
            <div class="link-row">
              <input type="text" placeholder="Add link..." class="link-input" />
              <button class="add-link-btn" title="Add more">+</button>
            </div>
          </div>
          <div class="links-hint" style="margin-top:6px; font-size:0.75rem; color:#9ca3af;">Up to 5 links</div>
        </div>
      `;
      this.bindLinkControls();
    } else if (mode === "text") {
      container.innerHTML = `
        <div class="text-mode-tabs">
          <div class="tab-buttons">
            <button class="text-tab active" data-sub="upload">Upload File</button>
            <button class="text-tab" data-sub="paste">Paste Text</button>
            <button class="text-tab" data-sub="links">Custom Links</button>
          </div>
          <div class="text-mode-content" id="text-mode-content">
            <div class="submode" data-sub="upload">
              <label class="file-upload-wrapper">
                <i class="fas fa-upload input-icon" style="left:8px;"></i>
                <input type="file" id="uploadFileInput" style="padding-left: 32px;" />
              </label>
            </div>
            <div class="submode" data-sub="paste" style="display:none;">
              <textarea id="pasteTextArea" placeholder="Paste your text here..." rows="3" style="width:100%; padding:12px; border-radius:8px; background: rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; resize: vertical;"></textarea>
            </div>
            <div class="submode" data-sub="links" style="display:none;">
              <div id="links-container">
                <div class="link-row">
                  <input type="text" placeholder="Add link..." class="link-input" />
                  <button class="add-link-btn" title="Add more">+</button>
                </div>
              </div>
              <div class="links-hint" style="margin-top:6px; font-size:0.75rem; color:#9ca3af;">Up to 5 links</div>
            </div>
          </div>
        </div>
      `;
      document.querySelectorAll(".text-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".text-tab").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const sub = btn.dataset.sub;
          document.querySelectorAll(".submode").forEach((sm) => {
            sm.style.display = sm.dataset.sub === sub ? "" : "none";
          });
          if (sub === "links") {
            this.bindLinkControls();
          }
        });
      });
    }
  }

  bindLinkControls() {
    const linksContainer = document.getElementById("links-container");
    if (!linksContainer) return;

    const updateButtons = () => {
      const rows = Array.from(linksContainer.querySelectorAll(".link-row"));
      rows.forEach((row, idx) => {
        const addBtn = row.querySelector(".add-link-btn");
        if (!addBtn) return;
        if (idx === rows.length - 1 && rows.length < 5) {
          addBtn.textContent = "+";
          addBtn.title = "Add more";
        } else {
          addBtn.textContent = "×";
          addBtn.title = "Remove";
        }
      });
    };

    updateButtons();

    linksContainer.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("add-link-btn")) {
        const currentRows = linksContainer.querySelectorAll(".link-row");
        const parentRow = target.closest(".link-row");
        if (!parentRow) return;

        if (target.textContent === "+" && currentRows.length < 5) {
          const newRow = document.createElement("div");
          newRow.className = "link-row";
          newRow.innerHTML = `
            <input type="text" placeholder="Add link..." class="link-input" />
            <button class="add-link-btn" title="Remove">×</button>
          `;
          linksContainer.appendChild(newRow);
          updateButtons();
        } else if (target.textContent === "×") {
          if (currentRows.length > 1) {
            parentRow.remove();
            updateButtons();
          }
        }
      }
    });
  }

  generatePresentation() {
    const modeCard = document.querySelector(".option-card.active");
    const mode = modeCard?.dataset.mode || "ai";
    let topic = "";
    let extraInfo = "";

    if (mode === "ai") {
      const topicInput = document.getElementById("topicInput");
      topic = topicInput?.value.trim() || "";
      if (!topic) {
        this.showNotification("Please enter a presentation topic", "error");
        topicInput?.focus();
        return;
      }
      if (topic.length > 200) {
        this.showNotification("Topic is too long. Please keep it under 150 characters.", "error");
        return;
      }
    } else if (mode === "upload") {
      const fileInput = document.getElementById("uploadFileInput");
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        this.showNotification("Please select a file to upload", "error");
        return;
      }
      extraInfo = fileInput.files[0].name;
      topic = `Upload: ${extraInfo}`;
    } else if (mode === "paste") {
      const pasted = document.getElementById("pasteTextArea")?.value.trim();
      if (!pasted) {
        this.showNotification("Please paste some text", "error");
        return;
      }
      extraInfo = `"${pasted.slice(0, 30)}..."`;
      topic = pasted;
    } else if (mode === "links") {
      const links = Array.from(document.querySelectorAll(".link-input"))
        .map((i) => i.value.trim())
        .filter((v) => v);
      if (links.length === 0) {
        this.showNotification("Please add at least one link", "error");
        return;
      }
      extraInfo = links.join(", ");
      topic = `Links: ${links[0]}`;
    } else if (mode === "text") {
      const activeSub = document.querySelector(".text-mode-tabs .submode:not([style*='display: none'])");
      if (!activeSub) return;
      const sub = activeSub.dataset.sub;
      if (sub === "upload") {
        const fileInput = document.getElementById("uploadFileInput");
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          this.showNotification("Please select a file to upload", "error");
          return;
        }
        extraInfo = fileInput.files[0].name;
        topic = `Upload: ${extraInfo}`;
      } else if (sub === "paste") {
        const pasted = document.getElementById("pasteTextArea")?.value.trim();
        if (!pasted) {
          this.showNotification("Please paste some text", "error");
          return;
        }
        extraInfo = `"${pasted.slice(0, 30)}..."`;
        topic = pasted;
      } else if (sub === "links") {
        const links = Array.from(document.querySelectorAll(".link-input"))
          .map((i) => i.value.trim())
          .filter((v) => v);
        if (links.length === 0) {
          this.showNotification("Please add at least one link", "error");
          return;
        }
        extraInfo = links.join(", ");
        topic = `Links: ${links[0]}`;
      }
    }

    const slidesChoice = document.querySelector(".slides-control")?.dataset.selected || "7 slides";
    const languageChoice = document.querySelector(".language-control")?.dataset.selected || "English";

    const generateBtn = document.getElementById("generateBtn");
    const originalText = (generateBtn?.innerHTML) || "Generate";

    if (generateBtn) {
      generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
      generateBtn.disabled = true;
    }

    setTimeout(() => {
      if (generateBtn) {
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
      }
      this.showNotification(
        `Generated (${mode.toUpperCase()}) presentation: ${slidesChoice}, ${languageChoice}`,
        "success"
      );
      if (mode === "ai") {
        const topicInput = document.getElementById("topicInput");
        if (topicInput) topicInput.value = "";
        this.updateCharacterCount();
      }
    }, 1500);
  }

  openPresentation(card) {
    const title = card.querySelector("h3")?.textContent || "";
    card.style.transform = "scale(0.98)";
    setTimeout(() => {
      card.style.transform = "";
    }, 150);
    this.showNotification(`Opening "${title}"...`, "info");
  }

  generateSimilar(btn) {
    const card = btn.closest(".presentation-card");
    const title = card?.querySelector("h3")?.textContent || "";
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = "Generate";
      btn.disabled = false;
      this.showNotification(`Generated similar presentation to "${title}"`, "success");
    }, 2000);
  }

  onInputFocus() {
    const inputWrapper = document.querySelector(".input-wrapper");
    if (inputWrapper) inputWrapper.classList.add("focused");
  }

  onInputBlur() {
    const inputWrapper = document.querySelector(".input-wrapper");
    if (inputWrapper) inputWrapper.classList.remove("focused");
  }

  populateSlidePreviews() {
    document.querySelectorAll(".presentation-card").forEach((card) => {
      const slidesData = card.dataset.slides;
      if (!slidesData) return;
      const slides = JSON.parse(slidesData);
      const listEl = card.querySelector(".preview-list");
      if (!listEl) return;
      listEl.innerHTML = "";
      const fragment = document.createDocumentFragment();
      slides.forEach((title) => {
        const li = document.createElement("li");
        li.textContent = title;
        fragment.appendChild(li);
      });
      listEl.appendChild(fragment);
    });
  }

  setupDropdowns() {
    document.querySelectorAll(".custom-dropdown").forEach((drop) => {
      const selected = drop.querySelector(".selected");
      const options = drop.querySelector(".options");
      const labelSpan = selected.querySelector(".label");

      selected.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".custom-dropdown").forEach((d) => {
          if (d !== drop) d.classList.remove("open");
        });
        drop.classList.toggle("open");
      });

      options.querySelectorAll("li").forEach((opt) => {
        opt.addEventListener("click", () => {
          const value = opt.dataset.value;
          labelSpan.textContent = value;
          options.querySelectorAll("li").forEach((li) => li.classList.remove("active"));
          opt.classList.add("active");
          drop.classList.remove("open");
          drop.dataset.selected = value;
        });
      });
    });

    document.addEventListener("click", () => {
      document.querySelectorAll(".custom-dropdown").forEach((d) => d.classList.remove("open"));
    });
  }

  renderExampleCards() {
    const examplePrompts = [
      { title: "Startup Pitch", prompt: "Create a pitch deck for an AI startup." },
      { title: "Marketing Strategy", prompt: "Develop a social media plan for a new product." },
      { title: "Lesson Plan", prompt: "Explain photosynthesis to high school students." },
      { title: "Sales Slide", prompt: "Present quarterly growth in a visually appealing way." },
      { title: "User Guide", prompt: "Write steps for onboarding new users to a mobile app." },
      { title: "Investor Report", prompt: "Summarize financial metrics in a clear report." },
      { title: "Product Launch", prompt: "Outline a launch plan for a new tech gadget." },
      { title: "Event Recap", prompt: "Create a summary of a recent tech conference." },
      { title: "Research Findings", prompt: "Present key findings from a market research study." },
      { title: "Training Module", prompt: "Design a training module for new employees." },
      { title: "Customer Feedback", prompt: "Analyze customer feedback and suggest improvements." },
      { title: "Brand Story", prompt: "Craft a compelling brand story for a fashion label." },
      { title: "Health Awareness", prompt: "Create a presentation on the importance of mental health." },
      { title: "Sustainability Report", prompt: "Summarize sustainability efforts of a company." },
      { title: "Tech Trends", prompt: "Discuss emerging trends in artificial intelligence." },
      { title: "Crisis Management", prompt: "Outline steps for managing a PR crisis." },
      { title: "Community Engagement", prompt: "Plan a community outreach program for a non-profit." },
      { title: "E-commerce Strategy", prompt: "Develop a strategy to boost online sales." },
      { title: "Content Calendar", prompt: "Create a content calendar for a blog." },
      { title: "Product Comparison", prompt: "Compare two competing products in a market." },
      { title: "Financial Analysis", prompt: "Analyze the financial performance of a company." },
      { title: "Travel Itinerary", prompt: "Plan a travel itinerary for a business trip." },
      { title: "Cultural Presentation", prompt: "Present cultural differences in global business." },
      
    ];

    const container = document.getElementById("examples-container");
    if (!container) return;
    container.innerHTML = "";
    const shuffled = [...examplePrompts].sort(() => 0.5 - Math.random()).slice(0, 3);

    shuffled.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "example-card";
      card.style.borderLeftColor = ["#368ef3ff", "#00ffc8ff", "#f5a623"][i % 3];

      card.innerHTML = `
        <div class="example-card-top">
          <div class="example-text">
            <h3>${item.title}</h3>
            <p>${item.prompt}</p>
          </div>
          <button class="use-prompt-btn" aria-label="Use prompt">+</button>
        </div>
      `;

      card.querySelector(".use-prompt-btn")?.addEventListener("click", () => {
        const activeCard = document.querySelector(".option-card.active");
        const mode = activeCard?.dataset.mode || "ai";
        if (mode === "paste") {
          const ta = document.getElementById("pasteTextArea");
          if (ta) ta.value = item.prompt;
        } else if (mode === "ai") {
          const topicInput = document.getElementById("topicInput");
          if (topicInput) {
            topicInput.value = item.prompt;
            this.updateCharacterCount();
          }
        }
      });

      container.appendChild(card);
    });
  }

  showNotification(message, type = "info") {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform .3s ease;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    `;
    const content = notification.querySelector(".notification-content");
    content.style.cssText = `
      display:flex;
      align-items:center;
      gap:0.75rem;
      font-weight:500;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 300);
    }, 4000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
    };
    return icons[type] || icons.info;
  }

  getNotificationColor(type) {
    const colors = {
      success: "linear-gradient(135deg, #10b981, #059669)",
      error: "linear-gradient(135deg, #ef4444, #dc2626)",
      info: "linear-gradient(135deg, #3b82f6, #2563eb)",
      warning: "linear-gradient(135deg, #f59e0b, #d97706)",
    };
    return colors[type] || colors.info;
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  new PowerPresentDashboard();

  // Tilt effect
  const cards = document.querySelectorAll(".presentation-card, .option-card");
  cards.forEach((card) => {
    card.style.transition += ", transform 0.2s ease";
  });

  let raf = null;
  document.addEventListener("mousemove", (e) => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 15;
          const rotateY = (centerX - x) / 15;
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
        } else {
          card.style.transform = "";
        }
      });
    });
  });

  // Scroll animations
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document.querySelectorAll(".presentation-card, .option-card").forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
  });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();
});
