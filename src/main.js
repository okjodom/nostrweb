import {relayPool, generatePrivateKey, getPublicKey, signEvent} from 'nostr-tools';
import {elem} from './domutil.js';
// curl -H 'accept: application/nostr+json' https://nostr.x1ddos.ch
const pool = relayPool();
pool.addRelay('wss://nostr.x1ddos.ch', {read: true, write: true});
// pool.addRelay('wss://nostr.bitcoiner.social/', {read: true, write: true});
pool.addRelay('wss://nostr.openchain.fr', {read: true, write: true});
pool.addRelay('wss://relay.nostr.info', {read: true, write: true});
// pool.addRelay('wss://relay.damus.io', {read: true, write: true});
// read only
// pool.addRelay('wss://nostr.rocks', {read: true, write: false});
// pool.addRelay('wss://nostr-relay.wlvs.space', {read: true, write: false});

const dateTime = new Intl.DateTimeFormat('de-ch' /* navigator.language */, {
  dateStyle: 'short',
  timeStyle: 'medium',
});
let max = 0;

function onEvent(evt, relay) {
  if (max++ >= 223) {
    return subscription.unsub();
  }
  switch (evt.kind) {
    case 0:
      handleMetadata(evt, relay);
      break;
    case 1:
      handleTextNote(evt, relay);
      break;
    case 2:
      handleRecommendServer(evt, relay);
      break;
    case 3:
      updateContactList(evt, relay);
      break;
    default:
      // console.log(`TODO: add support for event kind ${evt.kind}`/*, evt*/)
  }
}

// const pubkey = localStorage.getItem('pub_key')

const subscription = pool.sub({
  cb: onEvent,
  filter: {
    // authors: [
    //   '52155da703585f25053830ac39863c80ea6adc57b360472c16c566a412d2bc38', // quark
    //   'a6057742e73ff93b89587c27a74edf2cdab86904291416e90dc98af1c5f70cfa', // mosc
    //   '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d', // fiatjaf
    //   '52155da703585f25053830ac39863c80ea6adc57b360472c16c566a412d2bc38', // x1ddos
    //   // pubkey, // me
    //   '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',  // jb55
    // ],
    limit: 200,
  }
});

const textNoteList = [];
const replyList = [];
const eventRelayMap = {};
const hasEventTag = tag => tag[0] === 'e';

function handleTextNote(evt, relay) {
  if (eventRelayMap[evt.id]) {
    eventRelayMap[evt.id] = [relay, ...(eventRelayMap[evt.id])];
  } else {
    eventRelayMap[evt.id] = [relay];
    if (evt.tags.some(hasEventTag)) {
      replyList.push(evt)
      if (feedDomMap[evt.tags[0][1]]) {
        console.log('CALL ME', evt.tags[0][1], feedDomMap[evt.tags[0][1]]);
      }
    } else {
      textNoteList.push(evt);
    }
    renderFeed();
  }
}

// feed
const feedContainer = document.querySelector('#feed');
const feedDomMap = {};
const sortByCreatedAt = (evt1, evt2) => {
  if (evt1.created_at ===  evt2.created_at) {
    // console.log('TODO: OMG exactly at the same time, figure out how to sort then', evt1, evt2);
  }
  return evt1.created_at > evt2.created_at ? -1 : 1;
};

let debounceDebugMessageTimer;
function renderFeed() {
  const sortedFeeds = textNoteList.sort(sortByCreatedAt).reverse();
  // debug
  clearTimeout(debounceDebugMessageTimer);
  debounceDebugMessageTimer = setTimeout(() => {
    console.log(`${sortedFeeds.reverse().map(e => dateTime.format(e.created_at * 1000)).join('\n')}`)
  }, 2000);
  sortedFeeds.forEach((textNoteEvent, i) => {
    if (feedDomMap[textNoteEvent.id]) {
      // TODO check eventRelayMap if event was published to different relays
      return;
    }
    const article = createTextNote(textNoteEvent, eventRelayMap[textNoteEvent.id]);
    feedDomMap[textNoteEvent.id] = article;
    if (i === 0) {
      feedContainer.append(article);
    } else {
      feedDomMap[sortedFeeds[i - 1].id].before(article);
    }
  });
}

const sortEventCreatedAt = (evt) => (
  {created_at: a},
  {created_at: b},
) => (
  Math.abs(a - evt.created_at) < Math.abs(b - evt.created_at) ? -1 : 1
);

function createTextNote(evt, relay) {
  const {host, img, isReply, replies, time, userName} = getMetadata(evt, relay);
  const headerInfo = isReply ? [
    elem('strong', {title: evt.pubkey}, userName)
  ] : [
    elem('strong', {title: evt.pubkey}, userName),
    elem('span', {
      title: `Event ${evt.id}
      ${isReply ? `\nReply ${evt.tags[0][1]}\n` : ''}\n${time}`
    }, ` on ${host} `),
  ];
  const body = elem('div', {className: 'mbox-body'}, [
    elem('header', {
      className: 'mbox-header',
    }, [
      elem('small', {}, headerInfo),
    ]),
    evt.content, // text
    replies[0] ? elem('div', {className: 'mobx-replies'}, replies.map(e => createTextNote(e, relay))) : '',
  ]);
  return rendernArticle([img, body]);
}

function handleRecommendServer(evt, relay) {
  if (feedDomMap[evt.id]) {
    // TODO event might also be published to different relays
    return;
  }
  const art = renderRecommendServer(evt, relay);
  if (textNoteList.length < 2) {
    feedContainer.append(art);
    return;
  }
  const closestTextNotes = textNoteList.sort(sortEventCreatedAt(evt));
  feedDomMap[closestTextNotes[0].id].after(art);
  feedDomMap[evt.id] = art;
}

function renderRecommendServer(evt, relay) {
  const {host, img, time, userName} = getMetadata(evt, relay);
  const body = elem('div', {className: 'mbox-body', title: dateTime.format(time)}, [
    elem('header', {className: 'mbox-header'}, [
      elem('small', {}, [
        elem('strong', {}, userName),
        ` on ${host} `,
      ]),
    ]),
    `recommends server: ${evt.content}`,
  ]);
  return rendernArticle([img, body], {className: 'mbox-recommend-server'});
}

function rendernArticle(content, props) {
  const className = ['mbox', props?.className].join(' ');
  return elem('article', {...props, className}, content);
}

const userList = [];
const tempContactList = {};

function handleMetadata(evt, relay) {
  try {
    const content = JSON.parse(evt.content);
    setMetadata(evt, relay, content);
  } catch(err) {
    console.log(evt);
    console.error(err);
  }
}

function setMetadata(evt, relay, content) {
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
      // console.log('TODO: add contact list (kind 3)', updates);
    }
  }
}

const getHost = (url) => {
  try {
    return new URL(url).host;
  } catch(e) {
    return false;
  }
}

function getMetadata(evt, relay) {
  const host = getHost(relay[0]);
  const user = userList.find(user => user.pubkey === evt.pubkey);
  const userImg = /*user?.metadata[relay]?.picture || */'bubble.svg'; // TODO: enable pic once we have proxy
  const userName = user?.metadata[relay]?.name || evt.pubkey.slice(0, 8);
  const userAbout = user?.metadata[relay]?.about || '';
  const isReply = evt.tags.some(hasEventTag);
  const img = elem('img', {
    className: 'mbox-img',
    src: userImg,
    alt: `${userName}@${host}`,
    title: userAbout},
    ''
  );
  const replies = replyList.filter((reply) => reply.tags[0][1] === evt.id);
  const time = new Date(evt.created_at * 1000);
  return {host, img, isReply, replies, time, userName};
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

// send
const sendStatus = document.querySelector('#sendstatus');
const onSendError = err => {
  sendStatus.textContent = err.message;
  sendStatus.hidden = false;
};
const publish = document.querySelector('#publish');
publish.addEventListener('click', async () => {
  const pubkey = localStorage.getItem('pub_key');
  const privatekey = localStorage.getItem('private_key');
  if (!pubkey || !privatekey) {
    return onSendError(new Error('no pubkey/privatekey'));
  }
  if (!input.value) {
    return onSendError(new Error('message is empty'));
  }
  const newEvent = {
    kind: 1,
    pubkey,
    content: input.value,
    tags: [],
    created_at: Math.floor(Date.now() * 0.001),
  };
  const sig = await signEvent(newEvent, privatekey).catch(onSendError);
  if (sig) {
    const ev = await pool.publish({...newEvent, sig}, (status, url) => {
      if (status === 0) {
        console.info(`publish request sent to ${url}`);
      }
      if (status === 1) {
        sendStatus.hidden = true;
        input.value = '';
        publish.disabled = true;
        console.info(`event published by ${url}`, ev);
      }
    });
  }
});

const input = document.querySelector('input[name="message"]');
input.addEventListener('input', () => publish.disabled = !input.value);

// settings
const form = document.querySelector('form[name="settings"]');
const privateKeyInput = form.querySelector('#privatekey');
const pubKeyInput = form.querySelector('#pubkey');
const statusMessage = form.querySelector('#keystatus');
const generateBtn = form.querySelector('button[name="generate"]');
const importBtn = form.querySelector('button[name="import"]');
const privateTgl = form.querySelector('button[name="privatekey-toggle"]');

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
