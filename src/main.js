import {relayPool, generatePrivateKey, getPublicKey, signEvent} from 'nostr-tools';
import {elem} from './domutil.js';
// curl -H 'accept: application/nostr+json' https://nostr.x1ddos.ch
const pool = relayPool();
pool.addRelay('wss://nostr.x1ddos.ch', {read: true, write: true});
// pool.addRelay('wss://nostr.bitcoiner.social/', {read: true, write: true});
// pool.addRelay('wss://nostr.openchain.fr', {read: true, write: true});
// pool.addRelay('wss://relay.nostr.info', {read: true, write: true});
// pool.addRelay('wss://relay.damus.io', {read: true, write: true});
// read only
// pool.addRelay('wss://nostr.rocks', {read: true, write: false});
// pool.addRelay('wss://nostr-relay.wlvs.space', {read: true, write: false});

const feedlist = document.querySelector('#feedlist');

const dateTime = new Intl.DateTimeFormat(navigator.language, {
  dateStyle: 'full',
  timeStyle: 'long',
});

const userList = [];
let max = 0;

function onEvent(evt, relay) {
  if (max++ >= 23) {
    return subscription.unsub();
  }
  switch (evt.kind) {
    case 0:
      try {
        const content = JSON.parse(evt.content);
        setMetadata(userList, relay, evt, content);
      } catch(err) {
        console.error(err);
      }
      break;
    case 1:
      renderTextNote(evt, relay);
      break;
    case 2:
      renderRecommendServer(evt, relay);
      break;
    case 3:
      updateContactList(evt, relay);
      break;
    default:
      console.log(`TODO: add support for event kind ${evt.kind}`, evt)
  }
}

const pubkey = localStorage.getItem('pub_key')
console.log({pubkey})

const subscription = pool.sub({
  cb: onEvent,
  filter: {
    authors: [
      // '52155da703585f25053830ac39863c80ea6adc57b360472c16c566a412d2bc38', // quark
      // 'a6057742e73ff93b89587c27a74edf2cdab86904291416e90dc98af1c5f70cfa', // mosc
      '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d', // fiatjaf
      pubkey, // me
      // '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245'  // jb55
    ]
  }
});

function renderTextNote(evt, relay) {
  if (evt.tags.length) {
    console.log('has tags', evt)
  }
  const [host, img, time, userName] = getMetadata(evt, relay);
  const style = evt.tags.some(tag => tag[0] === 'e') && 'padding-left: 2rem';
  const body = elem('div', {
    className: 'mbox-body',
    title: dateTime.format(time),
    ...(style && {style})
  }, [
    renderProfile(userName, host),
    elem('div', {}, evt.id),
    evt.content // text
  ]);
  rendernArticle([img, body]);
}

function renderRecommendServer(evt, relay) {
  const [host, img, time, userName] = getMetadata(evt, relay);
  const body = elem('div', {className: 'mbox-body', title: dateTime.format(time)}, [
    renderProfile(userName, host),
    `recommends server: ${evt.content}`
  ]);
  rendernArticle([img, body]);
}

function renderProfile(userName, host) {
  return elem('header', {className: 'mbox-header'}, [
    elem('small', {}, [elem('strong', {}, userName), ` on ${host}`]),
  ]);
}

function rendernArticle(content) {
  const art = elem('article', {className: 'mbox'}, content);
  feedlist.prepend(art);
}

function getMetadata(evt, relay) {
  const {host} = new URL(relay);
  const user = userList.find(user => user.pubkey === evt.pubkey);
  const userImg = /*user?.metadata[relay]?.picture || */'bubble.svg'; // enable pic once we have proxy
  const userName = user?.metadata[relay]?.name || evt.pubkey.slice(0, 8);
  const userAbout = user?.metadata[relay]?.about || '';
  const img = elem('img', {
    className: 'mbox-img',
    src: userImg,
    alt: `${userName}@${host}`,
    title: userAbout},
    '');
  const time = new Date(evt.created_at * 1000);
  return [host, img, time, userName];
}

const tempContactList = {};

function setMetadata(userList, relay, evt, content) {
  const user = userList.find(u => u.pubkey === evt.pubkey);
  if (!user) {
    userList.push({
      metadata: {
        [relay]: content
      },
      pubkey: evt.pubkey,
    });
  } else {
    user.metadata[relay] = {
      ...user.metadata[relay],
      timestamp: evt.created_at,
      ...content,
    };
  }
  if (tempContactList[relay]) {
    const updates = tempContactList[relay].filter(update => update.pubkey === evt.pubkey);
    if (updates) {
      console.log('TODO: add contact list (kind 3)', updates);
    }
  }
}

function updateContactList(evt, relay) {
  const user = userList.find(u => u.pupkey === evt.pubkey);
  if (user) {
    console.log(`TODO: add contact list for ${evt.pubkey.slice(0, 8)} on ${relay}`, evt.tags);
  } else {
    tempContactList[relay] = tempContactList[relay]
      ? [...tempContactList[relay], evt]
      : [evt];
  }
}

// check pool.status

// publish
const publish = document.querySelector('#publish');
publish.addEventListener('click', async () => {
  const pubkey = localStorage.getItem('pub_key');
  const privatekey = localStorage.getItem('private_key');
  if (!pubkey || !privatekey) {
    return console.warn('no pubkey/privatekey');
  }
  const newEvent = {
    kind: 1,
    pubkey,
    content: 'geil',
    tags: [],
    created_at: Math.floor(Date.now() * 0.001),
  };
  const sig = await signEvent(newEvent, privatekey);
  const ev = await pool.publish({...newEvent, sig}, (status, url) => {
    if (status === 0) {
      console.log(`publish request sent to ${url}`)
    }
    if (status === 1) {
      console.log(`event published by ${url}`, ev)
    }
  });
});

// settings
const form = document.querySelector('form[name="settings"]');
const privateKeyInput = form.querySelector('#privatekey');
const pubKeyInput = form.querySelector('#pubkey');
const statusMessage = form.querySelector('#keystatus');
const generateBtn = form.querySelector('button[name="generate"]');
const importBtn = form.querySelector('button[name="import"]');
const privateTgl = form.querySelector('button[name="privatekey-toggle"]')

generateBtn.addEventListener('click', () => {
  const privatekey = generatePrivateKey();
  const pubkey = getPublicKey(privatekey);
  if (validKeys(privatekey, pubkey)) {
    privateKeyInput.value = privatekey;
    pubKeyInput.value = pubkey;
    statusMessage.textContent = 'private-key created!';
    statusMessage.hidden = false;
  }
});

importBtn.addEventListener('click', () => {
  const privatekey = privateKeyInput.value;
  const pubkey = pubKeyInput.value;
  if (validKeys(privatekey, pubkey)) {
    localStorage.setItem('private_key', privatekey);
    localStorage.setItem('pub_key', pubkey);
    statusMessage.textContent = 'stored private and public key locally!';
    statusMessage.hidden = false;
  }
});

form.addEventListener('input', () => validKeys(privateKeyInput.value, pubKeyInput.value));

function validKeys(privatekey, pubkey) {
  if (pubkey && privatekey) {
    try {
      if (getPublicKey(privatekey) === pubkey) {
        statusMessage.hidden = true;
        statusMessage.textContent = 'public-key corresponds to private-key';
        importBtn.removeAttribute('disabled');
        return true;
      } else {
        statusMessage.textContent = 'private-key does not correspond to public-key!'
      }
    } catch (e) {
      statusMessage.textContent = `not a valid private-key: ${e.message || e}`;
    }
  }
  statusMessage.hidden = false;
  importBtn.setAttribute('disabled', true);
  return  false;
}

privateTgl.addEventListener('click', () => {
  privateKeyInput.type = privateKeyInput.type === 'text' ? 'password' : 'text';
});

privateKeyInput.value = localStorage.getItem('private_key');
pubKeyInput.value = localStorage.getItem('pub_key');
