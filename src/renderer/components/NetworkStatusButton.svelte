<script>
  import NetworkStatusIndicator from './NetworkStatusIndicator.svelte';
</script>

<!-- Network Status Button Component -->
<div class="network-status-container">
  <NetworkStatusIndicator />
</div>

<style>
  .network-status-container {
    display: inline-flex;
    margin-left: 16px;
    position: relative;
    z-index: 1;
  }
</style>
