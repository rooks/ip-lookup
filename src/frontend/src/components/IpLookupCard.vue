<template>
  <div class="card">
    <div class="card-header">
      <h1 class="title">IP Lookup</h1>
      <p class="description">Enter an IP address to find its country and local time</p>
    </div>
    <div class="card-body">
      <IpInputRow
        v-for="(row, idx) in rows"
        :key="row.id"
        :row="row"
        :index="idx + 1"
        @update:ip="(ip) => updateRowIp(row.id, ip)"
        @lookup="lookupRow(row.id)"
        @remove="removeRow(row.id)"
      />
      <div v-if="rows.length === 0" class="empty-state">
        No IP addresses added. Click the button below to add one.
      </div>
    </div>
    <div class="card-footer">
      <AddButton @click="addRow" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIpLookup } from '../composables/useIpLookup'
import IpInputRow from './IpInputRow.vue'
import AddButton from './AddButton.vue'

const { rows, addRow, updateRowIp, lookupRow, removeRow } = useIpLookup()
</script>

<style scoped>
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}

.card-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #eee;
}

.title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.card-body {
  padding: 16px 24px;
}

.card-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #eee;
}

.empty-state {
  padding: 17px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
