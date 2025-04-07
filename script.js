/* script.js */

// グローバル変数
let web3Modal;      // Web3Modalインスタンス
let provider;       // provider (web3 provider)
let ethersProvider; // ethers用のprovider
let signer;         // ethers用のsigner
let connectedAddress = null;

// ウィンドウ読み込み後に初期化
window.addEventListener("load", async () => {
  initWallet();
  document.getElementById("connectBtn").addEventListener("click", onConnect);
  document.getElementById("verifyBtn").addEventListener("click", onVerify);
});

// 1) WalletConnect + Web3Modalの初期化
function initWallet() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default, // 組み込みスクリプトから参照
      options: {
        infuraId: "YOUR_INFURA_ID", // 例: InfuraなどのRPCを使う場合
        // or rpc: { 1: "https://cloudflare-eth.com" } など
      }
    }
    // ほかのプロバイダ（walletlink, binancechainwallet等）も必要に応じて追加
  };

  web3Modal = new window.Web3Modal.default({
    cacheProvider: false, // リロード時に前回のプロバイダを記憶するか
    providerOptions,
    theme: "light" // or "dark"
  });
}

// 2) Connectボタンクリック時
async function onConnect() {
  try {
    provider = await web3Modal.connect();      // WalletConnect UIのポップアップ
    ethersProvider = new ethers.providers.Web3Provider(provider);
    signer = ethersProvider.getSigner();
    connectedAddress = await signer.getAddress();

    // UI反映
    document.getElementById("connectedWallet").textContent =
      "Connected Wallet: " + connectedAddress;
  } catch (err) {
    console.error("Connection failed:", err);
    alert("Failed to connect wallet: " + err);
  }
}

// 3) Verify & Register Wallet ボタンクリック時
async function onVerify() {
  if (!signer || !connectedAddress) {
    alert("Please connect your wallet first.");
    return;
  }
  // 例: Discordユーザー名（あるいはID）をDOMから取得
  const username = document.getElementById("username").textContent;

  // 視認しやすいメッセージ
  const message = `I am verifying wallet ownership for The Daks.\nDiscord User: ${username}\nWallet: ${connectedAddress}`;

  try {
    // EIP-191のsignMessage
    const signature = await signer.signMessage(message);

    console.log("Signature: ", signature);

    // TODO: ここでサーバーやGoogle Sheets連携のエンドポイントにFetch
    //       署名、DiscordID/ユーザー名、ウォレットアドレスなどを送る
    /*
    const res = await fetch("https://your-backend.example.com/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        address: connectedAddress,
        message,
        signature
      })
    });
    const data = await res.json();
    if (data.success) {
      alert("Verification success!");
    } else {
      alert("
