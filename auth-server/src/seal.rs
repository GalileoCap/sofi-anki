//! A Google renewal token sealed under the server's key, so the browser can keep it and only this
//! server can read it back (A20).

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{ChaCha20Poly1305, Nonce};

const NONCE_LEN: usize = 12;
/// Bound into every seal, so a seal made for anything else does not open here.
const CONTEXT: &[u8] = b"anki-auth renewal token v1";

pub struct Sealer(ChaCha20Poly1305);

impl Sealer {
    pub fn new(key: &[u8; 32]) -> Self {
        Self(ChaCha20Poly1305::new(key.into()))
    }

    /// `secret` sealed under a fresh nonce, as URL-safe base64 of the nonce and the ciphertext.
    pub fn seal(&self, secret: &str) -> String {
        let mut nonce = [0u8; NONCE_LEN];
        getrandom::fill(&mut nonce).expect("the system's randomness");
        let sealed = self
            .0
            .encrypt(
                &Nonce::from(nonce),
                Payload {
                    msg: secret.as_bytes(),
                    aad: CONTEXT,
                },
            )
            .expect("a renewal token fits the cipher's limit");
        URL_SAFE_NO_PAD.encode([nonce.as_slice(), &sealed].concat())
    }

    /// The secret in `sealed`, or None when it was not sealed by this key or was changed since.
    pub fn open(&self, sealed: &str) -> Option<String> {
        let bytes = URL_SAFE_NO_PAD.decode(sealed).ok()?;
        if bytes.len() <= NONCE_LEN {
            return None;
        }
        let (nonce, ciphertext) = bytes.split_at(NONCE_LEN);
        let nonce: [u8; NONCE_LEN] = nonce.try_into().ok()?;
        let plain = self
            .0
            .decrypt(
                &Nonce::from(nonce),
                Payload {
                    msg: ciphertext,
                    aad: CONTEXT,
                },
            )
            .ok()?;
        String::from_utf8(plain).ok()
    }
}

/// A 32-byte key from 64 hex digits.
pub fn key_from_hex(hex: &str) -> Option<[u8; 32]> {
    let hex = hex.trim();
    if hex.len() != 64 {
        return None;
    }
    let mut key = [0u8; 32];
    for (i, byte) in key.iter_mut().enumerate() {
        *byte = u8::from_str_radix(hex.get(2 * i..2 * i + 2)?, 16).ok()?;
    }
    Some(key)
}
