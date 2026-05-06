let currentTask = null

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'EXECUTE_TASK') {
    currentTask = message.task
    executeTask(currentTask)
  }
})

async function executeTask(task) {
  await sleep(2000)

  const video = document.querySelector('video')
  if (video) {
    const watchTime = Math.floor(Math.random() * (30 - 5 + 1)) + 5
    await sleep(watchTime * 1000)
  }

  if (task.action_type === 'like') {
    const likeBtn = document.querySelector('[aria-label="Like"]') || document.querySelector('button[aria-label*="like"]')
    if (likeBtn) likeBtn.click()
  }

  await sleep(1000)
  chrome.runtime.sendMessage({ action: 'TASK_COMPLETED', data: { task, watch_time: 10 } })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
