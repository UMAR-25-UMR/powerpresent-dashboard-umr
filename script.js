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
    this.setupDropdowns(); // initialize dropdown logic
  }

  setupEventListeners() {
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', () => this.generatePresentation());

    const optionCards = document.querySelectorAll('.option-card');
    optionCards.forEach(card => {
      card.addEventListener('click', () => this.selectOption(card));
    });

    const presentationCards = document.querySelectorAll('.presentation-card');
    presentationCards.forEach(card => {
      card.addEventListener('click', () => this.openPresentation(card));
    });

    const generateSimilarBtns = document.querySelectorAll('.generate-similar-btn');
    generateSimilarBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.generateSimilar(btn);
      });
    });

    const topicInput = document.getElementById('topicInput');
    topicInput.addEventListener('focus', () => this.onInputFocus());
    topicInput.addEventListener('blur', () => this.onInputBlur());
  }

  setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        console.log('Voice recognition started');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const topicInput = document.getElementById('topicInput');
        topicInput.value = transcript;
        this.updateCharacterCount();
        this.stopVoiceRecording();
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.stopVoiceRecording();
      };

      this.recognition.onend = () => {
        this.stopVoiceRecording();
      };
    }
  }

  setupCharacterCounter() {
    const topicInput = document.getElementById('topicInput');
    topicInput.addEventListener('input', () => this.updateCharacterCount());
  }

  updateCharacterCount() {
    const topicInput = document.getElementById('topicInput');
    const characterCount = document.querySelector('.character-count');
    const count = topicInput.value.length;
    characterCount.textContent = `${count} / 200`;

    if (count > 200) {
      characterCount.style.color = '#ef4444';
    } else if (count > 180) {
      characterCount.style.color = '#f59e0b';
    } else if (count > 150) {
      characterCount.style.color = '#3b82f6';
    } 
    else {
      characterCount.style.color = '#9ca3af';
    }
  }

  toggleVoiceRecording() {
    if (!this.recognition) {
      this.showNotification('Speech recognition not supported in this browser', 'error');
      return;
    }

    if (this.isRecording) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }

  startVoiceRecording() {
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.add('recording');
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    this.isRecording = true;

    try {
      this.recognition.start();
      this.showNotification('Listening... Speak now', 'info');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.stopVoiceRecording();
    }
  }

  stopVoiceRecording() {
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.remove('recording');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    this.isRecording = false;

    if (this.recognition) {
      this.recognition.stop();
    }
  }

  selectOption(selectedCard) {
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('active');
    });
    selectedCard.classList.add('active');
    selectedCard.style.transform = 'scale(0.95)';
    setTimeout(() => {
      selectedCard.style.transform = '';
    }, 150);
  }

  generatePresentation() {
    const topicInput = document.getElementById('topicInput');
    const topic = topicInput.value.trim();

    if (!topic) {
      this.showNotification('Please enter a presentation topic', 'error');
      topicInput.focus();
      return;
    }

    if (topic.length > 150) {
      this.showNotification('Topic is too long. Please keep it under 150 characters.', 'error');
      return;
    }

    // Read dropdown selections (fallback to defaults)
    const slidesChoice = document.querySelector('.slides-control')?.dataset.selected || '7 slides';
    const languageChoice = document.querySelector('.language-control')?.dataset.selected || 'English';

    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.innerHTML;

    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;

    setTimeout(() => {
      generateBtn.innerHTML = originalText;
      generateBtn.disabled = false;
      this.showNotification(
        `Presentation generated (${slidesChoice}, ${languageChoice}) successfully!`,
        'success'
      );
      topicInput.value = '';
      this.updateCharacterCount();
    }, 3000);
  }

  openPresentation(card) {
    const title = card.querySelector('h3').textContent;
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
    this.showNotification(`Opening "${title}"...`, 'info');
    setTimeout(() => {
      console.log(`Opening presentation: ${title}`);
    }, 1000);
  }

  generateSimilar(btn) {
    const card = btn.closest('.presentation-card');
    const title = card.querySelector('h3').textContent;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = 'Generate';
      btn.disabled = false;
      this.showNotification(`Generated similar presentation to "${title}"`, 'success');
    }, 2000);
  }

  onInputFocus() {
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.style.transform = 'scale(1.02)';
    inputWrapper.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.2)';
  }

  onInputBlur() {
    const inputWrapper = document.querySelector('.input-wrapper');
    inputWrapper.style.transform = '';
    inputWrapper.style.boxShadow = '';
  }

  populateSlidePreviews() {
    document.querySelectorAll('.presentation-card').forEach(card => {
      const slidesData = card.dataset.slides;
      if (!slidesData) return;
      const slides = JSON.parse(slidesData);
      const listEl = card.querySelector('.preview-list');
      if (!listEl) return;
      slides.forEach(title => {
        const li = document.createElement('li');
        li.textContent = title;
        listEl.appendChild(li);
      });
    });
  }

  setupDropdowns() {
    // dropdown logic (slides & language)
    document.querySelectorAll('.custom-dropdown').forEach(drop => {
      const selected = drop.querySelector('.selected');
      const options = drop.querySelector('.options');
      const labelSpan = selected.querySelector('.label');

      selected.addEventListener('click', (e) => {
        e.stopPropagation();
        // close others
        document.querySelectorAll('.custom-dropdown').forEach(d => {
          if (d !== drop) d.classList.remove('open');
        });
        drop.classList.toggle('open');
      });

      options.querySelectorAll('li').forEach(opt => {
        opt.addEventListener('click', (e) => {
          const value = opt.dataset.value;
          labelSpan.textContent = value;

          options.querySelectorAll('li').forEach(li => li.classList.remove('active'));
          opt.classList.add('active');

          drop.classList.remove('open');
          drop.dataset.selected = value;
        });
      });
    });

    // close dropdowns on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
    });
  }

  showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
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
      transition: transform 0.3s ease;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1);
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
      display:flex;
      align-items:center;
      gap:0.75rem;
      font-weight:500;
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) notification.remove();
      }, 300);
    }, 4000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };
    return icons[type] || icons.info;
  }

  getNotificationColor(type) {
    const colors = {
      success: 'linear-gradient(135deg, #10b981, #059669)',
      error: 'linear-gradient(135deg, #ef4444, #dc2626)',
      info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };
    return colors[type] || colors.info;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new PowerPresentDashboard();

  // Hover tilt effect
  const cards = document.querySelectorAll('.presentation-card, .option-card');
  cards.forEach(card => {
    card.style.transition += ', transform 0.2s ease';
  });

  document.addEventListener('mousemove', (e) => {
    cards.forEach(card => {
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
        card.style.transform = '';
      }
    });
  });

  // Scroll animation
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.presentation-card, .option-card');
  animatedElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(el);
  });
});

// SHUFFLE CARDS LOGIC

const examplePrompts = [
  { title: "Startup Pitch", prompt: "Create a pitch deck for an AI startup." },
  { title: "Marketing Strategy", prompt: "Develop a social media plan for a new product." },
  { title: "Lesson Plan", prompt: "Explain photosynthesis to high school students." },
  { title: "Sales Slide", prompt: "Present quarterly growth in a visually appealing way." },
  { title: "User Guide", prompt: "Write steps for onboarding new users to a mobile app." },
  { title: "Investor Report", prompt: "Summarize financial metrics in a clear report." },
];

function renderExampleCards() {
  const container = document.getElementById('examples-container');
  container.innerHTML = '';
  const shuffled = examplePrompts.sort(() => 0.5 - Math.random()).slice(0, 3);

  shuffled.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.style.borderLeftColor = ['#4a90e2', '#50e3c2', '#f5a623'][i % 3]; // colorful border

    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.prompt}</p>
      <button class="add-btn">+</button>
    `;

    card.querySelector('.add-btn').addEventListener('click', () => {
      document.querySelector('#topicInput').value = item.prompt; // plus + button
    });

    container.appendChild(card);
  });
}

// Shuffle button
document.getElementById('shuffle-btn').addEventListener('click', renderExampleCards);

// Initial render
renderExampleCards();


