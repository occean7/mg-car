export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -88, duration: 1.2 });
  else el.scrollIntoView({ behavior: "smooth" });
}