document.addEventListener('mouseup', function() {
    let selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      let highlightColor = localStorage.getItem('highlightColor') || 'yellow';
      let span = document.createElement('span');
      span.style.backgroundColor = highlightColor;
      span.classList.add('highlight');
      span.textContent = selectedText;
  
      let range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
  
      let note = prompt('Add a note (optional):');
      if (note) {
        span.setAttribute('data-note', note);
        span.classList.add('note');
      }
  
      saveAnnotation(span);
    }
  });
  
  function saveAnnotation(span) {
    let annotations = JSON.parse(localStorage.getItem('annotations') || '[]');
    annotations.push({
      text: span.textContent,
      color: span.style.backgroundColor,
      note: span.getAttribute('data-note') || '',
      position: getXPathForElement(span)
    });
    localStorage.setItem('annotations', JSON.stringify(annotations));
  }
  
  function getXPathForElement(element) {
    const idx = (sib, name) => sib ? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name) : 1;
    const segs = el => !el || el.nodeType !== 1 ? [''] : 
      el.id && document.getElementById(el.id) === el ? [`id("${el.id}")`] : 
      [...segs(el.parentNode), `${el.localName}[${idx(el)}]`];
    return segs(element).join('/');
  }
  