// ===== LUXURY TIMEPIECE JAVASCRIPT =====

class LuxuryTimepiece {
    constructor() {
        this.currentLocation = null;
        this.currentTimezone = null;
        this.clockStyle = 'elegant'; // elegant, modern, classic
        this.isPaymentComplete = false;
        this.clockInterval = null;
        this.worldClockIntervals = [];
        this.currentSection = 'hero'; // hero, payment, timepiece
        this.pyramids = [];
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }

    async init() {
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize pyramids
        this.initPyramids();
        
        // Initialize magnetic buttons - DEAKTIVIERT (User-Wunsch)
        // this.initMagneticButtons();
        
        // Initialize ripple effect - DEAKTIVIERT (User-Wunsch)
        // this.initRippleEffect();
        
        // Start slot countdown
        this.initSlotCountdown();
        
        // Check if payment was already completed (localStorage)
        this.checkPaymentStatus();
    }

    // Universal Transition für alle Seiten-Wechsel
    async showTransition(callback, duration = 2500) {
        const transitionSection = document.getElementById('transitionSection');
        
        return new Promise((resolve) => {
            if (!transitionSection) {
                // Fallback wenn Transition nicht verfügbar
                if (callback) callback();
                resolve();
                return;
            }
            
            // Show transition
            transitionSection.style.display = 'flex';
            transitionSection.style.opacity = '1';
            
            // Warte die angegebene Dauer
            setTimeout(() => {
                // Fade out transition
                transitionSection.style.opacity = '0';
                
                setTimeout(() => {
                    transitionSection.style.display = 'none';
                    transitionSection.style.opacity = '1'; // Reset for next time
                    
                    // Execute callback (zeige neue Section)
                    if (callback) callback();
                    
                    resolve();
                }, 600);
            }, duration);
        });
    }

    initEventListeners() {
        // Hero section buttons
        const proceedBtn = document.getElementById('proceedBtn');
        const notReadyBtn = document.getElementById('notReadyBtn');
        
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => this.handleProceed());
        }
        
        if (notReadyBtn) {
            notReadyBtn.addEventListener('click', () => this.handleNotReady());
        }

        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePayment(e));
        }

        // Input formatting
        this.initInputFormatting();

        // Window resize handler for responsive clock
        window.addEventListener('resize', () => this.adjustClockSize());
        
        // Mouse movement for pyramid interaction
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    initPyramids() {
        // Get all pyramid elements and store their initial positions
        this.pyramids = Array.from(document.querySelectorAll('.pyramid-element')).map(pyramid => {
            const rect = pyramid.getBoundingClientRect();
            return {
                element: pyramid,
                initialX: parseFloat(pyramid.style.left || getComputedStyle(pyramid).left),
                initialY: parseFloat(pyramid.style.top || getComputedStyle(pyramid).top),
                currentX: 0,
                currentY: 0
            };
        });
    }

    initMagneticButtons() {
        const buttons = document.querySelectorAll('.cta-button, .proceed-button, .return-button, .leave-button');
        
        buttons.forEach(button => {
            button.classList.add('btn-magnetic');
            
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                // Nur 20% der Distanz bewegen = subtil!
                const moveX = x * 0.2;
                const moveY = y * 0.2;
                
                button.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
        
        console.log('🧲 Magnetic button effect initialized on', buttons.length, 'buttons');
    }

    initRippleEffect() {
        // Alle Buttons die einen Ripple-Effekt bekommen sollen
        const buttons = document.querySelectorAll('.cta-button, .proceed-button, .return-button, .leave-button, .payment-button, button');
        
        buttons.forEach(button => {
            // Füge ripple-container Klasse hinzu
            button.classList.add('ripple-container');
            
            button.addEventListener('click', (e) => {
                // Erstelle Ripple-Element
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                
                // Gold Ripple für Premium-Buttons
                if (button.classList.contains('cta-button') || button.classList.contains('proceed-button')) {
                    ripple.classList.add('ripple-gold');
                }
                // Grüner Ripple für Return-Button
                else if (button.classList.contains('return-button')) {
                    ripple.classList.add('ripple-green');
                }
                
                // Berechne Position des Klicks relativ zum Button
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Setze Ripple-Position
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                // Füge Ripple zum Button hinzu
                button.appendChild(ripple);
                
                // Entferne Ripple nach Animation
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        console.log('🌊 Ripple effect initialized on', buttons.length, 'buttons');
    }

    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        // Update pyramid positions to move away from mouse
        this.pyramids.forEach(pyramid => {
            const rect = pyramid.element.getBoundingClientRect();
            const pyramidCenterX = rect.left + rect.width / 2;
            const pyramidCenterY = rect.top + rect.height / 2;
            
            // Calculate distance from mouse to pyramid
            const deltaX = pyramidCenterX - this.mouseX;
            const deltaY = pyramidCenterY - this.mouseY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // If mouse is close enough, move pyramid away
            const maxDistance = 200; // pixels
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const moveX = (deltaX / distance) * force * 50; // 50px max movement
                const moveY = (deltaY / distance) * force * 50;
                
                pyramid.currentX = moveX;
                pyramid.currentY = moveY;
            } else {
                // Return to original position gradually
                pyramid.currentX *= 0.95;
                pyramid.currentY *= 0.95;
            }
            
            // Apply transform
            pyramid.element.style.transform = `translate(${pyramid.currentX}px, ${pyramid.currentY}px)`;
        });
    }

    handleProceed() {
        // Show transition screen first
        this.showTransitionScreen();
        
        // After 1.5 seconds, show payment section - schneller!
        setTimeout(() => {
            this.hideTransitionScreen();
            this.showPaymentSection();
        }, 1500);
    }

    handleNotReady() {
        // Show aggressive rejection screen
        this.showRejectionScreen();
    }

    showRejectionScreen() {
        const heroSection = document.querySelector('.hero-section');
        const rejectionSection = document.getElementById('rejectionSection');
        
        if (heroSection && rejectionSection) {
            heroSection.style.display = 'none';
            rejectionSection.style.display = 'flex';
            
            // Initialize particles for rejection screen
            setTimeout(() => {
                particlesJS('particles-rejection', {
                    particles: {
                        number: { value: 80, density: { enable: true, value_area: 800 } },
                        color: { value: '#FF6B6B' },
                        shape: { type: 'circle' },
                        opacity: { value: 0.6, random: true },
                        size: { value: 3, random: true },
                        line_linked: {
                            enable: true,
                            distance: 150,
                            color: '#FF6B6B',
                            opacity: 0.4,
                            width: 1
                        },
                        move: {
                            enable: true,
                            speed: 1.5,
                            direction: 'none',
                            random: true,
                            straight: false,
                            out_mode: 'out',
                            bounce: false
                        }
                    },
                    interactivity: {
                        detect_on: 'canvas',
                        events: {
                            onhover: { enable: false },
                            onclick: { enable: false },
                            resize: true
                        }
                    },
                    retina_detect: true
                });
            }, 100);
            
            // Setup button handlers
            const returnBtn = document.getElementById('returnBtn');
            const leaveBtn = document.getElementById('leaveBtn');
            
            if (returnBtn) {
                returnBtn.addEventListener('click', () => {
                    rejectionSection.style.display = 'none';
                    heroSection.style.display = 'flex';
                });
            }
            
            if (leaveBtn) {
                leaveBtn.addEventListener('click', () => {
                    // Optionally close window or show final message
                    alert('Access window closing. Return when ready.');
                    window.location.reload();
                });
            }
        }
    }

    showDismissiveMessage() {
        // Old function - now replaced by showRejectionScreen
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid var(--rose-gold-primary);
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            z-index: 10000;
            animation: fadeInScale 0.5s ease;
            box-shadow: 0 0 50px var(--rose-gold-glow);
        `;
        
        notification.innerHTML = `
            <h2 style="color: var(--rose-gold-primary); font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem; letter-spacing: 2px;">UNDERSTOOD</h2>
            <p style="color: #ffffff; font-size: 1.2rem; margin-bottom: 2rem; letter-spacing: 1px;">Return when you're ready</p>
            <button onclick="this.parentElement.remove()" style="
                background: transparent;
                border: 2px solid var(--rose-gold-primary);
                color: var(--rose-gold-primary);
                padding: 1rem 2rem;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                letter-spacing: 2px;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='var(--rose-gold-primary)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--rose-gold-primary)';">CLOSE</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showTransitionScreen() {
        const heroSection = document.getElementById('heroSection');
        const transitionSection = document.getElementById('transitionSection');
        
        if (heroSection && transitionSection) {
            // Fade out hero section
            heroSection.style.transition = 'all 1s ease';
            heroSection.style.opacity = '0';
            heroSection.style.transform = 'translateY(-50px)';
            
            setTimeout(() => {
                heroSection.classList.add('hidden');
                transitionSection.style.display = 'flex';
                
                // Fade in transition section
                transitionSection.style.opacity = '0';
                setTimeout(() => {
                    transitionSection.style.transition = 'all 1s ease';
                    transitionSection.style.opacity = '1';
                }, 100);
            }, 1000);
        }
    }

    hideTransitionScreen() {
        const transitionSection = document.getElementById('transitionSection');
        
        if (transitionSection) {
            transitionSection.style.transition = 'all 1s ease';
            transitionSection.style.opacity = '0';
            
            setTimeout(() => {
                transitionSection.style.display = 'none';
            }, 1000);
        }
    }

    showPaymentSection() {
        const transitionSection = document.getElementById('transitionSection');
        const paymentSection = document.getElementById('paymentSection');
        
        if (paymentSection) {
            // Hide transition if it's showing
            if (transitionSection && transitionSection.style.display !== 'none') {
                transitionSection.style.display = 'none';
            }
            
            paymentSection.classList.remove('hidden');
            
            // Fade in payment section
            paymentSection.style.opacity = '0';
            paymentSection.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                paymentSection.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                paymentSection.style.opacity = '1';
                paymentSection.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    initInputFormatting() {
        // Credit card number formatting
        const cardNumber = document.getElementById('cardNumber');
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        // Expiry date formatting
        const expiryDate = document.getElementById('expiryDate');
        expiryDate.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        // CVV formatting
        const cvv = document.getElementById('cvv');
        cvv.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    async handlePayment(e) {
        e.preventDefault();
        
        // Use Payment Method Selector if available
        if (window.paymentMethodSelector) {
            console.log('Using advanced payment method selector');
            await window.paymentMethodSelector.initiatePayment();
        } else if (window.stripeProcessor) {
            console.log('Using basic Stripe payment for 500,000 CHF');
            await window.stripeProcessor.createCheckoutSession();
        } else {
            console.error('No payment processor available');
            this.showPaymentError('Payment system temporarily unavailable. Please try again.');
        }
    }

    validatePaymentData(data) {
        // Basic validation
        const cardNumberClean = data.cardNumber.replace(/\s/g, '');
        if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
            return false;
        }

        if (!data.expiryDate.match(/^\d{2}\/\d{2}$/)) {
            return false;
        }

        if (data.cvv.length < 3 || data.cvv.length > 4) {
            return false;
        }

        if (data.cardHolder.length < 2) {
            return false;
        }

        return true;
    }

    showPaymentProcessing() {
        const button = document.querySelector('.payment-button');
        const originalContent = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                <div style="width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.3); border-top: 2px solid #000; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                <span>PROCESSING...</span>
            </div>
        `;
    }

    showPaymentError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'payment-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff4444, #cc3333);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 68, 68, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 4000);
    }

    completePayment() {
        // Mark payment as complete
        this.isPaymentComplete = true;
        localStorage.setItem('luxuryTimepieceAccess', 'granted');
        
        // Hide payment section and show timepiece
        this.showTimepiece();
    }

    initSlotCountdown() {
        const slotsElement = document.getElementById('memberSlots');
        if (!slotsElement) return;
        
        // Start with random number between 3-9
        let slots = Math.floor(Math.random() * 7) + 3;
        slotsElement.textContent = `${slots} SLOTS REMAINING`;
        
        // Decrease every 45-90 seconds
        setInterval(() => {
            if (slots > 1) {
                slots--;
                slotsElement.textContent = `${slots} ${slots === 1 ? 'SLOT' : 'SLOTS'} REMAINING`;
                
                // Add urgent animation when reaching 3 or less
                if (slots <= 3) {
                    slotsElement.style.color = '#FF6B6B';
                    slotsElement.style.animation = 'urgentFlash 1s ease-in-out infinite';
                }
            } else {
                slotsElement.textContent = 'LAST SLOT';
                slotsElement.style.color = '#FF4444';
            }
        }, Math.random() * 45000 + 45000); // 45-90 seconds
    }

    checkPaymentStatus() {
        const accessGranted = localStorage.getItem('luxuryTimepieceAccess');
        if (accessGranted === 'granted') {
            this.isPaymentComplete = true;
            // Skip hero and payment, go directly to timepiece
            setTimeout(() => {
                this.showTimepiece();
            }, 100);
        } else {
            // Show hero section first
            setTimeout(() => {
                this.showHeroSection();
            }, 100);
        }
    }

    showHeroSection() {
        const heroSection = document.getElementById('heroSection');
        const paymentSection = document.getElementById('paymentSection');
        
        if (heroSection) {
            paymentSection?.classList.add('hidden');
            heroSection.classList.remove('hidden');
            this.currentSection = 'hero';
        }
    }

    showTimepiece() {
        const paymentSection = document.getElementById('paymentSection');
        const timepieceSection = document.getElementById('timepieceSection');
        
        if (paymentSection && timepieceSection) {
            // Direct transition: hide payment, show timepiece
            paymentSection.classList.add('hidden');
            timepieceSection.classList.remove('hidden');
            
            // Initialize timepiece functionality
            this.initTimepiece();
            
            // Simple fade in
            timepieceSection.style.opacity = '0';
            timepieceSection.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                timepieceSection.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                timepieceSection.style.opacity = '1';
                timepieceSection.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    async initTimepiece() {
        // Get user location and timezone
        await this.getUserLocation();
        
        // Start the clock
        this.startClock();
        
        // Update location display
        this.updateLocationDisplay();
    }

    async getUserLocation() {
        if (!navigator.geolocation) {
            this.currentLocation = 'Location unavailable';
            this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        
                        // Get timezone from coordinates
                        this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        
                        // Reverse geocoding to get city name
                        const locationName = await this.reverseGeocode(latitude, longitude);
                        this.currentLocation = locationName;
                        
                        resolve();
                    } catch (error) {
                        this.currentLocation = 'Unknown location';
                        this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        resolve();
                    }
                },
                (error) => {
                    this.currentLocation = 'Access denied';
                    this.currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    resolve();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    async reverseGeocode(lat, lon) {
        try {
            // Using a simple approach to get approximate location
            // In a real-world scenario, you'd use a proper geocoding API
            const timezoneMap = {
                'Europe/Zurich': 'Zurich, Switzerland',
                'Europe/Berlin': 'Berlin, Germany',
                'Europe/London': 'London, United Kingdom',
                'America/New_York': 'New York, USA',
                'America/Los_Angeles': 'Los Angeles, USA',
                'Asia/Tokyo': 'Tokyo, Japan',
                'Asia/Dubai': 'Dubai, UAE',
                'Europe/Paris': 'Paris, France',
                'Asia/Singapore': 'Singapore',
                'Australia/Sydney': 'Sydney, Australia'
            };
            
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return timezoneMap[timezone] || `${timezone.replace('_', ' ')}`;
        } catch (error) {
            return 'Secured Location';
        }
    }

    updateLocationDisplay() {
        const locationElement = document.getElementById('currentLocation');
        const timezoneElement = document.getElementById('currentTimezone');
        
        if (locationElement && this.currentLocation) {
            locationElement.textContent = this.currentLocation;
        }
        
        if (timezoneElement && this.currentTimezone) {
            timezoneElement.textContent = this.currentTimezone.replace('_', ' ');
        }
    }

    startClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        
        // Update digital time
        this.updateDigitalTime(now);
        
        // Update analog clock
        this.updateAnalogClock(now);
    }

    updateDigitalTime(now) {
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        document.getElementById('hours').textContent = hours;
        document.getElementById('minutes').textContent = minutes;
        document.getElementById('seconds').textContent = seconds;
        
        // Update date
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('dayName').textContent = days[now.getDay()];
        document.getElementById('date').textContent = now.getDate();
        document.getElementById('month').textContent = months[now.getMonth()];
        document.getElementById('year').textContent = now.getFullYear();
    }

    updateAnalogClock(now) {
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        const hourAngle = (hours * 30) + (minutes * 0.5);
        const minuteAngle = minutes * 6;
        const secondAngle = seconds * 6;
        
        const hourHand = document.getElementById('hourHand');
        const minuteHand = document.getElementById('minuteHand');
        const secondHand = document.getElementById('secondHand');
        
        if (hourHand) hourHand.style.transform = `rotate(${hourAngle}deg)`;
        if (minuteHand) minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        if (secondHand) secondHand.style.transform = `rotate(${secondAngle}deg)`;
    }

    adjustClockSize() {
        const clockFrame = document.querySelector('.clock-frame');
        if (!clockFrame) return;
        
        const container = document.querySelector('.timepiece-container');
        const containerWidth = container.offsetWidth;
        
        let clockSize = Math.min(400, containerWidth * 0.8);
        if (window.innerWidth <= 768) {
            clockSize = Math.min(300, containerWidth * 0.9);
        }
        if (window.innerWidth <= 480) {
            clockSize = Math.min(250, containerWidth * 0.95);
        }
        
        clockFrame.style.width = `${clockSize}px`;
        clockFrame.style.height = `${clockSize}px`;
    }
}

// Global functions for button interactions
function toggleClockStyle() {
    const clock = window.luxuryTimepiece;
    const clockFace = document.querySelector('.clock-face');
    
    if (!clock || !clockFace) return;
    
    // Cycle through styles
    const styles = ['elegant', 'modern', 'classic'];
    const currentIndex = styles.indexOf(clock.clockStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    clock.clockStyle = styles[nextIndex];
    
    // Apply style changes
    switch (clock.clockStyle) {
        case 'elegant':
            clockFace.style.background = 'radial-gradient(circle, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)';
            clockFace.style.border = '2px solid var(--rose-gold-primary)';
            clockFace.style.boxShadow = 'inset 0 0 30px var(--rose-gold-glow)';
            break;
        case 'modern':
            clockFace.style.background = 'radial-gradient(circle, rgba(30, 30, 30, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)';
            clockFace.style.border = '2px solid rgba(255, 255, 255, 0.3)';
            clockFace.style.boxShadow = 'inset 0 0 30px rgba(255, 255, 255, 0.1)';
            break;
        case 'classic':
            clockFace.style.background = 'radial-gradient(circle, rgba(139, 69, 19, 0.3) 0%, rgba(20, 20, 20, 0.9) 100%)';
            clockFace.style.border = '2px solid rgba(205, 133, 63, 0.5)';
            clockFace.style.boxShadow = 'inset 0 0 30px rgba(205, 133, 63, 0.2)';
            break;
    }
    
    // Show style change notification
    showNotification(`Style: ${clock.clockStyle.charAt(0).toUpperCase() + clock.clockStyle.slice(1)}`);
}

function showWorldTime() {
    const modal = document.getElementById('worldTimeModal');
    modal.classList.remove('hidden');
    
    // Update world clocks
    updateWorldClocks();
    
    // Start updating world clocks every second
    const interval = setInterval(updateWorldClocks, 1000);
    window.luxuryTimepiece.worldClockIntervals.push(interval);
}

function closeWorldTime() {
    const modal = document.getElementById('worldTimeModal');
    modal.classList.add('hidden');
    
    // Clear world clock intervals
    window.luxuryTimepiece.worldClockIntervals.forEach(interval => clearInterval(interval));
    window.luxuryTimepiece.worldClockIntervals = [];
}

function updateWorldClocks() {
    const timezones = {
        nyTime: 'America/New_York',
        londonTime: 'Europe/London',
        tokyoTime: 'Asia/Tokyo',
        dubaiTime: 'Asia/Dubai'
    };
    
    Object.entries(timezones).forEach(([elementId, timezone]) => {
        const element = document.getElementById(elementId);
        if (element) {
            try {
                const time = new Date().toLocaleTimeString('de-DE', {
                    timeZone: timezone,
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                element.textContent = time;
            } catch (error) {
                element.textContent = '--:--:--';
            }
        }
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(45deg, rgba(232, 180, 184, 0.9), rgba(247, 202, 201, 0.9));
        color: #000;
        padding: 1rem 2rem;
        border-radius: 25px;
        box-shadow: 0 10px 30px rgba(232, 180, 184, 0.3);
        z-index: 10000;
        font-weight: 600;
        letter-spacing: 1px;
        animation: slideInTop 0.3s ease;
        border: 1px solid var(--rose-gold-primary);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutTop 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Add animation keyframes for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInTop {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-50px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideOutTop {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-50px);
        }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(300px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize the luxury timepiece when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.luxuryTimepiece = new LuxuryTimepiece();
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    if (window.luxuryTimepiece) {
        window.luxuryTimepiece.adjustClockSize();
    }
});

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeWorldTime();
    }
});

// Handle escape key for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWorldTime();
    }
});

// Add some luxury touches with mouse interactions
document.addEventListener('mousemove', (e) => {
    const clockFrame = document.querySelector('.clock-frame');
    if (!clockFrame) return;
    
    const rect = clockFrame.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    
    const maxRotation = 2; // degrees
    const rotateX = -deltaY * maxRotation;
    const rotateY = deltaX * maxRotation;
    
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        clockFrame.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    } else {
        clockFrame.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
});

// Reset clock rotation when mouse leaves the timepiece section
document.addEventListener('mouseleave', () => {
    const clockFrame = document.querySelector('.clock-frame');
    if (clockFrame) {
        clockFrame.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
});

// Initialize Particles.js after page load
window.addEventListener('load', function() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS("particles-js", {
            particles: {
                number: {
                    value: 120,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: '#E8B4A0'
                },
                shape: {
                    type: 'circle'
                },
                opacity: {
                    value: 0.6,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 1,
                        opacity_min: 0.3,
                        sync: false
                    }
                },
                size: {
                    value: 4,
                    random: true,
                    anim: {
                        enable: true,
                        speed: 2,
                        size_min: 0.5,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#D4A574',
                    opacity: 0.4,
                    width: 1.5
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: 'window',
                events: {
                    onhover: {
                        enable: true,
                        mode: 'repulse'
                    },
                    onclick: {
                        enable: true,
                        mode: 'push'
                    },
                    resize: true
                },
                modes: {
                    repulse: {
                        distance: 150,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    }
                }
            },
            retina_detect: true
        });
        console.log('✨ Particles.js initialized successfully on all pages!');
        console.log('🎯 Particles will repulse from mouse with 150px distance');
    } else {
        console.error('❌ Particles.js library not loaded');
    }
});
