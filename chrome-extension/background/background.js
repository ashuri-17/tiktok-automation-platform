const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'

let workerRunning = false
let pollInterval = null

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_WORKER') {
    startWorker()
  } else if (message.action === 'STOP_WORKER') {
    stopWorker()
  }
})

function startWorker() {
  workerRunning = true
  chrome.storage.local.set({ workerRunning: true })
  pollForTasks()
  pollInterval = setInterval(pollForTasks, 30000)
}

function stopWorker() {
  workerRunning = false
  chrome.storage.local.set({ workerRunning: false })
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

async function pollForTasks() {
  if (!workerRunning) return

  chrome.storage.local.get(['tiktokCookies'], async (data) => {
    if (!data.tiktokCookies) return

    const response = await fetch(`${SUPABASE_URL}/functions/v1/task-distribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    const { task } = await response.json()
    if (task) {
      chrome.tabs.create({ url: task.campaigns.video_url }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener)
          }
        })
      })
    }
  })
}
