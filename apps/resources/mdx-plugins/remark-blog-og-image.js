const fs = require('node:fs');
const path = require('node:path');

const BACKSLASH_PATTERN = /\\/g;
const BLOG_PATH_PATTERN = /(?:^|\/)blog\/[^/]+\/([^/]+)\.mdx?$/;
const OG_ASSET_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function toPosixPath(value) {
  return value.replace(BACKSLASH_PATTERN, '/');
}

function resolveBlogOgImageUrl(filePath) {
  const normalizedFilePath = toPosixPath(filePath);
  const match = normalizedFilePath.match(BLOG_PATH_PATTERN);
  if (!match) return undefined;

  const slug = match[1];
  const sourceDirectory = path.dirname(filePath);
  const assetsDirectory = path.resolve(sourceDirectory, '../../assets');

  for (const extension of OG_ASSET_EXTENSIONS) {
    const absolutePath = path.join(assetsDirectory, `${slug}-og${extension}`);
    if (fs.existsSync(absolutePath)) {
      const relativePath = toPosixPath(
        path.relative(sourceDirectory, absolutePath),
      );
      return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    }
  }

  return undefined;
}

function firstBodyChildIndex(children) {
  const index = children.findIndex(
    (node) => node.type !== 'yaml' && node.type !== 'mdxjsEsm',
  );
  return index === -1 ? children.length : index;
}

function hasImageUrl(tree, imageUrl) {
  const stack = [...(tree.children ?? [])];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node.type === 'image' && node.url === imageUrl) return true;
    if (Array.isArray(node.children)) {
      stack.push(...node.children);
    }
  }
  return false;
}

function remarkBlogOgImage() {
  return (tree, file) => {
    if (!Array.isArray(tree.children)) return;

    const filePath = file?.path || file?.history?.[0];
    if (!filePath) return;

    const imageUrl = resolveBlogOgImageUrl(filePath);
    if (!imageUrl || hasImageUrl(tree, imageUrl)) return;

    tree.children.splice(firstBodyChildIndex(tree.children), 0, {
      type: 'image',
      url: imageUrl,
      alt: '',
    });
  };
}

module.exports = remarkBlogOgImage;
module.exports.default = remarkBlogOgImage;
