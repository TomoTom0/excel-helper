<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '../stores/settings'
import { useConverterStore } from '../stores/converter'
import { useNumberingStore } from '../stores/numbering'
import { useSqlInsertStore } from '../stores/sqlInsert'

const settingsStore = useSettingsStore()
const { persistInputs } = storeToRefs(settingsStore)

const converterStore = useConverterStore()
const numberingStore = useNumberingStore()
const sqlInsertStore = useSqlInsertStore()

const showNotification = ref(false)
const notificationMessage = ref('')

const clearAllData = () => {
  if (!confirm('すべての保存データをクリアしますか？この操作は取り消せません。')) {
    return
  }

  // 各ストアのデータをクリア
  converterStore.clearColumnLengths()
  converterStore.clearDataBody()
  converterStore.clearColumnTitles()
  converterStore.clearColumnOptions()

  numberingStore.clearDataBody()

  sqlInsertStore.clearTableName()
  sqlInsertStore.clearDataBody()
  sqlInsertStore.clearColumnHeaders()
  sqlInsertStore.clearColumnLengths()
  sqlInsertStore.clearColumnOptions()

  // localStorageからも削除
  localStorage.removeItem('converter')
  localStorage.removeItem('numbering')
  localStorage.removeItem('sqlInsert')

  notificationMessage.value = 'すべてのデータをクリアしました'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 2000)
}

const handlePersistChange = () => {
  notificationMessage.value = persistInputs.value 
    ? '入力値の保存を有効にしました' 
    : '入力値の保存を無効にしました'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 2000)
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
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  color: #2c3e50;
}

.setting-description {
  margin: 10px 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.setting-note {
  color: #999;
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
  background-color: #ccc;
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
  background-color: #42b983;
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
