const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

let workerRunning = false
let workerInterval = null

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn')
  const stopBtn = document.getElementById('stop-btn')
  const loginBtn = document.getElementById('login-btn')
  const switchBtn = document.getElementById('switch-btn')

  chrome.storage.local.get(['workerRunning', 'tasksDone', 'coinsEarned'], (data) => {
    workerRunning = data.workerRunning || false
    updateUI()
    document.getElementById('tasks-done').textContent = data.tasksDone || 0
    document.getElementById('coins-earned').textContent = data.coinsEarned || 0
  })

  startBtn.addEventListener('click', startWorker)
  stopBtn.addEventListener('click', stopWorker)
  loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.tiktok.com/login' })
  })
  switchBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['tiktokCookies'])
    loginBtn.style.display = 'block'
    switchBtn.style.display = 'none'
    document.getElementById('login-status-text').textContent = 'Not logged in'
  })

  chrome.storage.local.get(['tiktokCookies'], (data) => {
    if (data.tiktokCookies) {
      document.getElementById('login-status-text').textContent = '✓ Logged in'
      loginBtn.style.display = 'none'
      switchBtn.style.display = 'block'
    }
  })
})

function startWorker() {
  workerRunning = true
  chrome.storage.local.set({ workerRunning: true })
  chrome.runtime.sendMessage({ action: 'START_WORKER' })
  updateUI()
}

function stopWorker() {
  workerRunning = false
  chrome.storage.local.set({ workerRunning: false })
  chrome.runtime.sendMessage({ action: 'STOP_WORKER' })
  updateUI()
}

function updateUI() {
  const startBtn = document.getElementById('start-btn')
  const stopBtn = document.getElementById('stop-btn')
  const statusIndicator = document.getElementById('status-indicator')

  if (workerRunning) {
    startBtn.style.display = 'none'
    stopBtn.style.display = 'block'
    statusIndicator.textContent = '● RUNNING'
    statusIndicator.className = 'status running'
    document.getElementById('current-action').textContent = 'Working...'
  } else {
    startBtn.style.display = 'block'
    stopBtn.style.display = 'none'
    statusIndicator.textContent = '● STOPPED'
    statusIndicator.className = 'status stopped'
    document.getElementById('current-action').textContent = 'Idle'
  }
}
