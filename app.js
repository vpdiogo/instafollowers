const input = document.querySelector('#files');
const dropzone = document.querySelector('#dropzone');
const message = document.querySelector('#message');
const uploadScreen = document.querySelector('#upload-screen');
const resultsScreen = document.querySelector('#results-screen');
const accounts = document.querySelector('#accounts');
const search = document.querySelector('#search');
const languageToggle = document.querySelector('#language-toggle');
const privacyInfo = document.querySelector('#privacy-info');
const privacyNote = document.querySelector('#privacy-note');

let analysis = { following: 0, followers: 0, notFollowing: [], youDontFollow: [] };
let selectedList = 'not-following';
let language = 'pt';

const translations = {
  pt: {
    heroEyebrow: 'ANÁLISE 100% LOCAL',
    heroTitle: 'Quem te segue<br />de volta?',
    heroDescription: 'Importe o arquivo baixado do Instagram e compare suas listas sem enviar seus dados para ninguém.',
    privacyInfoLabel: 'Saiba como seus dados são processados',
    privacyNote: 'Seus arquivos são processados diretamente neste navegador. O ZIP, sua lista de seguidores e suas credenciais não são enviados nem armazenados em servidores.',
    uploadTitle: 'Importe seus dados',
    uploadHint: 'Envie o ZIP completo gerado pela Central de Contas.',
    dropzoneTitle: 'Arraste seu ZIP aqui',
    dropzoneDescription: 'ou clique para selecionar',
    fileHelpTitle: 'O que o ZIP precisa conter?',
    fileHelpDescription: '<p>Para gerar um arquivo completo e mais confiável:</p><ol><li>Na Central de Contas, escolha baixar suas informações e selecione sua conta.</li><li>Se quiser um arquivo menor, marque apenas <strong>Seguidores e seguindo</strong>.</li><li>Escolha <strong>JSON</strong> como formato de arquivo — é o formato recomendado.</li><li>Em intervalo de datas, selecione <strong>Desde o início</strong>. Períodos menores podem não conter todos os seguidores.</li></ol><p>Também aceitamos ZIPs em HTML, mas JSON é a melhor opção.</p>',
    exportButton: 'Exportar seus dados do Instagram',
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
    missingFiles: 'Não encontrei os arquivos de seguidores e seguindo em JSON ou HTML dentro do ZIP.',
    zipOnly: 'Selecione apenas um arquivo ZIP completo.',
    processingError: 'Não foi possível processar estes arquivos.',
    account: 'conta',
    accounts: 'contas',
    found: 'encontrada',
    foundPlural: 'encontradas',
    jsonSource: 'Dados lidos do export em JSON',
    htmlSource: 'Dados lidos do export em HTML',
    switchLanguage: 'English',
    switchLanguageLabel: 'Mudar para inglês'
  },
  en: {
    heroEyebrow: '100% LOCAL ANALYSIS',
    heroTitle: 'Who follows you<br />back?',
    heroDescription: 'Import your Instagram download and compare your lists without sending your data anywhere.',
    privacyInfoLabel: 'Learn how your data is processed',
    privacyNote: 'Your files are processed directly in this browser. Your ZIP, follower list, and credentials are not uploaded to or stored on servers.',
    uploadTitle: 'Import your data',
    uploadHint: 'Upload the complete ZIP generated in Accounts Center.',
    dropzoneTitle: 'Drop your ZIP here',
    dropzoneDescription: 'or click to select them',
    fileHelpTitle: 'What does the ZIP need to include?',
    fileHelpDescription: '<p>For a complete, more reliable export:</p><ol><li>In Accounts Center, choose to download your information and select your account.</li><li>For a smaller file, select only <strong>Followers and following</strong>.</li><li>Choose <strong>JSON</strong> as the file format — it is recommended.</li><li>For the date range, select <strong>All time</strong>. Shorter periods may not include every follower.</li></ol><p>HTML ZIPs are also supported, but JSON is the best option.</p>',
    exportButton: 'Export your Instagram data',
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
    missingFiles: 'Could not find follower and following files in JSON or HTML inside the ZIP.',
    zipOnly: 'Select one complete ZIP file only.',
    processingError: 'Could not process these files.',
    account: 'account',
    accounts: 'accounts',
    found: 'found',
    foundPlural: 'found',
    jsonSource: 'Data read from the JSON export',
    htmlSource: 'Data read from the HTML export',
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

function usersFromJson(data) {
  const entries = Array.isArray(data)
    ? data
    : data.relationships_following || data.relationships_followers || [];
  return new Set(entries.map(getUsername).filter(Boolean));
}

function getHtmlUsername(href) {
  const match = href.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
  return (match?.[1] || '').replace(/^@/, '').trim().toLowerCase();
}

function usersFromHtml(content) {
  const linkedUsers = [...content.matchAll(/href=["']([^"']*instagram\.com[^"']*)["']/gi)]
    .map(match => getHtmlUsername(match[1]))
    .filter(Boolean);
  if (linkedUsers.length) return new Set(linkedUsers);

  const document = new DOMParser().parseFromString(content, 'text/html');
  const headings = [...document.querySelectorAll('h2')]
    .map(heading => heading.textContent.replace(/^@/, '').trim().toLowerCase())
    .filter(username => /^[a-z0-9._]{1,30}$/i.test(username));
  return new Set(headings);
}

function getExportFiles(entries, format) {
  const connectionsEntries = entries.filter(({ name }) => /(^|\/)connections\/followers_and_following\//i.test(name));
  const targetEntries = connectionsEntries.length ? connectionsEntries : entries;
  const followersFiles = targetEntries.filter(({ name }) => new RegExp('(^|/)followers(?:_\\d+)?\\.' + format + '$', 'i').test(name));
  const followingFile = targetEntries.find(({ name }) => new RegExp('(^|/)following\\.' + format + '$', 'i').test(name));
  return { followersFiles, followingFile };
}

function parseExport(entries) {
  const jsonFiles = getExportFiles(entries, 'json');
  const htmlFiles = getExportFiles(entries, 'html');
  const exportFiles = jsonFiles.followersFiles.length && jsonFiles.followingFile ? jsonFiles : htmlFiles;
  const format = jsonFiles.followersFiles.length && jsonFiles.followingFile ? 'json' : 'html';

  if (!exportFiles.followersFiles.length || !exportFiles.followingFile) {
    throw new Error(translate('missingFiles'));
  }

  const followers = new Set();
  const getUsers = format === 'json' ? usersFromJson : usersFromHtml;
  for (const file of exportFiles.followersFiles) {
    for (const user of getUsers(file.content)) followers.add(user);
  }
  const following = getUsers(exportFiles.followingFile.content);

  return {
    format,
    followers: followers.size,
    following: following.size,
    notFollowing: [...following].filter(user => !followers.has(user)).sort(),
    youDontFollow: [...followers].filter(user => !following.has(user)).sort()
  };
}

async function readSelection(fileList) {
  if (fileList.length !== 1 || !fileList[0].name.toLowerCase().endsWith('.zip')) {
    throw new Error(translate('zipOnly'));
  }

  const entries = [];
  const zip = await JSZip.loadAsync(fileList[0]);
  for (const [name, zipFile] of Object.entries(zip.files)) {
    if (!zipFile.dir && /\.(json|html)$/i.test(name)) {
      entries.push({ name, content: await zipFile.async('text') });
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
  document.querySelector('#data-format').textContent = translate(analysis.format + 'Source');
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

privacyInfo.addEventListener('click', () => {
  const expanded = privacyInfo.getAttribute('aria-expanded') === 'true';
  privacyInfo.setAttribute('aria-expanded', String(!expanded));
  privacyNote.hidden = expanded;
});

document.querySelector('#restart').addEventListener('click', () => {
  input.value = '';
  message.textContent = '';
  search.value = '';
  resultsScreen.hidden = true;
  uploadScreen.hidden = false;
});

applyTranslations();
