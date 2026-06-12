<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface Asset {
  name: string;
  size: number;
  browser_download_url: string;
}
interface Product {
  key: 'engine' | 'gui';
  title: string;
  subtitle: string;
  repo: string;
  version: string;
  assets: Asset[];
  failed: boolean;
}

const products = ref<Product[]>([
  {
    key: 'engine',
    title: 'BisonDB',
    subtitle: 'The engine — bisond, bisonsh, bisonc. For the terminal.',
    repo: 'Abdullah-Masood-05/Bisondb',
    version: '',
    assets: [],
    failed: false,
  },
  {
    key: 'gui',
    title: 'Prairie',
    subtitle: 'The GUI — a Compass-style desktop client.',
    repo: 'Abdullah-Masood-05/Prairie',
    version: '',
    assets: [],
    failed: false,
  },
]);

const visitorOs = ref<'windows' | 'linux' | 'mac' | 'other'>('other');

function osOf(assetName: string): 'windows' | 'linux' | 'mac' | 'other' {
  const n = assetName.toLowerCase();
  if (n.includes('windows') || n.endsWith('.exe') || n.endsWith('.msi')) return 'windows';
  if (n.includes('linux') || n.endsWith('.tar.gz') || n.endsWith('.appimage')) return 'linux';
  if (n.includes('darwin') || n.endsWith('.dmg')) return 'mac';
  return 'other';
}

const osIcon: Record<string, string> = { windows: '🪟', linux: '🐧', mac: '🍎', other: '📦' };

function fmtSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

onMounted(async () => {
  const ua = navigator.userAgent.toLowerCase();
  visitorOs.value = ua.includes('windows')
    ? 'windows'
    : ua.includes('mac')
      ? 'mac'
      : ua.includes('linux')
        ? 'linux'
        : 'other';

  for (const product of products.value) {
    try {
      const resp = await fetch(`https://api.github.com/repos/${product.repo}/releases/latest`);
      if (!resp.ok) throw new Error(String(resp.status));
      const release = await resp.json();
      product.version = release.tag_name ?? '';
      product.assets = (release.assets ?? []).map(
        (a: { name: string; size: number; browser_download_url: string }) => ({
          name: a.name,
          size: a.size,
          browser_download_url: a.browser_download_url,
        }),
      );
      if (product.assets.length === 0) product.failed = true;
    } catch {
      // Rate-limited or offline: fall back to static release-page links.
      product.failed = true;
    }
  }
});
</script>

<template>
  <div class="dl-grid">
    <div v-for="p in products" :key="p.key" class="dl-card">
      <h3>
        {{ p.title }} <span v-if="p.version" class="version">{{ p.version }}</span>
      </h3>
      <p class="subtitle">{{ p.subtitle }}</p>
      <template v-if="!p.failed">
        <a
          v-for="a in p.assets"
          :key="a.name"
          :href="a.browser_download_url"
          class="asset"
          :class="{ primary: osOf(a.name) === visitorOs }"
        >
          <span>{{ osIcon[osOf(a.name)] }} {{ a.name }}</span>
          <span class="size">{{ fmtSize(a.size) }}</span>
        </a>
      </template>
      <a v-else :href="`https://github.com/${p.repo}/releases/latest`" class="asset primary">
        View releases on GitHub →
      </a>
    </div>
  </div>
</template>

<style scoped>
.dl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.dl-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  background: var(--vp-c-bg-soft);
}
.dl-card h3 {
  margin: 0 0 4px;
}
.version {
  font-size: 0.8em;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.subtitle {
  margin: 0 0 12px;
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
/* Secondary assets: soft neutral surface with a hairline border. */
.asset {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  font-size: 0.88em;
  text-decoration: none;
  color: var(--vp-c-text-1);
  word-break: break-all;
}
.asset:hover {
  background: var(--vp-c-bg-elv);
  border-color: var(--vp-c-brand-2);
}

.asset.primary {
  background: #d5532f;
  border-color: transparent;
  color: #fff3ee;
  font-weight: 600;
}
.asset.primary:hover {
  background: #c24a28;
  color: #fff3ee;
}
.asset.primary .size {
  color: #ffd9cc;
}
.size {
  color: var(--vp-c-text-2);
  white-space: nowrap;
}
</style>
