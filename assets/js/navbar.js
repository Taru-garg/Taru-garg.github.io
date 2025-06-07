function renderNavbar() {
  const navbar = document.getElementById("navbar");
  if (navbar) {
    navbar.innerHTML = `
    <nav
      id="navbar"
      class="navbar fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 py-3 px-4"
    >
      <div
        class="navbar-container container max-w-screen-xl mx-auto flex items-center justify-between"
      >
        <!-- Logo -->
        <div class="flex items-center">
          <img
            src="assets/image/navbar-logo.png"
            alt="Logo"
            class="navbar-logo"
          />
        </div>

        <!-- Right side buttons -->
        <div class="flex items-center space-x-3">
          <a
            href="assets/files/Resume_Taru_Garg_2025.pdf"
            download="Resume_Taru_Garg"
          >
            <button
              class="navbar-button px-5 py-2 bg-white font-medium text-gray-700 text-sm rounded-md hover:bg-gray-700 hover:text-white transition ease-linear duration-300 border border-gray-200"
            >
              Get my CV
            </button>
          </a>
          <a href="blogs.html">
            <button
              class="navbar-button px-5 py-2 bg-gray-700 font-medium text-white text-sm rounded-md hover:bg-gray-800 transition ease-linear duration-300"
            >
              Blogs
            </button>
          </a>
        </div>
      </div>
    </nav>
        `;
  }
}
