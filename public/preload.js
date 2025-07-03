/*****************************************************************
 * public/preload.js  –  렌더러 <-> 메인 간 안전 브릿지
 *****************************************************************/
const { contextBridge, ipcRenderer } = require("electron");

console.log("[PRELOAD] loaded OK");   // 디버그용, 나중에 지워도 됨

contextBridge.exposeInMainWorld("electronAPI", {
  /** OS 블루투스 설정 창 열기 */
  openBluetoothSettings: () => ipcRenderer.invoke("open-bluetooth-settings"),
});
