import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: 'BisonDB',
    description:
      'A document database built from scratch — BSON storage, hand-written B+Trees, and a Compass-style GUI.',
    base: '/bisondb-site/',
    lastUpdated: true,
    // Dead links are a build failure, not a warning.
    ignoreDeadLinks: false,
    head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/bisondb-site/icon.svg' }]],
    appearance: 'dark',
    themeConfig: {
      logo: '/icon.svg',
      nav: [
        { text: 'Guide', link: '/guide/what-is-bisondb' },
        { text: 'Build', link: '/build/windows' },
        { text: 'Architecture', link: '/architecture/overview' },
        { text: 'Reference', link: '/reference/cli' },
        { text: 'Benchmarks', link: '/benchmarks/' },
        { text: 'Changelog', link: '/changelog/' },
      ],
      sidebar: {
        '/guide/': [
          {
            text: 'Getting started',
            items: [
              { text: 'What is BisonDB?', link: '/guide/what-is-bisondb' },
              { text: 'Quickstart', link: '/guide/quickstart' },
              { text: 'The shell (bisonsh)', link: '/guide/shell' },
              { text: 'Prairie (GUI)', link: '/guide/prairie' },
            ],
          },
        ],
        '/build/': [
          {
            text: 'Building from source',
            items: [
              { text: 'Windows (MSVC)', link: '/build/windows' },
              { text: 'Linux', link: '/build/linux' },
              { text: 'Windows + WSL', link: '/build/wsl' },
              { text: 'Prairie (GUI)', link: '/build/prairie' },
            ],
          },
        ],
        '/architecture/': [
          {
            text: 'Architecture',
            items: [
              { text: 'Overview', link: '/architecture/overview' },
              { text: 'BSON engine', link: '/architecture/bson' },
              { text: 'Storage layer', link: '/architecture/storage' },
              { text: 'The B+Tree', link: '/architecture/btree' },
              { text: 'Query engine', link: '/architecture/query-engine' },
              { text: 'Wire protocol', link: '/architecture/protocol' },
              { text: 'Concurrency', link: '/architecture/concurrency' },
            ],
          },
        ],
        '/reference/': [
          {
            text: 'Reference',
            items: [
              { text: 'CLI tools', link: '/reference/cli' },
              { text: 'Limits', link: '/reference/limits' },
              { text: 'FAQ', link: '/reference/faq' },
            ],
          },
        ],
      },
      socialLinks: [{ icon: 'github', link: 'https://github.com/Abdullah-Masood-05/Bisondb' }],
      footer: {
        message: 'MIT licensed. BisonDB and Prairie are educational projects.',
        copyright: 'BisonDB · Prairie',
      },
      search: { provider: 'local' },
    },
    // Warm-neutral diagram surfaces; amber reserved for emphasis only.
    mermaid: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#1a1714',
        primaryColor: '#242019', // node fill = bg-soft
        primaryBorderColor: '#443b30',
        primaryTextColor: '#ede6db',
        secondaryColor: '#2a241d',
        tertiaryColor: '#15120f',
        lineColor: '#847a6c',
        textColor: '#b3a899',
        clusterBkg: '#15120f',
        clusterBorder: '#3a332a',
        edgeLabelBackground: '#242019',
        // sequence diagrams
        actorBkg: '#242019',
        actorBorder: '#443b30',
        actorTextColor: '#ede6db',
        signalColor: '#847a6c',
        signalTextColor: '#b3a899',
        noteBkgColor: '#2a241d',
        noteBorderColor: '#c97f22', // amber emphasis: notes only
        noteTextColor: '#ede6db',
        labelBoxBkgColor: '#242019',
        labelBoxBorderColor: '#443b30',
        labelTextColor: '#ede6db',
        loopTextColor: '#b3a899',
      },
    },
  }),
);
