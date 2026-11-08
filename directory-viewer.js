(function () {
  var repository = 'Keyfront/Mystery-For-Joy-data_asset_directory';
  var branch = 'main';
  var apiBase = 'https://api.github.com/repos/' + repository + '/contents/';
  var cache = new Map();
  var imageExtensions = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
  var folderIconPath = 'M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.22.78 15 1.75 15h12.5c.97 0 1.75-.78 1.75-1.75V5.56a1.75 1.75 0 0 0-.51-1.24l-2.81-2.81A1.75 1.75 0 0 0 11.44 1Zm0 1.5h8.5v3h4.25v7.75a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V2.75a.25.25 0 0 1 .25-.25Z';
  var fileIconPath = 'M3.75 1h5.69L14 5.56v8.69c0 .97-.78 1.75-1.75 1.75h-8.5A1.75 1.75 0 0 1 2 14.25v-11C2 2.03 2.78 1 3.75 1Zm5.5 1.5v3h3Zm-5.5 0a.25.25 0 0 0-.25.25v11c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25V7h-3A1.75 1.75 0 0 1 7.75 5.25v-2.75Z';

  function encodePath(path) {
    return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  }

  function getEntries(path) {
    if (!cache.has(path)) {
      var url = apiBase + encodePath(path) + '?ref=' + encodeURIComponent(branch);
      cache.set(path, fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(function (response) {
        if (!response.ok) {
          throw new Error('GitHub API returned ' + response.status + ' for "' + (path || 'root') + '".');
        }
        return response.json();
      }).then(function (entries) {
        if (!Array.isArray(entries)) {
          throw new Error('GitHub API returned an invalid directory listing for "' + (path || 'root') + '".');
        }
        return entries;
      }));
    }
    return cache.get(path);
  }

  function makeIcon(isDirectory) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('class', 'file-icon');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    path.setAttribute('d', isDirectory ? folderIconPath : fileIconPath);
    svg.appendChild(path);
    return svg;
  }

  function formatSize(size) {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderListing(container, entries) {
    var heading = document.createElement('div');
    heading.className = container.dataset.headingClass || 'panel-heading';
    var nameHeading = document.createElement('span');
    var infoHeading = document.createElement('span');
    nameHeading.textContent = 'Name';
    infoHeading.textContent = container.dataset.column || 'Size';
    heading.append(nameHeading, infoHeading);
    container.replaceChildren(heading);

    entries.sort(function (a, b) {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    entries.forEach(function (entry) {
      var isDirectory = entry.type === 'dir';
      var row = document.createElement('div');
      var name = document.createElement('div');
      var link = document.createElement('a');
      var info = document.createElement('span');
      row.className = 'file-row';
      row.dataset.search = entry.name.toLowerCase();
      name.className = 'file-name';
      if (isDirectory) {
        link.href = encodeURIComponent(entry.name) + '/';
      } else if (imageExtensions.test(entry.name)) {
        link.href = encodeURIComponent(entry.name);
      } else {
        var root = document.body.dataset.viewerRoot || '';
        link.href = root + 'file.html?path=' + encodeURIComponent(entry.path || entry.name);
      }
      link.textContent = entry.name + (isDirectory ? '/' : '');
      info.className = 'file-info';
      info.textContent = isDirectory ? 'Directory' : formatSize(entry.size);
      name.append(makeIcon(isDirectory), link);
      row.append(name, info);
      container.appendChild(row);
    });

    var empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No files match your search.';
    empty.hidden = true;
    container.appendChild(empty);

    var search = document.getElementById('file-search');
    if (search) {
      search.addEventListener('input', function () {
        var query = search.value.trim().toLowerCase();
        var visibleCount = 0;
        Array.prototype.forEach.call(container.querySelectorAll('.file-row'), function (row) {
          row.hidden = row.dataset.search.indexOf(query) === -1;
          if (!row.hidden) visibleCount += 1;
        });
        empty.hidden = visibleCount > 0;
      });
      search.dispatchEvent(new Event('input'));
    }
  }

  function showError(status, error) {
    console.error(error);
    status.textContent = 'Unable to load this directory. ' + error.message + ' Check your connection or GitHub API rate limit, then reload the page.';
    status.setAttribute('role', 'alert');
  }

  function findPreview(entries) {
    var images = entries.filter(function (entry) {
      return entry.type === 'file' && imageExtensions.test(entry.name);
    });
    var latest = images.find(function (entry) { return entry.name.toLowerCase() === 'latest.png'; });
    return (latest && latest.size > 0 ? latest : null) ||
      images.find(function (entry) { return entry.size > 0; }) ||
      latest ||
      images[0] || null;
  }

  function renderDirectoryPreview(entries, directory) {
    var section = document.querySelector('[data-directory-preview]');
    if (!section) return;
    var title = section.querySelector('[data-preview-title]');
    var content = section.querySelector('[data-preview-content]');
    var preview = findPreview(entries);
    content.replaceChildren();
    if (!preview || preview.size === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      var strong = document.createElement('strong');
      strong.textContent = 'No preview available';
      empty.appendChild(strong);
      empty.appendChild(document.createTextNode(preview ? 'This image file is empty (0 B).' : 'No image files in this directory.'));
      content.appendChild(empty);
      title.textContent = preview ? preview.name : 'Image preview';
      return;
    }

    var link = document.createElement('a');
    var image = document.createElement('img');
    link.className = 'preview-image-link';
    link.href = encodeURIComponent(preview.name);
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', 'Open full-size ' + preview.name);
    image.src = encodeURIComponent(preview.name);
    image.alt = preview.name;
    link.appendChild(image);
    content.appendChild(link);
    title.textContent = preview.name;
  }

  function renderGallery(rootEntries) {
    var gallery = document.querySelector('[data-schedule-gallery]');
    if (!gallery) return Promise.resolve();
    var folders = rootEntries.filter(function (entry) {
      return entry.type === 'dir' && entry.name === 'images';
    });
    if (!folders.length) return Promise.resolve();

    return getEntries('images').then(function (imageEntries) {
      var schedules = imageEntries.filter(function (entry) { return entry.type === 'dir'; });
      var count = document.querySelector('[data-schedule-count]');
      if (count) count.textContent = schedules.length;
      var summary = document.querySelector('[data-content-summary]');
      if (summary) summary.textContent = schedules.length + ' schedule folders';

      return Promise.all(schedules.map(function (folder) {
        var path = 'images/' + folder.name;
        return getEntries(path).then(function (files) {
          return { folder: folder, files: files, preview: findPreview(files) };
        });
      })).then(function (results) {
        gallery.replaceChildren();
        results.forEach(function (result) {
          var card = document.createElement('article');
          var top = document.createElement('div');
          var folderLink = document.createElement('a');
          var size = document.createElement('span');
          var preview = document.createElement(result.preview && result.preview.size > 0 ? 'a' : 'div');
          card.className = 'preview-card';
          top.className = 'preview-top';
          folderLink.className = 'preview-title';
          folderLink.href = 'images/' + encodeURIComponent(result.folder.name) + '/';
          folderLink.textContent = result.folder.name;
          size.className = 'preview-size';
          size.textContent = result.preview ? formatSize(result.preview.size) : 'No image';
          top.append(folderLink, size);
          preview.className = 'preview-image';
          if (result.preview && result.preview.size > 0) {
            var image = document.createElement('img');
            var imagePath = 'images/' + encodeURIComponent(result.folder.name) + '/' + encodeURIComponent(result.preview.name);
            preview.href = imagePath;
            preview.target = '_blank';
            preview.rel = 'noopener';
            image.src = imagePath;
            image.alt = 'Latest schedule image for ' + result.folder.name;
            preview.appendChild(image);
          } else {
            var empty = document.createElement('div');
            var strong = document.createElement('strong');
            empty.className = 'preview-empty';
            strong.textContent = 'No preview available';
            empty.appendChild(strong);
            empty.appendChild(document.createTextNode(result.preview ? result.preview.name + ' is empty.' : 'No image file found.'));
            preview.appendChild(empty);
          }
          card.append(top, preview);
          gallery.appendChild(card);
        });
      });
    });
  }

  var directory = document.body.dataset.directory;
  var listing = document.querySelector('[data-directory-list]');
  var status = document.querySelector('[data-directory-status]');
  if (!listing || !status) return;
  status.textContent = 'Loading files...';

  getEntries(directory).then(function (entries) {
    renderListing(listing, entries);
    status.textContent = entries.length + ' items';
    renderDirectoryPreview(entries, directory);
    return renderGallery(entries);
  }).catch(function (error) {
    showError(status, error);
    var gallery = document.querySelector('[data-schedule-gallery]');
    if (gallery) {
      var message = document.createElement('p');
      message.className = 'preview-empty';
      message.textContent = 'Schedule previews could not be loaded.';
      gallery.replaceChildren(message);
    }
  });
})();
