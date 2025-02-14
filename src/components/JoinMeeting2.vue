<template>
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">会議日程調整</h1>

    <!-- 参加者情報入力 -->
    <div v-if="!hasSubmitted" class="mb-8">
      <div class="bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">参加者情報</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <input
              v-model="participantName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="山田 太郎"
            />
          </div>
        </div>
      </div>

      <!-- 時間枠の選択 -->
      <div v-for="date in Object.keys(meeting.dates).sort()" :key="date" class="mt-6">
        <div class="bg-white shadow-sm rounded-lg overflow-hidden">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-medium">
              {{ formatDate(date) }}
            </h3>
          </div>
          
          <div class="p-4">
            <div class="grid gap-4">
              <div
                v-for="(slot, index) in meeting.dates[date].timeSlots"
                :key="index"
                class="flex items-center justify-between bg-yellow-50 p-3 rounded-lg"
                @mousedown.prevent="startDragSelection(date, index)"
                @mousemove.prevent="updateDragSelection(date, index)"
                @mouseup.prevent="endDragSelection"
                @mouseleave.prevent="endDragSelection"
              >
                <div class="flex-1">
                  {{ slot.start }} 〜 {{ slot.end }}
                </div>
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150"
                  :class="[
                    getAnswerButtonClass(getParticipantAnswer(date, index)),
                    isDragging && isInDragRange(date, index) && 'ring-2 ring-indigo-500'
                  ]"
                >
                  {{ getAnswerSymbol(getParticipantAnswer(date, index)) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- コメント入力 -->
      <div class="mt-6 bg-white shadow-sm rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">コメント</h2>
        <textarea
          v-model="comment"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="ご要望やご質問があればご記入ください"
        ></textarea>
      </div>

      <!-- 送信ボタン -->
      <div class="mt-6 flex justify-end">
        <button
          @click="submitAnswers"
          :disabled="!canSubmit"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          回答を登録する
        </button>
      </div>
    </div>

    <!-- 送信完了メッセージ -->
    <div v-else class="bg-white shadow-sm rounded-lg p-6">
      <h2 class="text-lg font-semibold text-green-600 mb-4">
        回答を登録しました
      </h2>
      <p class="text-gray-600">
        ご協力ありがとうございました。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';

const route = useRoute();
const meetingStore = useMeetingStore();

// 会議情報の取得
const meeting = computed(() => {
  return meetingStore.getMeeting(route.params.id) || { dates: {} };
});

// 参加者の入力情報
const participantName = ref('');
const comment = ref('');
const hasSubmitted = ref(false);

// 回答の状態管理
const answers = ref({});
const answerStates = ['○', '△', '×'];

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartInfo = ref(null);
const dragCurrentInfo = ref(null);

// 参加者の回答を取得
const getParticipantAnswer = (date, index) => {
  const key = `${date}-${index}`;
  return answers.value[key] || 0; // デフォルトは○（0）
};

// 回答記号を取得
const getAnswerSymbol = (state) => {
  return answerStates[state];
};

// 回答ボタンのスタイルクラスを取得
const getAnswerButtonClass = (state) => {
  const classes = {
    0: 'bg-green-100 text-green-700 hover:bg-green-200',
    1: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    2: 'bg-red-100 text-red-700 hover:bg-red-200'
  };
  return classes[state];
};

// ドラッグ選択の開始
const startDragSelection = (date, index) => {
  isDragging.value = true;
  dragStartInfo.value = { date, index };
  dragCurrentInfo.value = { date, index };
  
  // ドラッグ開始時の状態を次の状態に進める
  const key = `${date}-${index}`;
  const currentState = answers.value[key] || 0;
  const nextState = (currentState + 1) % 3;
  answers.value[key] = nextState;
};

// ドラッグ選択の更新
const updateDragSelection = (date, index) => {
  if (!isDragging.value || !dragStartInfo.value) return;
  
  dragCurrentInfo.value = { date, index };
  
  if (date === dragStartInfo.value.date) {
    const startIndex = Math.min(dragStartInfo.value.index, dragCurrentInfo.value.index);
    const endIndex = Math.max(dragStartInfo.value.index, dragCurrentInfo.value.index);
    
    // ドラッグ開始時の状態を取得
    const startKey = `${date}-${dragStartInfo.value.index}`;
    const nextState = answers.value[startKey];
    
    // 範囲内のすべての時間枠を同じ状態に設定
    for (let i = startIndex; i <= endIndex; i++) {
      answers.value[`${date}-${i}`] = nextState;
    }
  }
};

// ドラッグ選択の終了
const endDragSelection = () => {
  isDragging.value = false;
  dragStartInfo.value = null;
  dragCurrentInfo.value = null;
};

// スロットが選択範囲内かどうかを判定
const isInDragRange = (date, index) => {
  if (!isDragging.value || !dragStartInfo.value || !dragCurrentInfo.value) return false;
  if (date !== dragStartInfo.value.date) return false;

  const startIndex = Math.min(dragStartInfo.value.index, dragCurrentInfo.value.index);
  const endIndex = Math.max(dragStartInfo.value.index, dragCurrentInfo.value.index);
  
  return index >= startIndex && index <= endIndex;
};

// 日付のフォーマット
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${dayOfWeek}）`;
};

// 送信可能かどうか
const canSubmit = computed(() => {
  return participantName.value.trim() !== '';
});

// 回答を送信
const submitAnswers = () => {
  const participant = {
    name: participantName.value,
    comment: comment.value,
    answers: {}
  };

  // 回答データを整形
  Object.keys(meeting.value.dates).forEach(date => {
    participant.answers[date] = meeting.value.dates[date].timeSlots.map((_, index) => {
      const state = getParticipantAnswer(date, index);
      return state === 0 ? '○' : state === 1 ? '△' : '×';
    });
  });

  // 回答を保存
  meetingStore.addParticipant(route.params.id, participant);
  hasSubmitted.value = true;
};
</script>
