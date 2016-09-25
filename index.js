'use strict'

const fs = require('hexo-fs');
const path = require('path');
const Prism = require('./prism.js');

const map = {
  '&#39;': '\'',
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"'
};

const regex = /<pre><code class="(.*)?">([\s\S]*?)<\/code><\/pre>/igm;

// Unescape from Marked escape.
function unescape(str) {
  if (!str || str == null) return '';
  var re = new RegExp('(' + Object.keys(map).join('|') + ')', 'g');
  return String(str).replace(re, (match) => map[match]);
};

const baseDir = hexo.base_dir;
const pluginDir = path.join(
    baseDir, 'node_modules', 'hexo-prism-plugin');
const themeDir = path.join(pluginDir, 'themes');
const libUri = path.join(pluginDir, 'prism.js');

// Process sub-directory
let configRoot = hexo.config.root;
if (configRoot && configRoot !== '/') {
  if (configRoot[configRoot.length - 1] === '/')
    configRoot = configRoot.slice(0, configRoot.length - 1);
} else
  configRoot = '';

function PrismPlugin(data) {
  let theme = hexo.config.prism_plugin.theme  || '';
  let mode = hexo.config.prism_plugin.mode || 'preprocess';

  // Copy script and stylesheet files
  if (theme === 'default') theme = '';
  else {
    theme = '-' + theme;
  }
  const themeFile = 'prism' + theme + '.css';
  const themeUri = path.join(themeDir, themeFile);
  fs.copyFile(themeUri, path.join(baseDir, 'public', 'css', themeFile));

  if (mode === 'realtime') {
    fs.copyFile(path.join(pluginDir, 'prism.js'),
      path.join(baseDir, 'public', 'js', 'prism.js'));
  }

  data.content = data.content.replace(regex, (origin, lang, code) => {
    if (lang === 'obj-c') lang = 'objectivec';
    const startTag = `<pre class="language-${lang}"><code class="language-${lang}">`;
    const endTag = `</code></pre>`;
    code = unescape(code);
    let parsedCode = '';
    if (Prism.languages[lang]) {      
      parsedCode = Prism.highlight(code, Prism.languages[lang]);
    }
    else parsedCode = code;
    return startTag + parsedCode + endTag;
  });

  // Inject script and stylesheet to post pages
  let jsImports = '';
  if (mode === 'realtime') {
    jsImports = `<script src="${configRoot}/js/prism.js"></script>`;
  }
  let cssImports = `<link href="${configRoot}/css/${themeFile}" rel="stylesheet">`;
  data.content += cssImports + jsImports;
  return data;
}

hexo.extend.filter.register('after_post_render', PrismPlugin);