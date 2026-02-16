```json
{
  "title": "How to verify Obsidian Sync's end-to-end encryption",
  "author": "Licat",
  "site": "Obsidian",
  "published": "2023-06-05T00:00:00+00:00"
}
```

On our [About page](https://obsidian.md), we describe the guiding principles that have shaped Obsidian since the start. Privacy is one of these principles, and we go to great lengths to make sure we can uphold thisstatement:

> We believe that your thoughts and ideas belong to you and deserve complete privacy. That’s why your data is stored on your device, inaccessible to us. When you use our online services, your data is protected with end-to-end encryption for maximumsecurity.

When you use [Obsidian Sync](https://obsidian.md/sync), your data is end-to-end encrypted. But how can you be sure that istrue?

In this guide, we provide step-by-step instructions so that you can trustlessly verify the end-to-end encryption of your data when it is sent and received via our Syncservers.

### How Obsidian Sync works

Let’s review how Obsidian Sync encryptionworks:

1. You provide a vault password, or let our managed server generate one for you. This password is separate from your account password and is only used for establishing a remotevault.
2. The Obsidian app generates a unique [salt](https://en.wikipedia.org/wiki/Salt_\(cryptography\)) for each vault. A salt is random data used to protect your password by mixing it with your password beforehashing.
3. Your base key is derived from your password + salt using an algorithm called [scrypt](https://en.wikipedia.org/wiki/Scrypt).
4. Your encryption key is derived from the base key using an algorithm called [HKDF](https://en.wikipedia.org/wiki/HKDF). If your vault was created using the [older encryption version](https://help.obsidian.md/sync/migrate), the encryption key uses the base keydirectly.
5. This encryption key is used to encrypt/decrypt data with [AES -256](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) using [Galois/CounterMode](https://en.wikipedia.org/wiki/Galois/Counter_Mode).

In the next few steps, you’ll learn how to get your vault’s salt, and test the encryption of yourdata.

### Getting your vault’s salt and encryption version

First, get the salt used to derive your encryption key by following thesesteps:

1. Make sure that Obsidian Sync is turnedon.
2. Open Developer Tools in the Obsidian app using the hotkey Cmd+Opt+I on macOS or Ctrl+Shift+I on Windows.
3. Go to the Console and run the following code, by copy/pasting it and pressing the Returnkey:
```js
let data = await (await fetch('https://api.obsidian.md/vault/list', {method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({token: JSON.parse(localStorage.getItem('obsidian-account')).token})})).json();
let vaults = [].concat(data.shared, data.vaults);
let vault = vaults.find(v => v.id === app.internalPlugins.getEnabledPluginById('sync').vaultId);
console.log(\`The salt of your vault ${vault.name} is: "${vault.salt}" with encryptionVersion ${vault.encryption_version}\`);
```

You should see a message containing your salt and encryptionversion:

```js
The salt of your vault Notes is: "8II2%?YeNpddlbd@4Z)c" with encryptionVersion 0
```

### Decrypting data

Next, find an example of a sync event and decrypt it. Here we will use the Network tab of Developers Tools. This is where all sync events are logged, so you can see data that is being sent and received by the Obsidian app, and confirm that it is using your encryptionkey.

1. Go to the Network tab of the Developer Tools, and filter by "Socket" types (for [WebSocket](https://en.wikipedia.org/wiki/WebSocket)).
2. Find the WebSocket connection to Obsidian Sync. It will look like `sync-xx.obsidian.md` — you may need to reload Obsidian to seeit.
3. In the WebSocket data stream, go to the Message tab. There you will see binary messages of uploads and downloads. If you aren’t seeing them, you can easily trigger one by modifying any synced note in yourvault.
4. Right click on one of them and choose `Copy message > Copy as Base64`.
5. Using the following code, enter your password, your salt, and base64 binary data, and change the encryption version if necessary. Then, run the decryption routine in the Console (alternatively you can run it in a NodeJS prompt orscript).
```js
// Use the standard crypto package from NodeJS
let crypto = require('crypto');

// Enter your password, salt, and base64 binary data
let password = '8VbM0dCTdyX4QzO(@)Y7';
let salt = '8zUqk?w*rnU7LneIzJR&';
let data = Buffer.from('sAsic1PU9IpdteFDoff+dSVHTL1KnOWaGE5PJnYf51L8qPJFslqHWcqZAdrYaUMdXqirdlw4rDhtvWb9Lg==', 'base64');

// Enter the encryption protocol version (0 or 3)
let encryptionVersion = 3;

// Derive the encryption/decryption key from your password and salt
let key = crypto.scryptSync(Buffer.from(password.normalize('NFKC'), 'utf8'), Buffer.from(salt.normalize('NFKC'), 'utf8'),
    32, {N: 32768, r: 8, p: 1, maxmem: 128 * 32768 * 8 * 2});
let aesKey = key;
if (encryptionVersion === 3) {
    aesKey = crypto.hkdfSync('sha256', key, '', 'ObsidianAesGcm', 32);
}

// Split up the data blob into the 12-bytes IV, the encrypted data, and the 16-bytes auth tag.
let iv = data.subarray(0, 12);
let encryptedData = data.subarray(12, data.length - 16);
let authTag = data.subarray(data.length - 16);

// Decrypt the data
let decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
decipher.setAuthTag(authTag);
let decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

// Print it to a string
console.log(decrypted.toString('utf8'));
```

The data that is returned should be a revision of a file that was sent or received via the Obsidian Sync’s servers. That’s it! If it properly decrypts, you’ll know your encryption key isworking.

---

**2025-09-05 edit:** Updated instructions to support [new Syncversion](https://obsidian.md/changelog/2025-08-22-sync/).