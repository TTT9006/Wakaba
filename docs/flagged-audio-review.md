# Báo cáo đối chiếu và kiểm tra đồng bộ Audio — 24/10/2026

Báo cáo kiểm tra tự động 4 tiêu chí chất lượng cho từng đoạn cắt audio theo yêu cầu:
1. **Số đoạn = số câu hỏi** (24 câu mỗi đề N5; 28-30 câu đề N4, N3, N2, N1).
2. **Không chồng lấn thời gian** (no overlapping timestamps).
3. **Không đoạn rỗng** (dung lượng > 0, thời lượng hợp lệ).
4. **Thứ tự tăng dần chuẩn xác** theo dòng thời gian bài nghe.

## 1. Bảng tổng hợp các đề thi JLPT (N5 – N1)

| Đề thi | Số đoạn | Không chồng lấn | Không đoạn rỗng | Thứ tự | Trạng thái đồng bộ | Cần người soát |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| JLPT N5 07/2024 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N5 2010-2011 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N5 12/2012 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N5 07/2013 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N5 2018 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N5 12/2021 | 24/24 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N4 07/2024 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 07/2023 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N2 07/2023 | 29/29 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N1 07/2023 | 30/30 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N2 07/2022 | 31/31 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 07/2022 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 12/2022 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N4 07/2017 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N2 12/2021 | 30/30 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 12/2021 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 12/2018 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N4 12/2021 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N4 07/2021 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N1 12/2022 | 30/30 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N3 07/2021 | 28/28 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |
| JLPT N1 07/2022 | 35/35 (Đạt) | ✔ Hợp lệ | ✔ Hợp lệ | ✔ Đúng | `khớp tự động` | 0 câu |

> **Ghi chú về quy ước trạng thái:** Mọi đoạn audio cắt tự động chỉ được đặt là `khớp tự động`. Tuyệt đối không tự đặt là `đã soát thủ công` khi chưa có xác nhận từ người dùng.

## 2. Danh sách các câu nghi ngờ cần người nghe lại (0 mục)

*Không có câu nào phát hiện lỗi nghiêm trọng hoặc chồng lấn. Tất cả các mốc cắt đều nằm trong ngưỡng an toàn.*
