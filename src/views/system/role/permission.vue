<template>
  <div class="app-container">
    <permisTable :selector=false />
  </div>
</template>

<script>

import permisTable from "@/components/PermisTable/permisTable"

export default {
  name: "Permission",
  components: {
    permisTable
  },
  data() {
    return {

    };
  },
  created() {

  },
  methods: {

  }
};
</script>
