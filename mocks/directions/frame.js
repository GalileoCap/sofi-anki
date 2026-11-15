// One screen alone at phone width, when the URL names it: ?only=<template id>, with &state=<class>
// and &dark=1 if wanted. The comparison page (index.html) frames each direction's screens this way.
const params = new URLSearchParams(location.search);
const only = params.get("only");
if (only) {
  document.querySelector(".page").hidden = true;
  document.body.classList.add("solo-page");
  const host = document.createElement("div");
  host.className = ["phone", "theme", "solo", params.get("dark") && "dark", params.get("state")].filter(Boolean).join(" ");
  host.innerHTML = `<div class="dir" data-screen data-template="${only}"></div>`;
  document.body.prepend(host);
}
