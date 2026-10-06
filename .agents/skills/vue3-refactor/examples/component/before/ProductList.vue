<template>
  <div>
    <input v-model="search" placeholder="Search" />
    <div v-if="loading">Loading...</div>
    <ul v-else>
      <li v-for="p in items.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) && x.stock > 0)" :key="p.id" @click="$emit('select', p)">
        {{ p.name }} - {{ 'R$ ' + p.price.toFixed(2).replace('.', ',') }}
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  props: ['categoryId'],
  data() {
    return { items: [], search: '', loading: false }
  },
  watch: {
    categoryId() { this.load() }
  },
  mounted() { this.load() },
  methods: {
    async load() {
      this.loading = true
      const r = await axios.get('/api/products?category=' + this.categoryId)
      this.items = r.data
      this.loading = false
    }
  }
}
</script>
