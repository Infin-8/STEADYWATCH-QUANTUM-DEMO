
    function toggleMobileMenu() {
        const navLinks = document.getElementById('navLinks');
        navLinks.classList.toggle('active');
    }
    
    // Close mobile menu when clicking a nav link
    document.addEventListener('DOMContentLoaded', function() {
        const navLinks = document.getElementById('navLinks');
        const links = navLinks.querySelectorAll('a');
        
        links.forEach(function(link) {
            link.addEventListener('click', function() {
                // Only close on mobile (screen width <= 768px)
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                }
            });
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const nav = document.querySelector('nav');
        const navLinks = document.getElementById('navLinks');
        const toggle = document.querySelector('.mobile-menu-toggle');
        
        if (window.innerWidth <= 768 && 
            !nav.contains(event.target) && 
            navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

