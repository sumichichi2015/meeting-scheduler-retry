<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">会議の作成</h1>

    <!-- カレンダー -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-3">日付の選択</h2>
      <Calendar v-model="selectedDates" @update:modelValue="handleDateSelect" />
    </div>

    <!-- 時間枠選択 -->
    <div v-if="hasSelectedDates" class="mb-6">
      <h2 class="text-lg font-semibold mb-3">時間枠の選択</h2>
      <div v-for="date in selectedDates" :key="date" class="mb-6">
        <h3 class="text-md font-medium mb-2">{{ formatDate(date) }}</h3>
        
        <!-- 時間範囲選択 -->
        <div class="mb-4">
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
              <input
                type="time"
                v-model="timeRanges[date].start"
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="1800"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
              <input
                type="time"
                v-model="timeRanges[date].end"
                class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="1800"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="generateTimeSlotsForDate(date)"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                時間枠を生成
              </button>
            </div>
          </div>
        </div>

        <!-- 時間枠一覧 -->
        <div v-if="meetingStore.currentMeeting.dates[date]?.timeSlots.length" class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div class="grid grid-cols-4 gap-2 p-4"
            @mousedown.prevent="startDragSelection(date)"
            @mousemove="updateDragSelection"
            @mouseup="endDragSelection"
            @mouseleave="endDragSelection"
          >
            <div
              v-for="(slot, index) in meetingStore.currentMeeting.dates[date].timeSlots"
              :key="`${date}-${slot.start}-${slot.end}`"
              class="relative"
            >
              <button
                :class="[
                  'w-full py-2 px-4 text-sm rounded-md border transition-colors duration-150',
                  slot.available
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100',
                  isDragging && isInDragRange(date, index) && 'ring-2 ring-indigo-500'
                ]"
                @mouseenter="updateHoveredSlot(date, index)"
              >
                {{ slot.start }} 〜 {{ slot.end }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作ボタン -->
    <div class="flex justify-end gap-4">
      <button
        class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="resetForm"
      >
        キャンセル
      </button>
      <button
        @click="handleCreateAndOpenMeeting"
        class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        :disabled="!canProceed"
      >
        URLを発行して開く
      </button>
    </div>

    <!-- 参加者登録用URL -->
    <div v-if="joinUrl" class="mt-6">
      <p class="text-lg font-semibold mb-3">参加者登録用URL:</p>
      <div class="flex items-center gap-2">
        <a
          :href="joinUrl"
          target="_blank"
          class="flex-1 p-2 bg-white border border-gray-300 rounded-md shadow-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
        >
          {{ joinUrl }}
        </a>
        <div class="flex gap-2">
          <button
            @click="copyUrl"
            class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2"
          >
            <span>コピー</span>
            <span v-if="showCopyMessage" class="text-green-600">✓</span>
          </button>
          <button
            @click="shareByEmail"
            class="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            メールで共有
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMeetingStore } from '../stores/meeting';
import Calendar from './Calendar.vue';

const meetingStore = useMeetingStore();
const selectedDates = ref([]);
const timeRanges = ref({});
const joinUrl = ref('');
const showCopyMessage = ref(false);

// 日付が選択されているかどうか
const hasSelectedDates = computed(() => selectedDates.value.length > 0);

// 会議作成が可能かどうか
const canProceed = computed(() => {
  if (!hasSelectedDates.value) return false;
  
  // 選択された日付すべてに時間枠が設定されているか確認
  return selectedDates.value.every(date => 
    meetingStore.currentMeeting.dates[date]?.timeSlots.length > 0
  );
});

// 日付のフォーマット
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${dayOfWeek})`;
};

// 日付が選択された時の処理
const handleDateSelect = (dates) => {
  selectedDates.value = dates;
  // 新しい日付の時間範囲を初期化
  dates.forEach(date => {
    if (!timeRanges.value[date]) {
      timeRanges.value[date] = {
        start: '09:00',
        end: '17:00'
      };
    }
  });
};

// 指定された日付の時間枠を生成
const generateTimeSlotsForDate = (date) => {
  const range = timeRanges.value[date];
  if (!range) return;

  const slots = meetingStore.generateTimeSlots(range.start, range.end);
  meetingStore.updateDateTimeSlots(date, slots);
};

// 時間枠の選択状態を切り替え
const toggleTimeSlot = (date, slot) => {
  slot.available = !slot.available;
};

// URLを生成して自動的に開く
const handleCreateAndOpenMeeting = async () => {
  const meetingId = meetingStore.saveMeeting({
    dates: meetingStore.currentMeeting.dates
  });
  
  joinUrl.value = meetingStore.generateJoinUrl(meetingId);
  
  // URLを自動的にクリップボードにコピー
  await navigator.clipboard.writeText(joinUrl.value);
  showCopyMessage.value = true;
  setTimeout(() => {
    showCopyMessage.value = false;
  }, 2000);

  // 新しいタブで参加者画面を開く
  window.open(joinUrl.value, '_blank');
};

// URLをメールで共有
const shareByEmail = () => {
  const subject = encodeURIComponent('会議の日程調整');
  const body = encodeURIComponent(`
以下のURLから会議の日程調整にご協力ください：

${joinUrl.value}
  `);
  window.open(`mailto:?subject=${subject}&body=${body}`);
};

// URLをクリップボードにコピー
const copyUrl = async () => {
  await navigator.clipboard.writeText(joinUrl.value);
  showCopyMessage.value = true;
  setTimeout(() => {
    showCopyMessage.value = false;
  }, 2000);
};

// フォームをリセット
const resetForm = () => {
  selectedDates.value = [];
  timeRanges.value = {};
  joinUrl.value = '';
  meetingStore.currentMeeting.dates = {};
};

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartInfo = ref(null);
const hoveredSlotInfo = ref(null);

// ドラッグ選択の開始
const startDragSelection = (date) => {
  isDragging.value = true;
  dragStartInfo.value = {
    date,
    index: hoveredSlotInfo.value?.index || 0
  };
};

// ホバー中のスロット情報を更新
const updateHoveredSlot = (date, index) => {
  hoveredSlotInfo.value = { date, index };
};

// ドラッグ中の選択を更新
const updateDragSelection = (event) => {
  if (!isDragging.value) return;
  // マウスの移動に応じて選択範囲を更新
};

// ドラッグ選択の終了
const endDragSelection = () => {
  if (!isDragging.value || !dragStartInfo.value || !hoveredSlotInfo.value) return;

  const date = dragStartInfo.value.date;
  const startIndex = Math.min(dragStartInfo.value.index, hoveredSlotInfo.value.index);
  const endIndex = Math.max(dragStartInfo.value.index, hoveredSlotInfo.value.index);

  // 選択範囲内のスロットの状態を切り替え
  const currentState = meetingStore.currentMeeting.dates[date].timeSlots[startIndex].available;
  for (let i = startIndex; i <= endIndex; i++) {
    meetingStore.currentMeeting.dates[date].timeSlots[i].available = !currentState;
  }

  // 状態をリセット
  isDragging.value = false;
  dragStartInfo.value = null;
};

// スロットが選択範囲内かどうかを判定
const isInDragRange = (date, index) => {
  if (!isDragging.value || !dragStartInfo.value || !hoveredSlotInfo.value) return false;
  if (date !== dragStartInfo.value.date) return false;

  const startIndex = Math.min(dragStartInfo.value.index, hoveredSlotInfo.value.index);
  const endIndex = Math.max(dragStartInfo.value.index, hoveredSlotInfo.value.index);
  
  return index >= startIndex && index <= endIndex;
};
</script>