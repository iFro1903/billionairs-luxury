class AccessibilityManager{constructor(){this.focusableElements=[],this.init()}init(){this.setupKeyboardNavigation(),this.setupFocusManagement(),this.setupARIALabels(),this.setupScreenReaderSupport(),this.setupFocusIndicators(),this.setupModalAccessibility()}setupKeyboardNavigation(){document.addEventListener("keydown",e=>{const t=e.target;if("Enter"!==e.key&&" "!==e.key||"BUTTON"!==t.tagName||(e.preventDefault(),t.click()),"Escape"===e.key&&this.closeTopModal(),"Tab"===e.key){const t=document.querySelector('.modal:not([style*="display: none"])');t&&this.trapFocusInModal(e,t)}});const e=document.querySelectorAll('[role="tab"]');e.forEach((t,n)=>{t.addEventListener("keydown",t=>{if("ArrowRight"===t.key){t.preventDefault();const o=e[n+1]||e[0];o.focus(),o.click()}else if("ArrowLeft"===t.key){t.preventDefault();const o=e[n-1]||e[e.length-1];o.focus(),o.click()}})})}setupFocusManagement(){this.updateFocusableElements();new MutationObserver(()=>{this.updateFocusableElements()}).observe(document.body,{childList:!0,subtree:!0})}updateFocusableElements(){this.focusableElements=Array.from(document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))}setupARIALabels(){const e=document.getElementById("memberBtn");e&&!e.hasAttribute("aria-label")&&e.setAttribute("aria-label","Access Inner Circle member login");const t=document.getElementById("langBtn");t&&!t.hasAttribute("aria-label")&&t.setAttribute("aria-label","Switch language between English and German");const n=document.getElementById("contactBtn");n&&!n.hasAttribute("aria-label")&&n.setAttribute("aria-label","Open contact information"),document.querySelectorAll(".modal-close, .popup-close, .close-modal").forEach(e=>{e.hasAttribute("aria-label")||(e.setAttribute("aria-label","Close dialog"),e.setAttribute("aria-keyshortcuts","Escape"))});const o=document.getElementById("stripeCheckoutButton");o&&!o.hasAttribute("aria-label")&&o.setAttribute("aria-label","Pay 500,000 Swiss Francs via Stripe payment gateway"),document.querySelectorAll(".copy-btn").forEach(e=>{e.hasAttribute("aria-label")||e.setAttribute("aria-label","Copy address to clipboard")});const a=document.getElementById("customerEmail");if(a&&!a.hasAttribute("aria-describedby")){const e=document.createElement("span");e.id="email-help",e.className="sr-only",e.textContent="Enter your email address for account access",a.parentNode.appendChild(e),a.setAttribute("aria-describedby","email-help")}const i=document.getElementById("customerPassword");if(i&&!i.hasAttribute("aria-describedby")){const e=document.createElement("span");e.id="password-help",e.className="sr-only",e.textContent="Password must be at least 8 characters long with uppercase, lowercase, and numbers",i.parentNode.appendChild(e),i.setAttribute("aria-describedby","password-help")}}setupScreenReaderSupport(){let e=document.getElementById("aria-live-region");e||(e=document.createElement("div"),e.id="aria-live-region",e.setAttribute("aria-live","polite"),e.setAttribute("aria-atomic","true"),e.className="sr-only",document.body.appendChild(e));const t=document.querySelector("main");t&&!t.hasAttribute("role")&&(t.setAttribute("role","main"),t.setAttribute("aria-label","Main content"));const n=document.querySelector("nav");n&&!n.hasAttribute("role")&&(n.setAttribute("role","navigation"),n.setAttribute("aria-label","Main navigation"));const o=document.querySelector("footer");o&&!o.hasAttribute("role")&&(o.setAttribute("role","contentinfo"),o.setAttribute("aria-label","Footer"))}announce(e,t="polite"){const n=document.getElementById("aria-live-region");n&&(n.setAttribute("aria-live",t),n.textContent=e,setTimeout(()=>{n.textContent=""},3e3))}setupSkipLinks(){}setupFocusIndicators(){document.addEventListener("mousedown",()=>{document.body.classList.add("using-mouse")}),document.addEventListener("keydown",e=>{"Tab"===e.key&&document.body.classList.remove("using-mouse")});const e=document.createElement("style");e.textContent="\n            /* Screen Reader Only Content */\n            .sr-only {\n                position: absolute;\n                width: 1px;\n                height: 1px;\n                padding: 0;\n                margin: -1px;\n                overflow: hidden;\n                clip: rect(0, 0, 0, 0);\n                white-space: nowrap;\n                border-width: 0;\n            }\n\n            /* Enhanced Focus Indicators */\n            body:not(.using-mouse) *:focus {\n                outline: 3px solid #E8B4A0 !important;\n                outline-offset: 2px !important;\n            }\n\n            /* Button focus states */\n            button:focus-visible,\n            a:focus-visible,\n            input:focus-visible,\n            select:focus-visible,\n            textarea:focus-visible {\n                outline: 3px solid #E8B4A0;\n                outline-offset: 2px;\n                box-shadow: 0 0 0 5px rgba(232, 180, 160, 0.2);\n            }\n\n            /* High contrast mode support */\n            @media (prefers-contrast: high) {\n                button:focus,\n                a:focus,\n                input:focus {\n                    outline-width: 4px;\n                    outline-color: #fff;\n                }\n            }\n\n            /* Reduced motion support */\n            @media (prefers-reduced-motion: reduce) {\n                *,\n                *::before,\n                *::after {\n                    animation-duration: 0.01ms !important;\n                    animation-iteration-count: 1 !important;\n                    transition-duration: 0.01ms !important;\n                }\n            }\n        ",document.head.appendChild(e)}setupModalAccessibility(){document.querySelectorAll('.modal, [role="dialog"]').forEach(e=>{e.hasAttribute("role")||e.setAttribute("role","dialog"),e.hasAttribute("aria-modal")||e.setAttribute("aria-modal","true");const t=e.querySelector("h1, h2, h3, .modal-title");t&&!t.id&&(t.id=`modal-title-${Math.random().toString(36).substr(2,9)}`,e.setAttribute("aria-labelledby",t.id)),e.addEventListener("keydown",t=>{"Tab"===t.key&&this.trapFocusInModal(t,e)})})}trapFocusInModal(e,t){const n=t.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');if(0===n.length)return;const o=n[0],a=n[n.length-1];e.shiftKey?document.activeElement===o&&(e.preventDefault(),a.focus()):document.activeElement===a&&(e.preventDefault(),o.focus())}closeTopModal(){const e=Array.from(document.querySelectorAll('.modal, [role="dialog"]')).filter(e=>{const t=window.getComputedStyle(e);return"none"!==t.display&&"hidden"!==t.visibility});if(e.length>0){const t=e[e.length-1].querySelector('.modal-close, .popup-close, .close-modal, [aria-label*="Close"]');t&&(t.click(),this.announce("Dialog closed"))}}makeAccessible(e,t={}){const{role:n=null,label:o=null,description:a=null,keyshortcut:i=null,expanded:r=null,controls:s=null,live:l=null}=t;return n&&e.setAttribute("role",n),o&&e.setAttribute("aria-label",o),a&&e.setAttribute("aria-describedby",a),i&&e.setAttribute("aria-keyshortcuts",i),null!==r&&e.setAttribute("aria-expanded",r.toString()),s&&e.setAttribute("aria-controls",s),l&&e.setAttribute("aria-live",l),e}prefersReducedMotion(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}prefersHighContrast(){return window.matchMedia("(prefers-contrast: high)").matches}prefersDarkMode(){return window.matchMedia("(prefers-color-scheme: dark)").matches}getAccessibilityReport(){return{focusableElements:this.focusableElements.length,elementsWithARIA:document.querySelectorAll("[aria-label], [aria-labelledby], [aria-describedby]").length,landmarks:{main:document.querySelectorAll('[role="main"], main').length,navigation:document.querySelectorAll('[role="navigation"], nav').length,contentinfo:document.querySelectorAll('[role="contentinfo"], footer').length},images:{total:document.querySelectorAll("img").length,withAlt:document.querySelectorAll("img[alt]").length,decorative:document.querySelectorAll('img[alt=""], img[role="presentation"]').length},forms:{total:document.querySelectorAll("form").length,inputsWithLabels:document.querySelectorAll("input[id]").length},userPreferences:{reducedMotion:this.prefersReducedMotion(),highContrast:this.prefersHighContrast(),darkMode:this.prefersDarkMode()}}}}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{window.a11y=new AccessibilityManager}):window.a11y=new AccessibilityManager,window.AccessibilityManager=AccessibilityManager;

/* ============================================================
   BILLIONAIRS — Accessibility Enhancements v2
   Additional WCAG 2.1 AA fixes
   ============================================================ */
(function(){
  'use strict';
  function enhance(){
    /* 1. Add role="banner" if missing */
    if(!document.querySelector('header,[role="banner"]')){
      var nav=document.querySelector('nav,.navbar,.nav-container');
      if(nav){var w=nav.closest('.navbar,.nav-container')||nav;w.setAttribute('role','banner');}
    }
    /* 2. 2FA digit inputs: add aria-labels */
    document.querySelectorAll('input[maxlength="1"]').forEach(function(el,i){
      if(!el.getAttribute('aria-label')&&!(el.labels&&el.labels.length)){
        el.setAttribute('aria-label','Digit '+(i+1)+' of verification code');
      }
    });
    /* 3. Fix labels without for attribute */
    document.querySelectorAll('label:not([for])').forEach(function(lbl){
      var inp=lbl.querySelector('input,select,textarea');
      if(inp){
        if(!inp.id){inp.id='a11y-'+Math.random().toString(36).substr(2,6);}
        lbl.setAttribute('for',inp.id);
      }
    });
    /* 4. Make onclick divs keyboard-accessible */
    document.querySelectorAll('div[onclick],span[onclick]').forEach(function(el){
      if(!el.getAttribute('role'))el.setAttribute('role','button');
      if(!el.getAttribute('tabindex'))el.setAttribute('tabindex','0');
      el.addEventListener('keydown',function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}
      });
    });
    /* 5. Mark current page in nav */
    var path=window.location.pathname;
    document.querySelectorAll('nav a[href],[role="navigation"] a[href]').forEach(function(a){
      var h=a.getAttribute('href');
      if(h===path||h===path.replace(/\/$/,''))a.setAttribute('aria-current','page');
    });
    /* 6. Images without alt */
    document.querySelectorAll('img:not([alt])').forEach(function(img){
      var s=(img.getAttribute('src')||'').toLowerCase();
      if(s.includes('separator')||s.includes('divider')||s.includes('bg')){
        img.setAttribute('alt','');img.setAttribute('role','presentation');
      } else {
        img.setAttribute('alt','Image');
      }
    });
    /* 7. Ensure all buttons have accessible name */
    document.querySelectorAll('button:not([aria-label])').forEach(function(btn){
      if(!btn.textContent.trim()&&!btn.getAttribute('title')){
        var svg=btn.querySelector('svg');
        if(svg)btn.setAttribute('aria-label','Button');
      }
    });
    /* 8. Respect reduced motion */
    if(window.matchMedia('(prefers-reduced-motion:reduce)').matches){
      document.documentElement.classList.add('reduced-motion');
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',enhance);}
  else{enhance();}
})();