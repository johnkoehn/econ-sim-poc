use std::cmp;

pub fn calculate_number_of_tiles(max_tiles_from_center: u8) -> u32 {
    if max_tiles_from_center == 0 {
        return 1;
    }

    let max_tiles_from_center_u32 = max_tiles_from_center as u32;
    let max_length = (max_tiles_from_center_u32 * 2) + 1;

    let bottom_width = max_length - max_tiles_from_center_u32;

    let mut sum = max_length;
    let mut current_row_length = max_length - 1;
    loop {
        sum += current_row_length * 2;
        current_row_length -= 1;

        if current_row_length < bottom_width {
            break;
        }
    }

    sum
}

pub fn calculate_next_coordinates(max_tiles_from_center: u8, q: i32, r: i32) -> (i32, i32) {
    // calculate the r_max for the given q
    let r_max = cmp::min(max_tiles_from_center as i32, -q + (max_tiles_from_center as i32));

    if r == r_max {
        // increment q by one and calculate r_min
        let new_q = q + 1;
        let r_min = cmp::max(-(max_tiles_from_center as i32), -new_q - (max_tiles_from_center as i32));
        return (new_q, r_min);
    }

    return (q, r + 1);
}

// see https://www.redblobgames.com/grids/hexagons/#distances
pub fn calculate_distance(current_q: i32, current_r: i32, destination_q: i32, destination_r: i32) -> i32 {
    let current_s = -current_q - current_r;
    let destination_s = -destination_q - destination_r;

    ((current_q - destination_q).abs() + (current_r - destination_r).abs() + (current_s - destination_s)).abs() / 2
}