// Initialize feather icons
feather.replace();

// Blog posts functionality
class BlogManager {
  constructor() {
    this.blogPosts = [];
    this.filteredPosts = [];
    this.currentPage = 1;
    this.postsPerPage = 6;
    this.currentFilters = {
      search: "",
      tag: "",
      sort: "date-desc",
    };
    this.init();
  }

  async init() {
    await this.loadBlogPosts();
    this.setupEventListeners();
    this.populateTagFilter();
    this.renderBlogPosts();
  }

  async loadBlogPosts() {
    try {
      // Get list of markdown files from assets/blogs directory
      const blogFiles = await this.getBlogFiles();

      for (const file of blogFiles) {
        try {
          const content = await this.loadBlogContent(file);
          const metadata = this.extractMetadata(content, file);
          this.blogPosts.push(metadata);
        } catch (error) {
          console.warn(`Failed to load blog post: ${file}`, error);
        }
      }

      this.filteredPosts = [...this.blogPosts];
      this.sortPostsByDate();
    } catch (error) {
      console.error("Failed to load blog posts:", error);
    }
  }

  async getBlogFiles() {
    return ["why-i-stopped-using-ai-for-backend.md"];
  }

  async loadBlogContent(filename) {
    const remoteHost =
      "https://raw.githubusercontent.com/Taru-garg/Taru-garg.github.io/master";
    var fetchlink = `/assets/blogs/${filename}`;
    if (window.location.hostname.includes("github.io")) {
      fetchlink = remoteHost + fetchlink;
    }
    const response = await fetch(fetchlink);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }

  extractMetadata(content, filename) {
    const lines = content.split("\n");
    const metadata = {
      filename: filename,
      title: "",
      date: new Date().toISOString().split("T")[0], // Default to today
      excerpt: "",
      tags: [],
      readTime: Math.ceil(content.split(" ").length / 200), // Estimate reading time
    };

    // Look for frontmatter (YAML between --- markers)
    if (lines[0] === "---") {
      let i = 1;
      while (i < lines.length && lines[i] !== "---") {
        const line = lines[i].trim();
        if (line.includes(":")) {
          const [key, ...valueParts] = line.split(":");
          const value = valueParts.join(":").trim();

          switch (key.toLowerCase()) {
            case "title":
              metadata.title = value.replace(/['"]/g, "");
              break;
            case "date":
              metadata.date = value.replace(/['"]/g, "");
              break;
            case "excerpt":
            case "description":
              metadata.excerpt = value.replace(/['"]/g, "");
              break;
            case "tags":
              metadata.tags = value
                .replace(/[\[\]'"]/g, "")
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t.length > 0);
              break;
          }
        }
        i++;
      }
    }

    // If no excerpt found, extract first paragraph after any frontmatter
    if (!metadata.excerpt) {
      const contentStart =
        lines[0] === "---"
          ? lines.findIndex((line, i) => i > 0 && line === "---") + 1
          : 0;
      const contentLines = lines.slice(contentStart);

      for (const line of contentLines) {
        const cleaned = line.replace(/^#+\s*/, "").trim();
        if (cleaned && !cleaned.startsWith("---") && cleaned.length > 20) {
          metadata.excerpt =
            cleaned.substring(0, 150) + (cleaned.length > 150 ? "..." : "");
          break;
        }
      }
    }

    return metadata;
  }

  sortPostsByDate() {
    this.blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  setupEventListeners() {
    const searchInput = document.getElementById("blog-search");
    const tagFilter = document.getElementById("tag-filter");
    const sortFilter = document.getElementById("sort-filter");
    const postsPerPageSelect = document.getElementById("posts-per-page");
    const clearFiltersBtn = document.getElementById("clear-filters");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentFilters.search = e.target.value;
        this.currentPage = 1;
        this.applyFilters();
      });
    }

    if (tagFilter) {
      tagFilter.addEventListener("change", (e) => {
        this.currentFilters.tag = e.target.value;
        this.currentPage = 1;
        this.applyFilters();
      });
    }

    if (sortFilter) {
      sortFilter.addEventListener("change", (e) => {
        this.currentFilters.sort = e.target.value;
        this.currentPage = 1;
        this.applyFilters();
      });
    }

    if (postsPerPageSelect) {
      postsPerPageSelect.addEventListener("change", (e) => {
        this.postsPerPage = parseInt(e.target.value);
        this.currentPage = 1;
        this.renderBlogPosts();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        this.clearAllFilters();
      });
    }
  }

  populateTagFilter() {
    const tagFilter = document.getElementById("tag-filter");
    if (!tagFilter) return;

    // Get all unique tags
    const allTags = new Set();
    this.blogPosts.forEach((post) => {
      post.tags.forEach((tag) => allTags.add(tag));
    });

    // Clear existing options (except "All Tags")
    tagFilter.innerHTML = '<option value="">All Tags</option>';

    // Add tag options
    Array.from(allTags)
      .sort()
      .forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
      });
  }

  clearAllFilters() {
    this.currentFilters = {
      search: "",
      tag: "",
      sort: "date-desc",
    };
    this.currentPage = 1;

    // Reset form elements
    const searchInput = document.getElementById("blog-search");
    const tagFilter = document.getElementById("tag-filter");
    const sortFilter = document.getElementById("sort-filter");

    if (searchInput) searchInput.value = "";
    if (tagFilter) tagFilter.value = "";
    if (sortFilter) sortFilter.value = "date-desc";

    this.applyFilters();
  }

  applyFilters() {
    this.filteredPosts = this.blogPosts.filter((post) => {
      // Search filter
      if (this.currentFilters.search) {
        const searchTerm = this.currentFilters.search.toLowerCase();
        const matchesSearch =
          post.title.toLowerCase().includes(searchTerm) ||
          post.excerpt.toLowerCase().includes(searchTerm) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

        if (!matchesSearch) return false;
      }

      // Tag filter
      if (this.currentFilters.tag) {
        if (!post.tags.includes(this.currentFilters.tag)) return false;
      }

      return true;
    });

    // Apply sorting
    this.sortPosts();
    this.renderBlogPosts();
    this.updateResultsInfo();
    this.toggleClearFiltersButton();
  }

  sortPosts() {
    switch (this.currentFilters.sort) {
      case "date-desc":
        this.filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        this.filteredPosts.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "title-asc":
        this.filteredPosts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        this.filteredPosts.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
  }

  updateResultsInfo() {
    const resultsInfo = document.getElementById("results-info");
    if (!resultsInfo) return;

    const totalPosts = this.filteredPosts.length;
    const totalPages = Math.ceil(totalPosts / this.postsPerPage);
    const startPost = (this.currentPage - 1) * this.postsPerPage + 1;
    const endPost = Math.min(this.currentPage * this.postsPerPage, totalPosts);

    if (totalPosts === 0) {
      resultsInfo.textContent = "No blog posts found";
    } else {
      resultsInfo.textContent = `Showing ${startPost}-${endPost} of ${totalPosts} posts`;
    }
  }

  toggleClearFiltersButton() {
    const clearBtn = document.getElementById("clear-filters");
    if (!clearBtn) return;

    const hasFilters =
      this.currentFilters.search ||
      this.currentFilters.tag ||
      this.currentFilters.sort !== "date-desc";

    clearBtn.style.display = hasFilters ? "block" : "none";
  }

  renderBlogPosts() {
    const container = document.getElementById("blog-posts-container");
    const loading = document.getElementById("loading");
    const blogsSection = document.getElementById("blogs-section");
    const noPosts = document.getElementById("no-posts");
    const searchSection = document.getElementById("search-section");

    loading.style.display = "none";
    blogsSection.style.display = "block";
    searchSection.style.display = "block";

    if (this.filteredPosts.length === 0) {
      container.innerHTML = "";
      noPosts.style.display = "block";
      document.getElementById("pagination").innerHTML = "";
      this.updateResultsInfo();
      return;
    }

    noPosts.style.display = "none";

    // Calculate pagination
    const totalPages = Math.ceil(this.filteredPosts.length / this.postsPerPage);
    const startIndex = (this.currentPage - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.filteredPosts.slice(startIndex, endIndex);

    // Render posts
    container.innerHTML = postsToShow
      .map(
        (post, index) => `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200">
              <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm text-gray-500 font-medium">${this.formatDate(
                    post.date
                  )}</span>
                  <span class="text-sm text-gray-400">${
                    post.readTime
                  } min read</span>
                </div>
                
                <h3 class="font-semibold text-gray-800 text-xl mb-3 hover:text-gray-600 transition-colors">
                  <a href="./blog-post.html?post=${post.filename}" class="block">
                    ${post.title}
                  </a>
                </h3>
                
                <p class="text-gray-600 text-sm mb-4 leading-relaxed">
                  ${post.excerpt || "Click to read more..."}
                </p>
                
                ${
                  post.tags.length > 0
                    ? `
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${post.tags
                      .map(
                        (tag) => `
                      <span class="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-md hover:bg-blue-200 cursor-pointer transition-colors" onclick="blogManager.filterByTag('${tag}')">
                        ${tag}
                      </span>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
                
                <a 
                  href="./blog-post.html?post=${post.filename}" 
                  class="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors"
                >
                  Read more
                  <i data-feather="arrow-right" class="ml-2 w-4 h-4"></i>
                </a>
              </div>
            </div>
          `
      )
      .join("");

    // Render pagination
    this.renderPagination(totalPages);
    this.updateResultsInfo();

    // Re-initialize feather icons for new content
    feather.replace();
  }

  renderPagination(totalPages) {
    const pagination = document.getElementById("pagination");
    if (!pagination || totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let paginationHTML = "";

    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `
              <button 
                onclick="blogManager.goToPage(${this.currentPage - 1})" 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                Previous
              </button>
            `;
    }

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis
    if (startPage > 1) {
      paginationHTML += `
              <button 
                onclick="blogManager.goToPage(1)" 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                1
              </button>
            `;
      if (startPage > 2) {
        paginationHTML += `
                <span class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
                  ...
                </span>
              `;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      paginationHTML += `
              <button 
                onclick="blogManager.goToPage(${i})" 
                class="px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "text-blue-600 bg-blue-50 border border-blue-300"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                } transition-colors"
              >
                ${i}
              </button>
            `;
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `
                <span class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
                  ...
                </span>
              `;
      }
      paginationHTML += `
              <button 
                onclick="blogManager.goToPage(${totalPages})" 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                ${totalPages}
              </button>
            `;
    }

    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `
              <button 
                onclick="blogManager.goToPage(${this.currentPage + 1})" 
                class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
              >
                Next
              </button>
            `;
    }

    pagination.innerHTML = paginationHTML;
  }

  goToPage(page) {
    this.currentPage = page;
    this.renderBlogPosts();

    // Scroll to top of blog section
    document.getElementById("blogs-section").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  filterByTag(tag) {
    const tagFilter = document.getElementById("tag-filter");
    if (tagFilter) {
      tagFilter.value = tag;
      this.currentFilters.tag = tag;
      this.currentPage = 1;
      this.applyFilters();
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// Initialize blog manager when DOM is ready
let blogManager;
document.addEventListener("DOMContentLoaded", () => {
  blogManager = new BlogManager();
});
