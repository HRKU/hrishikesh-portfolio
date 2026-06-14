#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SECTION_ALIASES = new Map([
  ['technologies', 'technologies'],
  ['skills', 'technologies'],
  ['tech stack', 'technologies'],
  ['professional experience', 'professional-experience'],
  ['experience', 'professional-experience'],
  ['work experience', 'professional-experience'],
  ['projects', 'projects'],
  ['project', 'projects'],
  ['education', 'education'],
  ['awards & achievements', 'awards-achievements'],
  ['awards and achievements', 'awards-achievements'],
  ['awards achievements', 'awards-achievements'],
  ['awards', 'awards-achievements'],
]);

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'based', 'built', 'by', 'can', 'delivered', 'developed',
  'for', 'from', 'full', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'using',
  'via', 'was', 'were', 'with', 'worked', 'work', 'implemented', 'managed', 'created', 'designed',
  'developing', 'build', 'develop', 'make', 'made', 'used', 'use', 'responsible', 'owned',
  'including', 'integration', 'integrated', 'platform', 'system', 'app', 'application',
]);

const GENERIC_WORDS = new Set([
  'built', 'using', 'with', 'worked', 'developed', 'delivered', 'managed', 'created', 'implemented',
  'integrated', 'made', 'used', 'use', 'build', 'develop', 'works', 'working', 'full', 'stack',
]);

const NOISE_PATTERNS = [
  /\brgb\b/i,
  /\btopsep\b/i,
  /\bparsep\b/i,
  /\bpartopsep\b/i,
  /\bitemsep\b/i,
  /\bleftmargin\b/i,
  /\bcolumnsep\b/i,
  /\btitlerule\b/i,
  /\bgeometry\b/i,
  /\bfootskip\b/i,
  /\bpdftitle\b/i,
  /\bpdfauthor\b/i,
  /\bpdfcreator\b/i,
  /\bignoreheadfoot\b/i,
  /\b0pt\b/i,
];

function parseArgs(argv) {
  const args = { input: null, output: null, resumeType: 'unknown' };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === '--input') args.input = argv[++i];
    else if (value === '--output') args.output = argv[++i];
    else if (value === '--resume-type') args.resumeType = argv[++i];
  }
  return args;
}

function readPdfText(filePath) {
  return execFileSync('/usr/bin/pdftotext', ['-layout', '-enc', 'UTF-8', filePath, '-'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

function extractDocumentBody(input) {
  const match = input.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  return match ? match[1] : input;
}

function normalizeSectionKey(rawTitle) {
  const cleaned = rawTitle
    .replace(/@@SECTION:/g, '')
    .replace(/@@/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return SECTION_ALIASES.get(cleaned) || cleaned.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function preserveInlineContent(input) {
  return input
    .replace(/\\hrefWithoutArrow\{[^}]*\}\{([^}]*)\}/g, '$1')
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
    .replace(/\\textbf\{([^{}]*)\}/g, '$1')
    .replace(/\\textit\{([^{}]*)\}/g, '$1')
    .replace(/\\emph\{([^{}]*)\}/g, '$1')
    .replace(/\\mbox\{([^{}]*)\}/g, '$1')
    .replace(/\\AND\b/g, '|')
    .replace(/\\&/g, '&')
    .replace(/~+/g, ' ');
}

function latexToReadableText(input) {
  let text = extractDocumentBody(input);

  text = text
    .replace(/%.*$/gm, '')
    .replace(/\\section\*?\{([^}]*)\}/g, (_, title) => `\n@@SECTION:${title.trim()}@@\n`)
    .replace(/\\begin\{twocolentry\}\{([^}]*)\}/g, (_, value) => `\n@@ENTRY:${value.trim()}@@\n`)
    .replace(/\\end\{twocolentry\}/g, '\n')
    .replace(/\\begin\{(header|onecolentry|highlights|adjustwidth|itemize|paracol)\}(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, '\n')
    .replace(/\\end\{(header|onecolentry|highlights|adjustwidth|itemize|paracol)\}/g, '\n')
    .replace(/\\item\s*/g, '\n- ');

  text = preserveInlineContent(text);

  text = text
    .replace(/\\newcommand\{[^}]*\}\{[\s\S]*?\}/g, ' ')
    .replace(/\\newsavebox\\?[A-Za-z@]+/g, ' ')
    .replace(/\\sbox\{[^}]*\}\{[\s\S]*?\}/g, ' ')
    .replace(/\\(?:usepackage|documentclass|definecolor|raggedright|pagestyle|pagenumbering|setcounter|setlength|titleformat|titlespacing|renewcommand|AtBeginEnvironment|input|pdfgentounicode|fontsize|selectfont|normalsize|large|small|footnotesize|scriptsize|tiny|centering|linespread|kern|vspace|hfill|unskip)\b(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, ' ')
    .replace(/\\[a-zA-Z@]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/\r/g, '');

  return text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeText(raw, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return readPdfText(filePath);
  if (ext === '.tex') return latexToReadableText(raw);
  return raw;
}

function removeNoiseLines(lines) {
  return lines.filter(line => {
    if (!line) return false;
    if (NOISE_PATTERNS.some(pattern => pattern.test(line))) return false;
    if (/^(?:\d+\s*)?[ptcm]+$/i.test(line)) return false;
    return true;
  });
}

function splitSections(text) {
  const lines = removeNoiseLines(
    text
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );

  const sections = [];
  let current = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^@@SECTION:(.+)@@$/);
    if (sectionMatch) {
      if (current) sections.push(current);
      current = {
        rawTitle: sectionMatch[1].trim(),
        lines: [],
      };
      continue;
    }

    const inferredSection = SECTION_ALIASES.get(
      line.replace(/[{}]/g, '').trim().toLowerCase()
    );
    if (inferredSection) {
      if (current) sections.push(current);
      current = {
        rawTitle: line,
        lines: [],
      };
      continue;
    }

    if (!current) continue;
    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function buildChunk({ id, source, resumeType, section, title, text, category, tags }) {
  const normalizePunctuation = (value) => {
    let out = value.replace(/\s+/g, ' ');
    out = out.replace(/([A-Za-z]{1,})\.\s+([A-Za-z]{1,})/g, '$1.$2');
    out = out.replace(/(\d)\.\s+(\d)/g, '$1.$2');
    out = out.replace(/,\s*\.\s*([A-Za-z]{2,})/g, ', .$1');
    out = out.replace(/\s*([,;:])\s*/g, '$1 ');
    return out.replace(/\s{2,}/g, ' ').trim();
  };

  const normalizedText = normalizePunctuation(text);

  return {
    id,
    source,
    resumeType,
    section,
    title,
    text: normalizedText,
    category,
    tags: Array.from(new Set(tags)),
  };
}

function isMeaningfulText(text) {
  const words = text.match(/[A-Za-z][A-Za-z0-9.+#/-]*/g) || [];
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  if (words.length < 5) return false;
  if (letters < 20) return false;
  if (!/[A-Za-z]{3,}/.test(text)) return false;
  return !NOISE_PATTERNS.some(pattern => pattern.test(text));
}

function inferTags(text, title, section, category, resumeType) {
  const source = `${title} ${text} ${section} ${category} ${resumeType}`.toLowerCase();
  const tokens = source
    .split(/[^a-z0-9+.#/-]+/)
    .map(token => token.trim())
    .map(token => token.replace(/[.,;:]+$/g, ''))
    .filter(Boolean)
    .filter(token => token.length > 2)
    .filter(token => !STOPWORDS.has(token))
    .filter(token => !GENERIC_WORDS.has(token));

  const bucket = new Set([section, category, resumeType]);
  for (const token of tokens) bucket.add(token);
  return Array.from(bucket);
}

function chunkTechnologies(section, meta, startIndex) {
  const chunks = [];
  let index = startIndex;
  let current = null;

  const flush = () => {
    if (!current) return;
    const text = `${current.title}: ${current.body.join(' ')}`.replace(/\s+/g, ' ').trim();
    if (!isMeaningfulText(text)) return;

    const id = `${meta.resumeType}-${String(index).padStart(3, '0')}`;
    chunks.push(buildChunk({
      id,
      source: meta.source,
      resumeType: meta.resumeType,
      section: 'technologies',
      title: current.title,
      text,
      category: 'skills',
      tags: inferTags(text, current.title, 'technologies', 'skills', meta.resumeType),
    }));
    index += 1;
  };

  for (const line of section.lines) {
    const match = line.match(/^([^:]{2,80}):\s*(.+)$/);
    if (match) {
      flush();
      current = {
        title: match[1].replace(/\s+/g, ' ').trim(),
        body: [match[2].replace(/\s+/g, ' ').trim()],
      };
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  flush();
  return { chunks, nextIndex: index };
}

function chunkProfessionalExperience(section, meta, startIndex) {
  const chunks = [];
  let index = startIndex;
  let current = null;

  const flush = () => {
    if (!current) return;
    const text = [
      current.entry ? `Date: ${current.entry}` : null,
      current.title,
      ...current.lines,
    ]
      .filter(Boolean)
      .join(' ');

    if (!isMeaningfulText(text)) return;

    const id = `${meta.resumeType}-${String(index).padStart(3, '0')}`;
    chunks.push(buildChunk({
      id,
      source: meta.source,
      resumeType: meta.resumeType,
      section: 'professional-experience',
      title: current.title,
      text,
      category: 'experience',
      tags: inferTags(text, current.title, 'professional-experience', 'experience', meta.resumeType),
    }));
    index += 1;
  };

  for (const line of section.lines) {
    const entryMatch = line.match(/^@@ENTRY:(.+)@@$/);
    if (entryMatch) {
      flush();
      current = {
        entry: entryMatch[1].trim(),
        title: '',
        lines: [],
      };
      continue;
    }

    if (!current) {
      current = { entry: null, title: '', lines: [] };
    }

    if (line.startsWith('- ')) {
      current.lines.push(line.replace(/^-+\s*/, '').trim());
      continue;
    }

    if (!current.title) {
      current.title = line.replace(/\s+/g, ' ').trim();
      continue;
    }

    current.lines.push(line);
  }

  flush();
  return { chunks, nextIndex: index };
}

function isProjectTitleCandidate(line) {
  if (!line) return false;
  if (line.startsWith('- ')) return false;
  if (line.startsWith('@@ENTRY:')) return false;
  if (/^--\s*/.test(line)) return false;
  if (/:\s/.test(line)) return false;

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 10) return false;
  if (/[;,.!?]$/.test(line)) return false;
  if (!/^[A-Z0-9]/.test(line)) return false;
  if (!/[A-Za-z]/.test(line)) return false;
  return true;
}

function splitCombinedProjectLine(line) {
  const match = line.match(/^(.+?)\s+[–-]\s+(.+)$/);
  if (!match) return null;

  const title = match[1].replace(/\s+/g, ' ').trim();
  const tech = match[2].replace(/\s+/g, ' ').trim();
  const rightSideLooksLikeTech = /,|React|Next|Node|Docker|TypeScript|Mongo|Easebuzz|Vercel|Tailwind|Azure|VPS|SQL|AI|JavaScript|Python|Ollama|RabbitMQ|Netlify|Heroku|Cloudflare|Zod/i.test(tech);
  if (!rightSideLooksLikeTech) return null;

  return { title, tech };
}

function chunkProjects(section, meta, startIndex) {
  const chunks = [];
  let index = startIndex;
  let current = null;

  const flush = () => {
    if (!current) return;
    const text = [
      current.title,
      current.tech,
      ...current.lines,
    ]
      .filter(Boolean)
      .join(' ');

    if (!isMeaningfulText(text)) return;

    const id = `${meta.resumeType}-${String(index).padStart(3, '0')}`;
    chunks.push(buildChunk({
      id,
      source: meta.source,
      resumeType: meta.resumeType,
      section: 'projects',
      title: current.title,
      text,
      category: 'project',
      tags: inferTags(text, current.title, 'projects', 'project', meta.resumeType),
    }));
    index += 1;
  };

  for (let i = 0; i < section.lines.length; i += 1) {
    const line = section.lines[i];
    const next = section.lines[i + 1] || '';

    const combined = splitCombinedProjectLine(line);
    if (combined) {
      flush();
      current = {
        title: combined.title,
        tech: combined.tech,
        lines: [],
      };
      continue;
    }

    if (isProjectTitleCandidate(line) && (next.startsWith('--') || splitCombinedProjectLine(next))) {
      flush();
      current = {
        title: line.replace(/\s+/g, ' ').trim(),
        tech: '',
        lines: [],
      };
      continue;
    }

    if (!current) continue;

    if (/^--\s*/.test(line)) {
      current.tech = line.replace(/^--\s*/, '').trim();
      continue;
    }

    if (line.startsWith('- ')) {
      current.lines.push(line.replace(/^-+\s*/, '').trim());
      continue;
    }

    current.lines.push(line);
  }

  flush();
  return { chunks, nextIndex: index };
}

function chunkEducation(section, meta, startIndex) {
  const lines = section.lines.filter(Boolean);
  if (!lines.length) return { chunks: [], nextIndex: startIndex };

  const text = lines
    .map(line => line.replace(/^-\s*/, '').trim())
    .join(' ');
  const title = 'Education';
  if (!isMeaningfulText(text)) return { chunks: [], nextIndex: startIndex };

  const chunk = buildChunk({
    id: `${meta.resumeType}-${String(startIndex).padStart(3, '0')}`,
    source: meta.source,
    resumeType: meta.resumeType,
    section: 'education',
    title,
    text,
    category: 'education',
    tags: inferTags(text, title, 'education', 'education', meta.resumeType),
  });

  return { chunks: [chunk], nextIndex: startIndex + 1 };
}

function chunkAwards(section, meta, startIndex) {
  const text = section.lines
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .join(' ');
  const title = 'Awards & Achievements';

  if (!isMeaningfulText(text)) return { chunks: [], nextIndex: startIndex };

  const chunk = buildChunk({
    id: `${meta.resumeType}-${String(startIndex).padStart(3, '0')}`,
    source: meta.source,
    resumeType: meta.resumeType,
    section: 'awards-achievements',
    title,
    text,
    category: 'awards',
    tags: inferTags(text, title, 'awards-achievements', 'awards', meta.resumeType),
  });

  return { chunks: [chunk], nextIndex: startIndex + 1 };
}

function chunkFallback(section, meta, startIndex) {
  const text = section.lines.join(' ');
  const title = section.rawTitle;
  if (!isMeaningfulText(text)) return { chunks: [], nextIndex: startIndex };

  const sectionKey = normalizeSectionKey(section.rawTitle) || 'general';
  const category = sectionKey === 'technologies' ? 'skills' : 'general';

  const chunk = buildChunk({
    id: `${meta.resumeType}-${String(startIndex).padStart(3, '0')}`,
    source: meta.source,
    resumeType: meta.resumeType,
    section: sectionKey,
    title,
    text,
    category,
    tags: inferTags(text, title, sectionKey, category, meta.resumeType),
  });

  return { chunks: [chunk], nextIndex: startIndex + 1 };
}

function splitIntoChunks(text, meta) {
  const sections = splitSections(text);
  const chunks = [];
  let index = 1;

  for (const section of sections) {
    const sectionKey = normalizeSectionKey(section.rawTitle);

    let result;
    if (sectionKey === 'technologies') {
      result = chunkTechnologies(section, meta, index);
    } else if (sectionKey === 'professional-experience') {
      result = chunkProfessionalExperience(section, meta, index);
    } else if (sectionKey === 'projects') {
      result = chunkProjects(section, meta, index);
    } else if (sectionKey === 'education') {
      result = chunkEducation(section, meta, index);
    } else if (sectionKey === 'awards-achievements') {
      result = chunkAwards(section, meta, index);
    } else {
      result = chunkFallback(section, meta, index);
    }

    chunks.push(...result.chunks);
    index = result.nextIndex;
  }

  return chunks;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input || !args.output) {
    console.error('Usage: node scripts/chunk-resume.mjs --input <file> --output <file> [--resume-type ai|fullstack]');
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const raw = fs.existsSync(inputPath) && path.extname(inputPath).toLowerCase() !== '.pdf'
    ? fs.readFileSync(inputPath, 'utf8')
    : '';

  const text = normalizeText(raw, inputPath);
  const chunks = splitIntoChunks(text, {
    source: path.basename(inputPath),
    resumeType: args.resumeType,
  });

  const filtered = chunks.filter(chunk => isMeaningfulText(chunk.text));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(filtered, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${filtered.length} chunks to ${outputPath}`);
}

main();
