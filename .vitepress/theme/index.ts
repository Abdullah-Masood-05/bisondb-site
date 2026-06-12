import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import DownloadSection from './components/DownloadSection.vue';
import BenchChart from './components/BenchChart.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DownloadSection', DownloadSection);
    app.component('BenchChart', BenchChart);
  },
} satisfies Theme;
