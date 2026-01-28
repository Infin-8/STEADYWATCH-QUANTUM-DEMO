
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

                // Simple form submission - just opens email with form data
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const company = document.getElementById('company').value;
            const inquiry = document.getElementById('inquiry').value;
            const message = document.getElementById('message').value;
            
            const subject = `Contact Form: ${inquiry}`;
            const body = `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\nInquiry Type: ${inquiry}\n\nMessage:\n${message}`;
            
            window.location.href = `mailto:nate_vazquez@icloud.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }); // ← Add this closing brace and parenthesis!

