<script>
  export let text;
</script>

<style>
  @keyframes slide {
    from {
      margin-left: 0;
      font-size: 10px;
    }

    50% {
      font-size: 20px;
    }

    to {
      margin-left: 90%;
      font-size: 10px;
    }
  }

  span {
    animation: 15s linear infinite alternate slide;
  }
</style>

<div class="h-6 whitespace-no-wrap overflow-hidden w-full">
  <span>{text}</span>
</div>
