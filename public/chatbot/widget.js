(() => {
  if (window.__nestiChatbotWidgetLoaded) return;
  window.__nestiChatbotWidgetLoaded = true;

  const script =
    document.currentScript ||
    Array.from(document.getElementsByTagName("script")).slice(-1)[0];

  if (!script || !script.src) {
    console.warn("[Nesti] Widget script not found.");
    return;
  }

  const scriptUrl = new URL(script.src);
  const token = scriptUrl.searchParams.get("token");
  if (!token) {
    console.warn("[Nesti] Missing embed token in widget URL.");
    return;
  }

  const widgetOrigin = scriptUrl.origin;
  const iframeSrc = `${widgetOrigin}/chatbot/${token}`;

  const container = document.createElement("div");
  container.id = "nesti-chatbot-widget";
  container.style.position = "fixed";
  container.style.right = "24px";
  container.style.bottom = "24px";
  container.style.zIndex = "9999";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "flex-end";
  container.style.fontFamily = "Arial, sans-serif";

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.innerText = "Chat";
  launcher.style.height = "56px";
  launcher.style.width = "56px";
  launcher.style.borderRadius = "50%";
  launcher.style.border = "none";
  launcher.style.cursor = "pointer";
  launcher.style.background = "#4F46E5";
  launcher.style.color = "#fff";
  launcher.style.boxShadow = "0 12px 24px rgba(15, 23, 42, 0.2)";
  launcher.style.fontSize = "14px";
  launcher.style.fontWeight = "600";

  const panel = document.createElement("div");
  panel.style.width = "380px";
  panel.style.maxWidth = "90vw";
  panel.style.height = "600px";
  panel.style.maxHeight = "80vh";
  panel.style.marginBottom = "12px";
  panel.style.borderRadius = "18px";
  panel.style.overflow = "hidden";
  panel.style.boxShadow = "0 24px 48px rgba(15, 23, 42, 0.2)";
  panel.style.border = "1px solid rgba(15, 23, 42, 0.08)";
  panel.style.background = "#fff";
  panel.style.display = "none";

  const iframe = document.createElement("iframe");
  iframe.src = iframeSrc;
  iframe.title = "Nesti Chatbot";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.allow = "clipboard-write";

  panel.appendChild(iframe);
  container.appendChild(panel);
  container.appendChild(launcher);
  document.body.appendChild(container);

  const togglePanel = () => {
    const isOpen = panel.style.display === "block";
    panel.style.display = isOpen ? "none" : "block";
    launcher.innerText = isOpen ? "Chat" : "Close";
  };

  launcher.addEventListener("click", togglePanel);
})();
