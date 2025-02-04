<template>
  <div class="time-slot-selector">
    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse">
        <!-- ヘッダー行（日付） -->
        <thead>
          <tr>
            <th class="w-20 px-2 py-2 border bg-gray-50">時間</th>
            <th 
              v-for="date in selectedDates" 
              :key="date"
              class="px-2 py-2 border bg-gray-50 min-w-[200px]"
            >
              {{ formatDate(date) }}
            </th>
          </tr>
        </thead>
        
        <!-- 時間枠 -->
        <tbody>
          <tr v-for="time in timeSlots" :key="time">
            <td class="px-2 py-2 border bg-gray-50 text-sm">
              {{ formatTime(time) }}
            </td>
            <td 
              v-for="date in selectedDates" 
              :key="date"
              class="border relative p-0"
            >
              <div
                class="w-full h-full"
                :class="{
                  'bg-yellow-200': isSelected(date, time),
                  'bg-white': !isSelected(date, time)
                }"
                @mousedown="startDragging(date, time)"
                @mouseenter="handleDragOver(date, time)"
                @mouseup="stopDragging"
                @click="toggleTimeSlot(date, time)"
              >
                <div class="h-8"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  selectedDates: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue']);

// 時間枠の生成（9:00-20:00）
const timeSlots = computed(() => {
  const slots = [];
  for (let hour = 9; hour < 20; hour++) {
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
});

// ドラッグ操作の状態管理
const isDragging = ref(false);
const dragStartValue = ref(null);
const currentSelection = ref({...props.modelValue});

// 日付のフォーマット
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
};

// 時間のフォーマット
const formatTime = (time) => {
  const [hour, minute] = time.split(':');
  return `${hour}:${minute || '00'} ～`;
};

// 時間枠の選択状態確認
const isSelected = (date, time) => {
  const dateKey = new Date(date).toISOString().split('T')[0];
  return currentSelection.value[dateKey]?.includes(time) ?? true;
};

// ドラッグ開始
const startDragging = (date, time) => {
  isDragging.value = true;
  dragStartValue.value = isSelected(date, time);
  document.addEventListener('mouseup', stopDragging);
};

// ドラッグ中の処理
const handleDragOver = (date, time) => {
  if (isDragging.value) {
    toggleTimeSlot(date, time, !dragStartValue.value);
  }
};

// ドラッグ終了
const stopDragging = () => {
  isDragging.value = false;
  dragStartValue.value = null;
  document.removeEventListener('mouseup', stopDragging);
  emit('update:modelValue', currentSelection.value);
};

// 時間枠の選択/選択解除
const toggleTimeSlot = (date, time, forcedValue) => {
  const dateKey = new Date(date).toISOString().split('T')[0];
  if (!currentSelection.value[dateKey]) {
    currentSelection.value[dateKey] = timeSlots.value.slice();
  }

  const timeIndex = currentSelection.value[dateKey].indexOf(time);
  const shouldBeSelected = forcedValue !== undefined ? forcedValue : timeIndex === -1;

  if (shouldBeSelected && timeIndex === -1) {
    currentSelection.value[dateKey].push(time);
  } else if (!shouldBeSelected && timeIndex !== -1) {
    currentSelection.value[dateKey].splice(timeIndex, 1);
  }

  currentSelection.value = {...currentSelection.value};
  if (!isDragging.value) {
    emit('update:modelValue', currentSelection.value);
  }
};

// コンポーネントのクリーンアップ
onUnmounted(() => {
  document.removeEventListener('mouseup', stopDragging);
});

// 初期状態の設定
onMounted(() => {
  // 全ての日付に対して、デフォルトですべての時間枠を選択状態にする
  const initialSelection = {};
  props.selectedDates.forEach(date => {
    const dateKey = new Date(date).toISOString().split('T')[0];
    initialSelection[dateKey] = timeSlots.value.slice();
  });
  currentSelection.value = initialSelection;
  emit('update:modelValue', initialSelection);
});
</script>

<style scoped>
.time-slot-selector {
  user-select: none;
}
</style>
