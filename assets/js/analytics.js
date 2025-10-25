// Google Analytics 4 - Billionairs Luxury
// Measurement ID: G-80P17E7RZK

// Initialize Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-80P17E7RZK', {
    'cookie_flags': 'SameSite=None;Secure',
    'send_page_view': true
});

// Custom Event Tracking Functions
const BillionairsAnalytics = {
    // User Events
    trackSignup: (email) => {
        gtag('event', 'sign_up', {
            method: 'email',
            user_email: email
        });
    },

    trackLogin: (email) => {
        gtag('event', 'login', {
            method: 'email'
        });
    },

    // Payment Events
    trackPaymentInitiated: (amount, currency = 'CHF') => {
        gtag('event', 'begin_checkout', {
            currency: currency,
            value: amount,
            items: [{
                item_id: 'membership',
                item_name: 'Billionairs Luxury Membership',
                price: amount,
                quantity: 1
            }]
        });
    },

    trackPaymentSuccess: (amount, transactionId, currency = 'CHF') => {
        gtag('event', 'purchase', {
            transaction_id: transactionId,
            currency: currency,
            value: amount,
            items: [{
                item_id: 'membership',
                item_name: 'Billionairs Luxury Membership',
                price: amount,
                quantity: 1
            }]
        });
    },

    // Easter Egg Events
    trackEasterEggUnlock: (eggType) => {
        gtag('event', 'unlock_achievement', {
            achievement_id: `easter_egg_${eggType}`,
            achievement_name: `${eggType.charAt(0).toUpperCase() + eggType.slice(1)} Easter Egg Unlocked`
        });
    },

    trackPyramidUnlock: () => {
        gtag('event', 'unlock_achievement', {
            achievement_id: 'pyramid_unlocked',
            achievement_name: 'Pyramid Unlocked'
        });
    },

    trackEyeUnlock: () => {
        gtag('event', 'unlock_achievement', {
            achievement_id: 'eye_unlocked',
            achievement_name: 'Eye Unlocked'
        });
    },

    trackChatReady: () => {
        gtag('event', 'unlock_achievement', {
            achievement_id: 'chat_ready',
            achievement_name: 'Chat Access Unlocked'
        });
    },

    // Chat Events
    trackChatMessage: (messageType = 'text') => {
        gtag('event', 'send_message', {
            message_type: messageType
        });
    },

    trackFileUpload: (fileType) => {
        gtag('event', 'file_upload', {
            file_type: fileType
        });
    },

    // Engagement Events
    trackTimeOnPage: (seconds, pageName) => {
        gtag('event', 'user_engagement', {
            engagement_time_msec: seconds * 1000,
            page_name: pageName
        });
    },

    trackButtonClick: (buttonName) => {
        gtag('event', 'button_click', {
            button_name: buttonName
        });
    },

    // Custom Conversion Events
    trackLeadGenerated: (source) => {
        gtag('event', 'generate_lead', {
            lead_source: source
        });
    },

    // Admin Events
    trackAdminLogin: () => {
        gtag('event', 'admin_login', {
            event_category: 'admin',
            event_label: 'CEO Access'
        });
    },

    trackEmergencyMode: (status) => {
        gtag('event', 'emergency_mode', {
            event_category: 'admin',
            event_label: status ? 'activated' : 'deactivated'
        });
    },

    // Error Tracking
    trackError: (errorType, errorMessage) => {
        gtag('event', 'exception', {
            description: errorMessage,
            fatal: false,
            error_type: errorType
        });
    }
};

// Export for global use
window.BillionairsAnalytics = BillionairsAnalytics;

// Auto-track page views on SPA navigation
let lastPath = location.pathname;
setInterval(() => {
    if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        gtag('config', 'G-80P17E7RZK', {
            page_path: location.pathname
        });
    }
}, 500);

console.log('📊 Google Analytics initialized - Measurement ID: G-80P17E7RZK');
