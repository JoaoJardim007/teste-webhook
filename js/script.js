document.addEventListener('DOMContentLoaded', function() {

    // --- COUNTDOWN TIMER ---
    const timerElement = document.getElementById('timer');
    function updateCountdown() {
        if (!timerElement) return;

        const now = new Date();
        // Oferta termina ao final do dia atual
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        let diff = endDate - now;

        if (diff < 0) { // Se já passou, mostra para o dia seguinte
             const nextDayEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
             diff = nextDayEndDate - now;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    if (timerElement) {
        setInterval(updateCountdown, 1000);
        updateCountdown(); // Initial call
    }

    // --- FADE-IN ANIMATION ON SCROLL ---
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start loading a bit before it's fully in view
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observerInstance.unobserve(entry.target); // Optional: Stop observing once visible
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => observer.observe(el));

    // --- STATS COUNTER ANIMATION ---
    const statsNumbers = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const targetCount = parseInt(el.dataset.count);
                let currentCount = 0;
                const increment = Math.max(1, Math.ceil(targetCount / 100)); // Ensure at least 1
                
                const timer = setInterval(() => {
                    currentCount += increment;
                    if (currentCount >= targetCount) {
                        el.textContent = targetCount.toLocaleString('pt-PT');
                        clearInterval(timer);
                    } else {
                        el.textContent = currentCount.toLocaleString('pt-PT');
                    }
                }, 20); // Adjust speed here
                observerInstance.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statsNumbers.forEach(num => statsObserver.observe(num));


    // --- FAQ ACCORDION ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isActive = question.classList.contains('active');

            // Close all other active FAQs
            faqQuestions.forEach(q => {
                if (q !== question) {
                    q.classList.remove('active');
                    q.nextElementSibling.classList.remove('active');
                }
            });

            // Toggle current FAQ
            question.classList.toggle('active');
            answer.classList.toggle('active');
        });
    });

    // --- STICKY CTA BAR ---
    const stickyBar = document.getElementById('sticky-cta-bar');
    if (stickyBar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 600) { // Show after scrolling 600px
                stickyBar.classList.add('visible');
            } else {
                stickyBar.classList.remove('visible');
            }
        });
    }
    
    // --- SCROLL TO FORM LINK ---
    const scrollToFormLink = document.querySelector('.scroll-to-form');
    if (scrollToFormLink) {
        scrollToFormLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // --- FORM SUBMISSION & META PIXEL TRACKING ---
    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('.form-submit-button');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'A ENVIAR...';

            const formData = new FormData(this);
            const leadData = {
                nome: formData.get('nome'),
                telefone: formData.get('telefone').replace(/\s/g, ''), // Remove spaces
                email: formData.get('email') || '', // Optional
                privacy_policy: formData.get('privacy_policy') === 'on',
                // You can add more data here if needed (e.g., UTM parameters)
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                fbc: getCookie('_fbc'), // Facebook Click ID
                fbp: getCookie('_fbp')  // Facebook Browser ID
            };
            
            // Store name for thank you page
            sessionStorage.setItem('formSubmittedName', leadData.nome.split(' ')[0]);

            try {
                // 1. Send to Meta Pixel via CAPI (Server-Side) using PHP
                const response = await fetch('php/send_lead_meta.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server Error:', errorData);
                    throw new Error(`Server responded with ${response.status}`);
                }
                
                const result = await response.json();
                console.log('Server Response:', result);

                // 2. Track Lead with Client-Side Meta Pixel as fallback/confirmation
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'Lead', {
                        content_name: 'EDP Solar Form Submit',
                        value: 1.00, // Example value
                        currency: 'EUR'
                    });
                    console.log('Meta Pixel "Lead" event fired (client-side).');
                }

                // Redirect to thank you page
                window.location.href = 'obrigado.html';

            } catch (error) {
                console.error('Form submission error:', error);
                alert('Ocorreu um erro ao enviar o seu pedido. Por favor, tente ligar diretamente ou tente novamente mais tarde.');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- TRACKING PHONE & WHATSAPP CLICKS ---
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Contact', { event_category: 'engagement', event_label: 'phone_call_click' });
                console.log('Meta Pixel "Contact" event for Phone fired.');
            }
        });
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Contact', { event_category: 'engagement', event_label: 'whatsapp_click' });
                console.log('Meta Pixel "Contact" event for WhatsApp fired.');
            }
        });
    });

    // Helper function to get cookies (for fbc/fbp)
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
});