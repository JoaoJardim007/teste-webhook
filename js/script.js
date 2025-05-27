/**
 * Cesar Jardim - Painéis Solares | JavaScript Mobile-First Otimizado
 * Versão 4.0 - Ultra Otimizado para Performance e Conversão Mobile
 * @version 4.0
 * @author Especialista em UX Mobile
 */

class CesarJardimMobileTracker {
    constructor() {
        this.debug = false; // Set to true for development
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
        
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 1,
            scrollDepth: 0,
            interactions: [],
            leadScore: 0,
            simulatorUsed: false,
            phoneNumber: '+351961055030',
            touchEvents: 0,
            viewportChanges: 0
        };
        
        this.performanceMetrics = {
            loadTime: 0,
            renderTime: 0,
            interactionDelay: 0
        };
        
        this.init();
    }

    init() {
        // Performance monitoring
        this.measurePerformance();
        
        // Core functionality
        this.setupEventListeners();
        this.initCountdown();
        this.initScrollAnimations();
        this.initStatsCounter();
        this.initFAQMobile();
        this.initStickyBarMobile();
        this.initFormValidationMobile();
        this.initScrollToForm();
        this.initSimulatorMobile();
        this.trackUserBehaviorMobile();
        this.setupMobileOptimizations();
        this.setupA11yMobile();
        
        if (this.debug) console.log('🚀 Cesar Jardim Mobile Tracker initialized');
    }

    log(message, data = null) {
        if (this.debug) {
            console.log(`[Cesar Mobile] ${message}`, data);
        }
    }

    // ==================== PERFORMANCE MONITORING ====================
    measurePerformance() {
        // Measure initial load time
        window.addEventListener('load', () => {
            this.performanceMetrics.loadTime = performance.now();
            
            // Track slow loads on mobile
            if (this.performanceMetrics.loadTime > 3000 && this.isMobile) {
                this.trackEvent('mobile_slow_load', {
                    load_time: Math.round(this.performanceMetrics.loadTime),
                    device_type: 'mobile',
                    connection: navigator.connection?.effectiveType || 'unknown'
                });
            }
            
            this.log(`📱 Mobile site loaded in ${Math.round(this.performanceMetrics.loadTime)}ms`);
        });

        // Monitor viewport changes (orientation, keyboard)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.sessionData.viewportChanges++;
                this.handleViewportChange();
            }, 150);
        });
    }

    handleViewportChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const keyboardVisible = window.visualViewport && 
                               window.visualViewport.height < window.innerHeight * 0.75;
        
        if (keyboardVisible) {
            document.body.classList.add('keyboard-visible');
            this.trackEvent('mobile_keyboard_show');
        } else {
            document.body.classList.remove('keyboard-visible');
        }
        
        this.trackEvent('mobile_orientation_change', {
            orientation: isLandscape ? 'landscape' : 'portrait',
            viewport_height: window.innerHeight,
            keyboard_visible: keyboardVisible
        });
    }

    // ==================== COUNTDOWN TIMER MOBILE ====================
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
            
            // Mobile format: HH:MM (shorter)
            timerElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Mobile urgency tracking (less aggressive)
            if (hours < 2 && !this.urgencyTracked) {
                this.trackEvent('mobile_urgency_high', { hours_left: hours });
                this.urgencyTracked = true;
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 60000); // Update every minute for mobile efficiency
        
        this.log('⏰ Mobile countdown initialized');
    }

    // ==================== SIMULADOR MOBILE OPTIMIZADO ====================
    initSimulatorMobile() {
        const slider = document.getElementById('bill-slider');
        const valueDisplay = document.getElementById('bill-value-display');
        
        if (!slider || !valueDisplay) return;

        // Mobile-optimized event listeners
        let interactionTimeout;
        
        // Use 'input' with throttling for mobile performance
        slider.addEventListener('input', this.throttle((e) => {
            this.updateSimulatorValuesMobile(parseInt(e.target.value));
            this.trackSimulatorUsageMobile(e.target.value);
            
            // Clear previous timeout
            clearTimeout(interactionTimeout);
            
            // Set new timeout for engagement tracking
            interactionTimeout = setTimeout(() => {
                this.sessionData.leadScore += 5; // Smaller increments for mobile
            }, 1000);
            
        }, 100)); // Throttle to 100ms for smooth mobile experience
        
        // Touch-specific optimizations
        if (this.isTouch) {
            slider.addEventListener('touchstart', () => {
                this.sessionData.touchEvents++;
                slider.style.transform = 'scale(1.05)';
            });
            
            slider.addEventListener('touchend', () => {
                slider.style.transform = 'scale(1)';
            });
        }
        
        // Initial calculation
        this.updateSimulatorValuesMobile(150);
        this.updateSliderBackgroundMobile(slider);
        
        this.log('🧮 Mobile simulator initialized');
    }

    updateSimulatorValuesMobile(monthlyBill) {
        const valueDisplay = document.getElementById('bill-value-display');
        const firstYearSaving = document.getElementById('first-year-saving');
        const fiveYearSaving = document.getElementById('five-year-saving');
        const totalTenYears = document.getElementById('total-ten-years');
        const slider = document.getElementById('bill-slider');
        
        if (!valueDisplay) return;

        // Update display with mobile-optimized animation
        valueDisplay.textContent = this.formatCurrencyMobile(monthlyBill);
        
        // Lighter animation for mobile
        if (!valueDisplay.classList.contains('value-updating')) {
            valueDisplay.classList.add('value-updating');
            setTimeout(() => {
                valueDisplay.classList.remove('value-updating');
            }, 250); // Shorter animation
        }
        
        // Calculate savings (optimized calculations)
        const firstYearMonthlySaving = monthlyBill * 0.30;
        const fiveYearMonthlySaving = monthlyBill * 0.70;
        
        const firstYearTotal = Math.round(firstYearMonthlySaving * 12);
        const fiveYearTotal = Math.round(fiveYearMonthlySaving * 12);
        const totalTenYearsValue = Math.round((firstYearTotal * 5) + (fiveYearTotal * 5));
        
        // Update displays with optimized animations for mobile
        if (firstYearSaving) this.animateValueMobile(firstYearSaving, firstYearTotal);
        if (fiveYearSaving) this.animateValueMobile(fiveYearSaving, fiveYearTotal);
        if (totalTenYears) this.animateValueMobile(totalTenYears, totalTenYearsValue);
        
        // Update slider background (mobile-optimized)
        if (slider) this.updateSliderBackgroundMobile(slider);
        
        // Store values for WhatsApp (mobile-friendly)
        this.simulatorData = {
            monthlyBill,
            firstYearSaving: firstYearTotal,
            fiveYearSaving: fiveYearTotal,
            totalTenYears: totalTenYearsValue,
            timestamp: Date.now()
        };
    }

    animateValueMobile(element, targetValue) {
        // Mobile-optimized animation (shorter duration, less CPU intensive)
        const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const duration = 300; // Shorter for mobile
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Simpler easing for mobile performance
            const easeOut = 1 - Math.pow(1 - progress, 2);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = this.formatCurrencyMobile(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    formatCurrencyMobile(value) {
        // Simplified formatting for mobile
        return new Intl.NumberFormat('pt-PT', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(value));
    }

    updateSliderBackgroundMobile(slider) {
        const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        
        slider.style.background = `linear-gradient(to right, 
            #6C5CE7 0%, 
            #A29BFE ${percentage}%, 
            #e2e8f0 ${percentage}%, 
            #e2e8f0 100%)`;
    }

    trackSimulatorUsageMobile(value) {
        if (!this.sessionData.simulatorUsed) {
            this.sessionData.simulatorUsed = true;
            this.sessionData.leadScore += 20; // Reduced for mobile
            this.trackEvent('mobile_simulator_first_use', { 
                initial_value: value,
                device_type: 'mobile'
            });
        }
        
        // Throttled tracking for mobile performance
        this.trackEvent('mobile_simulator_change', { 
            value: value,
            time_on_page: this.getTimeOnPage()
        });
    }

    // ==================== SCROLL ANIMATIONS MOBILE ====================
    initScrollAnimations() {
        // Mobile-optimized intersection observer
        const observerOptions = {
            threshold: [0.2], // Single threshold for mobile performance
            rootMargin: '0px 0px -30px 0px' // Smaller margin for mobile
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Lighter tracking for mobile
                    const elementClass = entry.target.className.split(' ')[0];
                    this.trackEvent('mobile_element_viewed', { 
                        element: elementClass,
                        intersectionRatio: Math.round(entry.intersectionRatio * 100) / 100
                    });
                    
                    // Smaller lead score increments for mobile
                    if (entry.intersectionRatio > 0.2) {
                        this.sessionData.leadScore += 5;
                    }
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // Mobile-optimized scroll depth tracking
        this.trackScrollDepthMobile();
    }

    trackScrollDepthMobile() {
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
                
                // Track milestone achievements (reduced frequency for mobile)
                milestones.forEach(milestone => {
                    if (scrollPercent >= milestone && !trackedMilestones.includes(milestone)) {
                        trackedMilestones.push(milestone);
                        this.trackEvent('mobile_scroll_milestone', { 
                            milestone: milestone,
                            time_spent: this.getTimeOnPage()
                        });
                        
                        this.sessionData.leadScore += milestone / 8; // Reduced scoring
                    }
                });
            }
        }, 1000); // Longer throttle for mobile battery efficiency

        window.addEventListener('scroll', trackScroll, { passive: true });
    }

    // ==================== STATS COUNTER MOBILE ====================
    initStatsCounter() {
        const statsNumbers = document.querySelectorAll('.stat-number');
        if (!statsNumbers.length) return;

        const observerOptions = {
            threshold: 0.5, // Higher threshold for mobile
            rootMargin: '0px'
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounterMobile(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        statsNumbers.forEach(num => statsObserver.observe(num));
    }

    animateCounterMobile(element) {
        const targetCount = parseInt(element.dataset.count);
        const duration = 1500; // Shorter duration for mobile
        const increment = targetCount / (duration / 32); // 30fps for mobile
        let currentCount = 0;

        const updateCounter = () => {
            currentCount += increment;
            if (currentCount >= targetCount) {
                element.textContent = targetCount.toLocaleString('pt-PT');
                this.trackEvent('mobile_stat_animation_complete', { 
                    stat: targetCount
                });
            } else {
                element.textContent = Math.floor(currentCount).toLocaleString('pt-PT');
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // ==================== FAQ MOBILE ====================
    initFAQMobile() {
        const faqQuestions = document.querySelectorAll('.faq-question-mobile');
        
        faqQuestions.forEach((question, index) => {
            question.addEventListener('click', (e) => {
                e.preventDefault();
                const answer = question.nextElementSibling;
                const toggle = question.querySelector('.faq-toggle');
                const isActive = question.classList.contains('active');

                // Close all other FAQs (accordion behavior optimized for mobile)
                faqQuestions.forEach((q, i) => {
                    if (i !== index) {
                        q.classList.remove('active');
                        q.nextElementSibling.classList.remove('active');
                        q.setAttribute('aria-expanded', 'false');
                        const otherToggle = q.querySelector('.faq-toggle');
                        if (otherToggle) otherToggle.textContent = '+';
                    }
                });

                // Toggle current FAQ
                question.classList.toggle('active');
                answer.classList.toggle('active');
                question.setAttribute('aria-expanded', !isActive);
                
                if (toggle) {
                    toggle.textContent = isActive ? '+' : '−';
                }

                // Mobile-optimized tracking
                this.trackEvent('mobile_faq_interaction', { 
                    question_index: index,
                    action: isActive ? 'close' : 'open'
                });

                this.sessionData.leadScore += 10; // Reduced for mobile

                // Mobile-friendly smooth scroll
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
            const answerId = `faq-answer-mobile-${index}`;
            question.setAttribute('aria-controls', answerId);
            question.nextElementSibling.setAttribute('id', answerId);
        });

        this.log('❓ Mobile FAQ initialized');
    }

    // ==================== STICKY BAR MOBILE OTIMIZADO ====================
    initStickyBarMobile() {
        const stickyBar = document.getElementById('sticky-cta-mobile');
        if (!stickyBar) return;

        let isVisible = false;
        let scrollTimeout;
        const showThreshold = 1200; // Higher threshold for mobile
        
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const shouldShow = window.scrollY > showThreshold;
                
                if (shouldShow && !isVisible) {
                    stickyBar.classList.add('visible');
                    isVisible = true;
                    this.trackEvent('mobile_sticky_bar_shown', { 
                        scroll_position: window.scrollY,
                        time_on_page: this.getTimeOnPage()
                    });
                } else if (!shouldShow && isVisible) {
                    stickyBar.classList.remove('visible');
                    isVisible = false;
                }
            }, 200); // Longer timeout for mobile performance
        };

        // Mobile-optimized scroll handling
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Touch gesture handling for sticky bar
        if (this.isTouch) {
            let touchStartY = 0;
            let touchDirection = null;
            
            document.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            document.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const touchDiff = touchStartY - touchY;
                
                // Detect scroll direction
                if (Math.abs(touchDiff) > 10) {
                    touchDirection = touchDiff > 0 ? 'up' : 'down';
                    
                    // Hide sticky bar when scrolling up fast (better mobile UX)
                    if (touchDirection === 'up' && Math.abs(touchDiff) > 50 && isVisible) {
                        stickyBar.style.transform = 'translateY(100%)';
                        setTimeout(() => {
                            if (stickyBar.classList.contains('visible')) {
                                stickyBar.style.transform = '';
                            }
                        }, 2000);
                    }
                }
            }, { passive: true });
        }
        
        this.log('📌 Mobile sticky bar initialized');
    }

    // ==================== SCROLL TO FORM MOBILE ====================
    initScrollToForm() {
        const scrollLinks = document.querySelectorAll('.scroll-to-form');
        
        scrollLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const formSection = document.getElementById('form-section');
                
                if (formSection) {
                    // Mobile-optimized smooth scroll
                    formSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Focus optimization for mobile
                    setTimeout(() => {
                        const firstInput = formSection.querySelector('.form-input-mobile');
                        if (firstInput && !this.isMobile) { // Avoid keyboard popup on mobile
                            firstInput.focus();
                        }
                    }, 600);
                    
                    this.trackEvent('mobile_scroll_to_form', { 
                        trigger: link.textContent.trim().substring(0, 30),
                        source_section: this.getCurrentSection(link)
                    });
                    
                    this.sessionData.leadScore += 15;
                }
            });
        });
    }

    // ==================== FORM VALIDATION MOBILE ====================
    initFormValidationMobile() {
        const leadForm = document.getElementById('lead-form');
        if (!leadForm) return;

        const inputs = {
            nome: leadForm.querySelector('#nome'),
            telefone: leadForm.querySelector('#telefone'),
            email: leadForm.querySelector('#email'),
            privacy: leadForm.querySelector('#privacy_policy')
        };

        // Mobile-optimized real-time validation
        Object.entries(inputs).forEach(([field, input]) => {
            if (!input) return;
            
            // Use 'blur' instead of 'input' for mobile performance
            input.addEventListener('blur', () => this.validateFieldMobile(field, input));
            
            // Debounced input validation
            input.addEventListener('input', this.debounce(() => {
                this.clearFieldErrorMobile(input);
                if (input.value.trim()) {
                    this.validateFieldMobile(field, input);
                }
            }, 500)); // Longer debounce for mobile
        });

        // Mobile-optimized phone formatting
        if (inputs.telefone) {
            inputs.telefone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 9) value = value.substring(0, 9);
                
                // Mobile-friendly formatting
                if (value.length >= 3 && value.length <= 6) {
                    value = value.replace(/(\d{3})(\d{1,3})/, '$1 $2');
                } else if (value.length > 6) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
                }
                
                e.target.value = value;
            });
        }

        // Mobile-optimized form submission
        leadForm.addEventListener('submit', (e) => this.handleFormSubmissionMobile(e, inputs));

        this.log('📝 Mobile form validation initialized');
    }

    validateFieldMobile(fieldName, input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'nome':
                if (!value) {
                    errorMessage = 'Nome obrigatório';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Nome muito curto';
                    isValid = false;
                } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value)) {
                    errorMessage = 'Apenas letras';
                    isValid = false;
                }
                break;

            case 'telefone':
                const phoneClean = value.replace(/\D/g, '');
                if (!phoneClean) {
                    errorMessage = 'Telemóvel obrigatório';
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
                    errorMessage = 'Aceite a política';
                    isValid = false;
                }
                break;
        }

        this.showFieldValidationMobile(input, isValid, errorMessage);
        return isValid;
    }

    showFieldValidationMobile(input, isValid, errorMessage) {
        const errorElement = document.getElementById(`${input.name}-error`);
        
        input.classList.remove('error', 'success');
        input.classList.add(isValid ? 'success' : 'error');
        
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }
    }

    clearFieldErrorMobile(input) {
        input.classList.remove('error');
        const errorElement = document.getElementById(`${input.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    async handleFormSubmissionMobile(e, inputs) {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('.form-submit-mobile');
        const loadingElement = document.getElementById('form-loading');
        
        // Mobile-optimized validation
        let isFormValid = true;
        Object.entries(inputs).forEach(([field, input]) => {
            if (input && !this.validateFieldMobile(field, input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.trackEvent('mobile_form_validation_failed', {
                time_on_page: this.getTimeOnPage(),
                lead_score: this.sessionData.leadScore
            });
            
            // Mobile-friendly error scroll
            const firstError = document.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Mobile-optimized loading state
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Enviando...';
        
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }

        // Prepare mobile-optimized form data
        const formData = new FormData(e.target);
        const leadData = {
            nome: formData.get('nome'),
            telefone: formData.get('telefone').replace(/\D/g, ''),
            email: formData.get('email') || '',
            privacy_policy: formData.get('privacy_policy') === 'on',
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            // Mobile-specific data
            device_type: 'mobile',
            screen_size: `${window.innerWidth}x${window.innerHeight}`,
            touch_device: this.isTouch,
            viewport_changes: this.sessionData.viewportChanges,
            touch_events: this.sessionData.touchEvents,
            lead_score: this.sessionData.leadScore,
            time_on_page: this.getTimeOnPage(),
            scroll_depth: this.sessionData.scrollDepth,
            interactions: this.sessionData.interactions.length,
            simulator_used: this.sessionData.simulatorUsed,
            simulator_data: this.simulatorData || null,
            referrer: document.referrer || 'direct',
            connection_type: navigator.connection?.effectiveType || 'unknown',
            battery_level: navigator.getBattery ? await this.getBatteryLevel() : null
        };

        try {
            // Track mobile form submission attempt
            this.trackEvent('mobile_form_submission_attempt', {
                conversion_time: this.getTimeOnPage(),
                device_info: {
                    screen: `${window.innerWidth}x${window.innerHeight}`,
                    touch: this.isTouch,
                    connection: navigator.connection?.effectiveType
                }
            });

            // Simulate server submission (replace with actual endpoint)
            await this.simulateServerSubmissionMobile(leadData);

            // Track successful mobile submission
            this.trackEvent('mobile_form_submission_success', {
                conversion_time: this.getTimeOnPage(),
                final_lead_score: this.sessionData.leadScore,
                device_type: 'mobile'
            });

            // Meta Pixel tracking for mobile
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead', {
                    content_name: 'Cesar Jardim Mobile Lead',
                    value: Math.min(this.sessionData.leadScore, 100),
                    currency: 'EUR',
                    custom_data: {
                        device_type: 'mobile',
                        touch_events: this.sessionData.touchEvents
                    }
                });
                this.log('📊 Mobile Meta Pixel Lead event tracked');
            }

            // Store success data for thank you page
            sessionStorage.setItem('formSubmittedName', leadData.nome.split(' ')[0]);
            sessionStorage.setItem('submissionData', JSON.stringify({
                time: Date.now(),
                leadScore: this.sessionData.leadScore,
                timeOnPage: this.getTimeOnPage(),
                simulatorData: this.simulatorData,
                deviceType: 'mobile'
            }));

            // Mobile-friendly redirect
            window.location.href = 'obrigado.html';

        } catch (error) {
            this.log('❌ Mobile form submission error:', error);
            
            this.trackEvent('mobile_form_submission_error', {
                error_message: error.message,
                lead_score: this.sessionData.leadScore,
                time_on_page: this.getTimeOnPage()
            });

            // Mobile-friendly error handling
            this.showFormErrorMobile('Erro ao enviar. Ligue: +351 961 055 030');
            
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
        }
    }

    async simulateServerSubmissionMobile(leadData) {
        // Mobile-optimized server simulation
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.05) { // 95% success rate for mobile
                    resolve({ status: 'success', id: Date.now() });
                } else {
                    reject(new Error('Conexão instável'));
                }
            }, 1000); // Faster response simulation for mobile
        });
    }

    showFormErrorMobile(message) {
        let errorDiv = document.querySelector('.form-error-mobile');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'form-error-mobile';
            errorDiv.style.cssText = `
                background: #fee;
                border: 1px solid #fcc;
                color: #c33;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                text-align: center;
                font-weight: 500;
                font-size: 0.9rem;
            `;
            document.querySelector('.form-container-mobile').appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async getBatteryLevel() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return Math.round(battery.level * 100);
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    // ==================== MOBILE EVENT TRACKING ====================
    setupEventListeners() {
        // Mobile-optimized click tracking
        document.addEventListener('click', (e) => {
            const element = e.target.closest('[data-event]');
            if (element) {
                const eventType = element.dataset.event;
                this.trackEvent(`mobile_${eventType}`, {
                    element_text: element.textContent.trim().substring(0, 30),
                    time_on_page: this.getTimeOnPage(),
                    touch_device: this.isTouch
                });
                
                this.sessionData.leadScore += this.getClickScoreMobile(eventType);
            }

            // Track phone clicks (mobile-specific)
            if (e.target.closest('a[href^="tel:"]')) {
                this.trackEvent('mobile_phone_click', {
                    number: e.target.closest('a').href.replace('tel:', ''),
                    source: this.getCurrentSection(e.target),
                    time_on_page: this.getTimeOnPage()
                });
                
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Contact', {
                        event_category: 'mobile_engagement',
                        event_label: 'phone_call_click'
                    });
                }
                
                this.sessionData.leadScore += 25;
            }

            // Track WhatsApp clicks (mobile-optimized)
            if (e.target.closest('a[href*="wa.me"]')) {
                this.trackEvent('mobile_whatsapp_click', {
                    source: this.getCurrentSection(e.target),
                    time_on_page: this.getTimeOnPage()
                });
                
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Contact', {
                        event_category: 'mobile_engagement',
                        event_label: 'whatsapp_click'
                    });
                }
                
                this.sessionData.leadScore += 20;
            }
        });

        // Mobile-specific touch tracking
        if (this.isTouch) {
            let touchStartTime;
            
            document.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                this.sessionData.touchEvents++;
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration > 500) { // Long press
                    this.trackEvent('mobile_long_press', {
                        duration: touchDuration,
                        element: e.target.tagName
                    });
                }
            }, { passive: true });
        }

        this.log('🎯 Mobile event listeners setup complete');
    }

    // ==================== MOBILE USER BEHAVIOR TRACKING ====================
    trackUserBehaviorMobile() {
        // Track mobile session start
        this.startTime = Date.now();
        
        // Mobile-specific page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('mobile_page_hidden', { 
                    time_visible: this.getTimeOnPage(),
                    lead_score: this.sessionData.leadScore 
                });
            } else {
                this.trackEvent('mobile_page_visible');
            }
        });

        // Mobile-optimized page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('mobile_session_end', {
                total_time: this.getTimeOnPage(),
                final_lead_score: this.sessionData.leadScore,
                max_scroll_depth: this.sessionData.scrollDepth,
                total_interactions: this.sessionData.interactions.length,
                simulator_used: this.sessionData.simulatorUsed,
                touch_events: this.sessionData.touchEvents,
                viewport_changes: this.sessionData.viewportChanges
            });
        });

        // Connection change tracking (mobile-specific)
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.trackEvent('mobile_connection_change', {
                    effective_type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                });
            });
        }

        this.log('👤 Mobile user behavior tracking initialized');
    }

    // ==================== MOBILE OPTIMIZATIONS ====================
    setupMobileOptimizations() {
        // Optimize images for mobile
        this.optimizeImagesMobile();
        
        // Preload critical resources for mobile
        this.preloadCriticalResourcesMobile();
        
        // Battery optimization
        this.setupBatteryOptimizations();
        
        // Connection-aware optimizations
        this.setupConnectionOptimizations();
    }

    optimizeImagesMobile() {
        // Mobile-optimized lazy loading
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
            }, { rootMargin: '50px' }); // Smaller margin for mobile

            images.forEach(img => imageObserver.observe(img));
        }
    }

    preloadCriticalResourcesMobile() {
        // Mobile-specific preloading
        const criticalResources = [
            '/obrigado.html'
        ];

        // Only preload on good connections
        if (navigator.connection?.effectiveType !== '2g') {
            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = resource;
                document.head.appendChild(link);
            });
        }
    }

    setupBatteryOptimizations() {
        // Reduce animations on low battery
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                if (battery.level < 0.2) { // Less than 20%
                    document.body.classList.add('low-battery');
                    this.trackEvent('mobile_low_battery', {
                        battery_level: Math.round(battery.level * 100)
                    });
                }
                
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.2) {
                        document.body.classList.add('low-battery');
                    } else {
                        document.body.classList.remove('low-battery');
                    }
                });
            });
        }
    }

    setupConnectionOptimizations() {
        if (navigator.connection) {
            const connection = navigator.connection;
            
            // Reduce functionality on slow connections
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                document.body.classList.add('slow-connection');
                this.trackEvent('mobile_slow_connection', {
                    effective_type: connection.effectiveType,
                    downlink: connection.downlink
                });
            }
        }
    }

    // ==================== MOBILE ACCESSIBILITY ====================
    setupA11yMobile() {
        // Mobile-optimized keyboard navigation
        document.querySelectorAll('.final-cta-btn, .cta-primary-mobile, .testimonial-btn-mobile').forEach(button => {
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Mobile screen reader optimizations
        if (!document.querySelector('.skip-link-mobile')) {
            const skipLink = document.createElement('a');
            skipLink.href = '#form-section';
            skipLink.className = 'skip-link-mobile sr-only';
            skipLink.textContent = 'Ir para formulário';
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
                font-size: 14px;
            `;
            
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '6px';
            });
            
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });
            
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        this.log('♿ Mobile accessibility features initialized');
    }

    // ==================== UTILITY METHODS ====================
    trackEvent(eventName, data = {}) {
        const eventData = {
            event: eventName,
            timestamp: Date.now(),
            page_url: window.location.href,
            device_type: 'mobile',
            screen_size: `${window.innerWidth}x${window.innerHeight}`,
            touch_device: this.isTouch,
            ...data
        };

        this.sessionData.interactions.push(eventData);
        
        // Google Analytics (mobile-optimized)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...data,
                device_category: 'mobile'
            });
        }
        
        // Meta Pixel (mobile events)
        if (typeof fbq !== 'undefined' && eventName.includes('conversion')) {
            fbq('trackCustom', eventName, {
                ...data,
                device_type: 'mobile'
            });
        }

        this.log(`📊 Mobile event tracked: ${eventName}`, eventData);
    }

    getTimeOnPage() {
        return Math.round((Date.now() - this.sessionData.startTime) / 1000);
    }

    getCurrentSection(element) {
        const section = element.closest('section') || element.closest('header') || element.closest('footer');
        return section ? section.className.split(' ')[0] || section.tagName.toLowerCase() : 'unknown';
    }

    getClickScoreMobile(eventType) {
        const scores = {
            'hero-phone-click': 40,
            'hero-whatsapp-click': 35,
            'final-phone-click': 50,
            'final-whatsapp-click': 45,
            'sticky-phone-click': 30,
            'sticky-whatsapp-click': 25,
            'form-submit': 80
        };
        return scores[eventType] || 8;
    }

    // Mobile-optimized utility functions
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

// ==================== GLOBAL FUNCTIONS MOBILE ====================

/**
 * Mobile-optimized edit functionality for simulator
 */
function enableEdit() {
    const slider = document.getElementById('bill-slider');
    const currentValue = slider ? slider.value : 150;
    
    // Mobile-friendly prompt
    const newValue = prompt('Valor da conta mensal (€):', currentValue);
    
    if (newValue && !isNaN(newValue)) {
        const value = Math.max(10, Math.min(1000, parseInt(newValue)));
        if (slider) {
            slider.value = value;
            window.cesarMobileTracker.updateSimulatorValuesMobile(value);
            window.cesarMobileTracker.trackEvent('mobile_simulator_manual_edit', { value });
        }
    }
}

/**
 * Mobile-optimized contact Cesar with simulator data
 */
function contactCesar() {
    const monthlyBill = document.getElementById('bill-slider')?.value || 150;
    const firstYearSaving = document.getElementById('first-year-saving')?.textContent || '0';
    const fiveYearSaving = document.getElementById('five-year-saving')?.textContent || '0';
    const totalTenYears = document.getElementById('total-ten-years')?.textContent || '0';
    
    const message = `Olá Cesar! 

📱 Vi no simulador mobile:
• Primeiros 5 anos: €${firstYearSaving} por ano
• Após 5 anos: €${fiveYearSaving} por ano
• Total em 10 anos: €${totalTenYears}

Minha conta mensal: €${monthlyBill}

Quero instalação gratuita! 🏠⚡`;
    
    const whatsappUrl = `https://wa.me/351961055030?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Track mobile event
    if (window.cesarMobileTracker) {
        window.cesarMobileTracker.trackEvent('mobile_simulator_contact', {
            monthly_bill: monthlyBill,
            first_year_saving: firstYearSaving,
            five_year_saving: fiveYearSaving,
            total_ten_years: totalTenYears,
            contact_method: 'whatsapp'
        });
    }
}

// ==================== MOBILE-SPECIFIC ERROR HANDLING ====================
class MobileErrorHandler {
    static init() {
        // Mobile-specific error handling
        window.addEventListener('error', (e) => {
            console.error('Mobile JavaScript error:', e.error);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'mobile_javascript_error', {
                    event_category: 'mobile_error',
                    event_label: e.error?.message || 'Unknown error',
                    value: 1
                });
            }
        });
        
        // Unhandled promise rejections (mobile-specific)
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Mobile unhandled promise rejection:', e.reason);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'mobile_promise_rejection', {
                    event_category: 'mobile_error',
                    event_label: e.reason?.message || 'Promise rejection',
                    value: 1
                });
            }
        });
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile error handling first
    MobileErrorHandler.init();
    
    // Initialize main mobile tracker
    window.cesarMobileTracker = new CesarJardimMobileTracker();
    
    // Track mobile page load performance
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        const isMobile = window.innerWidth <= 768;
        
        console.log(`📱 Cesar Jardim Mobile site loaded in ${Math.round(loadTime)}ms`);
        
        if (window.cesarMobileTracker) {
            window.cesarMobileTracker.trackEvent('mobile_page_load_complete', {
                load_time: Math.round(loadTime),
                performance_grade: loadTime < 2000 ? 'A' : loadTime < 4000 ? 'B' : 'C',
                device_type: 'mobile',
                connection_type: navigator.connection?.effectiveType || 'unknown'
            });
        }
    });
    
    // Mobile-specific service worker registration (optional)
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
});

// ==================== EXPORT FOR TESTING ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CesarJardimMobileTracker, MobileErrorHandler };
}