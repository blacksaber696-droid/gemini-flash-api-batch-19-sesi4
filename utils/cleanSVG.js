export default function cleanSVG(svgText) {
  if (!svgText) return "";

  const match = svgText.match(/<svg[\s\S]*<\/svg>/i);
  if (!match) return "";

  return match[0];
}
