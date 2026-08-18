import fs from 'fs';
import path from 'path';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author: string;
  readTime: string;
  category: string;
  coverImage?: string;
}

export interface Post extends PostMeta {
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');

function parseFrontmatter(rawContent: string) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: rawContent };

  const frontmatterStr = match[1] || '';
  const content = match[2] || '';

  const data: Record<string, string> = {};
  frontmatterStr.split(/\r?\n/).forEach((line) => {
    const splitIndex = line.indexOf(':');
    if (splitIndex > -1) {
      const key = line.slice(0, splitIndex).trim();
      let value = line.slice(splitIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      data[key] = value;
    }
  });

  return { data, content };
}

function parseMeta(filename: string): PostMeta {
  const slug = filename.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8');
  const { data } = parseFrontmatter(raw);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || '2026-01-01',
    excerpt: data.excerpt || '',
    author: data.author || 'PaperLens Team',
    readTime: data.readTime || '3 min read',
    category: data.category || 'General',
    coverImage: data.coverImage || undefined,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(parseMeta)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);

  let filePath = null;
  if (fs.existsSync(mdxPath)) filePath = mdxPath;
  else if (fs.existsSync(mdPath)) filePath = mdPath;

  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = parseFrontmatter(raw);

  return {
    slug,
    title: data.title || 'Untitled',
    date: data.date || '2026-01-01',
    excerpt: data.excerpt || '',
    author: data.author || 'PaperLens Team',
    readTime: data.readTime || '3 min read',
    category: data.category || 'General',
    coverImage: data.coverImage || undefined,
    content,
  };
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getAllCategories(): string[] {
  const cats = getAllPosts().map((p) => p.category);
  return [...new Set(cats)].sort();
}

export function getPostsByCategory(category: string): PostMeta[] {
  const normalised = category.toLowerCase();
  return getAllPosts().filter((p) => p.category.toLowerCase() === normalised);
}
