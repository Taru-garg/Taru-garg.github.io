class BlogViewer {
  constructor() {
    this.blogPost = null;
    this.init();
  }

  init() {
    feather.replace();
    this.loadBlogPost();
  }

  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  async loadBlogPost() {
    try {
      const filename = this.getUrlParameter("post");
      if (!filename) {
        this.showError();
        return;
      }

      const remoteHost =
        "https://raw.githubusercontent.com/Taru-garg/Taru-garg.github.io/master";
      var fetchlink = `/assets/blogs/${filename}`;
      if (window.location.hostname.includes("github.io")) {
        fetchlink = remoteHost + fetchlink;
      }
      const response = await fetch(fetchlink);
      if (!response.ok) {
        this.showError();
        return;
      }

      const content = await response.text();
      const metadata = this.extractMetadata(content, filename);
      this.blogPost = metadata;
      this.renderBlogPost();
    } catch (error) {
      console.error("Error loading blog post:", error);
      this.showError();
    }
  }

  extractMetadata(content, filename) {
    const lines = content.split("\n");
    const metadata = {
      filename: filename,
      title: filename
        .replace(/\.md$/, "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      date: new Date().toISOString().split("T")[0],
      excerpt: "",
      tags: [],
      readTime: Math.ceil(content.split(" ").length / 200),
      content: content,
    };

    // Parse frontmatter
    if (lines[0] === "---") {
      let i = 1;
      let frontmatterEnd = -1;

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

      if (i < lines.length && lines[i] === "---") {
        frontmatterEnd = i;
        metadata.content = lines.slice(frontmatterEnd + 1).join("\n");
      }
    }

    // Extract excerpt if not provided in frontmatter
    if (!metadata.excerpt) {
      const contentLines = metadata.content.split("\n");
      for (const line of contentLines) {
        const cleaned = line.replace(/^#+\s*/, "").trim();
        if (cleaned && !cleaned.startsWith("---") && cleaned.length > 20) {
          metadata.excerpt =
            cleaned.substring(0, 200) + (cleaned.length > 200 ? "..." : "");
          break;
        }
      }
    }

    return metadata;
  }

  renderBlogPost() {
    // Hide loading, show article
    document.getElementById("loading").style.display = "none";
    document.getElementById("blog-article").style.display = "block";

    // Set page title
    document.title = `${this.blogPost.title} - Taru Garg`;

    // Render metadata
    document.getElementById("blog-title").textContent = this.blogPost.title;
    document.getElementById("blog-date").textContent = this.formatDate(
      this.blogPost.date
    );
    document.getElementById("blog-read-time").textContent =
      this.blogPost.readTime;

    // Render tags
    const tagsContainer = document.getElementById("blog-tags");
    if (this.blogPost.tags.length > 0) {
      tagsContainer.innerHTML = this.blogPost.tags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join("");
    } else {
      tagsContainer.style.display = "none";
    }

    // Render excerpt
    const excerptContainer = document.getElementById("blog-excerpt");
    if (this.blogPost.excerpt) {
      excerptContainer.textContent = this.blogPost.excerpt;
    } else {
      excerptContainer.style.display = "none";
    }

    // Configure marked options
    marked.setOptions({
      highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
      },
      breaks: true,
      gfm: true,
    });

    // Render markdown content
    const contentContainer = document.getElementById("blog-content");
    contentContainer.innerHTML = marked.parse(this.blogPost.content);

    // Re-initialize feather icons
    feather.replace();
  }

  showError() {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "flex";
    feather.replace();
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

function sharePost(platform) {
  const url = window.location.href;
  const title = document.getElementById("blog-title").textContent;

  switch (platform) {
    case "twitter":
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          title
        )}&url=${encodeURIComponent(url)}`,
        "_blank"
      );
      break;
    case "linkedin":
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`,
        "_blank"
      );
      break;
    case "copy":
      navigator.clipboard.writeText(url);
      break;
  }
}

// Initialize blog viewer when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new BlogViewer();
});
