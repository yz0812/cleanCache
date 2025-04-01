// 获取缓存信息的函数
async function updateCacheInfo() {
  // 获取浏览器缓存大小
  try {
    const storageData = await chrome.browsingData.getStorageEstimate();
    const cacheSizeInMB = (storageData.usageDetails?.cacheStorage || 0) / (1024 * 1024);
    if (cacheSizeInMB > 0) {
      document.getElementById("cacheSize").textContent = `${cacheSizeInMB.toFixed(2)} MB`;
    } else {
      document.getElementById("cacheSize").textContent = "";
    }
  } catch (e) {
    // 如果无法获取，就不显示任何信息
    document.getElementById("cacheSize").textContent = "";
  }

  // 获取 LocalStorage 和 SessionStorage 信息
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            localStorage: Object.keys(localStorage).length,
            sessionStorage: Object.keys(sessionStorage).length,
            localStorageSize: new Blob(Object.values(localStorage)).size,
            sessionStorageSize: new Blob(Object.values(sessionStorage)).size,
          };
        },
      });

      const storage = result[0].result;
      if (storage.localStorage > 0) {
        document.getElementById("localStorageCount").textContent = `${storage.localStorage} 项 (${(storage.localStorageSize / 1024).toFixed(2)} KB)`;
      } else {
        document.getElementById("localStorageCount").textContent = "";
      }
      
      if (storage.sessionStorage > 0) {
        document.getElementById("sessionStorageCount").textContent = `${storage.sessionStorage} 项 (${(storage.sessionStorageSize / 1024).toFixed(2)} KB)`;
      } else {
        document.getElementById("sessionStorageCount").textContent = "";
      }
    }
  } catch (e) {
    document.getElementById("localStorageCount").textContent = "";
    document.getElementById("sessionStorageCount").textContent = "";
  }

  // 获取 Cookies 数量
  try {
    const cookies = await chrome.cookies.getAll({});
    if (cookies.length > 0) {
      document.getElementById("cookiesCount").textContent = `${cookies.length} 个`;
    } else {
      document.getElementById("cookiesCount").textContent = "";
    }
  } catch (e) {
    document.getElementById("cookiesCount").textContent = "";
  }
}

// 显示状态消息的函数
function showStatus(message, isError = false) {
  const status = document.getElementById("status");
  status.textContent = message;
  
  if (isError) {
    status.className = "mt-3 text-center text-sm py-2 bg-red-50 text-red-600 rounded-md transition-all duration-300";
  } else {
    status.className = "mt-3 text-center text-sm py-2 bg-green-50 text-green-600 rounded-md transition-all duration-300";
  }
  
  setTimeout(() => {
    status.textContent = "";
    status.className = "mt-3 text-center text-sm py-0 rounded-md transition-all duration-300";
  }, 2000);
}

// 清除浏览器缓存
async function clearBrowserCache() {
  try {
    await chrome.browsingData.removeCache({ since: 0 });
    showStatus("浏览器缓存已清除");
    await updateCacheInfo();
  } catch (error) {
    console.error("清除缓存失败:", error);
    showStatus("清除缓存失败: " + error.message, true);
  }
}

// 清除LocalStorage
async function clearLocalStorageData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("没有找到活动标签页");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        localStorage.clear();
      }
    });
    showStatus("LocalStorage已清除");
    await updateCacheInfo();
  } catch (error) {
    console.error("清除LocalStorage失败:", error);
    showStatus("清除失败: " + error.message, true);
  }
}

// 清除SessionStorage
async function clearSessionStorageData() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error("没有找到活动标签页");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        sessionStorage.clear();
      }
    });
    showStatus("SessionStorage已清除");
    await updateCacheInfo();
  } catch (error) {
    console.error("清除SessionStorage失败:", error);
    showStatus("清除失败: " + error.message, true);
  }
}

// 清除Cookies
async function clearCookiesData() {
  try {
    await chrome.browsingData.removeCookies({ since: 0 });
    showStatus("Cookies已清除");
    await updateCacheInfo();
  } catch (error) {
    console.error("清除Cookies失败:", error);
    showStatus("清除失败: " + error.message, true);
  }
}

// 页面加载时获取缓存信息
document.addEventListener("DOMContentLoaded", () => {
  updateCacheInfo();
  
  // 为各个单独清除按钮添加事件监听
  document.getElementById("clearCache").addEventListener("click", clearBrowserCache);
  document.getElementById("clearLocalStorage").addEventListener("click", clearLocalStorageData);
  document.getElementById("clearSessionStorage").addEventListener("click", clearSessionStorageData);
  document.getElementById("clearCookies").addEventListener("click", clearCookiesData);
});

// 清除所有按钮的事件处理
document.getElementById("clearButton").addEventListener("click", async () => {
  const status = document.getElementById("status");
  
  try {
    // 清除浏览器缓存
    await chrome.browsingData.removeCache({ since: 0 });

    // 清除 Cookies
    await chrome.browsingData.removeCookies({ since: 0 });

    // 清除 LocalStorage 和 SessionStorage
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error("没有找到活动标签页");
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          localStorage.clear();
          sessionStorage.clear();
        }
      });
    } catch (e) {
      console.error("清除存储失败:", e);
      throw new Error("清除存储失败: " + e.message);
    }

    status.textContent = "清除成功！";
    status.className = "mt-3 text-center text-sm py-2 bg-green-50 text-green-600 rounded-md transition-all duration-300";

    // 更新缓存信息
    await updateCacheInfo();

    setTimeout(() => {
      status.textContent = "";
      status.className = "mt-3 text-center text-sm py-0 rounded-md transition-all duration-300";
    }, 2000);
  } catch (error) {
    console.error("发生错误:", error);
    status.textContent = "清除失败：" + error.message;
    status.className = "mt-3 text-center text-sm py-2 bg-red-50 text-red-600 rounded-md transition-all duration-300";
  }
});
