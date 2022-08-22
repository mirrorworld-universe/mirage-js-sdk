<template>
  <c-container>
    <c-center py="10">
      <c-stack align="center">
        <c-icon font-size="2rem" :name="props.icon || 'package'" />
        <c-text>{{ props.message }}</c-text>
      </c-stack>
    </c-center>
  </c-container>
</template>

<script lang="ts" setup>
const props = defineProps<{
  message: string;
  icon: string;
}>();
</script>
