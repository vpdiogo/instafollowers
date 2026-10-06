const input = document.querySelector('#files');
const dropzone = document.querySelector('#dropzone');
const message = document.querySelector('#message');
const uploadScreen = document.querySelector('#upload-screen');
const resultsScreen = document.querySelector('#results-screen');
const accounts = document.querySelector('#accounts');
const search = document.querySelector('#search');

let analysis = { following: 0, followers: 0, notFollowing: [], youDontFollow: [] };
let selectedList = 'not-following';

function getUsername(entry) {
  const data = entry?.string_list_data?.[0];
  const fromUrl = data?.href?.split('/').filter(Boolean).pop();
  return (data?.value || fromUrl || '').replace(/^@/, '').trim().toLowerCase();
}

function toUsers(data) {
  const entries = Array.isArray(data)
    ? data
    : data.relationships_following || data.relationships_followers || [];
  return new Set(entries.map(getUsername).filter(Boolean));
}

function parseExport(entries) {
  const followersFiles = entries.filter(({ name }) => /(^|\/)followers(?:_\d+)?\.json$/i.test(name));
  const followingFile = entries.find(({ name }) => /(^|\/)following\.json$/i.test(name));

  if (!followersFiles.length || !followingFile) {
    throw new Error('Não encontrei followers_*.json e following.json. Confira se você selecionou o ZIP completo ou os dois JSONs.');
  }

  const followers = new Set();
  for (const file of followersFiles) {
    for (const user of toUsers(file.data)) followers.add(user);
  }
  const following = toUsers(followingFile.data);

  return {
    followers: followers.size,
    following: following.size,
    notFollowing: [...following].filter(user => !followers.has(user)).sort(),
    youDontFollow: [...followers].filter(user => !following.has(user)).sort()
  };
}

async function readSelection(fileList) {
  const entries = [];
  for (const file of fileList) {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);
      for (const [name, zipFile] of Object.entries(zip.files)) {
        if (!zipFile.dir && name.toLowerCase().endsWith('.json')) {
          entries.push({ name, data: JSON.parse(await zipFile.async('text')) });
        }
      }
    } else if (file.name.toLowerCase().endsWith('.json')) {
      entries.push({ name: file.name, data: JSON.parse(await file.text()) });
    }
  }
  return entries;
}

async function handleFiles(fileList) {
  try {
    message.textContent = 'Lendo o seu export…';
    analysis = parseExport(await readSelection(fileList));
    showResults();
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : 'Não foi possível processar estes arquivos.';
  }
}

function currentUsers() {
  const key = selectedList === 'not-following' ? 'notFollowing' : 'youDontFollow';
  const term = search.value.trim().toLowerCase();
  return analysis[key].filter(user => user.includes(term));
}

function renderList() {
  const users = currentUsers();
  accounts.replaceChildren(...users.map(user => {
    const item = document.createElement('li');
    const initial = document.createElement('span');
    initial.className = 'avatar';
    initial.textContent = user.slice(0, 1).toUpperCase();
    const link = document.createElement('a');
    link.href = `https://www.instagram.com/${encodeURIComponent(user)}/`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = `@${user}`;
    item.append(initial, link);
    return item;
  }));
  document.querySelector('#list-summary').textContent = `${users.length} conta${users.length === 1 ? '' : 's'}${search.value ? ' encontrada(s)' : ''}`;
}

function showResults() {
  document.querySelector('#following-total').textContent = analysis.following.toLocaleString('pt-BR');
  document.querySelector('#followers-total').textContent = analysis.followers.toLocaleString('pt-BR');
  document.querySelector('#not-following-total').textContent = analysis.notFollowing.length.toLocaleString('pt-BR');
  document.querySelector('#not-following-badge').textContent = analysis.notFollowing.length;
  document.querySelector('#you-dont-follow-badge').textContent = analysis.youDontFollow.length;
  uploadScreen.hidden = true;
  resultsScreen.hidden = false;
  renderList();
}

input.addEventListener('change', () => {
  if (input.files.length) handleFiles(input.files);
});

for (const eventName of ['dragenter', 'dragover']) {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.add('dragging');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  dropzone.addEventListener(eventName, event => {
    event.preventDefault();
    dropzone.classList.remove('dragging');
  });
}
dropzone.addEventListener('drop', event => {
  if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
});

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  selectedList = tab.dataset.list;
  search.value = '';
  document.querySelectorAll('.tab').forEach(button => {
    const active = button === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  renderList();
}));

search.addEventListener('input', renderList);

document.querySelector('#copy').addEventListener('click', async () => {
  const button = document.querySelector('#copy');
  await navigator.clipboard.writeText(currentUsers().map(user => `@${user}`).join('\n'));
  button.textContent = 'Copiado!';
  setTimeout(() => { button.textContent = 'Copiar lista'; }, 1500);
});

document.querySelector('#restart').addEventListener('click', () => {
  input.value = '';
  message.textContent = '';
  search.value = '';
  resultsScreen.hidden = true;
  uploadScreen.hidden = false;
});
