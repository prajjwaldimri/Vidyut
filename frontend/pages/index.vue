<template lang="pug">
div
  h1 {{ serverMsg }}
</template>

<script>
export default {
  data: function () {
    return {
      serverMsg: "",
    };
  },
  async mounted() {
    this.serverMsg = await this.$axios.$get("http://localhost:3333");
  },
};
</script>
