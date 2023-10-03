<script lang="ts">
  import sorter from 'sorters';
  import type { YearlyCounts } from './+layout.server.js';

  export let counts: YearlyCounts;

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  $: yearSections = Object.entries(counts)
    .map(([year, monthCounts]) => {
      let months = Object.entries(monthCounts)
        .sort(sorter({ value: (d) => d[0], descending: true }))
        .map(([month, count]) => {
          return {
            month,
            monthName: monthNames[+month - 1],
            count,
          };
        });

      return {
        year,
        months,
      };
    })
    .sort(sorter({ value: 'year', descending: true }));
</script>

<nav class="p-4">
  <header class="block text-xl sm:hidden">Journals by Month</header>
  {#each yearSections as { year, months }}
    <section>
      <time class="font-medium text-gray-800 lg:text-lg">{year}</time>
      <ol class="sm:text-sm lg:text-base">
        {#each months as { month, monthName, count }}
          <li class="whitespace-nowrap">
            <a href="/journals/{year}/{month}">
              <time datetime="{year}-{month}">{monthName}</time>
            </a>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</nav>
