export function cleanScrapedMarkdown(md: string): string {
  let out = md;

  // Remove common footer/company blocks
  const blocksToRemove = [
    /\n?Visitors:\n[\s\S]*?(?=\n\n|$)/gi,
    /\n?Powered by:[\s\S]*?(?=\n\n|$)/gi,
    /\n?Developed by:[\s\S]*?(?=\n\n|$)/gi,
    /\n?\[Leaflet\][\s\S]*?\(http[^)]*vassarlabs\.com[^)]*\)[\s\S]*?(?=\n\n|$)/gi,
  ];
  for (const re of blocksToRemove) out = out.replace(re, '\n');

  // Remove logo images explicitly
  out = out
    .replace(/!\]\(https:\/\/ingres\.iith\.ac\.in\/assets\/images\/logoIIT\.png\)/gi, '')
    .replace(/!\]\(https?:\/\/ingres\.iith\.ac\.in\/assets\/images\/footer-logo\.png\)/gi, '');

  // Trim excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n').trim();
  return out;
}


