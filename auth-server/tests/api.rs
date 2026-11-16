//! What the server promises the app (A20): a code becomes an access token and a sealed renewal
//! token, the sealed token renews with no sign-in, and nothing else gets through. Google is a fake
//! on a local port.

use std::io::Write;
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::Duration;

use anki_auth::Server;
use anki_auth::google::Google;
use anki_auth::http::{self, Response};
use anki_auth::seal::Sealer;

const APP: &str = "https://anki.smplworks.net";

/// A fake token endpoint: code `good` gives renewal token `renew-1`, which renews; anything else is refused.
fn fake_google() -> String {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    thread::spawn(move || {
        for mut stream in listener.incoming().flatten() {
            let request = http::read_request(&mut stream).unwrap();
            let form = String::from_utf8(request.body).unwrap();
            let response = if form.contains("code=good") && form.contains("client_secret=secret") {
                Response::json(
                    200,
                    r#"{"access_token":"access-1","expires_in":3599,"refresh_token":"renew-1"}"#
                        .into(),
                )
            } else if form.contains("refresh_token=renew-1") {
                Response::json(
                    200,
                    r#"{"access_token":"access-2","expires_in":3599}"#.into(),
                )
            } else {
                Response::json(400, r#"{"error":"invalid_grant"}"#.into())
            };
            http::write_response(&mut stream, &response).unwrap();
        }
    });
    format!("http://{addr}")
}

fn start() -> String {
    let google = fake_google();
    let server = Server {
        google: Google::new(
            "client".into(),
            "secret".into(),
            format!("{google}/token"),
            format!("{google}/revoke"),
        ),
        sealer: Sealer::new(&[7; 32]),
        origins: vec![APP.into()],
    };
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let addr = listener.local_addr().unwrap();
    thread::spawn(move || server.serve(listener));
    format!("http://{addr}")
}

/// The status, the allowed origin and the JSON body of a POST from `origin`.
fn post(
    base: &str,
    path: &str,
    origin: &str,
    body: &str,
) -> (u16, Option<String>, serde_json::Value) {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .http_status_as_error(false)
        .timeout_global(Some(Duration::from_secs(2)))
        .build()
        .into();
    let mut answer = agent
        .post(&format!("{base}{path}"))
        .header("Origin", origin)
        .content_type("application/json")
        .send(body)
        .unwrap();
    let allowed = answer
        .headers()
        .get("access-control-allow-origin")
        .map(|v| v.to_str().unwrap().to_owned());
    let text = answer.body_mut().read_to_string().unwrap();
    (
        answer.status().as_u16(),
        allowed,
        serde_json::from_str(&text).unwrap_or(serde_json::Value::Null),
    )
}

#[test]
fn a_code_gives_a_sealed_renewal_that_renews_without_signing_in() {
    let base = start();
    let (status, allowed, signed_in) = post(&base, "/exchange", APP, r#"{"code":"good"}"#);
    assert_eq!((status, allowed.as_deref()), (200, Some(APP)));
    assert_eq!(signed_in["token"], "access-1");
    assert_eq!(signed_in["expiresIn"], 3599);
    let sealed = signed_in["sealed"].as_str().unwrap();
    assert!(!sealed.contains("renew-1"));

    let (status, _, renewed) = post(
        &base,
        "/refresh",
        APP,
        &serde_json::json!({ "sealed": sealed }).to_string(),
    );
    assert_eq!(status, 200);
    assert_eq!(renewed["token"], "access-2");
}

#[test]
fn a_changed_seal_a_refused_code_and_another_origin_get_nothing() {
    let base = start();
    let (_, _, signed_in) = post(&base, "/exchange", APP, r#"{"code":"good"}"#);
    let mut sealed = signed_in["sealed"].as_str().unwrap().to_owned();
    let last = sealed.pop().unwrap();
    sealed.push(if last == 'A' { 'B' } else { 'A' });
    assert_eq!(
        post(
            &base,
            "/refresh",
            APP,
            &serde_json::json!({ "sealed": sealed }).to_string()
        )
        .0,
        400
    );
    assert_eq!(post(&base, "/exchange", APP, r#"{"code":"bad"}"#).0, 401);

    let (status, allowed, _) = post(
        &base,
        "/exchange",
        "https://evil.example",
        r#"{"code":"good"}"#,
    );
    assert_eq!((status, allowed), (403, None));
}

#[test]
fn a_request_over_the_limit_is_refused_and_the_next_is_served() {
    let base = start();
    let addr = base.trim_start_matches("http://");
    let mut stream = TcpStream::connect(addr).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(2)))
        .unwrap();
    let big = "x".repeat(http::MAX_REQUEST);
    let _ = write!(
        stream,
        "POST /exchange HTTP/1.1\r\nOrigin: {APP}\r\nContent-Length: {}\r\n\r\n{big}",
        big.len()
    );
    let mut answer = String::new();
    let _ = std::io::Read::read_to_string(&mut stream, &mut answer);
    assert!(answer.starts_with("HTTP/1.1 413"), "{answer}");

    assert_eq!(post(&base, "/exchange", APP, r#"{"code":"good"}"#).0, 200);
}
