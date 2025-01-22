// 获取缓存信息的函数
async function updateCacheInfo() {
  // 获取浏览器缓存大小
  try {
    const storageData = await chrome.browsingData.getStorageEstimate();
    const cacheSizeInMB = (storageData.usageDetails?.cacheStorage || 0) / (1024 * 1024);
    document.getElementById("cacheSize").textContent = `${cacheSizeInMB.toFixed(2)} MB`;
  } catch (e) {
    // 如果无法获取，就不显示任何信息
    document.getElementById("cacheSize").textContent = "";
  }

  // 获取 Cookies 数量
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
      document.getElementById("localStorageCount").textContent = `${storage.localStorage} 项 (${(storage.localStorageSize / 1024).toFixed(2)} KB)`;
      document.getElementById("sessionStorageCount").textContent = `${storage.sessionStorage} 项 (${(storage.sessionStorageSize / 1024).toFixed(2)} KB)`;
    }
  } catch (e) {
    document.getElementById("localStorageCount").textContent = "无法获取";
    document.getElementById("sessionStorageCount").textContent = "无法获取";
  }

  // 获取 Cookies 数量
  try {
    const cookies = await chrome.cookies.getAll({});
    document.getElementById("cookiesCount").textContent = `${cookies.length} 个`;
  } catch (e) {
    document.getElementById("cookiesCount").textContent = "无法获取";
  }
}

// 页面加载时获取缓存信息
document.addEventListener("DOMContentLoaded", updateCacheInfo);

// 清除按钮的事件处理
document.getElementById("clearButton").addEventListener("click", async () => {
  const status = document.getElementById("status");
  const options = {
    cache: document.getElementById("cache").checked,
    localStorage: document.getElementById("localStorage").checked,
    sessionStorage: document.getElementById("sessionStorage").checked,
    cookies: document.getElementById("cookies").checked,
  };

  try {
    // 清除浏览器缓存
    if (options.cache) {
      await chrome.browsingData.removeCache({ since: 0 });
    }

    // 清除 Cookies
    if (options.cookies) {
      await chrome.browsingData.removeCookies({ since: 0 });
    }

    // 清除 LocalStorage 和 SessionStorage
    if (options.localStorage || options.sessionStorage) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          throw new Error("没有找到活动标签页");
        }

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (clearLocal, clearSession) => {
            if (clearLocal) {
              localStorage.clear();
            }
            if (clearSession) {
              sessionStorage.clear();
            }
          },
          args: [options.localStorage, options.sessionStorage],
        });
      } catch (e) {
        console.error("清除存储失败:", e);
        throw new Error("清除存储失败: " + e.message);
      }
    }

    status.textContent = "清除成功！";
    status.style.color = "#4CAF50";

    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  } catch (error) {
    console.error("发生错误:", error);
    status.textContent = "清除失败：" + error.message;
    status.style.color = "#f44336";
  }
});
