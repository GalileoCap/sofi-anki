//! The token server, configured by its environment (deploy/README.md).

use std::env;
use std::net::TcpListener;
use std::process::exit;

use anki_auth::Server;
use anki_auth::google::Google;
use anki_auth::seal::{Sealer, key_from_hex};

fn required(name: &str) -> String {
    env::var(name).unwrap_or_else(|_| {
        eprintln!("{name} is not set");
        exit(2);
    })
}

fn main() {
    let addr = env::var("ANKI_AUTH_ADDR").unwrap_or_else(|_| "127.0.0.1:8787".to_owned());
    let key = key_from_hex(&required("SEAL_KEY")).unwrap_or_else(|| {
        eprintln!("SEAL_KEY must be 64 hex digits");
        exit(2);
    });
    let google = Google::new(
        required("GOOGLE_CLIENT_ID"),
        required("GOOGLE_CLIENT_SECRET"),
        env::var("GOOGLE_TOKEN_URL")
            .unwrap_or_else(|_| "https://oauth2.googleapis.com/token".to_owned()),
        env::var("GOOGLE_REVOKE_URL")
            .unwrap_or_else(|_| "https://oauth2.googleapis.com/revoke".to_owned()),
    );
    let origins = env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "https://anki.smplworks.net".to_owned())
        .split(',')
        .map(|o| o.trim().to_owned())
        .collect();
    let listener = TcpListener::bind(&addr).unwrap_or_else(|error| {
        eprintln!("cannot listen on {addr}: {error}");
        exit(1);
    });
    eprintln!("listening on {addr}");
    Server {
        google,
        sealer: Sealer::new(&key),
        origins,
    }
    .serve(listener);
}
