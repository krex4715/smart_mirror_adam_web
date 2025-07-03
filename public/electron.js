/*****************************************************************
 * public/electron.js  –  SmartMirror Electron main process
 *****************************************************************/
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs   = require("fs");

/* -------------------------------------------------------------
 *  IPC  :  블루투스 설정 창 열기
 * ----------------------------------------------------------- */
function openBluetoothSettings() {
  switch (process.platform) {
    /* ---------- Windows ---------- */
    case "win32":
      console.log("↪︎ ms-settings:bluetooth");
      shell.openExternal("ms-settings:bluetooth");
      break;

    /* ---------- macOS ---------- */
    case "darwin":
      console.log("↪︎ System Preferences (Bluetooth)");
      shell.openExternal("x-apple.systempreferences:com.apple.Bluetooth");
      break;

    /* ---------- Linux ---------- */
    case "linux": {
      /* 1) GNOME Settings (env 변수 강제, 새 세션으로 detach) */
      const gnomeCmd =
        "env XDG_CURRENT_DESKTOP=GNOME setsid /usr/bin/gnome-control-center bluetooth";
      console.log("↪︎", gnomeCmd);
      exec(gnomeCmd, (err, _so, se) => {
        if (!err) { console.log("✔ GNOME 설정 열림"); return; }
        console.error("✖ GNOME 실패:", se.trim());

        /* 2) Blueman (필요 없다면 아래 블록 통째로 삭제해도 됨)
        console.log("↪︎ /usr/bin/blueman-manager");
        exec("/usr/bin/blueman-manager", (err2, _so2, se2) => {
          if (!err2) { console.log("✔ Blueman 열림"); return; }
          console.error("✖ Blueman 실패:", se2.trim());

          // 3) KDE Plasma
          console.log("↪︎ /usr/bin/kcmshell5 kcm_bluetooth");
          exec("/usr/bin/kcmshell5 kcm_bluetooth", (err3, _so3, se3) => {
            if (!err3) { console.log("✔ KDE 모듈 열림"); return; }
            console.error("✖ KDE 실패:", se3.trim());

            // 4) 최후 수단 – URI 스킴
            console.log("↪︎ bluetooth-sendto://");
            shell.openExternal("bluetooth-sendto://");
          });
        });
        */
      });
      break;
    }

    default:
      console.warn("⚠️  지원되지 않는 OS:", process.platform);
      break;
  }
}

ipcMain.handle("open-bluetooth-settings", () => {
  console.log("🛠  IPC 수신  →  openBluetoothSettings()");
  openBluetoothSettings();
});

/* -------------------------------------------------------------
 *  BrowserWindow 생성
 * ----------------------------------------------------------- */
let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  console.log(
    "[DEBUG] preload path =", preloadPath,
    "exists =", fs.existsSync(preloadPath)
  );

  mainWindow = new BrowserWindow({
    width: 2160,
    height: 3840,
    frame: false,
    fullscreen: true,
    titleBarStyle: "hidden",
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    `file://${path.join(__dirname, "../build/index.html")}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => { mainWindow = null; });
}

/* -------------------------------------------------------------
 *  앱 라이프사이클
 * ----------------------------------------------------------- */
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
