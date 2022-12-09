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

function isValidURL(url) {
    if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
    }
    if (!['', '443', '80'].includes(url.port)) {
        return false;
    }
    const lastDot = url.hostname.lastIndexOf('.');
    if (lastDot < 1) {
        return false;
    }
    if (url.hostname.slice(lastDot) === '.local') {
        return false;
    }
    return true;
}

export function parseTextContent(string) {
    let firstLink;
    return [string
        .trimRight()
        .replaceAll(/\n{3,}/g, '\n\n')
        .split('\n')
        .map(line => {
            const words = line.split(' ');
            return words.map(word => {
                if (!word.match(/(https?:\/\/|www\.)\S*/)) {
                    return word;
                }
                try {
                    if (!word.startsWith('http')) {
                        word = 'https://' + word;
                    }
                    const url = new URL(word);
                    if (!isValidURL(url)) {
                        return word;
                    }
                    firstLink = firstLink || url.href;
                    return elem('a', {
                        href: url.href,
                        target: '_blank',
                        rel: 'noopener noreferrer'
                    }, url.href.slice(url.protocol.length + 2));
                } catch (err) {
                    return word;
                }
            })
            .reduce((acc, word) => [...acc, word, ' '], []);
        })
        .reduce((acc, words) => [...acc, ...words, elem('br')], []),
        {firstLink}];
}
