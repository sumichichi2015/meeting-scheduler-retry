<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">会議への参加</h1>

    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-3">参加者情報</h2>
      <div class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">お名前</label>
          <input
            type="text"
            id="name"
            v-model="participantName"
            class="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="山田 太郎"
          />
        </div>
      </div>
    </div>

    <div v-if="meeting" class="mb-6">
      <h2 class="text-lg font-semibold mb-3">会議の詳細</h2>
      <div class="bg-gray-50 p-4 rounded-lg space-y-4">
        <div v-for="(dateData, date) in meeting.dates" :key="date">
          <h3 class="font-medium text-gray-900 mb-2">{{ formatDate(date) }}</h3>
          <div class="bg-white shadow-sm rounded-lg overflow-hidden">
            <div class="space-y-4">
              <div class="grid gap-2 select-none"
                   @mousedown="startDrag"
                   @mousemove="handleDrag"
                   @mouseup="endDrag"
                   @mouseleave="endDrag">
                <div
                  v-for="(slot, index) in dateData.timeSlots"
                  :key="`${date}-${slot.start}-${slot.end}`"
                  class="bg-yellow-50 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition-colors duration-150"
                  :class="{ 'bg-blue-100': isSlotSelected(date, slot.start, slot.end) }"
                  :data-date="date"
                  :data-start="slot.start"
                  :data-end="slot.end"
                  @click="!isDragging && cycleResponse(date, slot.start, slot.end)"
                >
                  <span class="text-gray-900">
                    {{ slot.start }} 〜 {{ slot.end }}
                  </span>
                  <span 
                    class="w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium transition-all duration-150"
                    :class="{
                      'bg-green-100 text-green-700': getResponse(date, slot.start, slot.end) === '◯',
                      'bg-yellow-100 text-yellow-700': getResponse(date, slot.start, slot.end) === '△',
                      'bg-red-100 text-red-700': getResponse(date, slot.start, slot.end) === '×'
                    }"
                  >
                    {{ getResponse(date, slot.start, slot.end) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 参加者一覧 -->
          <div class="mt-4 bg-white rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">回答済み参加者</h4>
            <div class="space-y-2">
              <div v-for="participant in meeting.participants" :key="participant.id" class="text-sm">
                <div class="flex items-start">
                  <div class="font-medium text-gray-900">{{ participant.name }}</div>
                  <div v-if="participant.comment" class="ml-4 text-gray-500">
                    {{ participant.comment }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-3">コメント</h2>
      <textarea
        v-model="comment"
        rows="3"
        class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="備考やコメントがあればご記入ください"
      ></textarea>
    </div>

    <div class="flex justify-end">
      <button
        @click="handleSubmit"
        :disabled="!canSubmit"
        class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        回答を送信する
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';

const route = useRoute();
const router = useRouter();
const meetingStore = useMeetingStore();

const meetingId = computed(() => route.params.id);
const meeting = ref(null);
const participantName = ref('');
const comment = ref('');
const error = ref('');
const responses = ref({});

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartElement = ref(null);
const selectedSlots = ref(new Set());

// ドラッグ開始
const startDrag = (event) => {
  if (!event.target.closest('[data-date]')) return;
  
  isDragging.value = true;
  dragStartElement.value = event.target.closest('[data-date]');
  selectedSlots.value.clear();
  
  const date = dragStartElement.value.dataset.date;
  const start = dragStartElement.value.dataset.start;
  const end = dragStartElement.value.dataset.end;
  selectedSlots.value.add(`${date}|${start}|${end}`);
};

// ドラッグ中
const handleDrag = (event) => {
  if (!isDragging.value) return;
  
  const element = event.target.closest('[data-date]');
  if (!element) return;
  
  const date = element.dataset.date;
  const start = element.dataset.start;
  const end = element.dataset.end;
  selectedSlots.value.add(`${date}|${start}|${end}`);
};

// ドラッグ終了
const endDrag = () => {
  if (!isDragging.value) return;
  
  if (selectedSlots.value.size > 0) {
    cycleSelectedResponses();
  }
  
  isDragging.value = false;
  dragStartElement.value = null;
  selectedSlots.value.clear();
};

// 選択された時間枠かどうかを判定
const isSlotSelected = (date, start, end) => {
  return selectedSlots.value.has(`${date}|${start}|${end}`);
};

// 選択された時間枠の回答をまとめて切り替え
const cycleSelectedResponses = () => {
  // 選択された各時間枠について、それぞれの現在の回答の次の回答に変更
  selectedSlots.value.forEach(slot => {
    const [date, start, end] = slot.split('|');
    const currentResponse = getResponse(date, start, end);
    
    // 各回答の次の回答を決定（◯→△→×→◯）
    const nextResponse = {
      '◯': '△',
      '△': '×',
      '×': '◯'
    }[currentResponse];
    
    // 回答を更新
    if (!responses.value[date]) {
      responses.value[date] = {};
    }
    responses.value[date][`${start}-${end}`] = nextResponse;
  });
};

// 日付のフォーマット
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${dayOfWeek})`;
};

// 時間枠の回答を取得
const getResponse = (date, startTime, endTime) => {
  if (!responses.value[date]) {
    responses.value[date] = {};
  }
  const key = `${startTime}-${endTime}`;
  if (responses.value[date][key] === undefined) {
    responses.value[date][key] = '◯'; // デフォルトは◯
  }
  return responses.value[date][key];
};

// 回答を切り替え（◯ → △ → × → ◯）
const cycleResponse = (date, startTime, endTime) => {
  const key = `${startTime}-${endTime}`;
  const currentResponse = getResponse(date, startTime, endTime);
  const nextResponse = {
    '◯': '△',
    '△': '×',
    '×': '◯'
  }[currentResponse];
  
  if (!responses.value[date]) {
    responses.value[date] = {};
  }
  responses.value[date][key] = nextResponse;
};

// 送信可能かどうか
const canSubmit = computed(() => {
  if (!participantName.value.trim()) return false;
  
  // すべての時間枠に回答があるか確認
  return Object.entries(meeting.value?.dates || {}).every(([date, dateData]) => {
    if (!responses.value[date]) return false;
    return dateData.timeSlots.every(slot => 
      getResponse(date, slot.start, slot.end) !== null
    );
  });
});

// 回答の送信
const handleSubmit = async () => {
  if (!canSubmit.value) return;

  try {
    const participantId = await meetingStore.addParticipant(meetingId.value, {
      name: participantName.value,
      availability: responses.value,
      comment: comment.value
    });

    // 送信完了後、完了画面に遷移
    router.push({
      name: 'complete',
      params: { id: meetingId.value, participantId }
    });
  } catch (err) {
    error.value = err.message;
  }
};

// 会議データの読み込み
onMounted(() => {
  const loadedMeeting = meetingStore.getMeeting(meetingId.value);
  if (!loadedMeeting) {
    error.value = '指定された会議が見つかりません。URLを確認してください。';
    return;
  }
  meeting.value = loadedMeeting;
});
</script>

<style scoped>
.select-none {
  user-select: none;
  -webkit-user-select: none;
}
</style>
