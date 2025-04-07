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
  // (MetaMaskなど別のウォレットでもTestnet接続する場合は事前にchain追加設定が必要)
  const walletConnectProvider = {
    package: window.WalletConnectProvider.default,
    options: {
      rpc: {
        10143: "https://testnet-rpc.monad.xyz"
      },
      chainId: 10143
    }
  };

  const providerOptions = {
    walletconnect: walletConnectProvider
  };

  // Web3Modal インスタンス作成
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

    // どのアドレスで接続されたか
    selectedAccount = await signer.getAddress();

    // UI更新
    signBtn.disabled = false;
    statusDiv.innerText = "Connected with address: " + selectedAccount;
  } catch (err) {
    console.error(err);
    statusDiv.innerText = "Connection failed.\n" + err.message;
  }
}

// STEP 3: メッセージ署名 → (ハリボテ)サーバ検証
async function onSignMessage() {
  try {
    // クエリパラメータからdiscord_id & nonceを取得
    const queryParams = new URLSearchParams(window.location.search);
    const discordId = queryParams.get("discord_id") || "unknown_user";
    const nonce = queryParams.get("nonce") || Math.floor(Math.random() * 100000);

    // 署名用メッセージ
    // NOTE: 実際の運用では \n やフォーマットを明確にしたメッセージを使う
    const message = `DiscordID: ${discordId}\nNonce: ${nonce}\nI am verifying my wallet ownership.`;

    // Ethers.jsで署名を取る
    const signature = await signer.signMessage(message);

    // UI更新
    statusDiv.innerText = 
      "✅ Wallet Address: " + selectedAccount + "\n" +
      "✅ Signature: " + signature + "\n\n";

    // ここから先はハリボテ。本来はサーバーに送って署名を検証する
    // (本当にGoogleシートに書き込む場合は、下記fetch先でバックエンドAPIを立てる必要があります)
    const payload = {
      discord_id: discordId,
      wallet_address: selectedAccount,
      signature: signature,
      original_message: message
    };

    // 署名をサーバーに送る(例)
    // ※ GitHub Pagesのみではサーバーサイドが動かないので、ここはコメントアウトかダミーに
    /*
    fetch("https://your-backend.example.com/api/verify_signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        statusDiv.innerText += "✅ Verification success! GoogleSheet updated.\n";
      } else {
        statusDiv.innerText += "❌ Verification failed: " + (data.error || "Unknown error") + "\n";
      }
    })
    .catch(err => {
      console.error(err);
      statusDiv.innerText += "❌ Failed to send to server.\n" + err.message;
    });
    */

    // === ハリボテ動作 ===
    // サーバーに送信はせず、強制的に「検証完了」と表示
    setTimeout(() => {
      statusDiv.innerText += "✅ [FAKE] Verification complete!\n(No real server call)";
    }, 1000);

  } catch (err) {
    console.error(err);
    statusDiv.innerText = "Signing failed.\n" + err.message;
  }
}

// イベントリスナー設定
connectBtn.addEventListener("click", onConnect);
signBtn.addEventListener("click", onSignMessage);

// 初期化
window.addEventListener('load', async () => {
  init();
});
