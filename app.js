const input = document.querySelector('#files');
const dropzone = document.querySelector('#dropzone');
const message = document.querySelector('#message');
const uploadScreen = document.querySelector('#upload-screen');
const resultsScreen = document.querySelector('#results-screen');
const accounts = document.querySelector('#accounts');
const search = document.querySelector('#search');
const languageToggle = document.querySelector('#language-toggle');

let analysis = { following: 0, followers: 0, notFollowing: [], youDontFollow: [] };
let selectedList = 'not-following';
let language = 'pt';

const translations = {
  pt: {
    heroEyebrow: 'ANÁLISE 100% LOCAL',
    heroTitle: 'Quem te segue<br />de volta?',
    heroDescription: 'Importe o arquivo baixado do Instagram e compare suas listas sem enviar seus dados para ninguém.',
    uploadTitle: 'Importe o seu export',
    uploadHint: 'Envie o ZIP gerado pela Central de Contas, ou os arquivos JSON <code>followers_*.json</code> e <code>following.json</code>.',
    dropzoneTitle: 'Arraste seus arquivos aqui',
    dropzoneDescription: 'ou clique para selecionar',
    fileHelpTitle: 'Onde encontro esses arquivos?',
    fileHelpDescription: 'No download em JSON do Instagram, eles costumam ficar em <code>connections/followers_and_following</code>.',
    exportButton: 'Gerar export no Instagram',
    resultsEyebrow: 'RESULTADO',
    resultsTitle: 'Sua rede em números',
    restartButton: 'Analisar outro arquivo',
    analysisSummary: 'Resumo da análise',
    followingLabel: 'você segue',
    followersLabel: 'te seguem',
    notFollowingLabel: 'não seguem de volta',
    accountLists: 'Listas de contas',
    notFollowingTab: 'Não te seguem',
    youDontFollowTab: 'Você não segue',
    searchPlaceholder: 'Buscar usuário',
    copyButton: 'Copiar lista',
    copiedButton: 'Copiado!',
    readingExport: 'Lendo o seu export…',
    missingFiles: 'Não encontrei followers_*.json e following.json. Confira se você selecionou o ZIP completo ou os dois JSONs.',
    processingError: 'Não foi possível processar estes arquivos.',
    account: 'conta',
    accounts: 'contas',
    found: 'encontrada',
    foundPlural: 'encontradas',
    switchLanguage: 'English',
    switchLanguageLabel: 'Mudar para inglês'
  },
  en: {
    heroEyebrow: '100% LOCAL ANALYSIS',
    heroTitle: 'Who follows you<br />back?',
    heroDescription: 'Import your Instagram download and compare your lists without sending your data anywhere.',
    uploadTitle: 'Import your export',
    uploadHint: 'Upload the ZIP generated in Accounts Center, or the <code>followers_*.json</code> and <code>following.json</code> files.',
    dropzoneTitle: 'Drop your files here',
    dropzoneDescription: 'or click to select them',
    fileHelpTitle: 'Where can I find these files?',
    fileHelpDescription: 'In Instagram JSON downloads, they are usually under <code>connections/followers_and_following</code>.',
    exportButton: 'Create an Instagram export',
    resultsEyebrow: 'RESULTS',
    resultsTitle: 'Your network at a glance',
    restartButton: 'Analyze another file',
    analysisSummary: 'Analysis summary',
    followingLabel: 'you follow',
    followersLabel: 'follow you',
    notFollowingLabel: 'do not follow back',
    accountLists: 'Account lists',
    notFollowingTab: 'Do not follow back',
    youDontFollowTab: 'You do not follow',
    searchPlaceholder: 'Search username',
    copyButton: 'Copy list',
    copiedButton: 'Copied!',
    readingExport: 'Reading your export…',
    missingFiles: 'Could not find followers_*.json and following.json. Select the complete ZIP or both JSON files.',
    processingError: 'Could not process these files.',
    account: 'account',
    accounts: 'accounts',
    found: 'found',
    foundPlural: 'found',
    switchLanguage: 'Português',
    switchLanguageLabel: 'Switch to Portuguese'
  }
};

function translate(key) {
  return translations[language][key];
}

function applyTranslations() {
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
  });
  languageToggle.textContent = translate('switchLanguage');
  languageToggle.setAttribute('aria-label', translate('switchLanguageLabel'));
  renderList();
}

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
    throw new Error(translate('missingFiles'));
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
    message.textContent = translate('readingExport');
    analysis = parseExport(await readSelection(fileList));
    showResults();
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : translate('processingError');
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
  const accountLabel = translate(users.length === 1 ? 'account' : 'accounts');
  const suffix = search.value ? ' ' + translate(users.length === 1 ? 'found' : 'foundPlural') : '';
  document.querySelector('#list-summary').textContent = users.length + ' ' + accountLabel + suffix;
}

function showResults() {
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  document.querySelector('#following-total').textContent = analysis.following.toLocaleString(locale);
  document.querySelector('#followers-total').textContent = analysis.followers.toLocaleString(locale);
  document.querySelector('#not-following-total').textContent = analysis.notFollowing.length.toLocaleString(locale);
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
  button.textContent = translate('copiedButton');
  setTimeout(() => { button.textContent = translate('copyButton'); }, 1500);
});

languageToggle.addEventListener('click', () => {
  language = language === 'pt' ? 'en' : 'pt';
  applyTranslations();
});

document.querySelector('#restart').addEventListener('click', () => {
  input.value = '';
  message.textContent = '';
  search.value = '';
  resultsScreen.hidden = true;
  uploadScreen.hidden = false;
});

applyTranslations();
