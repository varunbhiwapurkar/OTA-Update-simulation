
import React, { useState } from "react";

async function importPublicKey(pem) {
  const b64 = pem.replace(/-----.*?-----/g, "").replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    ["verify"]
  );
}

async function verifySignature(publicKey, manifestJson, signatureBase64) {
  const enc = new TextEncoder();
  const data = enc.encode(manifestJson);
  const signature = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  return await window.crypto.subtle.verify(
    { name: "RSA-PSS", saltLength: 32 },
    publicKey,
    signature.buffer,
    data
  );
}

async function sha256hex(buffer) {
  
  const arr = buffer instanceof ArrayBuffer ? buffer : buffer.buffer ?? buffer;
  const digest = await window.crypto.subtle.digest("SHA-256", arr);
  const b = new Uint8Array(digest);
  return Array.from(b).map(x => x.toString(16).padStart(2,"0")).join("");
}

function App() {
  const [status, setStatus] = useState("Idle");
  const backend = "https://localhost:8443";

  async function checkForUpdate() {
    setStatus("Fetching manifest...");
    try {
      const mres = await fetch(`${backend}/api/updates/latest`);
      if (!mres.ok) throw new Error("no update");
      const js = await mres.json();
      setStatus("Fetched manifest");

      
      const pk = await (await fetch(`${backend}/api/keys/public`)).text();
      const publicKey = await importPublicKey(pk);

      
      const manifestJson = js.manifest_json || JSON.stringify(js.manifest);
      console.log("[CLIENT manifestJson used for verify] >>>", manifestJson);
      console.log("[CLIENT manifest bytes] >>>", Array.from(new TextEncoder().encode(manifestJson)));

      
      const signatureB64 = js.signature;
      const sigBytes = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
      console.log("[signature base64 length]", signatureB64.length);
      console.log("[signature bytes length]", sigBytes.length);
      console.log("[signature sample bytes]", sigBytes.slice(0,20));

      
      setStatus("Verifying signature...");
      const okSig = await verifySignature(publicKey, manifestJson, signatureB64);
      console.log("verify returned:", okSig);
      if (!okSig) {
        setStatus("Signature verification FAILED");
        return;
      }
      setStatus("Signature OK");

      
      setStatus("Downloading firmware...");
      const fwResp = await fetch(`${backend}/api/updates/${js.id}/firmware`);
      if (!fwResp.ok) throw new Error("firmware fetch failed");
      const fwBuffer = await fwResp.arrayBuffer();

      
      setStatus("Verifying integrity...");
      const hashHex = await sha256hex(fwBuffer);
      console.log("[computed hash]", hashHex);
      console.log("[manifest sha256]", js.manifest.sha256);
      if (hashHex !== js.manifest.sha256) {
        setStatus(`Hash mismatch! expected ${js.manifest.sha256} got ${hashHex}`);
        return;
      }

      
      setStatus("Update verified — applying (downloading)...");
      const blob = new Blob([fwBuffer]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = js.manifest.filename || "firmware.bin";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("Firmware downloaded/applied.");
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>OTA Client (Vehicle)</h2>
      <p>Status: <strong>{status}</strong></p>
      <button onClick={checkForUpdate}>Check for Update</button>
      <p>Backend: {backend}</p>
    </div>
  );
}

export default App;
