use serde::de::DeserializeOwned;

pub(crate) fn unpack<T: DeserializeOwned>(packet: &[u8]) -> Result<(Vec<u8>, T), String> {
    let prefix: [u8; 4] = packet
        .get(..4)
        .ok_or("请求不完整。")?
        .try_into()
        .map_err(|e: std::array::TryFromSliceError| e.to_string())?;
    let size = u32::from_le_bytes(prefix) as usize;
    if size > 40 * 1024 * 1024
        || packet.len() < size + 4
        || packet.len() - size - 4 > 256 * 1024 * 1024
    {
        return Err("请求大小无效。".into());
    }
    let metadata = serde_json::from_slice(&packet[4..size + 4]).map_err(|e| e.to_string())?;
    Ok((packet[size + 4..].to_vec(), metadata))
}
