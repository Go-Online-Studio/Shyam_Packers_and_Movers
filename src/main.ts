import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination, FreeMode } from 'swiper/modules';
import { initLeadPopupModal } from './popup-modal';

function initApp() {
  // Initialize Auto-lead popup modal on all pages
  initLeadPopupModal();


  // 1. Intersection Observer for Scroll Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const animClass = entry.target.getAttribute('data-animation') || 'slide-up-fade';
        entry.target.classList.add(animClass);
        const delay = entry.target.getAttribute('data-delay');
        if (delay) {
          (entry.target as HTMLElement).style.animationDelay = `${delay}ms`;
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elements = document.querySelectorAll('.observe-me');
  elements.forEach(el => observer.observe(el));

  // 1.5 Swiper Carousel Initializations
  const partnerSwiperEl = document.querySelector('.partner-swiper');
  if (partnerSwiperEl) {
    new Swiper('.partner-swiper', {
      modules: [Autoplay, FreeMode],
      slidesPerView: 'auto',
      spaceBetween: 24,
      loop: true,
      speed: 3500,
      freeMode: {
        enabled: true,
        momentum: false,
      },
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      allowTouchMove: true,
    });
  }

  const servicesSwiperEl = document.querySelector('.services-swiper');
  if (servicesSwiperEl) {
    new Swiper('.services-swiper', {
      modules: [Autoplay, Navigation, Pagination],
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.services-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.services-next',
        prevEl: '.services-prev',
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 28,
        },
      },
    });
  }

  // 2. Mobile Menu Toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 3. FAQ Accordion Logic
  const faqButtons = document.querySelectorAll('.faq-button');
  faqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const content = btn.nextElementSibling as HTMLElement;
      if (!content) return;
      
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      
      // Close all others
      document.querySelectorAll('.faq-content').forEach(c => {
        if (c !== content) {
          (c as HTMLElement).style.maxHeight = '0px';
          c.previousElementSibling?.setAttribute('aria-expanded', 'false');
          c.previousElementSibling?.querySelector('svg')?.classList.remove('rotate-180');
        }
      });

      // Toggle current
      if (isExpanded) {
        content.style.maxHeight = '0px';
        btn.setAttribute('aria-expanded', 'false');
        btn.querySelector('svg')?.classList.remove('rotate-180');
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        btn.setAttribute('aria-expanded', 'true');
        btn.querySelector('svg')?.classList.add('rotate-180');
      }
    });
  });

  // 4. WhatsApp & Contact Form Handling with Bootstrap-style Validation & Device Detection
  const phone = "919824252470";
  const companyName = "Shyam Packers & Movers";

  let resizeTimer: number | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {}, 300);
  });

  function getWhatsAppBaseUrl(): string {
    const a =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
        ? "https://api.whatsapp.com/send"
        : "https://web.whatsapp.com/send";
    return a;
  }

  function showToast(message: string) {
    const existing = document.querySelector(".wa-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "wa-toast";
    toast.innerHTML = `
      <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.227-.557-1.785-.737-2.909-2.545-2.997-2.663-.088-.118-.72-1.042-.72-2.025 0-.983.513-1.467.695-1.667.182-.2.397-.25.53-.25.133 0 .265.003.382.008.123.006.288-.047.45.342.167.4.57 1.39.62 1.492.05.102.083.222.016.355-.067.133-.1.216-.2.333-.1.117-.21.262-.3.351-.1.1-.205.209-.089.409.117.2.52 1.002 1.116 1.533.768.685 1.416.897 1.616.997.2.1.316.084.433-.05.117-.134.5-.584.633-.784.133-.2.267-.167.45-.1.183.067 1.166.55 1.366.65.2.1.333.15.383.234.05.083.05.483-.094.888z"/>
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  const forms = document.querySelectorAll<HTMLFormElement>(".whatsapp-quote-form, #contactForm, #quoteForm");
  forms.forEach(form => {
    // Realtime field validation feedback when touched
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
    inputs.forEach(input => {
      input.addEventListener("input", () => {
        if (input.getAttribute("name") === "phone" || input.type === "tel") {
          const val = input.value.trim();
          const digits = val.replace(/\D/g, "");
          if (val.length > 0 && digits.length < 10) {
            input.setCustomValidity("Please enter at least 10 digits.");
          } else {
            input.setCustomValidity("");
          }
        }

        if (form.classList.contains("was-validated")) {
          if (input.checkValidity()) {
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");
          } else {
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");
          }
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Check phone custom validity before submitting
      const phoneInput = form.querySelector<HTMLInputElement>('input[name="phone"]');
      if (phoneInput) {
        const digits = phoneInput.value.replace(/\D/g, "");
        if (digits.length < 10) {
          phoneInput.setCustomValidity("Please enter at least 10 digits.");
        } else {
          phoneInput.setCustomValidity("");
        }
      }

      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        const firstInvalid = form.querySelector<HTMLElement>(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const name = (form.querySelector<HTMLInputElement>('[name="name"]')?.value || "").trim();
      const phoneVal = (form.querySelector<HTMLInputElement>('[name="phone"]')?.value || "").trim();
      const service = (form.querySelector<HTMLSelectElement>('[name="service"]')?.value || form.querySelector<HTMLSelectElement>('[name="moveType"]')?.value || "General Relocation").trim();
      const movingFrom = (form.querySelector<HTMLInputElement>('[name="movingFrom"]')?.value || "").trim();
      const movingTo = (form.querySelector<HTMLInputElement>('[name="movingTo"]')?.value || "").trim();
      const moveDate = (form.querySelector<HTMLInputElement>('[name="moveDate"]')?.value || "").trim();
      const message = (form.querySelector<HTMLTextAreaElement>('[name="message"]')?.value || "").trim();

      let text = `📦 *New Relocation Quote Request*\n\n`;
      text += `*Name:* ${name}\n`;
      text += `*Phone:* ${phoneVal}\n`;
      text += `*Service:* ${service}\n`;
      if (movingFrom) text += `*Moving From:* ${movingFrom}\n`;
      if (movingTo) text += `*Moving To:* ${movingTo}\n`;
      if (moveDate) text += `*Preferred Date:* ${moveDate}\n`;
      if (message) text += `*Details/Message:* ${message}\n`;
      text += `\n_Sent from ${companyName} Website_`;

      const encoded = encodeURIComponent(text);
      const baseUrl = getWhatsAppBaseUrl();
      const fullUrl = `${baseUrl}?phone=${phone}&text=${encoded}`;

      // In-place Success Message replacement/display
      const formContainer = form.parentElement;
      const successBox = formContainer?.querySelector<HTMLElement>(".form-success-message");
      if (successBox) {
        form.classList.add("hidden");
        successBox.classList.remove("hidden");
      }

      showToast("Redirecting to WhatsApp with your quote request...");

      setTimeout(() => {
        window.open(fullUrl, "_blank");
      }, 800);

      form.reset();
      form.classList.remove("was-validated");
    });
  });

  // 5. Dynamic WhatsApp Service Inquiry Handler (Device adaptive with custom prefilled service message)
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".whatsapp-service-inquiry");
    if (!btn) return;

    e.preventDefault();
    const serviceName = btn.getAttribute("data-service") || "Relocation Services";
    const text = `📦 *New Service Inquiry*\n\nHello *${companyName}*,\nI am interested in your *${serviceName}* service and would like to get a free quote and details.\n\nPlease share pricing, availability, and process.\n\n_Sent via Website Services_`;
    const encoded = encodeURIComponent(text);
    const baseUrl = getWhatsAppBaseUrl();
    const fullUrl = `${baseUrl}?phone=${phone}&text=${encoded}`;

    showToast(`Connecting to WhatsApp for ${serviceName}...`);

    setTimeout(() => {
      window.open(fullUrl, "_blank");
    }, 400);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}




