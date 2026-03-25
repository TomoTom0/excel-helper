<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings'
import { useConverterStore } from '../stores/converter'
import { useNumberingStore } from '../stores/numbering'
import { useSqlInsertStore } from '../stores/sqlInsert'

const settingsStore = useSettingsStore()
const { persistInputs, darkMode } = storeToRefs(settingsStore)

const converterStore = useConverterStore()
const numberingStore = useNumberingStore()
const sqlInsertStore = useSqlInsertStore()

const showNotification = ref(false)
const notificationMessage = ref('')

const showTempNotification = (message: string) => {
  notificationMessage.value = message
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 2000)
}

const clearAllData = () => {
  if (!confirm('すべての保存データをクリアしますか？この操作は取り消せません。')) {
    return
  }

  // 各ストアのデータをクリア
  converterStore.clearColumnLengths()
  converterStore.clearDataBody()
  converterStore.clearColumnHeaders()
  converterStore.clearColumnOptions()

  numberingStore.clearDataBody()

  sqlInsertStore.clearTableName()
  sqlInsertStore.clearDataBody()
  sqlInsertStore.clearColumnHeaders()
  sqlInsertStore.clearColumnLengths()
  sqlInsertStore.clearColumnOptions()

  showTempNotification('すべてのデータをクリアしました')
}

const handlePersistChange = () => {
  const message = persistInputs.value
    ? '入力値の保存を有効にしました'
    : '入力値の保存を無効にしました'
  showTempNotification(message)
}

const handleDarkModeChange = () => {
  const message = darkMode.value
    ? 'ダークモードを有効にしました'
    : 'ライトモードを有効にしました'
  showTempNotification(message)
}
</script>

<template>
  <div class="converter-container">
    <div class="header-row">
      <h2>設定</h2>
    </div>

    <div class="settings-section">
      <div class="setting-item">
        <div class="setting-header">
          <h3>ダークモード</h3>
          <label class="toggle-switch">
            <input
              type="checkbox"
              v-model="darkMode"
              @change="handleDarkModeChange"
            />
            <span class="slider"></span>
          </label>
        </div>
        <p class="setting-description">
          ダークテーマを適用します。
        </p>
      </div>

      <div class="setting-item">
        <div class="setting-header">
          <h3>入力値の保存</h3>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              v-model="persistInputs"
              @change="handlePersistChange"
            />
            <span class="slider"></span>
          </label>
        </div>
        <p class="setting-description">
          前回入力した値をブラウザに保存し、次回アクセス時に復元します。
        </p>
        <p class="setting-description setting-note">
          ※無効にすると、既存の保存データもすべてクリアされます。
        </p>
      </div>

      <div class="setting-item">
        <div class="setting-header">
          <h3>データ管理</h3>
        </div>
        <p class="setting-description">
          保存されているすべてのデータをクリアします。
        </p>
        <button 
          class="btn btn-danger" 
          @click="clearAllData"
        >
          <i class="mdi mdi-delete"></i>
          <span>すべてのデータをクリア</span>
        </button>
      </div>
    </div>

    <!-- 通知メッセージ -->
    <div v-if="showNotification" class="notification success">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<style scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  transition: background-color 0.3s ease;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.setting-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.setting-description {
  margin: 10px 0;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.setting-note {
  color: var(--text-hint);
  font-size: 0.85rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--toggle-bg);
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--toggle-active);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  margin-top: 10px;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-danger:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
