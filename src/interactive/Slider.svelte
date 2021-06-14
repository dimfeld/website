<script>
  export let text;
</script>

<div class="h-6 whitespace-nowrap overflow-hidden w-full">
  <span>{text}</span>
</div>

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
