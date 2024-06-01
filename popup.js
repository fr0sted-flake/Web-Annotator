document.getElementById('highlightColor').addEventListener('input', function(event) {
    localStorage.setItem('highlightColor', event.target.value);
  });
  
  document.getElementById('exportAnnotations').addEventListener('click', function() {
    chrome.storage.sync.get('annotations', (data) => {
      let annotations = data.annotations || [];
      let blob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' });
      let url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: 'annotations.json'
      });
    });
  });
  