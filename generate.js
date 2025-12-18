const fs = require('fs');
const path = require('path');

const chapters = [
  { id: 'chapter1', dir: '01-Введение', title: 'Введение', num: '01' },
  { id: 'chapter2', dir: '02-Backend-Laravel', title: 'Backend Laravel', num: '02' },
  { id: 'chapter3', dir: '03-Frontend-Nuxt', title: 'Frontend Nuxt', num: '03' },
  { id: 'chapter4', dir: '04-Интеграция', title: 'Интеграция', num: '04' },
  { id: 'chapter5', dir: '05-Деплой', title: 'Деплой', num: '05' },
  { id: 'chapter6', dir: '06-Docker', title: 'Docker', num: '06' },
  { id: 'chapter7', dir: '07-Laravel12-API', title: 'Laravel 12 API', num: '07' },
  { id: 'chapter8', dir: '08-Nuxt4', title: 'Nuxt 4', num: '08' },
  { id: 'chapter9', dir: '09-Tailwind4', title: 'Tailwind CSS 4', num: '09' },
  { id: 'chapter10', dir: '10-Tailwind4-Tutorial', title: 'Tailwind 4 Туториал', num: '10' },
];

const basePath = '/Users/serik/Desktop/Laravel-Nuxt-Book';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Map language aliases
function mapLanguage(lang) {
  const aliases = {
    'vue': 'xml',
    'html': 'xml',
    'env': 'ini',
    'sh': 'bash',
    'shell': 'bash',
    'js': 'javascript',
    'ts': 'typescript',
    'yml': 'yaml',
  };
  return aliases[lang] || lang;
}

function convertMarkdownToHtml(markdown) {
  let html = '';
  const lines = markdown.split('\n');
  let i = 0;
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeContent = '';
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];

  // Remove chapter title
  if (lines[0] && lines[0].startsWith('# ')) {
    i = 1;
    while (i < lines.length && lines[i].trim() === '') i++;
  }

  function flushList() {
    if (listItems.length > 0) {
      html += '<ul class="styled-list">\n';
      listItems.forEach(item => {
        if (item.startsWith('[ ]')) {
          html += `<li class="checklist"><input type="checkbox" disabled> ${processInline(item.substring(4))}</li>\n`;
        } else if (item.startsWith('[x]')) {
          html += `<li class="checklist checked"><input type="checkbox" checked disabled> ${processInline(item.substring(4))}</li>\n`;
        } else {
          html += `<li>${processInline(item)}</li>\n`;
        }
      });
      html += '</ul>\n';
      listItems = [];
    }
    inList = false;
  }

  function flushTable() {
    if (tableRows.length > 0) {
      html += '<div class="table-wrapper"><table>\n';
      tableRows.forEach((row, idx) => {
        const cells = row.split('|').filter(c => c.trim() !== '');
        if (idx === 0) {
          html += '<thead><tr>';
          cells.forEach(cell => {
            html += `<th>${processInline(cell.trim())}</th>`;
          });
          html += '</tr></thead>\n<tbody>\n';
        } else if (!row.includes('---')) {
          html += '<tr>';
          cells.forEach(cell => {
            html += `<td>${processInline(cell.trim())}</td>`;
          });
          html += '</tr>\n';
        }
      });
      html += '</tbody></table></div>\n';
      tableRows = [];
    }
    inTable = false;
  }

  function processInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block start/end
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLanguage = mapLanguage(trimmed.substring(3) || 'text');
        codeContent = '';
      } else {
        html += `<pre><code class="language-${codeLanguage}">${escapeHtml(codeContent.trim())}</code></pre>\n`;
        inCodeBlock = false;
        codeLanguage = '';
        codeContent = '';
      }
      i++;
      continue;
    }

    // Inside code block
    if (inCodeBlock) {
      codeContent += line + '\n';
      i++;
      continue;
    }

    // Empty line
    if (trimmed === '') {
      flushList();
      flushTable();
      i++;
      continue;
    }

    // Horizontal rule
    if (trimmed === '---') {
      flushList();
      flushTable();
      html += '<hr>\n';
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      flushList();
      flushTable();
      html += `<h4>${processInline(trimmed.substring(5))}</h4>\n`;
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      flushTable();
      html += `<h3>${processInline(trimmed.substring(4))}</h3>\n`;
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      flushTable();
      html += `<h2>${processInline(trimmed.substring(3))}</h2>\n`;
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith('|')) {
      flushList();
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(trimmed);
      i++;
      continue;
    }

    // List item
    if (trimmed.startsWith('- ')) {
      flushTable();
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmed.substring(2));
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      flushTable();
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      i++;
      continue;
    }

    // Regular paragraph
    flushList();
    flushTable();
    html += `<p>${processInline(trimmed)}</p>\n`;
    i++;
  }

  flushList();
  flushTable();

  return html;
}

function generateChapterHtml(chapter, prevId, nextId) {
  const mdPath = path.join(basePath, chapter.dir, 'README.md');
  const markdown = fs.readFileSync(mdPath, 'utf8');
  const content = convertMarkdownToHtml(markdown);

  return `
        <!-- Chapter ${chapter.num}: ${chapter.title} -->
        <section class="chapter" id="${chapter.id}">
            <div class="chapter-header">
                <span class="chapter-badge">Глава ${chapter.num}</span>
                <h1>${chapter.title}</h1>
            </div>

            <div class="content-section">
                ${content}
            </div>

            <div class="chapter-nav">
                <button class="nav-btn nav-btn-prev" onclick="navigateTo('${prevId}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"/>
                        <polyline points="12,19 5,12 12,5"/>
                    </svg>
                    Назад
                </button>
                <button class="nav-btn nav-btn-next" onclick="navigateTo('${nextId}')">
                    ${nextId === 'intro' ? 'На главную' : 'Далее'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12,5 19,12 12,19"/>
                    </svg>
                </button>
            </div>
        </section>`;
}

// Generate all chapters
let chaptersHtml = '';
chapters.forEach((chapter, index) => {
  console.log(`Generating chapter: ${chapter.title}`);
  const prevId = index === 0 ? 'intro' : chapters[index - 1].id;
  const nextId = index === chapters.length - 1 ? 'intro' : chapters[index + 1].id;
  chaptersHtml += generateChapterHtml(chapter, prevId, nextId);
});

// Write to file
fs.writeFileSync(path.join(basePath, 'chapters-generated.html'), chaptersHtml);
console.log(`\nSaved to chapters-generated.html (${chaptersHtml.length} chars)`);
