<script lang="ts">
  import { fetcher as createFetcher } from 'swr-xstate';
  import type { FetchResult } from 'swr-xstate';
  import Switch from '$lib/components/Switch.svelte';

  let fetcherState = { context: {}, toStrings: () => '' };

  let fetcher = createFetcher<string>({
    name: 'test-fetcher',
    key: 'key',
    fetcher: fetchFunc,
    receive: receiveFunc,
    initialData: () =>
      Promise.resolve({
        data: 'https://imfeld.dev/images/projects-httptreemux.svg',
        timestamp: 1,
      }),
    autoRefreshPeriod: 5000,
    debug: debugFunc,
    initialEnabled: true,
    initialPermitted: true,
  });

  let fetchSuccess = true;
  let counter = 0;
  let fetchDelay = 2500;
  function fetchFunc(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (fetchSuccess) {
        // Increment counter to make it a unique URL.
        let url = `https://source.unsplash.com/random/200x200?q=${counter++}`;
        setTimeout(() => resolve(url), fetchDelay);
      } else {
        setTimeout(() => reject(new Error('Fetch failed!')), fetchDelay);
      }
    });
  }

  let imageSrc;
  let receivedStale: boolean;
  let errorText;
  let latestTimestamp = 0;
  function receiveFunc({ data, error, stale, timestamp }: FetchResult<string>) {
    console.log({ data, error, stale, timestamp });
    latestTimestamp = timestamp;
    errorText = '';
    receivedStale = Boolean(stale);
    if (error) {
      errorText = `Error: ${error.message}`;
    } else {
      imageSrc = data;
    }
  }

  let enabled = true;
  let permitted = true;

  $: fetcher.setEnabled(enabled);
  $: fetcher.setPermitted(permitted);

  function debugFunc(msg) {
    // console.dir(msg);
    fetcherState = msg.state;
    // msg.state.toStrings;
    // msg.state.context.lastRefresh;
  }
</script>

<div class="container p-4">
  <div>
    This is a very simple example of using the fetcher to get a new random
    Unsplash image every five seconds. You can use the checkboxes to alter the
    behavior of the state machine.
  </div>

  <div class="mt-4 flex flex-col font-sans sm:flex-row">
    <div class="flex flex-col sm:px-4">
      <label
        for="swr-enabled"
        class="mt-2 flex items-center text-sm font-medium text-gray-800">
        <Switch id="swr-enabled" bind:value={enabled} />
        <span class="ml-1">Enable Fetcher</span>
      </label>
      <label
        for="swr-permitted"
        class="mt-2 flex items-center text-sm font-medium text-gray-800">
        <Switch id="swr-permitted" bind:value={permitted} />
        <span class="ml-1">Permit Fetching</span>
      </label>
      <label
        for="swr-success"
        class="mt-2 flex items-center text-sm font-medium text-gray-800">
        <Switch id="swr-success" bind:value={fetchSuccess} />
        <span class="ml-1">Fetch Succeeds</span>
      </label>
      <span class="mt-2 inline-flex rounded-md shadow-sm">
        <button
          type="button"
          class="inline-flex items-center rounded border border-gray-300 bg-white
          px-2.5 py-1.5 font-sans text-xs font-medium leading-4
          text-gray-700 transition duration-150
          ease-in-out hover:text-gray-500 focus:border-blue-300 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-2 active:bg-gray-50 active:text-gray-800"
          on:click={() => fetcher.refresh()}>
          Force Refresh
        </button>
      </span>
      <label
        for="swr-delay"
        class="mt-2 flex flex-col items-start space-y-1 text-sm">
        <div>
          <span class="font-medium text-gray-800">Fetch Delay</span>
          {fetchDelay}ms
        </div>
        <div>
          <input
            id="swr-delay"
            class="text-teal-600"
            type="range"
            min="0"
            max="10000"
            step="100"
            bind:value={fetchDelay} />
        </div>
      </label>
    </div>

    <div class="mt-2 flex-1 sm:mt-0">
      <div>
        <span class="font-medium text-gray-800">Fetch Result:</span>
        {errorText || imageSrc}
        {#if receivedStale}<span class="font-bold">(stale)</span>{/if}
      </div>
      <div class="border" style="width:200px;height:200px">
        <img alt="result" width="200" height="200" src={imageSrc} />
      </div>
      <div class="text-sm font-medium text-gray-800">
        <div>
          Current State:
          <span class="font-bold">
            {fetcherState && fetcherState.toStrings()}
          </span>
        </div>
        <div>Last Refresh: {new Date(latestTimestamp).toTimeString()}</div>
        <div>Store Enabled: {fetcherState.context.storeEnabled}</div>
        <div>Browser Active: {fetcherState.context.browserEnabled}</div>
        <div>Fetching Permitted: {fetcherState.context.permitted}</div>
      </div>
    </div>
  </div>
</div>
