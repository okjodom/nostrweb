/**
 * example usage:
 *
 *   const props = {className: 'btn', onclick: async (e) => alert('hi')};
 *   const btn = elem('button', props, ['download']);
 *   document.body.append(btn);
 *
 * @param {string} name
 * @param {HTMLElement.prototype} props
 * @param {Array<HTMLElement|string>} children
 * @return HTMLElement
 */
export function elem(name = 'div', {data, ...props} = {}, children = []) {
    const el = document.createElement(name);
    Object.assign(el, props);
    if (['number', 'string'].includes(typeof children)) {
        el.append(children);
    } else {
        el.append(...children);
    }
    if (data) {
        Object.entries(data).forEach(([key, value]) => el.dataset[key] = value);
    }
    return el;
}

/**
 * Renders line breaks
 *
 * @param {string} text with newlines
 * @return Array<TextNode | HTMLBRElement>
 */
export function multilineText(string) {
  return string
    .trimRight()
    .split('\n')
    .reduce((acc, next, i) => acc.concat(i === 0 ? next : [elem('br'), next]), []);
}
