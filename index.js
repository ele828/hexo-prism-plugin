'use strict';

const fs = require('hexo-fs');
const path = require('path');
const Prism = require('node-prismjs');

const map = {
  '&#39;': '\'',
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"'
};

const regex = /<pre><code class="(.*)?">([\s\S]*?)<\/code><\/pre>/igm;
const captionRegex = /<p><code>(.*?)\s(.*?)\n([\s\S]*)<\/code><\/p>/igm;

const baseDir = hexo.base_dir;
const rootPath = hexo.config.root || '/';
const prismDir = path.join(baseDir, 'node_modules', 'prismjs');
const prismThemeDir = path.join(prismDir, 'themes');
const prismjsFilePath = path.join(prismThemeDir, 'prism.js');

// If prism plugin has not been configured,
// it cannot be initialized properly.
if (!hexo.config.prism_plugin) return;

// Plugin settings from config
const prismThemeName = hexo.config.prism_plugin.theme || '';
const mode = hexo.config.prism_plugin.mode || 'preprocess';
const line_number = hexo.config.prism_plugin.line_number || false;

const prismThemeFileName = 'prism' + (prismThemeName === 'default' ? '' : `-${prismThemeName}`) + '.css';
const prismThemeFilePath = path.join(prismThemeDir, prismThemeFileName);

/**
 * Unescape from Marked escape
 * @param {String} str
 * @return {String}
 */
function unescape(str) {
  if (!str || str == null) return '';
  const re = new RegExp('(' + Object.keys(map).join('|') + ')', 'g');
  return String(str).replace(re, (match) => map[match]);
};

/**
 * Code transform for prism plugin.
 * @param {Object} data
 * @return {Object}
 */
function PrismPlugin(data) {
  // Patch for caption support
  if (captionRegex.test(data.content)) {
    // Attempt to parse the code
    data.content = data.content.replace(captionRegex, (origin, lang, caption, code) => {
      if (!lang || !caption || !code) return origin;
      return `<figcaption>${caption}</figcaption><pre><code class="${lang}">${code}</code></pre>`;
    })
  }

  data.content = data.content.replace(regex, (origin, lang, code) => {
    const lineNumbers = line_number ? 'line-numbers' : '';
    const startTag = `<pre class="${lineNumbers} language-${lang}"><code class="language-${lang}">`;
    const endTag = `</code></pre>`;
    code = unescape(code);
    let parsedCode = '';
    if (Prism.languages[lang]) {
      parsedCode = Prism.highlight(code, Prism.languages[lang]);
    } else {
      parsedCode = code;
    }
    if (line_number) {
      const match = parsedCode.match(/\n(?!$)/g);
      const linesNum = match ? match.length + 1 : 1;
      let lines = new Array(linesNum + 1);
      lines = lines.join('<span></span>');
      const startLine = '<span aria-hidden="true" class="line-numbers-rows">';
      const endLine = '</span>';
      parsedCode += startLine + lines + endLine;
    }
    return startTag + parsedCode + endTag;
  });

  return data;
}

/**
 * Copy asset to hexo public folder.
 */
function copyAssets() {
  const assets = [{
    path: `css/${prismThemeFileName}`,
    data: () => fs.createReadStream(prismThemeFilePath)
  }];

  // If line_number is enabled in plugin config add the corresponding stylesheet
  if (line_number) {
    assets.push({
      path: 'css/prism-line-numbers.css',
      data: () => fs.createReadStream(path.join(prismDir, 'plugins/line-numbers', 'prism-line-numbers.css'))
    });
  }

  // If prism plugin config mode is realtime include prism.js and line-numbers.js
  if (mode === 'realtime') {
    assets.push({
      path: 'js/prism.js',
      data: () => fs.createReadStream(path.join(prismDir, 'prism.js'))
    });
    if (line_number) {
      assets.push({
        path: 'js/prism-line-numbers.min.js',
        data: () => fs.createReadStream(path.join(prismDir, 'plugins/line-numbers', 'prism-line-numbers.min.js'))
      });
    }
  }

  return assets;
}

/**
 * Injects code to html for importing assets.
 * @param {String} code
 * @param {Object} data
 */
function importAssets(code, data) {
  const js = [];
  const css = [
    `<link rel="stylesheet" href="${rootPath}css/${prismThemeFileName}" type="text/css">`
  ];

  if (line_number) {
    css.push(`<link rel="stylesheet" href="${rootPath}css/prism-line-numbers.css" type="text/css">`);
  }
  if (mode === 'realtime') {
    js.push(`<script src="${rootPath}js/prism.js"></script>`);
    if (line_number) {
      js.push(`<script src="${rootPath}js/prism-line-numbers.min.js"></script>`);
    }
  }
  const imports = css.join('\n') + js.join('\n');

  // Avoid duplicates
  if (code.indexOf(imports) > -1) {
    return code;
  }
  return code.replace(/<\s*\/\s*head\s*>/, imports + '</head>');;
}

// Register prism plugin
hexo.extend.filter.register('after_post_render', PrismPlugin);

// Register to append static assets
hexo.extend.generator.register('prism_assets', copyAssets);

// Register for importing static assets
hexo.extend.filter.register('after_render:html', importAssets);
