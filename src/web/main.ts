import { mountApp } from "./app";

function asset(name: string): string {
  const href = window.location.href.split("#")[0] ?? window.location.href;
  const base = /\/$/.test(href) || /\.html$/i.test(href) ? href : `${href}/`;
  return new URL(name, base).toString();
}

async function boot(): Promise<void> {
  const root = document.getElementById("app");
  if (!root) throw new Error("missing #app");
  const res = await fetch(asset("bank.json"));
  if (!res.ok) {
    root.innerHTML = `<main class="wrap"><p class="lede">Could not load bank.json (${res.status}).</p></main>`;
    return;
  }
  const bank = (await res.json()) as Parameters<typeof mountApp>[1]["bank"];
  mountApp(root, { bank, storage: window.localStorage });
}

void boot().catch((err) => {
  const root = document.getElementById("app");
  if (root) {
    root.innerHTML = `<main class="wrap"><p class="lede">${String(err)}</p></main>`;
  }
});
