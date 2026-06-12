<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { withBase } from 'vitepress';

// Renders one named chart from /public/data/benchmarks.json. Chart.js is
// imported lazily so it never runs during SSR.
const props = defineProps<{
  chart: 'insert-throughput' | 'query-latency' | 'docs-examined';
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const error = ref('');

interface BenchData {
  meta: { version: string; hardware: string; date: string };
  insertThroughput: { label: string; docsPerSec: number }[];
  queryLatency: { label: string; ms: number }[];
  docsExamined: { label: string; count: number }[];
}

onMounted(async () => {
  try {
    const [{ Chart, BarController, BarElement, CategoryScale, LinearScale, LogarithmicScale, Tooltip, Legend }, resp] =
      await Promise.all([import('chart.js'), fetch(withBase('/data/benchmarks.json'))]);
    Chart.register(BarController, BarElement, CategoryScale, LinearScale, LogarithmicScale, Tooltip, Legend);
    const data: BenchData = await resp.json();

    // Amber for the primary series; neutral grays for comparison series
    // (e.g. "full scan") — the accent must mean something.
    const amber = '#f3b14e';
    const gray = '#847a6c';

    let labels: string[] = [];
    let values: number[] = [];
    let title = '';
    let logScale = false;
    if (props.chart === 'insert-throughput') {
      labels = data.insertThroughput.map((d) => d.label);
      values = data.insertThroughput.map((d) => d.docsPerSec);
      title = 'documents / second';
    } else if (props.chart === 'query-latency') {
      labels = data.queryLatency.map((d) => d.label);
      values = data.queryLatency.map((d) => d.ms);
      title = 'milliseconds (log scale)';
      logScale = true;
    } else {
      labels = data.docsExamined.map((d) => d.label);
      values = data.docsExamined.map((d) => d.count);
      title = 'documents examined';
    }

    new Chart(canvas.value!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: title,
            data: values,
            backgroundColor: labels.map((_, i) => (i % 2 === 0 ? amber : gray)),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            type: logScale ? 'logarithmic' : 'linear',
            ticks: { color: '#b3a899' },
            grid: { color: 'rgba(132,122,108,0.18)' },
          },
          x: { ticks: { color: '#b3a899' }, grid: { display: false } },
        },
      },
    });
  } catch (e) {
    error.value = `chart unavailable: ${e instanceof Error ? e.message : e}`;
  }
});
</script>

<template>
  <div class="bench-chart">
    <canvas ref="canvas" />
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<style scoped>
.bench-chart {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.err {
  color: var(--vp-c-text-2);
  font-size: 0.85em;
}
</style>
