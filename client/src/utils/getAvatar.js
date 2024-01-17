export function getRandomAvatarUrl() {
  const avatarFunctions = [getAvatarUrl1, getAvatarUrl2, getAvatarUrl4, getAvatarUrl5, getAvatarUrl6];

  const randomIndex = Math.floor(Math.random() * avatarFunctions.length);
  return avatarFunctions[randomIndex]();
}

function getAvatarUrl1() {
  const seed = Math.random().toString(36).substring(2, 15);
  return `https://robohash.org/${seed}.png`;
}

function getAvatarUrl2() {
  const hash = Math.random().toString(36).substring(2, 15);
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}

function getAvatarUrl4() {
  const seed = Math.random().toString(36).substring(2, 15);
  return `https://source.boringavatars.com/beam/120/${seed}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`;
}

function getAvatarUrl5() {
  const seed = Math.random().toString(36).substring(2, 15);
  return `https://api.multiavatar.com/${seed}.png`;
}

function getAvatarUrl6() {
  const seed = Math.random().toString(36).substring(2, 15);
  return `https://robohash.org/${seed}.png?set=set4`;
}
