(() => {
  const toc = document.querySelector(".post-single > .toc");
  const navigation = toc?.querySelector("#TableOfContents");
  if (!navigation) return;

  navigation.setAttribute("aria-label", "文章目录");
  const branches = new Map();
  navigation.querySelectorAll("li").forEach((item, index) => {
    const link = item.querySelector(":scope > a");
    if (!link) return;

    let depth = 0;
    let ancestorList = item.parentElement.parentElement.closest("ul");
    while (ancestorList && navigation.contains(ancestorList)) {
      depth += 1;
      ancestorList = ancestorList.parentElement.closest("ul");
    }
    link.style.setProperty("--toc-depth", depth);

    const row = document.createElement("div");
    row.className = "toc-row";
    link.before(row);
    row.append(link);

    const children = item.querySelector(":scope > ul");
    if (!children) return;

    children.id = `toc-branch-${index}`;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toc-toggle";
    toggle.setAttribute("aria-controls", children.id);

    const setExpanded = (expanded) => {
      children.hidden = !expanded;
      toggle.setAttribute("aria-expanded", String(expanded));
      const label = `${expanded ? "收起" : "展开"}“${link.textContent.trim()}”的子目录`;
      toggle.setAttribute("aria-label", label);
      toggle.title = label;
    };
    branches.set(children.id, setExpanded);
    setExpanded(true);
    toggle.addEventListener("click", () => {
      setExpanded(children.hidden);
      scheduleUpdate();
    });
    row.append(toggle);
  });

  const entries = Array.from(navigation.querySelectorAll('a[href^="#"]'))
    .map((link) => ({
      link,
      heading: document.getElementById(decodeURIComponent(link.hash.slice(1))),
    }))
    .filter((entry) => entry.heading);
  if (!entries.length) return;

  let activeLink;
  let navigationTarget;
  let navigationTimer;
  let scheduled = 0;
  const setActive = (link) => {
    let hiddenBranch = link.closest("ul[hidden]");
    while (hiddenBranch) {
      link = hiddenBranch.parentElement.querySelector(":scope > .toc-row > a");
      hiddenBranch = link.closest("ul[hidden]");
    }
    if (activeLink === link) return;
    activeLink?.removeAttribute("aria-current");
    link.setAttribute("aria-current", "location");
    activeLink = link;
  };

  const releaseNavigation = () => {
    clearTimeout(navigationTimer);
    navigationTarget = undefined;
  };
  const waitForScrollIdle = () => {
    clearTimeout(navigationTimer);
    navigationTimer = setTimeout(() => {
      const entry = entries.find(({ link }) => link === navigationTarget);
      if (!entry) return;
      const destination = Math.max(0, Math.min(
        window.scrollY + entry.heading.getBoundingClientRect().top,
        document.documentElement.scrollHeight - window.innerHeight,
      ));
      // A busy/background tab may pause mid-animation. Only unlock once the
      // heading has actually arrived (including destinations near page bottom).
      if (Math.abs(window.scrollY - destination) <= 2) releaseNavigation();
    }, 180);
  };
  const selectTarget = (link) => {
    // PaperMod starts a smooth scroll on the anchor itself. Keep its destination
    // selected instead of letting intermediate scroll events overwrite it.
    cancelAnimationFrame(scheduled);
    scheduled = 0;
    navigationTarget = link;
    setActive(link);
    waitForScrollIdle();
  };

  const revealHash = () => {
    const entry = entries.find(({ link }) => link.hash === window.location.hash);
    if (!entry) return;
    toc.open = true;
    let branch = entry.link.closest("ul");
    while (branch && navigation.contains(branch)) {
      branches.get(branch.id)?.(true);
      branch = branch.parentElement.closest("ul");
    }
    selectTarget(entry.link);
  };

  const updateCurrent = () => {
    scheduled = 0;
    if (navigationTarget) {
      setActive(navigationTarget);
      return;
    }
    const offset = Math.min(160, window.innerHeight * 0.2);
    let current = entries[0];
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top > offset) break;
      current = entry;
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = entries[entries.length - 1];
    }
    setActive(current.link);
  };
  const scheduleUpdate = () => {
    if (navigationTarget) {
      setActive(navigationTarget);
      return;
    }
    if (scheduled) return;
    scheduled = requestAnimationFrame(updateCurrent);
  };
  const cancelNavigation = () => {
    if (!navigationTarget) return;
    releaseNavigation();
    scheduleUpdate();
  };

  navigation.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) selectTarget(link);
  });
  window.addEventListener("scroll", () => {
    if (navigationTarget) waitForScrollIdle();
    scheduleUpdate();
  }, { passive: true });
  window.addEventListener("wheel", cancelNavigation, { passive: true });
  window.addEventListener("touchstart", cancelNavigation, { passive: true });
  window.addEventListener("pointerdown", (event) => {
    if (!toc.contains(event.target)) cancelNavigation();
  }, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.target.closest("input, textarea, select, [contenteditable]")) return;
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) {
      cancelNavigation();
    }
  });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", revealHash);
  window.addEventListener("load", scheduleUpdate, { once: true });
  updateCurrent();
  revealHash();
})();
