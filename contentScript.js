document.addEventListener('mouseup', function(event) {
  const selection = window.getSelection();
  if (!selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.backgroundColor = 'yellow';
    range.surroundContents(span);
    window.getSelection().removeAllRanges();
  }
});
