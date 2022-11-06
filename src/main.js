import {relayPool} from 'nostr-tools';
import {elem} from './domutil.js';

const pool = relayPool();
pool.addRelay('wss://nostr.x1ddos.ch', {read: true, write: true});
pool.addRelay('wss://nostr.bitcoiner.social/', {read: true, write: true});

const feedlist = document.querySelector('#feedlist');

function onEvent(evt, relay) {
  console.log(`event from ${relay}`, evt);
  const time = new Date(evt.created_at * 1000);
  const text = `${evt.content} - ${time.toISOString()}`; // TODO: Intl.DateTimeFormat
  const img = elem('img', {className: 'mbox-img', src: 'bubble.svg'}, '');
  const body = elem('div', {className: 'mbox-body'}, [text]);
  const art = elem('article', {className: 'mbox'}, [img, body]);
  feedlist.append(art);
}

pool.sub({
  cb: onEvent,
  filter: {authors: [
    '52155da703585f25053830ac39863c80ea6adc57b360472c16c566a412d2bc38', // quark
    'a6057742e73ff93b89587c27a74edf2cdab86904291416e90dc98af1c5f70cfa', // mosc
    '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d', // fiatjaf
    '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'  // jb55
  ]}
});
