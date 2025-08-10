import CryptoJS from 'crypto-js';

class EncryptionManager {
  constructor() {
    this.keyPair = null;
    this.roomKey = null;
  }

  // Generate a symmetric key for the room
  generateRoomKey() {
    const key = CryptoJS.lib.WordArray.random(256/8).toString();
    this.roomKey = key;
    return key;
  }

  // Set room key
  setRoomKey(key) {
    this.roomKey = key;
  }

  // Encrypt message data
  encryptMessage(message) {
    if (!this.roomKey) {
      console.warn('No room key available for encryption');
      return message;
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(message), 
        this.roomKey
      ).toString();
      
      return {
        encrypted: true,
        data: encrypted,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return message;
    }
  }

  // Decrypt message data
  decryptMessage(encryptedData) {
    if (!encryptedData.encrypted || !this.roomKey) {
      return encryptedData;
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData.data, 
        this.roomKey
      ).toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  // Encrypt file data before upload
  encryptFileData(fileData) {
    if (!this.roomKey) {
      console.warn('No room key available for file encryption');
      return fileData;
    }

    try {
      // For large files, we'll encrypt just the metadata
      // In production, you'd want to encrypt the actual file content
      const encryptedMetadata = this.encryptMessage({
        name: fileData.name,
        type: fileData.type,
        size: fileData.size
      });

      return {
        ...fileData,
        encryptedMetadata,
        isEncrypted: true
      };
    } catch (error) {
      console.error('File encryption failed:', error);
      return fileData;
    }
  }

  // Generate hash for data integrity
  generateHash(data) {
    return CryptoJS.SHA256(JSON.stringify(data)).toString();
  }

  // Verify data integrity
  verifyHash(data, hash) {
    return this.generateHash(data) === hash;
  }

  // Generate simple key exchange for demo purposes
  // In production, use proper key exchange protocols like ECDH
  generateKeyExchange() {
    const privateKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const publicKey = CryptoJS.SHA256(privateKey).toString();
    
    return {
      privateKey,
      publicKey
    };
  }

  // Simulate secure key exchange
  performKeyExchange(roomId, userId) {
    // In production, implement proper key exchange protocol
    // For now, generate a deterministic key based on room and user
    const combinedData = `${roomId}-${userId}-${Date.now()}`;
    const roomKey = CryptoJS.SHA256(combinedData).toString().substring(0, 32);
    
    this.setRoomKey(roomKey);
    return roomKey;
  }

  // Encrypt whiteboard data
  encryptWhiteboardData(drawData) {
    return this.encryptMessage({
      type: 'whiteboard',
      data: drawData
    });
  }

  // Decrypt whiteboard data
  decryptWhiteboardData(encryptedData) {
    const decrypted = this.decryptMessage(encryptedData);
    return decrypted.type === 'whiteboard' ? decrypted.data : encryptedData;
  }

  // Encrypt chat message
  encryptChatMessage(message, username, userId) {
    return this.encryptMessage({
      type: 'chat',
      message,
      username,
      userId,
      timestamp: Date.now()
    });
  }

  // Decrypt chat message
  decryptChatMessage(encryptedData) {
    const decrypted = this.decryptMessage(encryptedData);
    return decrypted.type === 'chat' ? decrypted : encryptedData;
  }
}

// Export a singleton instance
export const encryptionManager = new EncryptionManager();

// Utility functions
export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

export const generateSecureId = () => {
  return CryptoJS.lib.WordArray.random(128/8).toString();
};

export const encryptLocalStorage = (key, data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      key
    ).toString();
    return encrypted;
  } catch (error) {
    console.error('Local storage encryption failed:', error);
    return data;
  }
};

export const decryptLocalStorage = (key, encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData,
      key
    ).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Local storage decryption failed:', error);
    return null;
  }
};

export default encryptionManager;