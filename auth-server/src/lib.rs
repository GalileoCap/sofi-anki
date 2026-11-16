//! The token server for sofi-anki's sync (A20): it trades a Google sign-in code for tokens and
//! renews access tokens from a renewal token the browser keeps sealed. It stores nothing, and
//! answers one request at a time, so its memory stays the same whatever the load.

pub mod google;
pub mod http;
pub mod seal;

use std::net::{TcpListener, TcpStream};
use std::time::{Duration, Instant};

use serde::Deserialize;
use serde_json::json;

use google::{Google, GoogleError};
use http::{ReadError, Request, Response};
use seal::Sealer;

/// How long a client may stay silent before the server drops it and serves the next.
const CLIENT_TIMEOUT: Duration = Duration::from_secs(5);

pub struct Server {
    pub google: Google,
    pub sealer: Sealer,
    /// The origins whose pages may call: the app's address, and a dev server's.
    pub origins: Vec<String>,
}

#[derive(Deserialize)]
struct CodeBody {
    code: String,
}

#[derive(Deserialize)]
struct SealedBody {
    sealed: String,
}

impl Server {
    /// Answers every connection on `listener`, one after another, until the process ends.
    pub fn serve(&self, listener: TcpListener) {
        for stream in listener.incoming().flatten() {
            self.handle(stream);
        }
    }

    fn handle(&self, mut stream: TcpStream) {
        let _ = stream.set_read_timeout(Some(CLIENT_TIMEOUT));
        let _ = stream.set_write_timeout(Some(CLIENT_TIMEOUT));
        let started = Instant::now();
        let (line, response) = match http::read_request(&mut stream) {
            Ok(request) => (
                format!("{} {}", request.method, request.path),
                self.answer(&request),
            ),
            Err(ReadError::Gone) => return,
            Err(ReadError::TooLarge) => ("-".to_owned(), Response::error(413, "too_large")),
            Err(ReadError::Malformed) => ("-".to_owned(), Response::error(400, "malformed")),
        };
        let _ = http::write_response(&mut stream, &response);
        eprintln!(
            "{line} {} {}ms",
            response.status,
            started.elapsed().as_millis()
        );
    }

    /// The answer to `request`, which names back its origin when that origin may read it.
    pub fn answer(&self, request: &Request) -> Response {
        if request.method == "GET" && request.path == "/health" {
            return Response::json(200, json!({ "ok": true }).to_string());
        }
        let Some(origin) = request.origin.as_ref().filter(|o| self.origins.contains(o)) else {
            return Response::error(403, "origin");
        };
        let mut response = match (request.method.as_str(), request.path.as_str()) {
            ("OPTIONS", _) => Response::json(204, String::new()),
            ("POST", "/exchange") => self.exchange(&request.body),
            ("POST", "/refresh") => self.refresh(&request.body),
            ("POST", "/revoke") => self.revoke(&request.body),
            _ => Response::error(404, "not_found"),
        };
        response.allow_origin = Some(origin.clone());
        response
    }

    fn exchange(&self, body: &[u8]) -> Response {
        let Ok(CodeBody { code }) = serde_json::from_slice(body) else {
            return Response::error(400, "malformed");
        };
        match self.google.exchange(&code) {
            Ok(tokens) => match tokens.refresh_token {
                Some(renewal) => Response::json(
                    200,
                    json!({ "token": tokens.access_token, "expiresIn": tokens.expires_in, "sealed": self.sealer.seal(&renewal) }).to_string(),
                ),
                // Google grants a renewal token on a person's first consent only. Revoking the
                // grant makes the next sign-in a first consent again.
                None => {
                    self.google.revoke(&tokens.access_token);
                    Response::error(409, "sign_in_again")
                }
            },
            Err(error) => google_error(error),
        }
    }

    fn refresh(&self, body: &[u8]) -> Response {
        let Some(renewal) = self.opened(body) else {
            return Response::error(400, "bad_seal");
        };
        match self.google.refresh(&renewal) {
            Ok(tokens) => Response::json(
                200,
                json!({ "token": tokens.access_token, "expiresIn": tokens.expires_in }).to_string(),
            ),
            Err(error) => google_error(error),
        }
    }

    fn revoke(&self, body: &[u8]) -> Response {
        let Some(renewal) = self.opened(body) else {
            return Response::error(400, "bad_seal");
        };
        self.google.revoke(&renewal);
        Response::json(204, String::new())
    }

    fn opened(&self, body: &[u8]) -> Option<String> {
        let SealedBody { sealed } = serde_json::from_slice(body).ok()?;
        self.sealer.open(&sealed)
    }
}

/// A refusal is the person's sign-in gone (401), which the app answers by asking them to sign in again.
fn google_error(error: GoogleError) -> Response {
    match error {
        GoogleError::Refused => Response::error(401, "refused"),
        GoogleError::Unreachable => Response::error(502, "google_unreachable"),
    }
}
