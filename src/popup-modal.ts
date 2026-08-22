/**
 * Auto Pop-up Inquiry Modal for Shyam Packers & Movers
 * Handles:
 * - Auto-display on page load (unless already submitted)
 * - Persistent state in localStorage
 * - Custom Bootstrap-style form validation (without external libraries)
 * - Dual submission: WhatsApp with dynamic device URL & Google Sheets via Apps Script
 * - In-place success screen with "Fill Again" option
 */

// Configure Google Apps Script Web App URL from environment or direct fallback
export const GOOGLE_SHEET_APPSCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string;

// Official WhatsApp Phone Number & Company Name
const WHATSAPP_PHONE = "919824252470";
const COMPANY_NAME = "Shyam Packers & Movers";
const STORAGE_KEY = "shyam_inquiry_form_submitted";


/**
 * Returns dynamic WhatsApp URL based on user device and screen width
 */
export function getWhatsAppBaseUrl(): string {
  const isMobile =/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  return isMobile
    ? "https://api.whatsapp.com/send"
    : "https://web.whatsapp.com/send";
}

/**
 * Injects modal HTML markup into DOM if not already present
 */
function injectModalMarkup(): void {
  if (document.getElementById("leadPopupModal")) return;

  const today = new Date().toISOString().split("T")[0];

  const modalHtml = `
    <div id="leadPopupModal" class="popup-modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="popupModalTitle">
      <div class="popup-modal-backdrop" id="popupModalBackdrop"></div>
      
      <div class="popup-modal-container">
        <div class="popup-modal-card glass-modal">
          
          <!-- Close Button -->
          <button type="button" id="closePopupModalBtn" class="popup-modal-close" aria-label="Close inquiry form">
            <svg class="w-5 h-5 text-slate-500 hover:text-slate-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Top Brand Badge -->
          <div class="popup-modal-header text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider uppercase mb-2">
              <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Fast & Free Estimate
            </div>
            <h3 id="popupModalTitle" class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Get an Instant Moving Quote
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              Fill in your shifting details below and our team will get in touch with best rates!
            </p>
          </div>

          <!-- Form View -->
          <form id="popupInquiryForm" class="popup-form-body mt-4" novalidate>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <!-- Full Name -->
              <div class="form-group">
                <label for="popup_name" class="popup-label">Full Name <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="text" id="popup_name" name="name" required minlength="3" placeholder="e.g. Rahul Sharma" class="popup-input" />
                </div>
                <div class="invalid-feedback">Please enter your name (min 3 characters).</div>
              </div>

              <!-- Mobile Number -->
              <div class="form-group">
                <label for="popup_phone" class="popup-label">Mobile Number <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="tel" id="popup_phone" name="phone" required placeholder="10-digit mobile number" maxlength="14" class="popup-input" />
                </div>
                <div class="invalid-feedback">Please enter a valid 10-digit mobile number.</div>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="popup_email" class="popup-label">Email Address <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input type="email" id="popup_email" name="email" required placeholder="name@example.com" class="popup-input" />
                </div>
                <div class="invalid-feedback">Please enter a valid email address.</div>
              </div>

              <!-- Service Type -->
              <div class="form-group">
                <label for="popup_service" class="popup-label">Select Service <span class="text-red-500">*</span></label>
                <select id="popup_service" name="service" required class="popup-input">
                  <option value="" disabled selected>-- Choose Service --</option>
                  <option value="Household Shifting">Household Shifting</option>
                  <option value="Office & Corporate Relocation">Office & Corporate Relocation</option>
                  <option value="Car & Vehicle Transport">Car & Vehicle Transport</option>
                  <option value="Packing & Unpacking">Packing & Unpacking</option>
                  <option value="Loading & Unloading">Loading & Unloading</option>
                  <option value="Warehousing & Storage">Warehousing & Storage</option>
                  <option value="Local Relocation (Vadodara)">Local Relocation (Vadodara)</option>
                  <option value="Domestic All-India Relocation">Domestic All-India Relocation</option>
                </select>
                <div class="invalid-feedback">Please select a moving service.</div>
              </div>

              <!-- Moving From -->
              <div class="form-group">
                <label for="popup_from" class="popup-label">Moving From (City / Area) <span class="text-red-500">*</span></label>
                <input type="text" id="popup_from" name="movingFrom" required minlength="2" placeholder="e.g. Vadodara, Gujarat" class="popup-input" />
                <div class="invalid-feedback">Please enter pickup city or area.</div>
              </div>

              <!-- Moving To -->
              <div class="form-group">
                <label for="popup_to" class="popup-label">Moving To (City / Area) <span class="text-red-500">*</span></label>
                <input type="text" id="popup_to" name="movingTo" required minlength="2" placeholder="e.g. Ahmedabad / Mumbai" class="popup-input" />
                <div class="invalid-feedback">Please enter destination city or area.</div>
              </div>

              <!-- Moving Date -->
              <div class="form-group sm:col-span-2">
                <label for="popup_date" class="popup-label">Preferred Moving Date <span class="text-red-500">*</span></label>
                <input type="date" id="popup_date" name="moveDate" required min="${today}" class="popup-input" />
                <div class="invalid-feedback">Please select an upcoming moving date.</div>
              </div>

              <!-- Message / Remarks -->
              <div class="form-group sm:col-span-2">
                <label for="popup_message" class="popup-label">Message / Items Description (Optional)</label>
                <textarea id="popup_message" name="message" rows="2" placeholder="Tell us about your 1BHK/2BHK, fragile items, preferred timing, etc." class="popup-input popup-textarea"></textarea>
              </div>

              <!-- Agree Checkbox -->
              <div class="form-group sm:col-span-2">
                <label class="popup-checkbox-label">
                  <input type="checkbox" id="popup_agree" name="agree" required class="popup-checkbox" />
                  <span class="text-xs text-slate-600 leading-snug">
                    I agree to be contacted via WhatsApp / Phone / Email for this relocation quote as per the <a href="privacy-policy.html" target="_blank" class="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>.
                  </span>
                </label>
                <div class="invalid-feedback">You must agree before submitting.</div>
              </div>

            </div>

            <!-- Submit Button -->
            <div class="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <button type="submit" id="popupSubmitBtn" class="popup-btn-submit w-full group">
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.227-.557-1.785-.737-2.909-2.545-2.997-2.663-.088-.118-.72-1.042-.72-2.025 0-.983.513-1.467.695-1.667.182-.2.397-.25.53-.25.133 0 .265.003.382.008.123.006.288-.047.45.342.167.4.57 1.39.62 1.492.05.102.083.222.016.355-.067.133-.1.216-.2.333-.1.117-.21.262-.3.351-.1.1-.205.209-.089.409.117.2.52 1.002 1.116 1.533.768.685 1.416.897 1.616.997.2.1.316.084.433-.05.117-.134.5-.584.633-.784.133-.2.267-.167.45-.1.183.067 1.166.55 1.366.65.2.1.333.15.383.234.05.083.05.483-.094.888z"/>
                  </svg>
                  <span>Submit & Send to WhatsApp</span>
                </span>
              </button>
            </div>

            <p class="text-[11px] text-center text-slate-400 mt-2.5 flex items-center justify-center gap-1">
              <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              100% Privacy Protected • Instant Response
            </p>
          </form>

          <!-- Success Screen (Shown in place of form after submit) -->
          <div id="popupSuccessState" class="popup-success-card hidden text-center py-6 px-4">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-8 ring-emerald-50">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h4 class="text-2xl font-black text-slate-900 mb-2">Form Submitted Successfully!</h4>
            <p class="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              Thank you! Your quote request has been recorded and pre-filled in WhatsApp. Our relocation expert will get back to you shortly.
            </p>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" id="popupFillAgainBtn" class="popup-btn-outline w-full sm:w-auto">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Fill Another Inquiry
              </button>
              
              <button type="button" id="popupCloseSuccessBtn" class="popup-btn-secondary w-full sm:w-auto">
                Done & Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

/**
 * Initializes modal interactions, validations, and auto-open timer
 */
export function initLeadPopupModal(): void {
  // Inject HTML markup
  injectModalMarkup();

  const modal = document.getElementById("leadPopupModal");
  if (!modal) return;

  const backdrop = document.getElementById("popupModalBackdrop");
  const closeBtn = document.getElementById("closePopupModalBtn");
  const closeSuccessBtn = document.getElementById("popupCloseSuccessBtn");
  const fillAgainBtn = document.getElementById("popupFillAgainBtn");
  const form = document.getElementById("popupInquiryForm") as HTMLFormElement | null;
  const successState = document.getElementById("popupSuccessState");

  if (!form) return;

  function openModal(): void {
    if (!modal) return;
    modal.classList.remove("hidden");
    requestAnimationFrame(() => {
      modal.classList.add("open");
      document.body.classList.add("modal-open");
    });
  }

  function closeModal(): void {
    if (!modal) return;
    modal.classList.remove("open");
    setTimeout(() => {
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    }, 300);
  }

  // Bind close triggers
  closeBtn?.addEventListener("click", closeModal);
  closeSuccessBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Realtime Input Validations
  const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea");
  
  function validateField(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
    let isValid = true;
    const name = input.name;
    const val = input.value.trim();

    if (input.required) {
      if (input.type === "checkbox") {
        isValid = (input as HTMLInputElement).checked;
      } else if (!val) {
        isValid = false;
      }
    }

    if (isValid && (name === "phone" || input.type === "tel")) {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 10) {
        isValid = false;
        input.setCustomValidity("Must be at least 10 digits");
      } else {
        input.setCustomValidity("");
      }
    } else if (isValid && input.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        isValid = false;
        input.setCustomValidity("Invalid email address");
      } else {
        input.setCustomValidity("");
      }
    } else if (isValid && (name === "name" || name === "movingFrom" || name === "movingTo")) {
      const minLen = parseInt(input.getAttribute("minlength") || "2", 10);
      if (val.length < minLen) {
        isValid = false;
        input.setCustomValidity(`Must be at least ${minLen} characters`);
      } else {
        input.setCustomValidity("");
      }
    }

    if (form?.classList.contains("was-validated")) {
      if (isValid) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
      } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
      }
    }

    return isValid;
  }

  inputs.forEach((input) => {
    input.addEventListener("input", () => validateField(input));
    input.addEventListener("change", () => validateField(input));
    input.addEventListener("blur", () => {
      if (form.classList.contains("was-validated")) {
        validateField(input);
      }
    });
  });

  // Form Submit Handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let allValid = true;
    inputs.forEach((input) => {
      const fieldValid = validateField(input);
      if (!fieldValid) allValid = false;
    });

    if (!allValid || !form.checkValidity()) {
      form.classList.add("was-validated");
      const firstInvalid = form.querySelector<HTMLElement>(".is-invalid, :invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Extract Form Values
    const name = (form.querySelector<HTMLInputElement>('[name="name"]')?.value || "").trim();
    const phone = (form.querySelector<HTMLInputElement>('[name="phone"]')?.value || "").trim();
    const email = (form.querySelector<HTMLInputElement>('[name="email"]')?.value || "").trim();
    const service = (form.querySelector<HTMLSelectElement>('[name="service"]')?.value || "General Relocation").trim();
    const movingFrom = (form.querySelector<HTMLInputElement>('[name="movingFrom"]')?.value || "").trim();
    const movingTo = (form.querySelector<HTMLInputElement>('[name="movingTo"]')?.value || "").trim();
    const moveDate = (form.querySelector<HTMLInputElement>('[name="moveDate"]')?.value || "").trim();
    const message = (form.querySelector<HTMLTextAreaElement>('[name="message"]')?.value || "").trim();

    const payload = {
      name,
      phone,
      email,
      service,
      movingFrom,
      movingTo,
      moveDate,
      message,
      pageUrl: window.location.href,
      submittedAt: new Date().toISOString(),
    };

    // 1. Mark as submitted in localStorage for long-term suppression
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // LocalStorage fallback if disabled in private mode
    }

    // 2. Submit to Google Sheets via Google Apps Script and wait for completion
    if (GOOGLE_SHEET_APPSCRIPT_URL && !GOOGLE_SHEET_APPSCRIPT_URL.includes("placeholder")) {
      try {
        await fetch(GOOGLE_SHEET_APPSCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Google Apps Script error:", err);
      }
    }

    // 3. Format WhatsApp Message & Open Dynamic URL
    let waText = `📦 *New Quote Request via Website Pop-up*\n\n`;
    waText += `*Name:* ${name}\n`;
    waText += `*Phone:* ${phone}\n`;
    waText += `*Email:* ${email}\n`;
    waText += `*Service:* ${service}\n`;
    waText += `*Moving From:* ${movingFrom}\n`;
    waText += `*Moving To:* ${movingTo}\n`;
    waText += `*Moving Date:* ${moveDate}\n`;
    if (message) waText += `*Details/Items:* ${message}\n`;
    waText += `\n_Sent via ${COMPANY_NAME} Pop-up Form_`;

    const encodedText = encodeURIComponent(waText);
    const waBaseUrl = getWhatsAppBaseUrl();
    const fullWaUrl = `${waBaseUrl}?phone=${WHATSAPP_PHONE}&text=${encodedText}`;

    // 4. Clear Form & Show In-place Success Screen
    form.reset();
    form.classList.remove("was-validated");
    inputs.forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
    });

    form.classList.add("hidden");
    successState?.classList.remove("hidden");

    // Open WhatsApp in new tab after a brief delay
    setTimeout(() => {
      window.open(fullWaUrl, "_blank");
    }, 600);
  });

  // "Fill Again" Handler: Reset view to allow filling another quote
  fillAgainBtn?.addEventListener("click", () => {
    successState?.classList.add("hidden");
    form.classList.remove("hidden");
    form.reset();
    form.classList.remove("was-validated");
    inputs.forEach((input) => {
      input.classList.remove("is-valid", "is-invalid");
    });
    const firstInput = form.querySelector<HTMLInputElement>('[name="name"]');
    if (firstInput) firstInput.focus();
  });

  // 5. Auto-open logic: Check if user already submitted
  try {
    const hasSubmitted = localStorage.getItem(STORAGE_KEY);
    if (hasSubmitted !== "true") {
      // Open once on every page reload/visit until user actually submits the form
      setTimeout(() => {
        openModal();
      }, 700);
    }
  } catch {
    // If localStorage not accessible, open by default
    setTimeout(() => {
      openModal();
    }, 700);
  }
}

