const reveal = (hero) => hero.classList.add("is-revealed");

const heroes = document.querySelectorAll("[data-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion || !("IntersectionObserver" in window)) {
  heroes.forEach(reveal);
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        requestAnimationFrame(() => reveal(entry.target));
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.2 },
  );

  heroes.forEach((hero) => observer.observe(hero));
}
