/**
 * Laravel + Nuxt Book - Interactive JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initSyntaxHighlighting();

  // Show chapter from URL hash or intro by default
  const hash = window.location.hash.slice(1);
  showChapter(hash || 'intro');

  initNavigation();

  // Hide preloader
  setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
    }
  }, 300);
});

/**
 * Navigate to a specific chapter
 */
function navigateTo(chapterId) {
  showChapter(chapterId);
}

/**
 * Show specific chapter
 */
function showChapter(chapterId) {
  // Hide all chapters
  const chapters = document.querySelectorAll('.chapter');
  chapters.forEach(chapter => {
    chapter.classList.remove('active');
  });

  // Show target chapter
  const targetChapter = document.getElementById(chapterId);
  if (targetChapter) {
    targetChapter.classList.add('active');
  }

  // Update navigation active state
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.chapter === chapterId) {
      item.classList.add('active');
    }
  });

  // Scroll to top instantly
  window.scrollTo(0, 0);

  // Close mobile menu if open
  closeMobileMenu();

  // Update URL hash
  if (history.pushState) {
    history.pushState(null, null, '#' + chapterId);
  }
}

/**
 * Initialize navigation
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const chapterId = this.dataset.chapter;
      if (chapterId) {
        showChapter(chapterId);
      }
    });
  });

  // Handle browser back/forward
  window.addEventListener('popstate', function() {
    const hash = window.location.hash.slice(1) || 'intro';
    showChapter(hash);
  });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !menuToggle.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
}

/**
 * Initialize syntax highlighting
 */
function initSyntaxHighlighting() {
  if (typeof hljs !== 'undefined') {
    // Register language aliases
    hljs.registerAliases(['vue', 'html'], { languageName: 'xml' });
    hljs.registerAliases(['env'], { languageName: 'ini' });
    hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' });
    hljs.registerAliases(['js'], { languageName: 'javascript' });
    hljs.registerAliases(['ts'], { languageName: 'typescript' });
    hljs.registerAliases(['yml'], { languageName: 'yaml' });

    // Highlight all code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}

/**
 * Navigate to previous chapter
 */
function prevChapter(currentId) {
  const chapters = ['intro', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter8', 'chapter9', 'chapter10'];
  const currentIndex = chapters.indexOf(currentId);
  if (currentIndex > 0) {
    showChapter(chapters[currentIndex - 1]);
  }
}

/**
 * Navigate to next chapter
 */
function nextChapter(currentId) {
  const chapters = ['intro', 'chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5', 'chapter6', 'chapter7', 'chapter8', 'chapter9', 'chapter10'];
  const currentIndex = chapters.indexOf(currentId);
  if (currentIndex < chapters.length - 1) {
    showChapter(chapters[currentIndex + 1]);
  }
}

// Expose functions globally
window.navigateTo = navigateTo;
window.showChapter = showChapter;
window.prevChapter = prevChapter;
window.nextChapter = nextChapter;
