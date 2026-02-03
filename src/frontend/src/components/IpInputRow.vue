<template>
  <div class="ip-row">
    <span class="row-label">{{ index }}.</span>
    <input
      ref="inputRef"
      type="text"
      class="ip-input"
      :class="{ 'input-error': showValidationError, 'input-focus': isFocused }"
      :value="row.ip"
      :disabled="row.status === 'loading'"
      placeholder="Enter IP address"
      @input="onInput"
      @blur="onBlur"
      @focus="isFocused = true"
      @keydown.enter="onEnter"
    />
    <div class="result-area">
      <LoadingSpinner v-if="row.status === 'loading'" />
      <div
        v-else-if="row.status === 'success' && row.result"
        class="success-result"
      >
        <span class="flag">{{ flag }}</span>
        <span class="country">{{ row.result.country }}</span>
        <span class="city">{{ row.result.city }}</span>
        <span class="time">{{ time }}</span>
      </div>
      <div v-else-if="row.status === 'error'" class="error-result">
        {{ row.error }}
      </div>
      <div v-else-if="showValidationError" class="validation-error">
        {{ validationError }}
      </div>
    </div>
    <button
      class="remove-button"
      type="button"
      @click="$emit('remove')"
      title="Remove row"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from "vue";
import type { IpRow } from "../types";
import { useIpValidation } from "../composables/useIpValidation";
import { useRealtimeClock } from "../composables/useRealtimeClock";
import { countryCodeToFlag } from "../utils/countryFlags";
import LoadingSpinner from "./LoadingSpinner.vue";

const props = defineProps<{
  row: IpRow;
  index: number;
}>();

const emit = defineEmits<{
  "update:ip": [ip: string];
  lookup: [];
  remove: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const isFocused = ref(false);

const { isValid, isEmpty, validationError } = useIpValidation(
  toRef(() => props.row.ip),
);

const showValidationError = computed(() => {
  return !isEmpty.value && !isValid.value && !isFocused.value;
});

const timezone = computed(() => props.row.result?.timezone || null);
const { time } = useRealtimeClock(timezone);

const flag = computed(() => {
  if (props.row.result?.country_code) {
    return countryCodeToFlag(props.row.result.country_code);
  }
  return "";
});

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:ip", target.value);
}

function onBlur() {
  isFocused.value = false;
  if (!isEmpty.value && isValid.value) {
    emit("lookup");
  }
}

function onEnter() {
  if (!isEmpty.value && isValid.value) {
    emit("lookup");
    inputRef.value?.blur();
  }
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<style scoped>
.ip-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.row-label {
  width: 24px;
  text-align: right;
  color: #666;
  font-weight: 500;
}

.ip-input {
  flex: 0 0 200px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.ip-input:focus,
.ip-input.input-focus {
  border-color: #2196f3;
}

.ip-input.input-error {
  border-color: #f44336;
}

.ip-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.result-area {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 24px;
}

.success-result {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.flag {
  position: relative;
  top: 2px;
  font-size: 20px;
}

.country {
  color: #333;
  font-weight: 500;
}

.city {
  color: #555;
  font-size: 14px;
}

.time {
  color: #666;
  font-family: monospace;
  font-size: 14px;
}

.error-result {
  color: #f44336;
  font-size: 14px;
}

.validation-error {
  color: #f44336;
  font-size: 12px;
}

.remove-button {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.remove-button:hover {
  background: #f44336;
  color: white;
}
</style>
