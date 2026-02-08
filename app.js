const modalImage = document.getElementById('modalImage');


function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('active');
    
    // Hide/show comparison link on mobile
    const comparisonLink = navLinks.querySelector('a[href*="comparison.html"]');
    if (comparisonLink) {
        const listItem = comparisonLink.closest('li');
        if (window.innerWidth <= 768) {
            if (navLinks.classList.contains('active')) {
                // Menu is opening - hide comparison link
                listItem.style.display = 'none';
            } else {
                // Menu is closing - show comparison link (if you want it visible when closed)
                // listItem.style.display = ''; // Uncomment if you want it visible when menu is closed
            }
        }
    }
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
                
                // Show comparison link again when menu closes (if you want)
                const comparisonLink = navLinks.querySelector('a[href*="comparison.html"]');
                if (comparisonLink) {
                    const listItem = comparisonLink.closest('li');
                    // listItem.style.display = ''; // Uncomment if you want it visible when menu closes
                }
            }
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
            
            // Show comparison link when menu closes (if you want)
            const comparisonLink = navLinks.querySelector('a[href*="comparison.html"]');
            if (comparisonLink) {
                const listItem = comparisonLink.closest('li');
                // listItem.style.display = ''; // Uncomment if you want it visible when menu closes
            }
        }
    });
    

modalImage.addEventListener('mouseover', function() {
    console.log("egg6", "boo");           // your log
});
});
