function redirectLegacyWriting() {
  if (window.location.hash === '#writing') {
    window.location.replace('/blog.html');
  }
}

window.addEventListener('hashchange', redirectLegacyWriting);
redirectLegacyWriting();
