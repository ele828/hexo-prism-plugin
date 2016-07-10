# Hexo-Prism-Plugin

Since `highlight.js` didn't support JSX syntax properly, I wrote this plugin to replace
Hexo's default code highlight plugin.

## Install
```
npm i -S hexo-prism-plugin
```
## Usage
First, you should edit your `_config.yml` by adding following configuration.

```yaml
prism_plugin:
  mode: 'preprocess'    # realtime/preprocess
  theme: 'default'
```

- `mode`:
  - realtime  (Parse code on browser in real time)
  - preprocess  (Preprocess code in node)

- `theme`:
  - default
  - coy
  - dark
  - funky
  - okaidia
  - solarizedlight
  - tomorrow
  - twilight

And then, clean and generate project by running command:

```
hexo clean
```

```
hexo g
```

Note: if you change theme, you should re-generate your project.

## License
MIT