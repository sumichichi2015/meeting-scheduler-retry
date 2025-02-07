import { defineStore } from 'pinia';
import { ref, computed, watch, onUnmounted } from 'vue';
import { Storage } from '../utils/storage';
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  query,
  where,
  Timestamp,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

const STORAGE_KEY = 'meeting_scheduler_data';
const MEETINGS_COLLECTION = 'meetings';

export const useMeetingStore = defineStore('meeting', () => {
  // 会議データ
  const meetings = ref(Storage.load(STORAGE_KEY) || {});
  
  // 現在編集中の会議データ
  const currentMeeting = ref({
    id: null,
    dates: {},  // { '2025-02-04': { timeSlots: [...] } }
    comment: '', // コメント欄
    participants: [], // 参加者の配列
    organizer: '', // 主催者名
    meetingName: '', // 会議名
    createdAt: null,
    expiresAt: null
  });

  // Firestoreのリスナー解除用関数
  let unsubscribe = null;

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
      (currentHour === endHour && currentMinute <= endMinute)
    ) {
      const start = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // 次の時間枠の開始時刻を計算
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
      
      // 終了時刻を超えないようにチェック
      if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
        const end = endTime;
        slots.push({ start, end, available: true });
        break;
      }
      
      const end = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push({ start, end, available: true });
    }
    
    return slots;
  };

  // 会議IDの生成
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // 会議データの保存
  const saveMeeting = async (meetingData) => {
    const id = meetingData.id || generateMeetingId();
    const now = new Date();
    const meetingDoc = {
      ...meetingData,
      id,
      organizer: meetingData.organizer || '',
      meetingName: meetingData.meetingName || '',
      createdAt: Timestamp.fromDate(now),
      expiresAt: meetingData.expiresAt ? Timestamp.fromDate(new Date(meetingData.expiresAt)) : null,
      updatedAt: Timestamp.fromDate(now),
      participants: [] // 参加者配列を初期化
    };

    try {
      // Firestoreに保存
      await setDoc(doc(db, MEETINGS_COLLECTION, id), meetingDoc);
      
      // ローカルステートも更新
      meetings.value[id] = meetingDoc;
      
      return id;
    } catch (error) {
      console.error('Failed to save meeting:', error);
      throw error;
    }
  };

  // 会議データの取得とリアルタイム監視
  const getMeeting = async (id) => {
    try {
      // すでにリスナーがある場合は解除
      if (unsubscribe) {
        unsubscribe();
      }

      // 会議データのリアルタイム監視を開始
      unsubscribe = onSnapshot(doc(db, MEETINGS_COLLECTION, id), (doc) => {
        if (doc.exists()) {
          const meetingData = doc.data();
          // 期限切れチェック
          if (meetingData.expiresAt && meetingData.expiresAt.toDate() < new Date()) {
            return null;
          }
          meetings.value[id] = meetingData;
          return meetingData;
        }
        return null;
      });

      // 初回データ取得
      const docSnap = await getDoc(doc(db, MEETINGS_COLLECTION, id));
      if (docSnap.exists()) {
        const meetingData = docSnap.data();
        if (meetingData.expiresAt && meetingData.expiresAt.toDate() < new Date()) {
          return null;
        }
        meetings.value[id] = meetingData;
        return meetingData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get meeting:', error);
      throw error;
    }
  };

  // 参加者の追加
  const addParticipant = async (meetingId, participantData) => {
    try {
      const participantId = Math.random().toString(36).substring(2, 15);
      const participant = {
        id: participantId,
        name: participantData.name,
        availability: participantData.availability || {},
        createdAt: Timestamp.fromDate(new Date())
      };

      // 会議ドキュメントの参加者配列を更新
      const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);
      await updateDoc(meetingRef, {
        participants: arrayUnion(participant)
      });

      // ローカルステートも更新
      if (!meetings.value[meetingId].participants) {
        meetings.value[meetingId].participants = [];
      }
      meetings.value[meetingId].participants.push(participant);

      return participantId;
    } catch (error) {
      console.error('Failed to add participant:', error);
      throw error;
    }
  };

  // コンポーネントのアンマウント時にリスナーを解除
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return {
    meetings,
    currentMeeting,
    generateTimeSlots,
    generateMeetingId,
    saveMeeting,
    getMeeting,
    addParticipant,
    generateJoinUrl: (meetingId) => `${window.location.origin}/join/${meetingId}`,
    updateDateTimeSlots: (date, timeSlots) => {
      console.log('updateDateTimeSlots 呼び出し:', { date, timeSlots });
      
      // 入力バリデーション
      if (!date || !timeSlots) {
        console.error('日付または時間枠が不正です', { date, timeSlots });
        return;
      }

      // currentMeeting が初期化されていない場合は初期化
      if (!currentMeeting.value.dates) {
        console.warn('currentMeeting.dates が初期化されていません。初期化します。');
        currentMeeting.value.dates = {};
      }

      // 日付のエントリが存在しない場合は作成
      if (!currentMeeting.value.dates[date]) {
        console.log(`日付 ${date} のエントリを作成します`);
        currentMeeting.value.dates[date] = {};
      }

      // 時間枠を更新
      currentMeeting.value.dates[date].timeSlots = timeSlots;
      
      // デバッグ: 更新後の状態を確認
      console.log('更新後の時間枠:', currentMeeting.value.dates[date].timeSlots);
    },
    setOrganizer: (name) => {
      currentMeeting.value.organizer = name;
    },
    setMeetingName: (name) => {
      currentMeeting.value.meetingName = name;
    }
  };
});
