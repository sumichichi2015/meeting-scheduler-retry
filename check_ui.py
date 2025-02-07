from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.keys import Keys
import time
import os

def check_time_slots():
    # Chromeドライバーの設定
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # ヘッドレスモードで実行
    options.add_argument('--window-size=1920,1080')  # ウィンドウサイズを設定
    options.add_argument('--disable-gpu')  # GPUハードウェアアクセラレーションを無効化
    options.add_argument('--no-sandbox')  # サンドボックスを無効化
    options.add_argument('--disable-dev-shm-usage')  # /dev/shmの使用を回避
    driver = webdriver.Chrome(options=options)
    
    try:
        # 会議作成ページにアクセス
        driver.get('http://localhost:3002/meeting-scheduler-retry/create')
        time.sleep(5)  # ページの読み込みを待つ
        
        # デバッグ: DOMツリーを出力
        print("DOMツリー:")
        print(driver.execute_script("return document.documentElement.outerHTML"))
        
        # デバッグ: 全ての要素を表示
        all_elements = driver.find_elements(By.XPATH, "//*")
        print(f"検出された要素の数: {len(all_elements)}")
        
        # デバッグ: Vue.jsのデータ属性を持つ要素を検索
        vue_elements = driver.find_elements(By.XPATH, "//*[starts-with(@data-v-,'')] | //*[contains(@class, 'v-')]")
        print(f"Vue.js関連の要素数: {len(vue_elements)}")
        
        # Vue.jsのv-modelをトリガーするJavaScriptヘルパー関数
        def trigger_vue_input(element, value):
            driver.execute_script("""
                const input = arguments[0];
                const value = arguments[1];
                const event = new Event('input', { bubbles: true });
                input.value = value;
                input.dispatchEvent(event);
            """, element, value)
        
        # 主催者名と会議名を入力
        try:
            # より詳細で柔軟なセレクターを使用
            input_selectors = [
                "input[placeholder='例：山田 太郎']",
                "input[placeholder='例：2025年度第1回プロジェクト会議']",
                "//label[contains(text(), '主催者名')]/following-sibling::input",
                "//label[contains(text(), '会議名')]/following-sibling::input"
            ]
            
            # 主催者名入力
            organizer_input = None
            for selector in input_selectors:
                try:
                    if selector.startswith("//"):
                        organizer_input = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        organizer_input = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    if organizer_input:
                        break
                except:
                    continue
            
            if organizer_input:
                # Vue.jsのv-modelをトリガー
                trigger_vue_input(organizer_input, "テスト主催者")
                print("主催者名入力完了")
            else:
                print("主催者名入力フィールドが見つかりませんでした")
        except Exception as e:
            print(f"主催者名入力エラー: {str(e)}")
        
        try:
            # 会議名入力
            meeting_name_input = None
            for selector in input_selectors[1:]:
                try:
                    if selector.startswith("//"):
                        meeting_name_input = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.XPATH, selector))
                        )
                    else:
                        meeting_name_input = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                    
                    if meeting_name_input:
                        break
                except:
                    continue
            
            if meeting_name_input:
                # Vue.jsのv-modelをトリガー
                trigger_vue_input(meeting_name_input, "テスト会議")
                print("会議名入力完了")
            else:
                print("会議名入力フィールドが見つかりませんでした")
        except Exception as e:
            print(f"会議名入力エラー: {str(e)}")
        
        # カレンダーで日付を選択
        try:
            # より具体的で堅牢なセレクターを使用
            dates = WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-v-d3cca5a8].date:not(.other-month)"))
            )
            print(f"検出された日付の数: {len(dates)}")
            
            if dates:
                # 最初の利用可能な日付をクリック
                dates[0].click()
                print("日付選択完了")
        except Exception as e:
            print(f"日付選択エラー: {str(e)}")
        
        # 時間範囲を設定
        try:
            # 時間入力フィールドを探すための複数の方法
            time_input_selectors = [
                "input[type='time']",
                "//label[contains(text(), '開始時間')]/following-sibling::input[@type='time']",
                "//label[contains(text(), '終了時間')]/following-sibling::input[@type='time']",
                "input[placeholder='開始時間']",
                "input[placeholder='終了時間']"
            ]
            
            time_inputs = []
            for selector in time_input_selectors:
                try:
                    if selector.startswith("//"):
                        inputs = driver.find_elements(By.XPATH, selector)
                    else:
                        inputs = driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    time_inputs.extend(inputs)
                    
                    if len(time_inputs) >= 2:
                        break
                except Exception as e:
                    print(f"時間入力フィールド検索エラー: {str(e)}")
            
            print(f"検出された時間入力フィールドの数: {len(time_inputs)}")
            
            if len(time_inputs) >= 2:
                # 開始時間と終了時間を設定
                for input_field in time_inputs:
                    input_field.clear()
                
                # Vue.jsのv-modelをトリガー
                trigger_vue_input(time_inputs[0], "09:00")
                trigger_vue_input(time_inputs[1], "17:00")
                
                print("時間範囲入力完了")
            else:
                print("時間入力フィールドが見つかりませんでした")
        except Exception as e:
            print(f"時間範囲入力エラー: {str(e)}")
        
        # 時間枠生成ボタンをクリック
        try:
            generate_button_selectors = [
                "button:contains('時間枠を生成')",
                "button:contains('Generate Time Slots')",
                "button[data-v-generate-timeslots]",
                "//button[contains(text(), '時間枠を生成')]",
                "//button[contains(text(), 'Generate Time Slots')]"
            ]
            
            generate_button = None
            for selector in generate_button_selectors:
                try:
                    if selector.startswith("//"):
                        generate_button = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    elif selector.startswith("button:contains"):
                        text = selector.split("'")[1]
                        generate_button = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.XPATH, f"//button[contains(text(), '{text}')]"))
                        )
                    else:
                        generate_button = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    
                    if generate_button:
                        break
                except:
                    continue
            
            if generate_button:
                # JavaScriptを使用してクリックイベントをトリガー
                driver.execute_script("""
                    const button = arguments[0];
                    const event = new Event('click', { bubbles: true });
                    button.dispatchEvent(event);
                """, generate_button)
                print("時間枠生成ボタンクリック完了")
            else:
                print("時間枠生成ボタンが見つかりませんでした")
        except Exception as e:
            print(f"時間枠生成ボタンクリックエラー: {str(e)}")
        
        time.sleep(2)  # 時間枠の生成を待つ
        
        # スクリーンショットを保存
        screenshot_path = os.path.join(os.path.dirname(__file__), "screenshot.png")
        driver.save_screenshot(screenshot_path)
        print(f"スクリーンショット保存: {screenshot_path}")
        
        # 時間枠の要素を確認
        try:
            time_slots = WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "button.w-full.py-2.px-4"))
            )
            print(f"検出された時間枠の数: {len(time_slots)}")
            
            if time_slots:
                print("時間枠が正しく表示されています")
                for slot in time_slots[:3]:  # 最初の3つの時間枠の内容を表示
                    print(f"時間枠の内容: {slot.text}")
                return True
            else:
                print("時間枠が表示されていません")
                return False
        except Exception as e:
            print(f"時間枠確認エラー: {str(e)}")
            return False
        
    except TimeoutException:
        print("タイムアウト: 要素が見つかりませんでした")
        return False
    except Exception as e:
        print(f"エラーが発生しました: {str(e)}")
        return False
    finally:
        driver.quit()

if __name__ == "__main__":
    check_time_slots()
