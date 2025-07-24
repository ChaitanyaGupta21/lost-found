document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    // Location Dropdown Functionality
    const locationDropdown = document.querySelector('.location-dropdown');
    const locationInput = document.querySelector('.location-input');
    const locationSearch = document.querySelector('.location-search');
    const locationMenu = document.querySelector('.location-menu');
    const popularLocations = document.querySelectorAll('.popular-locations li');
    const moreLocations = document.querySelectorAll('.more-locations li');
    const currentLocation = document.querySelector('.current-location');
    
    // Handle location selection
    function selectLocation(locationName) {
        locationInput.textContent = locationName;
        // In a real app, this would filter items by location
        console.log('Location selected:', locationName);
        
        // Add a subtle animation when selecting a location
        locationInput.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            locationInput.style.animation = '';
        }, 300);
    }
    
    // Add click event to all location options
    popularLocations.forEach(location => {
        location.addEventListener('click', function() {
            const locationText = this.textContent.trim();
            selectLocation(locationText);
            // Close the dropdown with a slight delay for better UX
            setTimeout(() => {
                locationMenu.style.display = 'none';
            }, 150);
        });
    });
    
    moreLocations.forEach(location => {
        location.addEventListener('click', function() {
            const locationText = this.textContent.trim();
            selectLocation(locationText);
            // Close the dropdown with a slight delay for better UX
            setTimeout(() => {
                locationMenu.style.display = 'none';
            }, 150);
        });
    });
    
    // Current location functionality
    if (currentLocation) {
        currentLocation.addEventListener('click', function() {
            // Simulate getting current location
            selectLocation('Current Location');
            // In a real app, you would use the Geolocation API here
            setTimeout(() => {
                locationMenu.style.display = 'none';
            }, 150);
        });
    }
    
    // Toggle dropdown on search click
    if (locationSearch) {
        locationSearch.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = locationMenu.style.display === 'block';
            locationMenu.style.display = isVisible ? 'none' : 'block';
            
            // Add animation classes
            if (!isVisible) {
                locationMenu.style.opacity = '1';
                locationMenu.style.transform = 'translateY(0)';
            } else {
                locationMenu.style.opacity = '0';
                locationMenu.style.transform = 'translateY(-10px)';
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (locationMenu.style.display === 'block' && 
            !locationDropdown.contains(event.target)) {
            locationMenu.style.opacity = '0';
            locationMenu.style.transform = 'translateY(-10px)';
            
            // Add a small delay before hiding to allow for animation
            setTimeout(() => {
                locationMenu.style.display = 'none';
            }, 200);
        }
    });
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            authButtons.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Search Functionality
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm !== '') {
            // In a real application, this would redirect to search results
            alert('Searching for: ' + searchTerm);
            // window.location.href = 'search-results.html?q=' + encodeURIComponent(searchTerm);
        }
    }
    
    // Add a CSS animation for the location selection
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Newsletter Form Submission
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (validateEmail(email)) {
                // In a real application, this would submit to a server
                alert('Thank you for subscribing with: ' + email);
            }
        });
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Add animation to items when they come into view
    const animateOnScroll = function() {
        const items = document.querySelectorAll('.item-card, .step, .testimonial');
        
        items.forEach(item => {
            const itemPosition = item.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (itemPosition < screenPosition) {
                item.classList.add('animate');
            }
        });
    };
    
    // Run animation check on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
});

// Add CSS for animations
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .item-card, .step, .testimonial {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .item-card.animate, .step.animate, .testimonial.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Mobile Navigation Styles */
        @media (max-width: 992px) {
            .navbar {
                padding: 15px 20px;
                position: relative;
            }
            
            .hamburger {
                display: block;
                z-index: 1001;
            }
            
            .hamburger.active .bar:nth-child(1) {
                transform: translateY(8px) rotate(45deg);
            }
            
            .hamburger.active .bar:nth-child(2) {
                opacity: 0;
            }
            
            .hamburger.active .bar:nth-child(3) {
                transform: translateY(-8px) rotate(-45deg);
            }
            
            .nav-links {
                position: fixed;
                left: -100%;
                top: 70px;
                flex-direction: column;
                background-color: white;
                width: 100%;
                text-align: center;
                transition: 0.3s;
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
                padding: 20px 0;
                z-index: 1000;
            }
            
            .nav-links.active {
                left: 0;
            }
            
            .auth-buttons {
                position: fixed;
                left: -100%;
                top: 320px;
                flex-direction: column;
                width: 100%;
                text-align: center;
                transition: 0.3s;
                padding: 0 20px 20px;
                background-color: white;
                z-index: 1000;
            }
            
            .auth-buttons.active {
                left: 0;
            }
            
            .auth-buttons a {
                width: 100%;
                margin-bottom: 10px;
            }
            
            /* Hero Section Responsive */
            .hero h1 {
                font-size: 2.2rem;
            }
            
            .hero-buttons {
                flex-direction: column;
                gap: 10px;
            }
            
            .hero-buttons a {
                width: 100%;
            }
            
            /* Footer Responsive */
            .footer-content {
                grid-template-columns: 1fr;
                text-align: center;
            }
            
            .footer-logo, .footer-links, .footer-contact, .footer-newsletter {
                margin-bottom: 30px;
            }
            
            .social-icons {
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
});