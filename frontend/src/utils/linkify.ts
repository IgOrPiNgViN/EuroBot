// Превращает адреса вида https://... в тексте HTML в кликабельные ссылки.
// Новости из ВК приходят простым текстом, и ссылки в них не кликаются.
// Теги и уже существующие <a>…</a> не трогаем.

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi
// Знаки препинания в конце адреса обычно относятся к предложению, а не к ссылке
const TRAILING_RE = /[.,;:!?)»"'\]]+$/

function linkifyText(text: string): string {
  return text.replace(URL_RE, (match) => {
    const trailing = match.match(TRAILING_RE)?.[0] ?? ''
    const url = trailing ? match.slice(0, -trailing.length) : match
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${trailing}`
  })
}

export function linkifyHtml(html: string): string {
  if (!html) return html
  let insideLink = 0
  // Делим на теги и текст между ними; ссылки ищем только в тексте вне <a>
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<a[\s>]/i.test(part)) insideLink++
        else if (/^<\/a\s*>/i.test(part)) insideLink = Math.max(0, insideLink - 1)
        return part
      }
      return insideLink ? part : linkifyText(part)
    })
    .join('')
}
