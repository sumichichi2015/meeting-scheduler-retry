<template>
  <div class="flex items-end gap-4">
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        開始時刻
      </label>
      <select
        v-model="startTime"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        :disabled="disabled"
      >
        <option
          v-for="time in availableStartTimes"
          :key="time"
          :value="time"
        >
          {{ formatTime(time) }}
        </option>
      </select>
    </div>

    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        終了時刻
      </label>
      <select
        v-model="endTime"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        :disabled="disabled"
      >
        <option
          v-for="time in availableEndTimes"
          :key="time"
          :value="time"
        >
          {{ formatTime(time) }}
        </option>
      </select>
    </div>

    <button
      @click="handleFilter"
      class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
      :disabled="!isValid || disabled"
    >
      範囲をしぼる
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: '09:00', end: '17:00' })
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'filter']);

// 時間の選択肢を生成（9:00-20:00、30分単位）
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 9; hour <= 20; hour++) {
    for (let minute of [0, 30]) {
      times.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      );
    }
  }
  return times;
};

const startTime = ref(props.modelValue.start);
const endTime = ref(props.modelValue.end);

// 開始時刻の選択肢
const availableStartTimes = computed(() => {
  return generateTimeOptions().filter(time => time <= endTime.value);
});

// 終了時刻の選択肢
const availableEndTimes = computed(() => {
  return generateTimeOptions().filter(time => time > startTime.value);
});

// 選択が有効かどうか
const isValid = computed(() => {
  return startTime.value < endTime.value;
});

// 時刻のフォーマット
const formatTime = (time) => {
  return time;
};

// 選択値の変更を監視
watch([startTime, endTime], ([newStart, newEnd]) => {
  if (isValid.value) {
    emit('update:modelValue', { start: newStart, end: newEnd });
  }
});

// フィルターボタンのクリックハンドラ
const handleFilter = () => {
  if (isValid.value) {
    emit('filter', { start: startTime.value, end: endTime.value });
  }
};
</script>
