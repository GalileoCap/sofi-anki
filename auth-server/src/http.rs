//! Just enough HTTP/1.1 for the app's three calls behind Opalstack's nginx: one request per
//! connection, read into a fixed buffer, and an answer that closes the connection.

use std::io::{self, Read, Write};

/// The most a request may hold, head and body: a code or a sealed token fits many times over.
pub const MAX_REQUEST: usize = 8 * 1024;

pub struct Request {
    pub method: String,
    pub path: String,
    pub origin: Option<String>,
    pub body: Vec<u8>,
}

/// Why a request was refused before it was read whole.
#[derive(Debug, PartialEq)]
pub enum ReadError {
    TooLarge,
    Malformed,
    /// The client went silent or closed early: nothing is answered.
    Gone,
}

/// One request from `stream`, never reading more than `MAX_REQUEST` bytes.
pub fn read_request(stream: &mut impl Read) -> Result<Request, ReadError> {
    let mut buf = [0u8; MAX_REQUEST];
    let mut filled = 0;
    let head_end = loop {
        if let Some(end) = find(&buf[..filled], b"\r\n\r\n") {
            break end;
        }
        if filled == buf.len() {
            return Err(ReadError::TooLarge);
        }
        match stream.read(&mut buf[filled..]) {
            Ok(0) | Err(_) => return Err(ReadError::Gone),
            Ok(n) => filled += n,
        }
    };
    let head = std::str::from_utf8(&buf[..head_end]).map_err(|_| ReadError::Malformed)?;
    let mut lines = head.split("\r\n");
    let mut first = lines.next().ok_or(ReadError::Malformed)?.split(' ');
    let method = first.next().ok_or(ReadError::Malformed)?.to_owned();
    let path = first.next().ok_or(ReadError::Malformed)?.to_owned();
    let mut origin = None;
    let mut length = 0usize;
    for line in lines {
        let (name, value) = line.split_once(':').ok_or(ReadError::Malformed)?;
        let value = value.trim();
        if name.eq_ignore_ascii_case("origin") {
            origin = Some(value.to_owned());
        } else if name.eq_ignore_ascii_case("content-length") {
            length = value.parse().map_err(|_| ReadError::Malformed)?;
        }
    }
    let body_start = head_end + 4;
    if body_start + length > buf.len() {
        return Err(ReadError::TooLarge);
    }
    while filled < body_start + length {
        match stream.read(&mut buf[filled..body_start + length]) {
            Ok(0) | Err(_) => return Err(ReadError::Gone),
            Ok(n) => filled += n,
        }
    }
    Ok(Request {
        method,
        path,
        origin,
        body: buf[body_start..body_start + length].to_vec(),
    })
}

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack.windows(needle.len()).position(|w| w == needle)
}

pub struct Response {
    pub status: u16,
    pub body: String,
    /// The origin the answer is for, named back to the browser so it lets the app read it.
    pub allow_origin: Option<String>,
}

impl Response {
    pub fn json(status: u16, body: String) -> Self {
        Self {
            status,
            body,
            allow_origin: None,
        }
    }

    pub fn error(status: u16, code: &str) -> Self {
        Self::json(status, serde_json::json!({ "error": code }).to_string())
    }
}

fn reason(status: u16) -> &'static str {
    match status {
        200 => "OK",
        204 => "No Content",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        413 => "Content Too Large",
        502 => "Bad Gateway",
        _ => "Error",
    }
}

pub fn write_response(stream: &mut impl Write, response: &Response) -> io::Result<()> {
    let mut head = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\nVary: Origin\r\n",
        response.status,
        reason(response.status),
        response.body.len()
    );
    if let Some(origin) = &response.allow_origin {
        head.push_str(&format!(
            "Access-Control-Allow-Origin: {origin}\r\nAccess-Control-Allow-Methods: POST\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Max-Age: 86400\r\n"
        ));
    }
    head.push_str("\r\n");
    stream.write_all(head.as_bytes())?;
    stream.write_all(response.body.as_bytes())?;
    stream.flush()
}
