/**
 * LocalStorageのラッパークラス
 * - エラーハンドリング
 * - データの型安全性
 * - 有効期限の管理
 * を提供します
 */
export class Storage {
  /**
   * データを保存します
   * @param {string} key - 保存するキー
   * @param {any} value - 保存する値
   * @param {number} [expirationHours] - 有効期限（時間）
   */
  static save(key, value, expirationHours = 24) {
    try {
      const item = {
        value,
        timestamp: new Date().getTime(),
        expirationHours
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('保存エラー:', error);
      return false;
    }
  }

  /**
   * データを取得します
   * @param {string} key - 取得するキー
   * @returns {any|null} 保存された値、または null
   */
  static load(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const { value, timestamp, expirationHours } = JSON.parse(item);
      const now = new Date().getTime();
      const expirationTime = timestamp + (expirationHours * 60 * 60 * 1000);

      if (now > expirationTime) {
        localStorage.removeItem(key);
        return null;
      }

      return value;
    } catch (error) {
      console.error('読み込みエラー:', error);
      return null;
    }
  }

  /**
   * データを削除します
   * @param {string} key - 削除するキー
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('削除エラー:', error);
      return false;
    }
  }

  /**
   * 全てのデータを削除します
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('全件削除エラー:', error);
      return false;
    }
  }
}
