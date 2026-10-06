<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ images: string[] }>()
const currentIndex = ref(0)
</script>

<template>
  <section>
    <img :src="props.images[currentIndex]" alt="" />
    <div>
      <img
        v-for="(image, index) in props.images"
        :key="image"
        :src="image"
        alt=""
        @click="currentIndex = index"
      />
    </div>
  </section>
</template>
