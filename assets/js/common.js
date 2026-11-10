// The abstract, award and bibtex buttons: each shows its part of the entry and hides the others. Listened for on
// the document, so the entries of a page shown later (swap.js) have them too.
const ENTRY_PARTS = ["abstract", "award", "bibtex"];
ENTRY_PARTS.forEach((part) =>
  $(document).on("click", `a.${part}`, function () {
    const entry = $(this).parent().parent();
    ENTRY_PARTS.forEach((other) => entry.find(other === part ? `.${other}.hidden` : `.${other}.hidden.open`).toggleClass("open"));
  })
);

// What a page's content needs set up: on a page load, the page; for a page shown later, its panel (swap.js).
function setUpContent(root) {
  const $root = $(root);
  $root.find("a").removeClass("waves-effect waves-light");

  // bootstrap-toc
  const $myNav = $root.find("#toc-sidebar");
  if ($myNav.length) {
    // remove related publications years from the TOC
    $root.find(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    Toc.init($myNav);
    $("body").scrollspy({
      target: "#toc-sidebar",
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $root.find(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $root.find('[data-toggle="popover"]').popover({
    trigger: "hover",
  });
}

$(document).ready(() => setUpContent(document));
document.addEventListener("swap:content", (e) => setUpContent(e.target));
