import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { Storage } from '../utils/storage';

const STORAGE_KEY = 'meeting_scheduler_data';

export const useMeetingStore = defineStore('meeting', () => {
  // 会議データ
  const meetings = ref(Storage.load(STORAGE_KEY) || {});
  
  // 現在編集中の会議データ
  const currentMeeting = ref({
    id: null,
    dates: {},  // { '2025-02-04': { timeSlots: [...] } }
    comment: '', // コメント欄
    participants: [], // 参加者の配列
    createdAt: null,
    expiresAt: null
  });

  // データの変更を監視して自動保存
  watch(
    meetings,
    (newMeetings) => {
      Storage.save(STORAGE_KEY, newMeetings);
    },
    { deep: true }
  );

  // 30分単位の時間枠を生成
  const generateTimeSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const start = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
      
      const end = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        start,
        end,
        available: true
      });
    }
    
    return slots;
  };

  // 会議IDの生成
  const generateMeetingId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
  };

  // 会議データの保存
  const saveMeeting = (meetingData) => {
    const id = generateMeetingId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60日後に期限切れ

    const meeting = {
      ...meetingData,
      id,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      participants: []
    };

    meetings.value[id] = meeting;
    return id;
  };

  // 会議データの取得（期限切れチェック付き）
  const getMeeting = (id) => {
    const meeting = meetings.value[id];
    if (!meeting) return null;

    // 期限切れチェック
    const now = new Date();
    const expiresAt = new Date(meeting.expiresAt);
    if (now > expiresAt) {
      delete meetings.value[id];
      return null;
    }

    return meeting;
  };

  // 会議の参加登録用URLを生成
  const generateJoinUrl = (meetingId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${meetingId}`;
  };

  // 日付ごとの時間枠を更新
  const updateDateTimeSlots = (date, timeSlots) => {
    if (!currentMeeting.value.dates[date]) {
      currentMeeting.value.dates[date] = { timeSlots: [] };
    }
    currentMeeting.value.dates[date].timeSlots = timeSlots;
  };

  // 参加者の追加
  const addParticipant = (meetingId, participantData) => {
    const meeting = getMeeting(meetingId);
    if (!meeting) {
      throw new Error('会議が見つかりません');
    }

    // 参加者名の重複チェック
    const isDuplicate = meeting.participants.some(
      participant => participant.name === participantData.name
    );
    if (isDuplicate) {
      throw new Error('この名前はすでに使用されています');
    }

    const participantId = Date.now().toString(36);
    const newParticipant = {
      id: participantId,
      name: participantData.name,
      availability: participantData.availability || {},
      comment: participantData.comment || '',
      createdAt: new Date().toISOString()
    };

    meeting.participants.push(newParticipant);
    return participantId;
  };

  // 期限切れの会議を削除
  const cleanExpiredMeetings = () => {
    const now = new Date();
    Object.entries(meetings.value).forEach(([id, meeting]) => {
      const expiresAt = new Date(meeting.expiresAt);
      if (now > expiresAt) {
        delete meetings.value[id];
      }
    });
  };

  // 定期的に期限切れの会議を削除
  setInterval(cleanExpiredMeetings, 60 * 60 * 1000); // 1時間ごと

  return {
    meetings,
    currentMeeting,
    saveMeeting,
    getMeeting,
    generateJoinUrl,
    addParticipant,
    cleanExpiredMeetings,
    generateTimeSlots,
    updateDateTimeSlots
  };
});
