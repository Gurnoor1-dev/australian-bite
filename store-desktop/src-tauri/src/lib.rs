#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct PrinterInfo {
    name: String,
}

#[derive(Debug, Deserialize)]
struct ReceiptItem {
    name: String,
    variant: Option<String>,
    quantity: u32,
    unit_price: i64,
    line_total: i64,
    addons: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct ReceiptPayload {
    order_number: String,
    created_at: String,
    customer_name: String,
    customer_phone: String,
    address: Option<String>,
    fulfillment_type: String,
    payment_method: String,
    payment_status: String,
    items: Vec<ReceiptItem>,
    subtotal: i64,
    discount: i64,
    delivery_fee: i64,
    total: i64,
    notes: Option<String>,
}

fn clean_ascii(input: &str) -> String {
    input.chars().map(|c| if c.is_ascii() { c } else { '?' }).collect()
}

fn fit_line(left: &str, right: &str, width: usize) -> String {
    let right = clean_ascii(right);
    let left = clean_ascii(left);
    let right = if right.len() >= width { right[..width].to_string() } else { right };
    let max_left = width.saturating_sub(right.len() + 1);
    let left = if left.len() > max_left { left[..max_left].to_string() } else { left };
    format!("{left}{}{}", " ".repeat(width.saturating_sub(left.len() + right.len())), right)
}

fn build_receipt(payload: &ReceiptPayload) -> Vec<u8> {
    let mut out = Vec::new();
    let width = 48usize;
    let push = |out: &mut Vec<u8>, s: &str| out.extend_from_slice(s.as_bytes());
    out.extend_from_slice(b"\x1B@");
    out.extend_from_slice(b"\x1Ba\x01\x1BE\x01");
    push(&mut out, "AUSTRALIAN BITE\n");
    out.extend_from_slice(b"\x1BE\x00");
    push(&mut out, "Near NH-152, Kurukshetra Road\nPehowa, Haryana 136128\n");
    push(&mut out, "+91 74043 39777\n");
    push(&mut out, "-----------------------------------------------\n");
    out.extend_from_slice(b"\x1Ba\x00");
    push(&mut out, &format!("ORDER  {}\n", clean_ascii(&payload.order_number)));
    push(&mut out, &format!("{}\n", clean_ascii(&payload.created_at)));
    push(&mut out, &format!("Customer: {}\n", clean_ascii(&payload.customer_name)));
    push(&mut out, &format!("Phone: {}\n", clean_ascii(&payload.customer_phone)));
    if let Some(address) = &payload.address {
        if !address.is_empty() { push(&mut out, &format!("Address: {}\n", clean_ascii(address))); }
    }
    push(&mut out, &format!("Type: {}\n", clean_ascii(&payload.fulfillment_type)));
    push(&mut out, &format!("Payment: {} ({})\n", clean_ascii(&payload.payment_method), clean_ascii(&payload.payment_status)));
    push(&mut out, "-----------------------------------------------\n");
    for item in &payload.items {
        let label = match &item.variant {
            Some(v) if !v.is_empty() && v != "Standard" => format!("{} ({})", item.name, v),
            _ => item.name.clone(),
        };
        push(&mut out, &format!("{}\n", clean_ascii(&label)));
        push(&mut out, &format!("{}\n", fit_line(&format!("  {} x Rs. {}", item.quantity, item.unit_price), &format!("Rs. {}", item.line_total), width)));
        if let Some(addons) = &item.addons {
            for addon in addons { push(&mut out, &format!("  + {}\n", clean_ascii(addon))); }
        }
    }
    push(&mut out, "-----------------------------------------------\n");
    push(&mut out, &format!("{}\n", fit_line("Subtotal", &format!("Rs. {}", payload.subtotal), width)));
    if payload.discount > 0 { push(&mut out, &format!("{}\n", fit_line("Discount", &format!("- Rs. {}", payload.discount), width))); }
    if payload.delivery_fee > 0 { push(&mut out, &format!("{}\n", fit_line("Delivery", &format!("Rs. {}", payload.delivery_fee), width))); }
    out.extend_from_slice(b"\x1BE\x01");
    push(&mut out, &format!("{}\n", fit_line("TOTAL", &format!("Rs. {}", payload.total), width)));
    out.extend_from_slice(b"\x1BE\x00");
    if let Some(notes) = &payload.notes {
        if !notes.is_empty() { push(&mut out, &format!("Notes: {}\n", clean_ascii(notes))); }
    }
    out.extend_from_slice(b"\x1Ba\x01");
    push(&mut out, "Thank you for ordering!\n");
    push(&mut out, "Order receipt - not a GST tax invoice\n");
    out.extend_from_slice(b"\n\n\n\x1DV\x00");
    out
}

#[cfg(windows)]
fn enumerate_printers() -> Result<Vec<PrinterInfo>, String> {
    use std::ptr::null_mut;
    use winapi::shared::minwindef::{DWORD, FALSE};
    use winapi::um::winspool::{EnumPrintersW, PRINTER_ENUM_CONNECTIONS, PRINTER_ENUM_LOCAL, PRINTER_INFO_4W};

    unsafe {
        let flags = PRINTER_ENUM_LOCAL | PRINTER_ENUM_CONNECTIONS;
        let mut needed: DWORD = 0;
        let mut returned: DWORD = 0;
        EnumPrintersW(flags, null_mut(), 4, null_mut(), 0, &mut needed, &mut returned);
        if needed == 0 { return Ok(Vec::new()); }
        let mut buffer = vec![0u8; needed as usize];
        let ok = EnumPrintersW(flags, null_mut(), 4, buffer.as_mut_ptr(), needed, &mut needed, &mut returned);
        if ok == FALSE { return Err("Windows could not enumerate printers".into()); }
        let rows = std::slice::from_raw_parts(buffer.as_ptr() as *const PRINTER_INFO_4W, returned as usize);
        let mut printers = Vec::new();
        for row in rows {
            if row.pPrinterName.is_null() { continue; }
            let mut len = 0usize;
            while *row.pPrinterName.add(len) != 0 { len += 1; }
            let name = String::from_utf16_lossy(std::slice::from_raw_parts(row.pPrinterName, len));
            printers.push(PrinterInfo { name });
        }
        printers.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        Ok(printers)
    }
}

#[cfg(not(windows))]
fn enumerate_printers() -> Result<Vec<PrinterInfo>, String> {
    Err("The Store POS printer service currently targets Windows.".into())
}

#[cfg(windows)]
fn send_raw_to_printer(printer_name: &str, bytes: &[u8]) -> Result<u32, String> {
    use std::{ffi::OsStr, os::windows::ffi::OsStrExt, ptr::null_mut};
    use winapi::shared::minwindef::{DWORD, FALSE};
    use winapi::um::winspool::{ClosePrinter, EndDocPrinter, EndPagePrinter, OpenPrinterW, StartDocPrinterW, StartPagePrinter, WritePrinter, DOC_INFO_1W};

    let mut printer_w: Vec<u16> = OsStr::new(printer_name).encode_wide().chain(Some(0)).collect();
    let mut doc_name: Vec<u16> = OsStr::new("Australian Bite POS receipt").encode_wide().chain(Some(0)).collect();
    let mut datatype: Vec<u16> = OsStr::new("RAW").encode_wide().chain(Some(0)).collect();
    unsafe {
        let mut handle = null_mut();
        if OpenPrinterW(printer_w.as_mut_ptr(), &mut handle, null_mut()) == FALSE {
            return Err(format!("Could not open printer '{printer_name}'. Check that it is installed and online."));
        }
        let mut info = DOC_INFO_1W {
            pDocName: doc_name.as_mut_ptr(),
            pOutputFile: null_mut(),
            pDatatype: datatype.as_mut_ptr(),
        };
        let job = StartDocPrinterW(handle, 1, &mut info as *mut _ as *mut u8);
        if job == 0 {
            ClosePrinter(handle);
            return Err("Windows could not start the print job.".into());
        }
        if StartPagePrinter(handle) == FALSE {
            EndDocPrinter(handle);
            ClosePrinter(handle);
            return Err("Windows could not start the receipt page.".into());
        }
        let mut written: DWORD = 0;
        let ok = WritePrinter(handle, bytes.as_ptr() as *mut _, bytes.len() as DWORD, &mut written);
        EndPagePrinter(handle);
        EndDocPrinter(handle);
        ClosePrinter(handle);
        if ok == FALSE || written as usize != bytes.len() {
            return Err("The printer did not accept the complete receipt.".into());
        }
        Ok(job)
    }
}

#[cfg(not(windows))]
fn send_raw_to_printer(_printer_name: &str, _bytes: &[u8]) -> Result<u32, String> {
    Err("Direct thermal printing is available in the Windows desktop build.".into())
}

#[tauri::command]
fn list_printers() -> Result<Vec<PrinterInfo>, String> {
    enumerate_printers()
}

#[tauri::command]
fn print_receipt(printer_name: String, receipt: ReceiptPayload) -> Result<u32, String> {
    if printer_name.trim().is_empty() { return Err("Choose a printer first.".into()); }
    let bytes = build_receipt(&receipt);
    send_raw_to_printer(&printer_name, &bytes)
}


#[derive(Debug, Serialize)]
struct DesktopUpdate {
    version: String,
    notes: String,
}

#[cfg(windows)]
fn latest_github_release() -> Result<serde_json::Value, String> {
    let response = ureq::get("https://api.github.com/repos/Gurnoor1-dev/australian-bite/releases?per_page=50")
        .set("User-Agent", "Australian-Bite-Store-POS")
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|error| format!("Could not check GitHub releases: {error}"))?;
    let body = response.into_string().map_err(|error| format!("Could not read the GitHub release response: {error}"))?;
    let releases: Vec<serde_json::Value> = serde_json::from_str(&body)
        .map_err(|error| format!("GitHub returned an invalid release response: {error}"))?;
    releases.into_iter()
        .filter_map(|release| release_version(&release).ok().map(|version| (version, release)))
        .max_by(|left, right| left.0.cmp(&right.0))
        .map(|(_, release)| release)
        .ok_or_else(|| "No Australian Bite Store POS releases were found. POS release tags must start with store-v.".to_string())
}

#[cfg(windows)]
fn release_version(release: &serde_json::Value) -> Result<semver::Version, String> {
    let tag = release["tag_name"].as_str().ok_or("The latest GitHub release has no tag.")?;
    let version = tag.strip_prefix("store-v").or_else(|| tag.strip_prefix('v')).unwrap_or(tag);
    semver::Version::parse(version).map_err(|_| format!("The release tag '{tag}' is not a valid POS version."))
}

#[tauri::command]
fn check_for_updates() -> Result<Option<DesktopUpdate>, String> {
    #[cfg(windows)]
    {
        let release = latest_github_release()?;
        let latest = release_version(&release)?;
        let current = semver::Version::parse(env!("CARGO_PKG_VERSION"))
            .map_err(|error| format!("The installed app version is invalid: {error}"))?;
        if latest.major > current.major {
            return Ok(Some(DesktopUpdate {
                version: latest.to_string(),
                notes: release["body"].as_str().unwrap_or("").to_string(),
            }));
        }
    }
    Ok(None)
}

#[cfg(windows)]
fn download_release_asset(url: &str) -> Result<Vec<u8>, String> {
    use std::io::Read;
    let mut response = ureq::get(url)
        .set("User-Agent", "Australian-Bite-Store-POS")
        .call()
        .map_err(|error| format!("Could not download the POS update: {error}"))?;
    let mut bytes = Vec::new();
    response.into_reader().read_to_end(&mut bytes)
        .map_err(|error| format!("Could not read the POS update download: {error}"))?;
    Ok(bytes)
}

#[cfg(windows)]
fn powershell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

#[tauri::command]
fn install_latest_update(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(windows)]
    {
        use sha2::{Digest, Sha256};
        use std::{fs, process::Command};

        let release = latest_github_release()?;
        let latest = release_version(&release)?;
        let current = semver::Version::parse(env!("CARGO_PKG_VERSION"))
            .map_err(|error| format!("The installed app version is invalid: {error}"))?;
        if latest.major <= current.major {
            return Err("Australian Bite POS is already up to date.".into());
        }

        let assets = release["assets"].as_array().ok_or("The GitHub release has no downloadable assets.")?;
        let installer = assets.iter().find(|asset| {
            let name = asset["name"].as_str().unwrap_or("").to_ascii_lowercase();
            name.ends_with(".exe") && name.contains("setup")
        }).ok_or("The GitHub release does not contain the Windows setup installer.")?;
        let installer_name = installer["name"].as_str().ok_or("The installer asset has no filename.")?;
        let installer_url = installer["browser_download_url"].as_str().ok_or("The installer download URL is missing.")?;
        let checksum_name = format!("{installer_name}.sha256");
        let checksum = assets.iter().find(|asset| asset["name"].as_str() == Some(checksum_name.as_str()))
            .ok_or("The release is missing its installer SHA-256 checksum.")?;
        let checksum_url = checksum["browser_download_url"].as_str().ok_or("The checksum download URL is missing.")?;

        let installer_bytes = download_release_asset(installer_url)?;
        let checksum_bytes = download_release_asset(checksum_url)?;
        let expected = String::from_utf8(checksum_bytes)
            .map_err(|_| "The installer checksum file is not valid text.")?
            .split_whitespace().next().ok_or("The installer checksum is empty.")?.to_ascii_lowercase();
        let actual = format!("{:x}", Sha256::digest(&installer_bytes));
        if actual != expected {
            return Err("The downloaded installer failed its SHA-256 integrity check.".into());
        }

        let installer_path = std::env::temp_dir().join(format!("australian-bite-pos-{}-setup.exe", latest));
        fs::write(&installer_path, installer_bytes)
            .map_err(|error| format!("Could not save the POS update: {error}"))?;
        let app_path = std::env::current_exe()
            .map_err(|error| format!("Could not locate the installed POS app: {error}"))?;
        let script = format!(
            "$ErrorActionPreference='Stop'; Start-Sleep -Seconds 2; Start-Process -FilePath {} -ArgumentList '/S' -Wait; Start-Process -FilePath {}",
            powershell_quote(&installer_path.to_string_lossy()),
            powershell_quote(&app_path.to_string_lossy())
        );
        Command::new("powershell.exe")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-Command", &script])
            .spawn()
            .map_err(|error| format!("Could not start the POS installer: {error}"))?;
        app.exit(0);
        return Ok(());
    }
    #[cfg(not(windows))]
    {
        let _ = app;
        Err("Automatic desktop updates are available in the Windows POS build.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_printers, print_receipt, check_for_updates, install_latest_update])
        .run(tauri::generate_context!())
        .expect("error while running Australian Bite POS");
}