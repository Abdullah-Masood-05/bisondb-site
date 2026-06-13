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
        message: 'BisonDB and Prairie are GPLv3 · educational projects.',
        copyright: 'BisonDB · Prairie',
      },
      search: { provider: 'local' },
    },
    // Pure-gray diagram surfaces; crimson reserved for emphasis only.
    mermaid: {
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: '#111113',
        primaryColor: '#1b1b1e', // node fill = bg-soft
        primaryBorderColor: '#35353a',
        primaryTextColor: '#f2f2f2',
        secondaryColor: '#232327',
        tertiaryColor: '#0d0d0f',
        lineColor: '#76767e',
        textColor: '#a6a6ad',
        clusterBkg: '#0d0d0f',
        clusterBorder: '#2a2a2e',
        edgeLabelBackground: '#1b1b1e',
        // sequence diagrams
        actorBkg: '#1b1b1e',
        actorBorder: '#35353a',
        actorTextColor: '#f2f2f2',
        signalColor: '#76767e',
        signalTextColor: '#a6a6ad',
        noteBkgColor: '#232327',
        noteBorderColor: '#f2555a', // crimson emphasis: notes only
        noteTextColor: '#f2f2f2',
        labelBoxBkgColor: '#1b1b1e',
        labelBoxBorderColor: '#35353a',
        labelTextColor: '#f2f2f2',
        loopTextColor: '#a6a6ad',
      },
    },
  }),
);
