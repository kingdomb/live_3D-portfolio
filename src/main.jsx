import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

// Single Page Apps for GitHub Pages — decodes the redirect public/404.html
// produces back into the original URL before React Router sees it.
// https://github.com/rafgraph/spa-github-pages
(function (l) {
  if (l.search[1] === '/') {
    var decoded = l.search
      .slice(1)
      .split('&')
      .map(function (s) {
        return s.replace(/~and~/g, '&');
      })
      .join('?');
    window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
  }
})(window.location);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
