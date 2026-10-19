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

  const revealHash = () => {
    const entry = entries.find(({ link }) => link.hash === window.location.hash);
    if (!entry) return;
    toc.open = true;
    let branch = entry.link.closest("ul");
    while (branch && navigation.contains(branch)) {
      branches.get(branch.id)?.(true);
      branch = branch.parentElement.closest("ul");
    }
    setActive(entry.link);
  };

  let scheduled = false;
  const updateCurrent = () => {
    scheduled = false;
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
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateCurrent);
  };

  navigation.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) setActive(link);
  });
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", revealHash);
  window.addEventListener("load", scheduleUpdate, { once: true });
  updateCurrent();
  revealHash();
})();
