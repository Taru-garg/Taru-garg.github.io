feather.replace();

// Navbar shrinking functionality
window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  const scrolled = window.scrollY > 50;

  if (scrolled) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});
