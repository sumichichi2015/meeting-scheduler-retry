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
            <div class="divide-y divide-gray-200">
              <div
                v-for="(slot, index) in dateData.timeSlots"
                :key="`${date}-${slot.start}`"
                class="hover:bg-gray-50 relative cursor-pointer select-none"
                @mousedown="startDragSelection(date, index)"
                @mousemove="updateDragSelection(date, index)"
                @mouseup="endDragSelection"
                @mouseleave="handleMouseLeave($event, date, index)"
              >
                <div 
                  class="px-6 py-3 flex items-center justify-between group"
                  :class="{'bg-indigo-50': isInDragRange(date, index)}"
                >
                  <div class="flex-1">
                    <div class="text-sm text-gray-900">
                      {{ slot.start }} 〜 {{ slot.end }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ getParticipantCount(date, slot) }}
                    </div>
                  </div>
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-150"
                      :class="responseClasses(getResponse(date, slot))"
                    >
                      {{ getResponse(date, slot) }}
                    </div>
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
        placeholder="ご要望やコメントがありましたらご記入ください"
      ></textarea>
    </div>

    <div class="flex justify-end">
      <button
        @click="handleSubmit"
        :disabled="!canSubmit"
        class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        回答を送信する
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeetingStore } from '../stores/meeting';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';

const route = useRoute();
const router = useRouter();
const meetingStore = useMeetingStore();

const meetingId = computed(() => route.params.id);
const meeting = ref(null);
const participantName = ref('');
const comment = ref('');
const error = ref('');
const responses = ref({});
const unsubscribe = ref(null);

// 回答の状態遷移を定義
const nextResponse = {
  '○': '△',
  '△': '×',
  '×': '○'
};

// 特定の時間枠の回答を取得
const getResponse = (date, slot) => {
  const key = `${date}-${slot.start}`;
  return responses.value[key] || '○';
};

// 回答を設定
const setResponse = (date, slot, value) => {
  const key = `${date}-${slot.start}`;
  responses.value[key] = value;
};

// ドラッグ選択の状態管理
const isDragging = ref(false);
const dragStartInfo = ref(null);
const dragCurrentInfo = ref(null);
const initialResponses = ref(new Map()); // ドラッグ開始時の状態を保存

// ドラッグ選択の開始
const startDragSelection = (date, index) => {
  isDragging.value = true;
  dragStartInfo.value = { date, index };
  dragCurrentInfo.value = { date, index };
  initialResponses.value.clear();

  // クリック時の現在の回答状態を取得し、次の状態に更新
  const slot = meeting.value.dates[date].timeSlots[index];
  const currentResponse = getResponse(date, slot);
  const nextValue = nextResponse[currentResponse];
  
  // 最初のスロットの状態を保存し、更新
  const key = `${date}-${slot.start}`;
  initialResponses.value.set(key, currentResponse);
  setResponse(date, slot, nextValue);
};

// ドラッグ中の選択を更新
const updateDragSelection = (date, index) => {
  if (!isDragging.value || !dragStartInfo.value) return;
  dragCurrentInfo.value = { date, index };
  updateDraggedResponses();
};

// マウスがコンポーネントから離れた時の処理
const handleMouseLeave = (event, date, index) => {
  const relatedTarget = event.relatedTarget;
  if (!relatedTarget || !relatedTarget.closest('.divide-y')) {
    endDragSelection();
  }
};

// ドラッグされた範囲の回答を更新
const updateDraggedResponses = () => {
  if (!dragStartInfo.value || !dragCurrentInfo.value || !meeting.value) return;

  const dates = Object.keys(meeting.value.dates);
  const startDateIndex = dates.indexOf(dragStartInfo.value.date);
  const currentDateIndex = dates.indexOf(dragCurrentInfo.value.date);

  const [minDateIndex, maxDateIndex] = [
    Math.min(startDateIndex, currentDateIndex),
    Math.max(startDateIndex, currentDateIndex)
  ];

  // 選択された日付の範囲でループ
  for (let dateIndex = minDateIndex; dateIndex <= maxDateIndex; dateIndex++) {
    const date = dates[dateIndex];
    const timeSlots = meeting.value.dates[date].timeSlots;
    let startSlotIndex = 0;
    let endSlotIndex = timeSlots.length - 1;

    // 開始日の場合
    if (dateIndex === startDateIndex) {
      startSlotIndex = dragStartInfo.value.index;
    }
    // 終了日の場合
    if (dateIndex === currentDateIndex) {
      endSlotIndex = dragCurrentInfo.value.index;
    }

    // インデックスの順序を正規化
    if (dateIndex === startDateIndex && dateIndex === currentDateIndex) {
      [startSlotIndex, endSlotIndex] = [
        Math.min(dragStartInfo.value.index, dragCurrentInfo.value.index),
        Math.max(dragStartInfo.value.index, dragCurrentInfo.value.index)
      ];
    }

    // スロットの更新
    for (let i = startSlotIndex; i <= endSlotIndex; i++) {
      const slot = timeSlots[i];
      const key = `${date}-${slot.start}`;
      
      // まだ保存されていない場合は現在の状態を保存
      if (!initialResponses.value.has(key)) {
        const currentResponse = getResponse(date, slot);
        initialResponses.value.set(key, currentResponse);
      }
      
      // 保存された初期状態から次の状態に遷移
      const initialResponse = initialResponses.value.get(key);
      setResponse(date, slot, nextResponse[initialResponse]);
    }
  }
};

// ドラッグ選択の終了
const endDragSelection = () => {
  isDragging.value = false;
  dragStartInfo.value = null;
  dragCurrentInfo.value = null;
  initialResponses.value.clear();
};

// 範囲内かどうかを判定
const isInDragRange = (date, index) => {
  if (!isDragging.value || !dragStartInfo.value || !dragCurrentInfo.value) return false;

  const dates = Object.keys(meeting.value.dates);
  const startDateIndex = dates.indexOf(dragStartInfo.value.date);
  const currentDateIndex = dates.indexOf(dragCurrentInfo.value.date);
  const targetDateIndex = dates.indexOf(date);

  // 日付が範囲外の場合
  if (targetDateIndex < Math.min(startDateIndex, currentDateIndex) ||
      targetDateIndex > Math.max(startDateIndex, currentDateIndex)) {
    return false;
  }

  // 同じ日の場合
  if (startDateIndex === currentDateIndex && targetDateIndex === startDateIndex) {
    const [minIndex, maxIndex] = [
      Math.min(dragStartInfo.value.index, dragCurrentInfo.value.index),
      Math.max(dragStartInfo.value.index, dragCurrentInfo.value.index)
    ];
    return index >= minIndex && index <= maxIndex;
  }

  // 開始日の場合
  if (targetDateIndex === startDateIndex) {
    return index >= dragStartInfo.value.index;
  }

  // 終了日の場合
  if (targetDateIndex === currentDateIndex) {
    return index <= dragCurrentInfo.value.index;
  }

  // 中間の日の場合
  return true;
};

// 回答のスタイルクラス
const responseClasses = (response) => {
  switch (response) {
    case '○':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
    case '△':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    case '×':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
    default:
      return 'border-gray-300';
  }
};

// 日付のフォーマット
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 (${dayOfWeek})`;
};

// 参加状況のカウントを取得
const getParticipantCount = (date, slot) => {
  const okCount = getParticipantCountByResponse(date, slot, '○');
  const maybeCount = getParticipantCountByResponse(date, slot, '△');
  const total = meeting.value?.participants?.length || 0;
  
  if (total === 0) return '回答なし';
  return `${okCount + maybeCount}/${total}名`;
};

// 参加状況のカウント（特定の回答）
const getParticipantCountByResponse = (date, slot, response) => {
  if (!meeting.value?.participants) return 0;
  return meeting.value.participants.filter(p => {
    return p.responses?.[`${date}-${slot.start}`] === response;
  }).length;
};

// 送信可能かどうか
const canSubmit = computed(() => {
  return participantName.value.trim() !== '';
});

// 回答の送信
const handleSubmit = async () => {
  if (!canSubmit.value) return;

  try {
    const meetingRef = doc(db, 'meetings', meetingId.value);
    const participant = {
      name: participantName.value,
      comment: comment.value,
      responses: responses.value,
      timestamp: new Date().toISOString()
    };

    await updateDoc(meetingRef, {
      participants: arrayUnion(participant)
    });

    // 送信成功後、フォームをクリア
    participantName.value = '';
    comment.value = '';
    responses.value = {};
    
    alert('回答を送信しました。ありがとうございます。');
  } catch (e) {
    console.error('Error submitting response:', e);
    error.value = '回答の送信に失敗しました。';
  }
};

// Firestoreからの会議データの取得とリアルタイム監視
onMounted(async () => {
  try {
    const meetingRef = doc(db, 'meetings', meetingId.value);
    unsubscribe.value = onSnapshot(meetingRef, (doc) => {
      if (doc.exists()) {
        meeting.value = doc.data();
        // 既存の回答がある場合は反映
        if (meeting.value.participants) {
          const existingParticipant = meeting.value.participants.find(
            p => p.name === participantName.value
          );
          if (existingParticipant) {
            responses.value = existingParticipant.responses || {};
          }
        }
      } else {
        error.value = '指定された会議が見つかりません。';
        router.push('/');
      }
    });
  } catch (e) {
    console.error('Error loading meeting:', e);
    error.value = '会議データの読み込みに失敗しました。';
  }
});

// コンポーネントのアンマウント時にリスナーを解除
onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value();
  }
});
</script>
