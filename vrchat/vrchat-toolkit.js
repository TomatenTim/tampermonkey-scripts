// ==UserScript==
// @name         VRChat Toolkit
// @namespace    https://github.com/TomatenTim/tampermonkey-scripts
// @version      0.1.
// @description  Simple toolkit for the VRChat homepage
// @author       TomatenTim
// @match        https://vrchat.com/*
// @connect      api.vrclist.com
// @grant        GM_xmlhttpRequest
// @grant        window.focus
// @updateURL    https://raw.githubusercontent.com/TomatenTim/tampermonkey-scripts/main/vrchat/vrchat-toolkit.js
// @downloadURL  https://raw.githubusercontent.com/TomatenTim/tampermonkey-scripts/main/vrchat/vrchat-toolkit.js
// ==/UserScript==


// url change watcher
let urlOld = null;
setInterval(() => {
  const urlNew = new URL(location.href);
  if (urlOld && urlOld.pathname == urlNew.pathname) {
    return;
  }
  urlOld = urlNew;
  handleUrlChange(urlNew);
}, 100)

// handles url Changes
function handleUrlChange(url) {
  if (url.pathname.startsWith('/home/world/')) {
    modifyPageWorldDetails();
  }
}


async function modifyPageWorldDetails() {

  // wait for data to be loaded
  await waitForElem('[aria-label="World Info"]');

  const worldInfoElem = document.querySelector('[aria-label="World Info"]');

  const spacer = document.querySelector('[aria-label="World Info"]').children[1]

  worldInfoElem.append(spacer.cloneNode());
  worldInfoElem.append(getButtonElem('VRCX', 'vrcx', 'world', getIdFromUrl()));
  worldInfoElem.append(spacer.cloneNode());
  worldInfoElem.append(getButtonElem('VRCList', 'vrcList', 'world', getIdFromUrl()));
  worldInfoElem.append(spacer.cloneNode());
  worldInfoElem.append(getButtonElem('VRCW', 'vrcw', 'world', getIdFromUrl()));


}

function getButtonElem(label, platform, type, id) {

  const handleClick = async (e) => {

    if (e.button >= 2) {
      return;
    }

    e.preventDefault();

    const url = await getUrlByPlatformAndTypeAndID(platform, type, id)

    var handle = window.open(url, platform == 'vrcx' ? '_self' : '_blank');

    // if middle click
    if (e.button == 1) {
      window.focus();
    }

  }

  var linkElem = document.createElement('a');
  linkElem.href = '#';
  linkElem.textContent = label;
  linkElem.addEventListener('click', handleClick);
  linkElem.addEventListener('auxclick', handleClick);


  return linkElem;
}

async function getUrlByPlatformAndTypeAndID(platform, type, _id) {

  let id;

  // if vrcList world check for the vrcList world id
  if (platform == 'vrcList' && type == 'world') {
    id = await resolveWorldID2VRCListID(_id)
    // if world not found redirect user to search
    if (!id) {
      platform += '_search'
    }
  }

  // if id not set (no remote fetching / not found) set it from param
  if (!id) {
    id = _id;
  }

  const urlByPlatformAndType = {
    vrchat: {
      world: `https://vrchat.com/home/world/${id}`,
      avatar: `https://vrchat.com/home/avatar/${id}`,
      group: `https://vrchat.com/home/group/${id}`,
      user: `https://vrchat.com/home/user/${id}`,
    },
    vrcx: {
      world: `vrcx://world/${id}`,
      avatar: `vrcx://avatar/${id}`,
      group: `vrcx://group/${id}`,
      user: `vrcx://user/${id}`,
    },
    vrcList: {
      world: `https://vrclist.com/world/${id}`,
      // user: `https://vrclist.com/?type=search&query=${id}`,
    },
    vrcList_search: {
      world: `https://vrclist.com/?type=search&query=${id}`,
      // user: `https://vrclist.com/?type=search&query=${id}`,
    },
    vrcw: {
      world: `https://en.vrcw.net/world/detail/${id}`,
    },
  }

  let url = '#'

  // if platfrom and type found set url
  if (urlByPlatformAndType[platform] && urlByPlatformAndType[platform][type]) {
    url = urlByPlatformAndType[platform][type];
  }

  return url;

}

function getWorldSpacer() {
  return document.querySelector('[aria-label="World Info"]');
}


// send a request to vrcList to resolve the ID to the VRCList ID
async function resolveWorldID2VRCListID(id) {

  try {

    const r = await GM.xmlHttpRequest({
      url: 'https://api.vrclist.com/worlds/search',
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      responseType: 'json',
      data: JSON.stringify({
        "name_author_id": id,
        "tags": "",
        "sort": "recent",
        "exclude_visited": false,
        "quest_only": false,
        "page": 0
      })
    });

    const data = await JSON.parse(r.responseText);
    return data[0].id;

  } catch (e) {
    return null
  }
}


// get ID from the URL
function getIdFromUrl(url) {
  url = url || location.pathname;
  const regex = /(grp|avtr|wrld)\_([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})$/
  return url.match(regex)[0];
}

// https://stackoverflow.com/a/61511955
function waitForElem(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}



