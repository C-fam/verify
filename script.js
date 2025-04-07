// HTML要素の取得
const connectBtn = document.getElementById("connectBtn");
const signBtn = document.getElementById("signBtn");
const statusDiv = document.getElementById("status");

let web3Modal;
let provider;
let signer;
let selectedAccount;

// STEP 1: Web3Modal初期化
function init() {
  // WalletConnectのオプション: Monad Testnet用にchainIdを指定
  const walletConnectProvider = {
    package: window.WalletConnectProvider.default,
    options: {
      rpc: {
        10143: "https://testnet-rpc.monad.xyz"
      },
      chainId: 10143,
    }
  };

  const providerOptions = {
    walletconnect: walletConnectProvider
  };

  // Web3Modal インスタンス化
  web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions,
    theme: "light"
  });
}

// STEP 2: ウォレット接続
async function onConnect() {
  try {
    // モーダル表示してウォレット選択
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();

    // どのアドレスで接続されたか?
    selectedAccount = await signer.getAddress();
    statusDiv.innerText = "Connected with address: " + selectedAccount;
    signBtn.disabled = false;
  } catch (err) {
    console.error(err);
    statusDiv.innerText = "Connection failed";
  }
}

// STEP 3: メッセージを署名 → サーバに送る(例)
async function onSignMessage() {
  try {
    // DiscordユーザーIDやnonceなど、URLパラメータから取得
    const queryParams = new URLSearchParams(window.location.search);
    const discordId = queryParams.get("discord_id");
    const nonce = queryParams.get("nonce") || Math.floor(Math.random() * 1000000);

    // メッセージを作る
    const message = `DiscordID: ${discordId}\nNonce: ${nonce}\nI am verifying my wallet ownership.`;

    // Ethers.jsを使って署名
    const signature = await signer.signMessage(message);

    statusDiv.innerText = 
      "Address: " + selectedAccount + "\n" + 
      "Signature: " + signature;

    // STEP 4: 署名をサーバーに送信 (POST)
    // ※実際には自前サーバー(API)を立てて、検証＆スプレッドシート記入
    //   ここではfetch例のみ記載
    fetch("https://example.com/api/verify_signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discord_id: discordId,
        wallet_address: selectedAccount,
        signature: signature,
        original_message: message
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        statusDiv.innerText += "\nServer verification success!";
      } else {
        statusDiv.innerText += "\nServer verification failed.";
      }
    })
    .catch(err => {
      console.error(err);
      statusDiv.innerText += "\nFailed to send to server.";
    });

  } catch (err) {
    console.error(err);
    statusDiv.innerText = "Signing failed";
  }
}

// イベントリスナー設定
connectBtn.addEventListener("click", onConnect);
signBtn.addEventListener("click", onSignMessage);

// 初期化
window.addEventListener('load', async () => {
  init();
});