/*
═══════════════════════════════════════════════════════════════════════════
  MEMBER TESTIMONIALS SYSTEM
  Click-to-reveal Member Reviews (Anonymous & Authentic)
═══════════════════════════════════════════════════════════════════════════
*/

// Member Testimonials Data
const memberTestimonials = {
    fk: {
        name: "F.K.",
        role: "Tech Exit • San Francisco",
        date: "September 2025",
        text: `After my third exit, I thought I'd seen it all. Private clubs, exclusive events, the usual circles. But BILLIONAIRS is different.

It's not about showing off wealth—it's about being around people who understand that money is just the entry ticket, not the destination.

The Monaco gathering changed how I think about my next chapter. No pitches, no agendas, just real conversations with people who've actually built something.

Worth every franc.`
    },
    
    am: {
        name: "A.M.",
        role: "Family Office • Zürich",
        date: "August 2025",
        text: `I manage a €2B family office. I've been to countless "exclusive" events that turned out to be networking circuses in disguise.

BILLIONAIRS is the opposite. Actual discretion. Actual value.

The pre-market opportunities alone have paid for the membership 10x over. But more importantly, I've found a circle of peers I can actually trust.

In our world, that's priceless.`
    },
    
    anon: {
        name: "Anon",
        role: "Crypto OG • Dubai",
        date: "October 2025",
        text: `Made my first million in 2013. First hundred million by 2017. 

Every "elite" group I joined was full of people trying to sell me something or figure out my holdings.

Here? Nobody cares about your net worth. They care about who you are when the money doesn't matter.

That's rare. That's real.

Staying anonymous, but staying connected.`
    },
    
    mr: {
        name: "M.R.",
        role: "Real Estate • London",
        date: "July 2025",
        text: `Built my portfolio from one flat in Kensington to a £400M+ empire.

The network I've built through BILLIONAIRS has opened doors I didn't even know existed. Dubai project I learned about at the last gathering? Already closed. ROI: 847%.

But beyond the deals, it's the caliber of people. No pretenders. No tourists. Just serious wealth, managed seriously.

This is what "exclusive" should actually mean.`
    },
    
    sl: {
        name: "S.L.",
        role: "Private Equity • New York",
        date: "June 2025",
        text: `I run a $3B fund. I'm surrounded by wealth every day.

But BILLIONAIRS showed me there's a difference between people who have money and people who understand what to do with it.

The conversations here are at a level I haven't found anywhere else. No surface talk, no humble-bragging, just real insights from real players.

If you're wondering if it's worth CHF 500k—stop wondering. If you have to ask, you're not ready.`
    }
};

// Modal Elements
let testimonialModal;
let testimonialClose;
let testimonialMemberName;
let testimonialMemberRole;
let testimonialText;
let testimonialDate;

// Initialize Testimonial System
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    testimonialModal = document.getElementById('testimonialModal');
    testimonialClose = document.querySelector('.testimonial-close');
    testimonialMemberName = document.getElementById('testimonialMemberName');
    testimonialMemberRole = document.getElementById('testimonialMemberRole');
    testimonialText = document.getElementById('testimonialText');
    testimonialDate = document.getElementById('testimonialDate');
    
    // Add click & hover handlers to all member testimonials
    const memberElements = document.querySelectorAll('.member-testimonial');
    memberElements.forEach(element => {
        element.addEventListener('click', function() {
            const memberId = this.getAttribute('data-member');
            showTestimonial(memberId);
        });

        // Hover/focus shows a short inline preview in the shared preview area
        element.addEventListener('mouseover', function() {
            const id = this.getAttribute('data-member');
            showInlinePreview(id);
        });
        element.addEventListener('focus', function() {
            const id = this.getAttribute('data-member');
            showInlinePreview(id);
        });
        element.addEventListener('mouseout', function() {
            clearInlinePreview();
        });
        element.addEventListener('blur', function() {
            clearInlinePreview();
        });
    });
    
    // Close modal handlers
    if (testimonialClose) {
        testimonialClose.addEventListener('click', closeTestimonialModal);
    }
    
    if (testimonialModal) {
        testimonialModal.addEventListener('click', function(e) {
            if (e.target === testimonialModal) {
                closeTestimonialModal();
            }
        });
    }
    
    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && testimonialModal.classList.contains('active')) {
            closeTestimonialModal();
        }
    });
});

// Show testimonial
function showTestimonial(memberId) {
    const testimonial = memberTestimonials[memberId];
    
    if (!testimonial) return;
    
    // Update modal content
    testimonialMemberName.textContent = testimonial.name;
    testimonialMemberRole.textContent = testimonial.role;
    testimonialText.textContent = testimonial.text;
    testimonialDate.textContent = testimonial.date;
    
    // Show modal with animation
    testimonialModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Track analytics (optional)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'testimonial_view', {
            'member': memberId,
            'event_category': 'engagement'
        });
    }
}

// Close modal
function closeTestimonialModal() {
    testimonialModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
}

// Inline preview helpers
const previewElement = () => document.getElementById('memberComment');
function showInlinePreview(memberId) {
    const preview = previewElement();
    if (!preview) return;
    const t = memberTestimonials[memberId];
    if (!t) return;
    // Use first two lines as preview
    const lines = t.text.split('\n').filter(Boolean);
    const short = lines.slice(0, 2).join(' ');
    preview.textContent = short + ' '; // trailing space before read more
    // Add "Read more" call to action that opens modal
    const readMore = document.createElement('a');
    readMore.href = '#';
    readMore.className = 'member-comment-readmore';
    readMore.textContent = 'Read more';
    readMore.addEventListener('click', function(e) {
        e.preventDefault();
        showTestimonial(memberId);
    });
    preview.appendChild(readMore);
}

function clearInlinePreview() {
    const preview = previewElement();
    if (!preview) return;
    preview.textContent = '';
}
