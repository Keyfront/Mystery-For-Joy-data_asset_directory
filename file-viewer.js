(function () {
  var repository = 'Keyfront/Mystery-For-Joy-data_asset_directory';
  var branch = 'main';
  var path = new URLSearchParams(window.location.search).get('path');
  var status = document.querySelector('[data-file-status]');
  var name = document.querySelector('[data-file-name]');
  var stats = document.querySelector('[data-file-stats]');
  var breadcrumb = document.querySelector('[data-file-breadcrumb]');
  var codeLines = document.querySelector('[data-code-lines]');
  var codeWrap = document.querySelector('[data-code-wrap]');
  var apiBase = 'https://api.github.com/repos/' + repository + '/contents/';

  function encodePath(filePath) {
    return filePath.split('/').map(encodeURIComponent).join('/');
  }

  function setError(message) {
    status.textContent = message;
    status.setAttribute('role', 'alert');
  }

  function setLinks(filePath, downloadUrl) {
    var github = document.querySelector('[data-github-link]');
    var raw = document.querySelector('[data-raw-link]');
    var download = document.querySelector('[data-download-link]');
    var githubUrl = 'https://github.com/' + repository + '/blob/' + branch + '/' + encodePath(filePath);
    github.href = githubUrl;
    raw.href = downloadUrl;
    download.href = downloadUrl;
  }

  function renderBreadcrumb(filePath) {
    var parts = filePath.split('/');
    parts.forEach(function (part, index) {
      breadcrumb.appendChild(document.createTextNode(' / '));
      if (index === parts.length - 1) {
        var current = document.createElement('span');
        current.textContent = part;
        current.setAttribute('aria-current', 'page');
        breadcrumb.appendChild(current);
      } else {
        var link = document.createElement('a');
        link.href = './' + parts.slice(0, index + 1).map(encodeURIComponent).join('/') + '/';
        link.textContent = part;
        breadcrumb.appendChild(link);
      }
    });
  }

  function decodeContent(content) {
    var binary = window.atob(content.replace(/\s/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

  function isBinary(text) {
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text);
  }

  function renderCode(text) {
    if (isBinary(text)) {
      setError('This file appears to be binary and cannot be displayed as source code. Use Download or Raw to open it.');
      return;
    }
    var lines = text ? text.split(/\r\n|\n|\r/) : [];
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    var fragment = document.createDocumentFragment();
    lines.forEach(function (line, index) {
      var row = document.createElement('tr');
      var number = document.createElement('td');
      var source = document.createElement('td');
      var code = document.createElement('code');
      number.className = 'line-number';
      number.textContent = index + 1;
      source.className = 'line-code';
      code.textContent = line || ' ';
      source.appendChild(code);
      row.append(number, source);
      fragment.appendChild(row);
    });
    codeLines.replaceChildren(fragment);
    codeWrap.hidden = false;
    status.hidden = true;
    stats.textContent = lines.length + ' lines · ' + new Blob([text]).size + ' Bytes';
  }

  if (!path || path.split('/').some(function (part) { return !part || part === '.' || part === '..'; })) {
    name.textContent = 'Invalid file path';
    setError('No valid repository file was specified.');
    return;
  }

  name.textContent = path.split('/').pop();
  document.title = name.textContent + ' — Mystery For Joy';
  renderBreadcrumb(path);
  var apiUrl = apiBase + encodePath(path) + '?ref=' + encodeURIComponent(branch);

  fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } }).then(function (response) {
    if (!response.ok) {
      throw new Error('GitHub API returned ' + response.status + ' while loading "' + path + '".');
    }
    return response.json();
  }).then(function (file) {
    if (file.type !== 'file' || typeof file.download_url !== 'string') {
      throw new Error('GitHub API did not return a readable file for "' + path + '".');
    }
    setLinks(path, file.download_url);
    var contentPromise;
    if (file.encoding === 'base64' && typeof file.content === 'string' && file.content.length) {
      contentPromise = Promise.resolve(decodeContent(file.content));
    } else {
      contentPromise = fetch(file.download_url).then(function (response) {
        if (!response.ok) throw new Error('Unable to download the source file (HTTP ' + response.status + ').');
        return response.text();
      });
    }
    return contentPromise;
  }).then(function (text) {
    renderCode(text);
  }).catch(function (error) {
    console.error(error);
    setError(error.message + ' Check your connection or GitHub API rate limit, then reload the page.');
  });
})();
