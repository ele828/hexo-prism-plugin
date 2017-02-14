'use strict';

const fs = require('hexo-fs');
const path = require('path');
const Prism = require('node-prismjs');
require('prismjs/plugins/line-numbers/prism-line-numbers.min');

const map = {
  '&#39;': '\'',
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"'
};

const regex = /<pre><code class="(.*)?">([\s\S]*?)<\/code><\/pre>/igm;

const baseDir = hexo.base_dir;
const prismDir = path.join(baseDir, 'node_modules', 'prismjs');
const prismThemeDir = path.join(prismDir, 'themes');
const prismjsFilePath = path.join(prismThemeDir, 'prism.js');

// Plugin settings from config
let prismThemeName = hexo.config.prism_plugin.theme || '';
let mode = hexo.config.prism_plugin.mode || 'preprocess';
let line_number = hexo.config.prism_plugin.line_number || false;

const prismThemeFileName = 'prism' + (prismThemeName === 'default' ? '' : `-${prismThemeName}`) + '.css';
const prismThemeFilePath = path.join(prismThemeDir, prismThemeFileName);

// Unescape from Marked escape.
function unescape(str) {
  if (!str || str == null) return '';
  var re = new RegExp('(' + Object.keys(map).join('|') + ')', 'g');
  return String(str).replace(re, (match) => map[match]);
};

function PrismPlugin(data) {

  data.content = data.content.replace(regex, (origin, lang, code) => {
    if (lang === 'obj-c') lang = 'objectivec';
    let lineNumbers = line_number ? 'line-numbers' : '';
    const startTag = `<pre class="${lineNumbers} language-${lang}"><code class="language-${lang}">`;
    const endTag = `</code></pre>`;
    code = unescape(code);
    let parsedCode = '';
    if (Prism.languages[lang]) {
      parsedCode = Prism.highlight(code, Prism.languages[lang]);
    }
    else parsedCode = code;
    if (line_number) {
      let match = parsedCode.match(/\n(?!$)/g);
      let linesNum = match ? match.length + 1 : 1;
      let lines = new Array(linesNum + 1);
      lines = lines.join('<span></span>');
      let startLine = '<span aria-hidden="true" class="line-numbers-rows">';
      let endLine = '</span>';
      parsedCode += startLine + lines + endLine;
    }
    return startTag + parsedCode + endTag;
  });

  return data;
}

hexo.extend.filter.register('after_post_render', PrismPlugin);

hexo.extend.generator.register('prism_assets', function () {

  // Register scripts and stylesheets
  let assets = [{
    path: `css/${prismThemeFileName}`,
    data: () => fs.createReadStream(prismThemeFilePath)
  }];
  // If line_number is enabled in plugin config add the corresponding stylesheet
  if(line_number) {
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
});

hexo.extend.filter.register('after_render:html', function (str, data) {

  let css = `<link rel="stylesheet" href="/css/${prismThemeFileName}" type="text/css">`;

  let js = '';

  if(line_number) {
    css += `<link rel="stylesheet" href="/css/prism-line-numbers.css" type="text/css">`;
  }

  if(mode === 'realtime') {
    js +=  '<script src="/js/prism.js"></script>';
    if(line_number) {
      js += '<script src="/js/prism-line-numbers.min.js"></script>';
    }
  }

  str = str.replace(/<\s*\/\s*head\s*>/, css + js + '</head>');
  //console.log('String ', str);
  return str;
});
