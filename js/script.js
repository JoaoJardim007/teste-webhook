/**
 * EDP Solar - JavaScript Otimizado para Alta Conversão
 * Foco: Performance, UX, Tracking Avançado, Mobile First
 * @version 2.0
 */

class EDPSolarTracker {
    constructor() {
        this.debug = false; // Set to true for development
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 1,
            scrollDepth: 0,
            interactions: [],
            leadScore: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCountdown();
        this.initScrollAnimations();
        this.initStatsCounter();
        this.initFAQ();
        this.initStickyBar();
        this.initFormValidation();
        this.initScrollToForm();
        this.trackUserBehavior();
        this.setupA11y();
        
        if (this.debug) console.log('EDP Solar Tracker initialized');
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[EDP Solar] ${message}`, data);
        }
    }

    // ==================== COUNTDOWN TIMER ====================
    initCountdown() {
        const timerElement = document.getElementById('timer');
        if (!timerElement) return;

        const updateCountdown = () => {
            const now = new Date();
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            
            let diff = endDate - now;
            if (diff < 0) {
                const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const nextEndDate = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 23, 59, 59, 999);
                diff = nextEndDate - now;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timerElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Urgency tracking
            if (hours < 2) {
                this.trackEvent('urgency_high', { hours_left: hours });
                timerElement.style.animation = 'urgentBlink 1s infinite';
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
        
        this.log('Countdown initialized');
    }

    // ==================== SCROLL ANIMATIONS ====================
    initScrollAnimations() {
        const observerOptions = {
            threshold: [0.1, 0.5],
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Track element visibility
                    const elementId = entry.target.id || entry.target.className;
                    this.trackEvent('element_viewed', { 
                        element: elementId,
                        intersectionRatio: entry.intersectionRatio 
                    });
                    
                    // Add lead score based on engagement
                    if (entry.intersectionRatio > 0.5) {
                        this.sessionData.leadScore += 10;
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // Track scroll depth
        this.trackScrollDepth();
    }

    trackScrollDepth() {
        let maxScrollDepth = 0;
        const milestones = [25, 50, 75, 100];
        const trackedMilestones = [];

        const trackScroll = this.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
                this.sessionData.scrollDepth = scrollPercent;
                
                // Track milestone achievements
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !trackedMilestones.includes(milestone)) {
                        trackedMilestones.push(milestone);
                        this.trackEvent('scroll_milestone', { 
                            milestone: milestone,
                            time_spent: this.getTimeOnPage() 
                        });
                        
                        // Add lead score for deep engagement
                        this.sessionData.leadScore += milestone / 4;
                    }
                });
            }
        }, 500);

        window.addEventListener('scroll', trackScroll, { passive: true });
    }

    // ==================== STATS COUNTER ANIMATION ====================
    initStatsCounter() {
        const statsNumbers = document.querySelectorAll('.stat-number');
        if (!statsNumbers.length) return;

        const observerOptions = {
            threshold: 0.7,
            rootMargin: '0px'
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        statsNumbers.forEach(num => statsObserver.observe(num));
    }

    animateCounter(element) {
        const targetCount = parseInt(element.dataset.count);
        const duration = 2000;
        const increment = targetCount / (duration / 16);
        let currentCount = 0;

        const updateCounter = () => {
            currentCount += increment;
            if (currentCount >= targetCount) {
                element.textContent = targetCount.toLocaleString('pt-PT');
                this.trackEvent('stat_animation_complete', { 
                    stat: element.dataset.count,
                    element: element.closest('.stat-item')?.dataset.stat 
                });
            } else {
                element.textContent = Math.floor(currentCount).toLocaleString('pt-PT');
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // ==================== FAQ ACCORDION ====================
    initFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach((question, index) => {
            question.addEventListener('click', (e) => {
                e.preventDefault();
                const answer = question.nextElementSibling;
                const isActive = question.classList.contains('active');

                // Close all other FAQs for better UX
                faqQuestions.forEach((q, i) => {
                    if (i !== index) {
                        q.classList.remove('active');
                        q.nextElementSibling.classList.remove('active');
                        q.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current FAQ
                question.classList.toggle('active');
                answer.classList.toggle('active');
                question.setAttribute('aria-expanded', !isActive);

                // Track FAQ interaction
                this.trackEvent('faq_interaction', { 
                    question_index: index,
                    action: isActive ? 'close' : 'open',
                    question_text: question.textContent.trim().substring(0, 50)
                });

                // Add lead score for FAQ engagement
                this.sessionData.leadScore += 15;

                // Smooth scroll to FAQ if opening
                if (!isActive) {
                    setTimeout(() => {
                        question.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }, 100);
                }
            });

            // Set initial ARIA attributes
            question.setAttribute('aria-expanded', 'false');
            const answerId = `faq-answer-${index}`;
            question.setAttribute('aria-controls', answerId);
            question.nextElementSibling.setAttribute('id', answerId);
        });

        this.log('FAQ initialized');
    }

    // ==================== STICKY CTA BAR ====================
    initStickyBar() {
        const stickyBar = document.getElementById('sticky-cta-bar');
        if (!stickyBar) return;

        let scrollTimeout;
        const showThreshold = 800;
        
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const shouldShow = window.scrollY > showThreshold;
                
                if (shouldShow && !stickyBar.classList.contains('visible')) {
                    stickyBar.classList.add('visible');
                    this.trackEvent('sticky_bar_shown', { 
                        scroll_position: window.scrollY,
                        time_on_page: this.getTimeOnPage()
                    });
                } else if (!shouldShow && stickyBar.classList.contains('visible')) {
                    stickyBar.classList.remove('visible');
                }
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        this.log('Sticky bar initialized');
    }

    // ==================== SCROLL TO FORM ====================
    initScrollToForm() {
        const scrollLinks = document.querySelectorAll('.scroll-to-form');
        
        scrollLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const formSection = document.getElementById('form-section');
                
                if (formSection) {
                    formSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Focus on first form input for better UX
                    setTimeout(() => {
                        const firstInput = formSection.querySelector('input[type="text"]');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }, 500);
                    
                    this.trackEvent('scroll_to_form', { 
                        trigger: link.textContent.trim(),
                        source_section: this.getCurrentSection(link)
                    });
                    
                    this.sessionData.leadScore += 20;
                }
            });
        });
    }

    // ==================== FORM VALIDATION & SUBMISSION ====================
    initFormValidation() {
        const leadForm = document.getElementById('lead-form');
        if (!leadForm) return;

        const inputs = {
            nome: leadForm.querySelector('#nome'),
            telefone: leadForm.querySelector('#telefone'),
            email: leadForm.querySelector('#email'),
            privacy: leadForm.querySelector('#privacy_policy')
        };

        // Real-time validation
        Object.entries(inputs).forEach(([field, input]) => {
            if (!input) return;
            
            input.addEventListener('blur', () => this.validateField(field, input));
            input.addEventListener('input', this.debounce(() => {
                this.clearFieldError(input);
                if (input.value.trim()) {
                    this.validateField(field, input);
                }
            }, 300));
        });

        // Phone number formatting
        if (inputs.telefone) {
            inputs.telefone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 9) value = value.substring(0, 9);
                
                if (value.length >= 3) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
                }
                
                e.target.value = value;
            });
        }

        // Form submission
        leadForm.addEventListener('submit', (e) => this.handleFormSubmission(e, inputs));

        this.log('Form validation initialized');
    }

    validateField(fieldName, input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'nome':
                if (!value) {
                    errorMessage = 'Nome é obrigatório';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Nome deve ter pelo menos 2 caracteres';
                    isValid = false;
                } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
                    errorMessage = 'Nome deve conter apenas letras';
                    isValid = false;
                }
                break;

            case 'telefone':
                const phoneClean = value.replace(/\D/g, '');
                if (!phoneClean) {
                    errorMessage = 'Telemóvel é obrigatório';
                    isValid = false;
                } else if (!/^9[0-9]{8}$/.test(phoneClean)) {
                    errorMessage = 'Formato: 9XX XXX XXX';
                    isValid = false;
                }
                break;

            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errorMessage = 'Email inválido';
                    isValid = false;
                }
                break;

            case 'privacy':
                if (!input.checked) {
                    errorMessage = 'Deve aceitar a política de privacidade';
                    isValid = false;
                }
                break;
        }

        this.showFieldValidation(input, isValid, errorMessage);
        return isValid;
    }

    showFieldValidation(input, isValid, errorMessage) {
        const errorElement = document.getElementById(`${input.name}-error`);
        
        input.classList.remove('error', 'success');
        input.classList.add(isValid ? 'success' : 'error');
        
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = document.getElementById(`${input.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    async handleFormSubmission(e, inputs) {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('.form-submit-button');
        const loadingElement = document.getElementById('form-loading');
        
        // Validate all fields
        let isFormValid = true;
        Object.entries(inputs).forEach(([field, input]) => {
            if (input && !this.validateField(field, input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.trackEvent('form_validation_failed', {
                errors: this.getFormErrors(),
                time_on_page: this.getTimeOnPage(),
                lead_score: this.sessionData.leadScore
            });
            return;
        }

        // Show loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Enviando...';
        
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }

        // Prepare form data with enhanced tracking
        const formData = new FormData(e.target);
        const leadData = {
            nome: formData.get('nome'),
            telefone: formData.get('telefone').replace(/\D/g, ''),
            email: formData.get('email') || '',
            privacy_policy: formData.get('privacy_policy') === 'on',
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            fbc: this.getCookie('_fbc'),
            fbp: this.getCookie('_fbp'),
            // Enhanced tracking data
            lead_score: this.sessionData.leadScore,
            time_on_page: this.getTimeOnPage(),
            scroll_depth: this.sessionData.scrollDepth,
            interactions: this.sessionData.interactions.length,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            referrer: document.referrer || 'direct',
            utm_source: this.getURLParameter('utm_source'),
            utm_medium: this.getURLParameter('utm_medium'),
            utm_campaign: this.getURLParameter('utm_campaign')
        };

        try {
            // Track form submission attempt
            this.trackEvent('form_submission_attempt', {
                lead_data: { ...leadData, telefone: '***HIDDEN***' },
                form_completion_time: this.getTimeOnPage()
            });

            // Submit to server
            const response = await fetch('php/send_lead_meta.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData)
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const result = await response.json();
            this.log('Form submission result:', result);

            // Track successful submission
            this.trackEvent('form_submission_success', {
                server_response: result,
                conversion_time: this.getTimeOnPage(),
                final_lead_score: this.sessionData.leadScore
            });

            // Client-side Meta Pixel tracking
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead', {
                    content_name: 'EDP Solar Form Submit',
                    value: Math.min(this.sessionData.leadScore, 100),
                    currency: 'EUR',
                    custom_data: {
                        lead_score: this.sessionData.leadScore,
                        time_on_page: this.getTimeOnPage()
                    }
                });
                this.log('Meta Pixel Lead event tracked');
            }

            // Store success data for thank you page
            sessionStorage.setItem('formSubmittedName', leadData.nome.split(' ')[0]);
            sessionStorage.setItem('submissionData', JSON.stringify({
                time: Date.now(),
                leadScore: this.sessionData.leadScore,
                timeOnPage: this.getTimeOnPage()
            }));

            // Redirect with smooth transition
            window.location.href = 'obrigado.html';

        } catch (error) {
            this.log('Form submission error:', error);
            
            this.trackEvent('form_submission_error', {
                error_message: error.message,
                lead_score: this.sessionData.leadScore,
                time_on_page: this.getTimeOnPage()
            });

            // Show user-friendly error
            this.showFormError('Ocorreu um erro ao enviar. Tente ligar diretamente: +351 912 345 678');
            
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }

    showFormError(message) {
        // Create or update error display
        let errorDiv = document.querySelector('.form-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error-message';
            errorDiv.style.cssText = `
                background: #fee;
                border: 1px solid #fcc;
                color: #c33;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                text-align: center;
                font-weight: 500;
            `;
            document.querySelector('.form-container').appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    getFormErrors() {
        const errors = [];
        document.querySelectorAll('.error-message').forEach(el => {
            if (el.textContent.trim()) {
                errors.push(el.textContent.trim());
            }
        });
        return errors;
    }

    // ==================== CLICK TRACKING ====================
    setupEventListeners() {
        // Track all CTA clicks
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-event]');
            if (element) {
                const eventType = element.dataset.event;
                this.trackEvent(eventType, {
                    element_text: element.textContent.trim().substring(0, 50),
                    element_position: this.getElementPosition(element),
                    time_on_page: this.getTimeOnPage()
                });
                
                this.sessionData.leadScore += this.getClickScore(eventType);
            }

            // Track phone clicks
            if (e.target.closest('a[href^="tel:"]')) {
                this.trackEvent('phone_click', {
                    number: e.target.closest('a').href.replace('tel:', ''),
                    source: this.getCurrentSection(e.target),
                    time_on_page: this.getTimeOnPage()
                });
                
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Contact', {
                        event_category: 'engagement',
                        event_label: 'phone_call_click'
                    });
                }
                
                this.sessionData.leadScore += 30;
            }

            // Track WhatsApp clicks
            if (e.target.closest('a[href*="wa.me"]')) {
                this.trackEvent('whatsapp_click', {
                    source: this.getCurrentSection(e.target),
                    time_on_page: this.getTimeOnPage()
                });
                
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Contact', {
                        event_category: 'engagement',
                        event_label: 'whatsapp_click'
                    });
                }
                
                this.sessionData.leadScore += 25;
            }
        });

        this.log('Event listeners setup complete');
    }

    // ==================== USER BEHAVIOR TRACKING ====================
    trackUserBehavior() {
        // Track time on page
        this.startTime = Date.now();
        
        // Track mouse movement (engagement indicator)
        let mouseMovements = 0;
        document.addEventListener('mousemove', this.throttle(() => {
            mouseMovements++;
            if (mouseMovements % 50 === 0) { // Every 50 movements
                this.sessionData.leadScore += 1;
            }
        }, 100));

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { 
                    time_visible: this.getTimeOnPage(),
                    lead_score: this.sessionData.leadScore 
                });
            } else {
                this.trackEvent('page_visible', { 
                    time_away: Date.now() - this.lastHiddenTime 
                });
                this.lastHiddenTime = Date.now();
            }
        });

        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('page_unload', {
                total_time: this.getTimeOnPage(),
                final_lead_score: this.sessionData.leadScore,
                max_scroll_depth: this.sessionData.scrollDepth,
                total_interactions: this.sessionData.interactions.length
            });
        });

        this.log('User behavior tracking initialized');
    }

    // ==================== ACCESSIBILITY ====================
    setupA11y() {
        // Keyboard navigation for CTAs
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Skip link for screen readers
        if (!document.querySelector('.skip-link')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link sr-only';
            skipLink.textContent = 'Pular para o conteúdo principal';
            skipLink.style.cssText = `
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                z-index: 9999;
                text-decoration: none;
                border-radius: 4px;
            `;
            
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '6px';
            });
            
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });
            
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        this.log('Accessibility features initialized');
    }

    // ==================== UTILITY METHODS ====================
    trackEvent(eventName, data = {}) {
        const eventData = {
            event: eventName,
            timestamp: Date.now(),
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            screen_size: `${window.innerWidth}x${window.innerHeight}`,
            ...data
        };

        this.sessionData.interactions.push(eventData);
        
        // Send to analytics (implement your preferred analytics)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
        
        if (typeof fbq !== 'undefined' && eventName.includes('conversion')) {
            fbq('trackCustom', eventName, data);
        }

        this.log(`Event tracked: ${eventName}`, eventData);
    }

    getTimeOnPage() {
        return Math.round((Date.now() - this.sessionData.startTime) / 1000);
    }

    getCurrentSection(element) {
        const section = element.closest('section') || element.closest('header') || element.closest('footer');
        return section ? section.className.split(' ')[0] || section.tagName.toLowerCase() : 'unknown';
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            viewport_height: window.innerHeight
        };
    }

    getClickScore(eventType) {
        const scores = {
            'hero-phone-click': 50,
            'hero-whatsapp-click': 45,
            'final-phone-click': 60,
            'final-whatsapp-click': 55,
            'sticky-phone-click': 40,
            'sticky-whatsapp-click': 35,
            'form-submit': 100
        };
        return scores[eventType] || 10;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Utility functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================
class PerformanceOptimizer {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeImages();
        this.preloadCriticalResources();
        this.setupServiceWorker();
        this.monitorPerformance();
    }

    optimizeImages() {
        // Lazy load images that are not immediately visible
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    preloadCriticalResources() {
        // Preload critical resources based on user behavior
        const criticalResources = [
            '/obrigado.html', // Thank you page
            '/img/edp-logo.webp' // Optimized logo
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    monitorPerformance() {
        // Monitor Core Web Vitals
        if ('web-vital' in window) {
            return; // Use web-vitals library if available
        }

        // Basic performance monitoring
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                
                if (loadTime > 3000) { // If load time > 3s
                    console.warn('Slow page load detected:', loadTime + 'ms');
                    
                    // Track slow load
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'slow_page_load', {
                            event_category: 'performance',
                            value: Math.round(loadTime)
                        });
                    }
                }
            }, 0);
        });
    }
}

// ==================== MOBILE OPTIMIZATION ====================
class MobileOptimizer {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        if (!this.isMobile) return;

        this.optimizeTouchTargets();
        this.handleTouchGestures();
        this.optimizeViewport();
        this.preventZoom();
    }

    optimizeTouchTargets() {
        // Ensure all interactive elements meet minimum touch target size (44px)
        const interactiveElements = document.querySelectorAll('a, button, [tabindex]');
        
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44 || rect.width < 44) {
                element.style.minHeight = '44px';
                element.style.minWidth = '44px';
                element.style.display = 'flex';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
            }
        });
    }

    handleTouchGestures() {
        // Optimize scroll behavior
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchDiff = this.touchStartY - touchY;

            // Detect significant scroll and hide sticky bar temporarily for better UX
            if (Math.abs(touchDiff) > 50) {
                const stickyBar = document.querySelector('.sticky-cta-bar');
                if (stickyBar && stickyBar.classList.contains('visible')) {
                    stickyBar.style.transform = 'translateY(100%)';
                    
                    setTimeout(() => {
                        stickyBar.style.transform = '';
                    }, 1000);
                }
            }
        }, { passive: true });
    }

    optimizeViewport() {
        // Ensure proper viewport behavior
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    }

    preventZoom() {
        // Prevent accidental zoom on form inputs
        const formInputs = document.querySelectorAll('input, select, textarea');
        
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            });
            
            input.addEventListener('blur', () => {
                const viewport = document.querySelector('meta[name="viewport"]');
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            });
        });
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    window.edpTracker = new EDPSolarTracker();
    new PerformanceOptimizer();
    new MobileOptimizer();
    
    // Global error handling
    window.addEventListener('error', (e) => {
        console.error('JavaScript error:', e.error);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'javascript_error', {
                event_category: 'error',
                event_label: e.error.message,
                value: 1
            });
        }
    });
    
    // Track page load performance
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${Math.round(loadTime)}ms`);
        
        if (window.edpTracker) {
            window.edpTracker.trackEvent('page_load_complete', {
                load_time: Math.round(loadTime),
                performance_grade: loadTime < 2000 ? 'A' : loadTime < 4000 ? 'B' : 'C'
            });
        }
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EDPSolarTracker, PerformanceOptimizer, MobileOptimizer };
}