//! Google's token endpoint: a sign-in code traded for tokens, a renewal token for a new access
//! token, and a renewal token revoked.

use std::time::Duration;

use serde::Deserialize;
use ureq::Agent;

pub struct Google {
    agent: Agent,
    client_id: String,
    client_secret: String,
    token_url: String,
    revoke_url: String,
}

#[derive(Deserialize)]
pub struct Tokens {
    pub access_token: String,
    pub expires_in: u64,
    pub refresh_token: Option<String>,
}

/// Why Google gave no token: it refused the code or the renewal token, or it could not be reached.
#[derive(Debug)]
pub enum GoogleError {
    Refused,
    Unreachable,
}

/// The most of Google's answer read: a token answer is well under 4 KB.
const MAX_ANSWER: u64 = 16 * 1024;

impl Google {
    pub fn new(
        client_id: String,
        client_secret: String,
        token_url: String,
        revoke_url: String,
    ) -> Self {
        let agent = Agent::config_builder()
            .timeout_global(Some(Duration::from_secs(10)))
            // One kept connection to Google: requests come one at a time, and each idle one holds TLS buffers.
            .max_idle_connections(1)
            .max_idle_connections_per_host(1)
            .http_status_as_error(false)
            .build()
            .into();
        Self {
            agent,
            client_id,
            client_secret,
            token_url,
            revoke_url,
        }
    }

    fn token(&self, form: &[(&str, &str)]) -> Result<Tokens, GoogleError> {
        let mut answer = self
            .agent
            .post(&self.token_url)
            .send_form(form.iter().copied())
            .map_err(|_| GoogleError::Unreachable)?;
        let status = answer.status().as_u16();
        if (400..500).contains(&status) {
            return Err(GoogleError::Refused);
        }
        if status != 200 {
            return Err(GoogleError::Unreachable);
        }
        let text = answer
            .body_mut()
            .with_config()
            .limit(MAX_ANSWER)
            .read_to_string()
            .map_err(|_| GoogleError::Unreachable)?;
        serde_json::from_str(&text).map_err(|_| GoogleError::Unreachable)
    }

    /// The tokens for a code from Google's sign-in popup, whose redirect is `postmessage`.
    pub fn exchange(&self, code: &str) -> Result<Tokens, GoogleError> {
        self.token(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("client_id", &self.client_id),
            ("client_secret", &self.client_secret),
            ("redirect_uri", "postmessage"),
        ])
    }

    /// A new access token from a renewal token.
    pub fn refresh(&self, refresh_token: &str) -> Result<Tokens, GoogleError> {
        self.token(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", refresh_token),
            ("client_id", &self.client_id),
            ("client_secret", &self.client_secret),
        ])
    }

    /// The renewal token revoked, with every access token made from it. Best effort.
    pub fn revoke(&self, refresh_token: &str) {
        let _ = self
            .agent
            .post(&self.revoke_url)
            .send_form([("token", refresh_token)]);
    }
}
