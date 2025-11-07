document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

const videoPlaceholder = document.querySelector('.video-placeholder');
if (videoPlaceholder) {
  videoPlaceholder.addEventListener('click', () => {
    alert('Video demo would play here in a production application!');
  });
}

const cards = document.querySelectorAll('.feature-card');
cards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transition = 'all 0.3s ease';
  });
});

const redirectButtons = document.querySelectorAll('.btn-white, .btn-primary, .cta-button');
redirectButtons.forEach(button => {
  button.addEventListener('click', function (e) {
    e.preventDefault();
    window.location.href = "/login";  // Flask route
  });
});
