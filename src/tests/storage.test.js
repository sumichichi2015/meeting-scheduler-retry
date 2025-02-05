import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../utils/storage';

describe('Storage', () => {
  beforeEach(() => {
    // テスト前にLocalStorageをクリア
    localStorage.clear();
  });

  it('データの保存と読み込みができる', () => {
    const testData = { id: 1, name: 'テスト会議' };
    Storage.save('test_key', testData);
    const loadedData = Storage.load('test_key');
    expect(loadedData).toEqual(testData);
  });

  it('期限切れのデータは自動的に削除される', () => {
    const testData = { id: 1, name: 'テスト会議' };
    Storage.save('test_key', testData, 0); // 有効期限0時間
    const loadedData = Storage.load('test_key');
    expect(loadedData).toBeNull();
  });
});
