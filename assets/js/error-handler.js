/**
 * BILLIONAIRS - Global Error Handler
 * Fängt ungefangene JS-Fehler ab, zeigt Nutzer-Feedback via Toast
 * und meldet Fehler an Sentry (wenn konfiguriert).
 * 
 * @version 1.0.0
 * @date 2025-02-18
 */
(function() {
  'use strict';

  // === Konfiguration ===
  const CONFIG = {
    // Maximale Fehler pro Session bevor Toast unterdrückt wird
    maxToastsPerSession: 5,
    // Fehler-Duplikate unterdrücken (gleiche Nachricht innerhalb X ms)
    dedupeWindowMs: 3000,
    // Sentry DSN (Frontend) - wird aus meta-tag oder global gelesen
    sentryDsn: null,
    // Debug-Modus (mehr Konsolenausgabe)
    debug: false,
    // Fehler-Typen die ignoriert werden (z.B. Browser-Extensions)
    ignoredErrors: [
      'ResizeObserver loop',
      'Script error.',
      'Non-Error promise rejection',
      'Loading chunk',
      'ChunkLoadError',
      'AbortError',
      'cancelled',
      'NetworkError',
      'Load failed'
    ],
    // Ignorierte Quellen (Browser-Extensions etc.)
    ignoredSources: [
      'chrome-extension://',
      'moz-extension://',
      'safari-extension://',
      'extensions/',
      'webkit-masked-url'
    ]
  };

  // === State ===
  let errorCount = 0;
  let toastCount = 0;
  const recentErrors = new Map(); // deduplication

  // === Hilfsfunktionen ===

  /**
   * Prüft ob ein Fehler ignoriert werden soll
   */
  function shouldIgnore(message, source) {
    if (!message) return true;
    
    const msg = String(message).toLowerCase();
    
    // Ignorierte Fehlermeldungen
    for (const pattern of CONFIG.ignoredErrors) {
      if (msg.includes(pattern.toLowerCase())) return true;
    }
    
    // Ignorierte Quellen (Extensions etc.)
    if (source) {
      const src = String(source).toLowerCase();
      for (const pattern of CONFIG.ignoredSources) {
        if (src.includes(pattern.toLowerCase())) return true;
      }
    }
    
    return false;
  }

  /**
   * Prüft ob dieser Fehler kürzlich schon aufgetreten ist
   */
  function isDuplicate(key) {
    const now = Date.now();
    if (recentErrors.has(key)) {
      const lastTime = recentErrors.get(key);
      if (now - lastTime < CONFIG.dedupeWindowMs) {
        return true;
      }
    }
    recentErrors.set(key, now);
    
    // Alte Einträge bereinigen
    if (recentErrors.size > 50) {
      const cutoff = now - CONFIG.dedupeWindowMs;
      for (const [k, v] of recentErrors) {
        if (v < cutoff) recentErrors.delete(k);
      }
    }
    
    return false;
  }

  /**
   * Zeigt dem Nutzer einen Toast (nutzt das bestehende LuxuryToast System)
   */
  function showErrorToast(message) {
    if (toastCount >= CONFIG.maxToastsPerSession) return;
    toastCount++;
    
    // Warte auf Toast-System
    if (window.toast && window.toast.container) {
      window.toast.error(message || 'An unexpected error occurred. Please reload the page.', {
        duration: 8000
      });
    }
  }

  /**
   * Sendet Fehler an Sentry Frontend (wenn DSN vorhanden)
   */
  function reportToSentry(errorData) {
    const dsn = CONFIG.sentryDsn || window.__SENTRY_DSN__;
    if (!dsn) return;
    
    try {
      const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
      if (!dsnMatch) return;
      
      const [, publicKey, sentryHost, projectId] = dsnMatch;
      const sentryUrl = 'https://' + sentryHost + '/api/' + projectId + '/store/';
      
      const event = {
        event_id: generateEventId(),
        timestamp: Date.now() / 1000,
        platform: 'javascript',
        level: 'error',
        environment: getEnvironment(),
        logger: 'global-error-handler',
        exception: {
          values: [{
            type: errorData.type || 'Error',
            value: errorData.message,
            stacktrace: errorData.stack ? { frames: parseStack(errorData.stack) } : undefined
          }]
        },
        tags: {
          handler: errorData.handler,
          url: window.location.pathname,
          runtime: 'browser'
        },
        extra: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          errorCount: errorCount
        },
        request: {
          url: window.location.href,
          headers: {
            'User-Agent': navigator.userAgent
          }
        }
      };
      
      // navigator.sendBeacon ist zuverlässiger (überlebt page unload)
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      const authUrl = sentryUrl + '?sentry_version=7&sentry_key=' + publicKey + '&sentry_client=billionairs-web/1.0';
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(authUrl, blob);
      } else {
        fetch(authUrl, {
          method: 'POST',
          body: blob,
          keepalive: true
        }).catch(function() { /* silent */ });
      }
    } catch (e) {
      // Sentry-Reporting darf selbst nie crashen
    }
  }

  /**
   * Generiert eine Event-ID
   */
  function generateEventId() {
    var hex = '0123456789abcdef';
    var id = '';
    for (var i = 0; i < 32; i++) {
      id += hex[Math.floor(Math.random() * 16)];
    }
    return id;
  }

  /**
   * Erkennt die Umgebung
   */
  function getEnvironment() {
    var host = window.location.hostname;
    if (host === 'billionairs.luxury' || host === 'www.billionairs.luxury') return 'production';
    if (host.includes('vercel.app')) return 'preview';
    return 'development';
  }

  /**
   * Parsed Stack Trace für Sentry
   */
  function parseStack(stack) {
    if (!stack) return [];
    return stack.split('\n').slice(0, 10).map(function(line) {
      var match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return { function: match[1], filename: match[2], lineno: parseInt(match[3]), colno: parseInt(match[4]) };
      }
      var match2 = line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (match2) {
        return { filename: match2[1], lineno: parseInt(match2[2]), colno: parseInt(match2[3]) };
      }
      return { filename: line.trim() };
    }).filter(function(f) { return f.filename; }).reverse();
  }

  /**
   * Zentrale Fehlerverarbeitung
   */
  function handleError(errorData) {
    errorCount++;
    
    // Ignorieren?
    if (shouldIgnore(errorData.message, errorData.source)) {
      if (CONFIG.debug) console.log('[ErrorHandler] Ignored:', errorData.message);
      return;
    }
    
    // Duplikat?
    var dedupeKey = (errorData.message || '') + (errorData.source || '') + (errorData.line || '');
    if (isDuplicate(dedupeKey)) {
      if (CONFIG.debug) console.log('[ErrorHandler] Duplicate suppressed:', errorData.message);
      return;
    }
    
    // Loggen
    console.error('[BILLIONAIRS Error]', {
      message: errorData.message,
      source: errorData.source,
      line: errorData.line,
      col: errorData.col,
      handler: errorData.handler,
      time: new Date().toISOString()
    });
    
    // Toast für Nutzer
    showErrorToast(getI18nError(errorData.message));
    
    // An Sentry melden
    reportToSentry(errorData);
  }

  /**
   * Mehrsprachige Fehlermeldung
   */
  function getI18nError(originalMsg) {
    var lang = document.documentElement.lang || 
               (window.i18n && window.i18n.currentLang) || 
               localStorage.getItem('selectedLanguage') || 'en';
    
    var messages = {
      en: 'Something went wrong. Please try again or reload the page.',
      de: 'Etwas ist schiefgelaufen. Bitte versuche es erneut oder lade die Seite neu.',
      fr: 'Une erreur est survenue. Veuillez réessayer ou recharger la page.',
      es: 'Algo salió mal. Por favor, inténtalo de nuevo o recarga la página.',
      it: 'Qualcosa è andato storto. Per favore riprova o ricarica la pagina.',
      ru: 'Что-то пошло не так. Пожалуйста, попробуйте снова или перезагрузите страницу.',
      zh: '出了点问题。请重试或刷新页面。',
      ja: 'エラーが発生しました。もう一度お試しいただくか、ページを再読み込みしてください。',
      ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى أو إعادة تحميل الصفحة.'
    };
    
    return messages[lang] || messages.en;
  }

  // === Event Listener ===

  /**
   * 1. window.onerror - Fängt ungefangene JS-Fehler
   */
  window.onerror = function(message, source, line, col, error) {
    handleError({
      message: message,
      source: source,
      line: line,
      col: col,
      type: error ? error.name : 'Error',
      stack: error ? error.stack : null,
      handler: 'window.onerror'
    });
    
    // false = Fehler wird weiterhin in der Konsole angezeigt
    return false;
  };

  /**
   * 2. unhandledrejection - Fängt ungefangene Promise-Fehler
   */
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var message, stack, type;
    
    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
      type = reason.name;
    } else if (typeof reason === 'string') {
      message = reason;
    } else if (reason && reason.message) {
      message = reason.message;
      stack = reason.stack;
    } else {
      message = 'Unhandled Promise Rejection';
    }
    
    handleError({
      message: message,
      stack: stack,
      type: type || 'UnhandledRejection',
      handler: 'unhandledrejection'
    });
  });

  /**
   * 3. Resource Errors (Bilder, Scripts, CSS die nicht laden)
   */
  window.addEventListener('error', function(event) {
    // Nur Resource-Fehler (nicht JS-Fehler, die gehen über window.onerror)
    if (event.target && event.target !== window) {
      var tag = event.target.tagName;
      var src = event.target.src || event.target.href || 'unknown';
      
      // Resource-Fehler loggen, aber keinen Toast zeigen (zu technisch)
      console.warn('[BILLIONAIRS Resource Error]', tag, src);
      
      reportToSentry({
        message: 'Resource failed to load: ' + tag + ' ' + src,
        type: 'ResourceError',
        handler: 'resource-error',
        source: src
      });
    }
  }, true); // true = capture phase (nötig für Resource-Errors)

  // === Öffentliche API ===
  window.BillionairsErrorHandler = {
    /** Manuell einen Fehler melden */
    report: function(error, context) {
      handleError({
        message: error.message || String(error),
        stack: error.stack,
        type: error.name || 'ManualReport',
        handler: 'manual',
        source: context || ''
      });
    },
    /** Fehleranzahl dieser Session */
    getErrorCount: function() {
      return errorCount;
    },
    /** Toast-Limit zurücksetzen */
    resetToastLimit: function() {
      toastCount = 0;
    },
    /** Debug ein/ausschalten */
    setDebug: function(enabled) {
      CONFIG.debug = !!enabled;
    },
    /** Sentry DSN setzen */
    setSentryDsn: function(dsn) {
      CONFIG.sentryDsn = dsn;
    }
  };

  // Debug-Info in Development
  if (getEnvironment() === 'development') {
    CONFIG.debug = true;
    console.log('[ErrorHandler] ✅ Global Error Handler active (development mode)');
  }

})();
