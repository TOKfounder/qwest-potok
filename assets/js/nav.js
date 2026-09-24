(function () {
  const nav = document.getElementById('siteNav');
  const menuButton = document.getElementById('menuButton');
  const navLinks = document.getElementById('navLinks');
  if (!nav || !menuButton || !navLinks) return;

  let lastScrollY = window.scrollY;

  menuButton.addEventListener('click', function () {
    const open = navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });

  window.addEventListener('scroll', function () {
    if (navLinks.classList.contains('open')) {
      lastScrollY = window.scrollY;
      return;
    }
    if (window.scrollY > lastScrollY && window.scrollY > 80) {
      nav.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
  }, { passive: true });
})();
