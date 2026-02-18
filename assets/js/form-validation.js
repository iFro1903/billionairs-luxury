/**
 * BILLIONAIRS - Live Form Validation
 * Provides real-time validation feedback for all forms
 * 
 * Features:
 * - Live email format check
 * - Password strength meter
 * - Password match indicator
 * - Name minimum length
 * - Phone format validation
 * - Visual field status (valid/invalid/neutral)
 * - Inline error messages
 * - i18n support
 * 
 * @version 1.0.0
 * @date 2026-02-18
 */
(function() {
  'use strict';

  // === i18n Messages ===
  function getLang() {
    return document.documentElement.lang ||
           (window.i18n && window.i18n.currentLang) ||
           localStorage.getItem('selectedLanguage') || 'en';
  }

  const MESSAGES = {
    en: {
      email_invalid: 'Please enter a valid email address',
      email_valid: 'Valid email',
      pw_too_short: 'At least 8 characters required',
      pw_weak: 'Weak password',
      pw_fair: 'Fair password',
      pw_strong: 'Strong password',
      pw_very_strong: 'Very strong password',
      pw_match: 'Passwords match',
      pw_no_match: 'Passwords do not match',
      name_too_short: 'At least 2 characters required',
      name_valid: 'Looks good',
      phone_invalid: 'Please enter a valid phone number',
      phone_valid: 'Valid phone number',
      field_required: 'This field is required',
      terms_required: 'You must accept the terms'
    },
    de: {
      email_invalid: 'Bitte gib eine g\u00fcltige E-Mail-Adresse ein',
      email_valid: 'G\u00fcltige E-Mail',
      pw_too_short: 'Mindestens 8 Zeichen erforderlich',
      pw_weak: 'Schwaches Passwort',
      pw_fair: 'Mittleres Passwort',
      pw_strong: 'Starkes Passwort',
      pw_very_strong: 'Sehr starkes Passwort',
      pw_match: 'Passw\u00f6rter stimmen \u00fcberein',
      pw_no_match: 'Passw\u00f6rter stimmen nicht \u00fcberein',
      name_too_short: 'Mindestens 2 Zeichen erforderlich',
      name_valid: 'Sieht gut aus',
      phone_invalid: 'Bitte gib eine g\u00fcltige Telefonnummer ein',
      phone_valid: 'G\u00fcltige Nummer',
      field_required: 'Dieses Feld ist erforderlich',
      terms_required: 'Du musst die Bedingungen akzeptieren'
    },
    fr: {
      email_invalid: 'Veuillez entrer une adresse e-mail valide',
      email_valid: 'E-mail valide',
      pw_too_short: 'Au moins 8 caract\u00e8res requis',
      pw_weak: 'Mot de passe faible',
      pw_fair: 'Mot de passe moyen',
      pw_strong: 'Mot de passe fort',
      pw_very_strong: 'Mot de passe tr\u00e8s fort',
      pw_match: 'Les mots de passe correspondent',
      pw_no_match: 'Les mots de passe ne correspondent pas',
      name_too_short: 'Au moins 2 caract\u00e8res requis',
      name_valid: 'Bon',
      phone_invalid: 'Veuillez entrer un num\u00e9ro valide',
      phone_valid: 'Num\u00e9ro valide',
      field_required: 'Ce champ est obligatoire',
      terms_required: 'Vous devez accepter les conditions'
    },
    es: {
      email_invalid: 'Ingresa un correo electr\u00f3nico v\u00e1lido',
      email_valid: 'Correo v\u00e1lido',
      pw_too_short: 'M\u00ednimo 8 caracteres',
      pw_weak: 'Contrase\u00f1a d\u00e9bil',
      pw_fair: 'Contrase\u00f1a aceptable',
      pw_strong: 'Contrase\u00f1a fuerte',
      pw_very_strong: 'Contrase\u00f1a muy fuerte',
      pw_match: 'Las contrase\u00f1as coinciden',
      pw_no_match: 'Las contrase\u00f1as no coinciden',
      name_too_short: 'M\u00ednimo 2 caracteres',
      name_valid: 'Se ve bien',
      phone_invalid: 'Ingresa un n\u00famero v\u00e1lido',
      phone_valid: 'N\u00famero v\u00e1lido',
      field_required: 'Este campo es obligatorio',
      terms_required: 'Debes aceptar los t\u00e9rminos'
    },
    it: {
      email_invalid: 'Inserisci un indirizzo email valido',
      email_valid: 'Email valida',
      pw_too_short: 'Almeno 8 caratteri richiesti',
      pw_weak: 'Password debole',
      pw_fair: 'Password discreta',
      pw_strong: 'Password forte',
      pw_very_strong: 'Password molto forte',
      pw_match: 'Le password coincidono',
      pw_no_match: 'Le password non coincidono',
      name_too_short: 'Almeno 2 caratteri richiesti',
      name_valid: 'Ottimo',
      phone_invalid: 'Inserisci un numero valido',
      phone_valid: 'Numero valido',
      field_required: 'Questo campo \u00e8 obbligatorio',
      terms_required: 'Devi accettare i termini'
    }
  };

  function msg(key) {
    var lang = getLang();
    return (MESSAGES[lang] && MESSAGES[lang][key]) || MESSAGES.en[key] || '';
  }

  // === Validation Rules ===
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;

  function getPasswordStrength(pw) {
    if (!pw || pw.length < 8) return 0;
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    if (score <= 1) return 1; // weak
    if (score <= 2) return 2; // fair
    if (score <= 3) return 3; // strong
    return 4; // very strong
  }

  // === DOM Helpers ===

  function createFeedback(input) {
    // Don't create if already has feedback
    if (input.parentNode.querySelector('.lv-feedback')) return input.parentNode.querySelector('.lv-feedback');
    
    var fb = document.createElement('div');
    fb.className = 'lv-feedback';
    fb.setAttribute('aria-live', 'polite');
    fb.setAttribute('role', 'status');
    
    // Insert after input (or after password strength bar if present)
    var strengthBar = input.parentNode.querySelector('[id*="passwordStrengthBar"], [id*="StrengthBar"]');
    var reqDiv = input.parentNode.querySelector('.password-requirements');
    var insertAfter = strengthBar || reqDiv || input;
    
    if (insertAfter.nextSibling) {
      insertAfter.parentNode.insertBefore(fb, insertAfter.nextSibling);
    } else {
      insertAfter.parentNode.appendChild(fb);
    }
    return fb;
  }

  function setFieldState(input, state, message) {
    // state: 'valid' | 'invalid' | 'neutral'
    var group = input.closest('.form-group') || input.parentNode;
    
    group.classList.remove('lv-valid', 'lv-invalid', 'lv-neutral');
    input.classList.remove('lv-valid', 'lv-invalid', 'lv-neutral');
    
    if (state === 'valid') {
      group.classList.add('lv-valid');
      input.classList.add('lv-valid');
    } else if (state === 'invalid') {
      group.classList.add('lv-invalid');
      input.classList.add('lv-invalid');
    } else {
      group.classList.add('lv-neutral');
      input.classList.add('lv-neutral');
    }
    
    var fb = createFeedback(input);
    if (message) {
      fb.textContent = message;
      fb.className = 'lv-feedback lv-feedback--' + state;
      fb.style.display = 'block';
    } else {
      fb.textContent = '';
      fb.style.display = 'none';
    }
  }

  // === Validators ===

  function validateEmail(input) {
    var val = input.value.trim();
    if (!val) {
      setFieldState(input, 'neutral', '');
      return false;
    }
    if (EMAIL_REGEX.test(val)) {
      setFieldState(input, 'valid', msg('email_valid'));
      return true;
    } else {
      setFieldState(input, 'invalid', msg('email_invalid'));
      return false;
    }
  }

  function validateName(input) {
    var val = input.value.trim();
    if (!val) {
      setFieldState(input, 'neutral', '');
      return false;
    }
    if (val.length >= 2) {
      setFieldState(input, 'valid', msg('name_valid'));
      return true;
    } else {
      setFieldState(input, 'invalid', msg('name_too_short'));
      return false;
    }
  }

  function validatePassword(input) {
    var val = input.value;
    if (!val) {
      setFieldState(input, 'neutral', '');
      return false;
    }
    if (val.length < 8) {
      setFieldState(input, 'invalid', msg('pw_too_short'));
      return false;
    }
    var strength = getPasswordStrength(val);
    var labels = ['', 'pw_weak', 'pw_fair', 'pw_strong', 'pw_very_strong'];
    var states = ['', 'invalid', 'neutral', 'valid', 'valid'];
    setFieldState(input, states[strength], msg(labels[strength]));
    return val.length >= 8;
  }

  function validatePasswordConfirm(input, passwordInput) {
    var val = input.value;
    var pw = passwordInput.value;
    if (!val) {
      setFieldState(input, 'neutral', '');
      return false;
    }
    if (val === pw && pw.length >= 8) {
      setFieldState(input, 'valid', msg('pw_match'));
      return true;
    } else {
      setFieldState(input, 'invalid', msg('pw_no_match'));
      return false;
    }
  }

  function validatePhone(input) {
    var val = input.value.trim();
    if (!val) {
      setFieldState(input, 'neutral', '');
      return false;
    }
    if (PHONE_REGEX.test(val)) {
      setFieldState(input, 'valid', msg('phone_valid'));
      return true;
    } else {
      setFieldState(input, 'invalid', msg('phone_invalid'));
      return false;
    }
  }

  // === Auto-Discovery & Binding ===

  function debounce(fn, delay) {
    var timer;
    return function() {
      var ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  }

  function bindField(input, validatorFn) {
    var debouncedValidate = debounce(function() { validatorFn(input); }, 300);
    input.addEventListener('input', debouncedValidate);
    input.addEventListener('blur', function() { validatorFn(input); });
  }

  function init() {
    // Find all forms
    var forms = document.querySelectorAll('form');
    
    forms.forEach(function(form) {
      var inputs = form.querySelectorAll('input');
      var passwordInput = null;
      
      inputs.forEach(function(input) {
        var type = input.type;
        var id = (input.id || '').toLowerCase();
        var name = (input.name || '').toLowerCase();
        
        // Skip readonly, hidden, submit, checkbox
        if (input.readOnly || type === 'hidden' || type === 'submit' || type === 'checkbox' || type === 'radio') return;
        
        // Email fields
        if (type === 'email') {
          bindField(input, validateEmail);
          return;
        }
        
        // Password fields
        if (type === 'password') {
          // Check if this is a confirm field
          if (id.includes('confirm') || name.includes('confirm') || id.includes('passwordconfirm')) {
            // Find the main password input
            if (!passwordInput) {
              passwordInput = form.querySelector('input[type="password"]:not([id*="confirm"]):not([id*="Confirm"]):not([name*="confirm"]):not([name*="Confirm"])');
            }
            if (passwordInput) {
              bindField(input, function(inp) { validatePasswordConfirm(inp, passwordInput); });
              // Also re-validate confirm when password changes
              passwordInput.addEventListener('input', debounce(function() {
                if (input.value) validatePasswordConfirm(input, passwordInput);
              }, 300));
            }
          } else {
            passwordInput = input;
            bindField(input, validatePassword);
          }
          return;
        }
        
        // Phone fields
        if (type === 'tel' || id.includes('phone') || name.includes('phone')) {
          bindField(input, validatePhone);
          return;
        }
        
        // Name fields (first name, last name)
        if (id.includes('name') || id.includes('firstname') || id.includes('lastname') ||
            name.includes('name') || name.includes('firstname') || name.includes('lastname')) {
          // Skip company name (optional)
          if (id.includes('company') || name.includes('company')) return;
          if (input.required) {
            bindField(input, validateName);
          }
          return;
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.BillionairsFormValidation = {
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validatePasswordConfirm: validatePasswordConfirm,
    validateName: validateName,
    validatePhone: validatePhone,
    setFieldState: setFieldState,
    reinit: init
  };

})();
