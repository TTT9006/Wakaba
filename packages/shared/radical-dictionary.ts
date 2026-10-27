/**
 * Tu dien nghia tieng Viet chuan muc cho 214 Bo thu Khang Hy.
 * Dung lam fallback doc lap va client-side resilience bao dam 100% nguoi dung
 * luon thay nghia tieng Viet day du ke ca khi backend chua hoan tat redeploy.
 */
export interface RadicalVietnameseMeta {
  vietnameseMeaning: string;
  vietnameseMeanings: string[];
  vietnameseNames: string[];
}

export const RADICAL_VIETNAMESE_DICT: Record<number, RadicalVietnameseMeta> = {
  "1": {
    "vietnameseMeaning": "Một, số một",
    "vietnameseMeanings": [
      "một",
      "toàn bộ",
      "đồng nhất"
    ],
    "vietnameseNames": [
      "Nhất"
    ]
  },
  "2": {
    "vietnameseMeaning": "Nét sổ dọc",
    "vietnameseMeanings": [
      "nét sổ thẳng",
      "xuyên suốt từ trên xuống dưới"
    ],
    "vietnameseNames": [
      "Cổn",
      "Thụ"
    ]
  },
  "3": {
    "vietnameseMeaning": "Điểm, dấu chấm",
    "vietnameseMeanings": [
      "dấu chấm",
      "điểm"
    ],
    "vietnameseNames": [
      "Chủ"
    ]
  },
  "4": {
    "vietnameseMeaning": "Nét phẩy, xiên trái",
    "vietnameseMeanings": [
      "nét phẩy nghiêng về bên trái"
    ],
    "vietnameseNames": [
      "Phiệt",
      "Triệt"
    ]
  },
  "5": {
    "vietnameseMeaning": "Can Ất, cong gập",
    "vietnameseMeanings": [
      "can thứ 2 thiên can",
      "uốn lượn",
      "lưỡi câu"
    ],
    "vietnameseNames": [
      "Ất"
    ]
  },
  "6": {
    "vietnameseMeaning": "Nét móc lên",
    "vietnameseMeanings": [
      "nét móc đứng hất lên",
      "lưỡi câu"
    ],
    "vietnameseNames": [
      "Quyết"
    ]
  },
  "7": {
    "vietnameseMeaning": "Số hai",
    "vietnameseMeanings": [
      "hai",
      "số hai",
      "lần thứ hai"
    ],
    "vietnameseNames": [
      "Nhị"
    ]
  },
  "8": {
    "vietnameseMeaning": "Nắp đậy, đầu",
    "vietnameseMeanings": [
      "nắp đậy phía trên"
    ],
    "vietnameseNames": [
      "Đầu"
    ]
  },
  "9": {
    "vietnameseMeaning": "Người",
    "vietnameseMeanings": [
      "con người",
      "nhân loại",
      "người"
    ],
    "vietnameseNames": [
      "Nhân"
    ]
  },
  "10": {
    "vietnameseMeaning": "Chân người, trẻ nhỏ",
    "vietnameseMeanings": [
      "chân người đang đi",
      "trẻ con"
    ],
    "vietnameseNames": [
      "Nhân"
    ]
  },
  "11": {
    "vietnameseMeaning": "Vào, đi vào",
    "vietnameseMeanings": [
      "tiến vào",
      "nhập vào",
      "cho vào"
    ],
    "vietnameseNames": [
      "Nhập"
    ]
  },
  "12": {
    "vietnameseMeaning": "Số tám, tách ra",
    "vietnameseMeanings": [
      "tám",
      "số tám",
      "chia rẽ",
      "tách biệt"
    ],
    "vietnameseNames": [
      "Bát"
    ]
  },
  "13": {
    "vietnameseMeaning": "Vùng biên cương xa, khung mở đáy",
    "vietnameseMeanings": [
      "biên ải xa xôi",
      "vùng hoang dã ngoại ô"
    ],
    "vietnameseNames": [
      "Quynh"
    ]
  },
  "14": {
    "vietnameseMeaning": "Khăn trùm, che phủ",
    "vietnameseMeanings": [
      "trùm lên",
      "che phủ"
    ],
    "vietnameseNames": [
      "Mịch"
    ]
  },
  "15": {
    "vietnameseMeaning": "Băng tuyết, nước đá",
    "vietnameseMeanings": [
      "băng đá",
      "giá lạnh",
      "đông lạnh"
    ],
    "vietnameseNames": [
      "Băng"
    ]
  },
  "16": {
    "vietnameseMeaning": "Bàn nhỏ, ghế dựa",
    "vietnameseMeanings": [
      "cái bàn con",
      "ghế nhỏ"
    ],
    "vietnameseNames": [
      "Kỷ"
    ]
  },
  "17": {
    "vietnameseMeaning": "Há miệng, hố lõm",
    "vietnameseMeanings": [
      "vùng trũng",
      "cái hố sâu",
      "đồ chứa mở miệng"
    ],
    "vietnameseNames": [
      "Khảm"
    ]
  },
  "18": {
    "vietnameseMeaning": "Con dao, thanh kiếm",
    "vietnameseMeanings": [
      "dao",
      "gươm giáo",
      "vũ khí sắc bén"
    ],
    "vietnameseNames": [
      "Đao"
    ]
  },
  "19": {
    "vietnameseMeaning": "Sức mạnh, sinh lực",
    "vietnameseMeanings": [
      "sức lực",
      "sức mạnh",
      "cố gắng",
      "nỗ lực"
    ],
    "vietnameseNames": [
      "Lực"
    ]
  },
  "20": {
    "vietnameseMeaning": "Bao bọc, ôm lấy",
    "vietnameseMeanings": [
      "gói ghém",
      "bao quanh",
      "ôm tròn"
    ],
    "vietnameseNames": [
      "Bao"
    ]
  },
  "21": {
    "vietnameseMeaning": "Cái thìa, cái muỗng",
    "vietnameseMeanings": [
      "cái thìa nhỏ",
      "con dao găm nhỏ"
    ],
    "vietnameseNames": [
      "Chủy"
    ]
  },
  "22": {
    "vietnameseMeaning": "Khung chứa đồ, tủ hộp",
    "vietnameseMeanings": [
      "đồ đựng đồ vật",
      "hòm chứa"
    ],
    "vietnameseNames": [
      "Phương"
    ]
  },
  "23": {
    "vietnameseMeaning": "Che giấu, cất giấu",
    "vietnameseMeanings": [
      "nơi giấu đồ",
      "che lấp",
      "giấu kín"
    ],
    "vietnameseNames": [
      "Hệ"
    ]
  },
  "24": {
    "vietnameseMeaning": "Số mười, hoàn hảo",
    "vietnameseMeanings": [
      "mười",
      "số mười",
      "thập toàn thập mỹ"
    ],
    "vietnameseNames": [
      "Thập"
    ]
  },
  "25": {
    "vietnameseMeaning": "Bói toán, xem bói",
    "vietnameseMeanings": [
      "bói điềm",
      "dự đoán",
      "xem quẻ"
    ],
    "vietnameseNames": [
      "Bốc"
    ]
  },
  "26": {
    "vietnameseMeaning": "Đốt tre, ngọc ấn tín",
    "vietnameseMeanings": [
      "khớp xương",
      "đốt trúc",
      "ấn tín làm tin"
    ],
    "vietnameseNames": [
      "Tiết"
    ]
  },
  "27": {
    "vietnameseMeaning": "Vách núi dựng đứng",
    "vietnameseMeanings": [
      "sườn núi hiểm trở",
      "vách đá"
    ],
    "vietnameseNames": [
      "Hán"
    ]
  },
  "28": {
    "vietnameseMeaning": "Riêng tư, cá nhân",
    "vietnameseMeanings": [
      "tư riêng",
      "bản thân",
      "ích kỷ"
    ],
    "vietnameseNames": [
      "Khư"
    ]
  },
  "29": {
    "vietnameseMeaning": "Lại, bàn tay phải",
    "vietnameseMeanings": [
      "lại một lần nữa",
      "bàn tay",
      "hơn nữa"
    ],
    "vietnameseNames": [
      "Hựu"
    ]
  },
  "30": {
    "vietnameseMeaning": "Miệng, cửa khẩu",
    "vietnameseMeanings": [
      "cái miệng",
      "lỗ thủng",
      "cửa vào"
    ],
    "vietnameseNames": [
      "Khẩu"
    ]
  },
  "31": {
    "vietnameseMeaning": "Vây quanh, bao quanh",
    "vietnameseMeanings": [
      "bao bọc",
      "vây khép kín",
      "ranh giới"
    ],
    "vietnameseNames": [
      "Vi"
    ]
  },
  "32": {
    "vietnameseMeaning": "Đất, thổ nhưỡng",
    "vietnameseMeanings": [
      "đất đai",
      "thổ nhưỡng",
      "mảnh đất"
    ],
    "vietnameseNames": [
      "Thổ",
      "Độ",
      "Đỗ"
    ]
  },
  "33": {
    "vietnameseMeaning": "Kẻ sĩ, người tài giỏi",
    "vietnameseMeanings": [
      "trí thức",
      "quan lại",
      "chiến sĩ",
      "người có học"
    ],
    "vietnameseNames": [
      "Sĩ"
    ]
  },
  "34": {
    "vietnameseMeaning": "Bước đi sau, chậm trễ",
    "vietnameseMeanings": [
      "đi từ từ phía sau",
      "chậm rãi"
    ],
    "vietnameseNames": [
      "Tri"
    ]
  },
  "35": {
    "vietnameseMeaning": "Đi chậm rãi, kéo lê bước",
    "vietnameseMeanings": [
      "bước đi chậm chạp",
      "lê gót"
    ],
    "vietnameseNames": [
      "Tuy"
    ]
  },
  "36": {
    "vietnameseMeaning": "Buổi chiều tối, hoàng hôn",
    "vietnameseMeanings": [
      "chiều tối",
      "hoàng hôn",
      "đêm tối"
    ],
    "vietnameseNames": [
      "Tịch"
    ]
  },
  "37": {
    "vietnameseMeaning": "To lớn, vĩ đại",
    "vietnameseMeanings": [
      "to lớn",
      "rộng lớn",
      "vĩ đại"
    ],
    "vietnameseNames": [
      "Đại",
      "Thái"
    ]
  },
  "38": {
    "vietnameseMeaning": "Phụ nữ, con gái",
    "vietnameseMeanings": [
      "người nữ",
      "phụ nữ",
      "con gái"
    ],
    "vietnameseNames": [
      "Nữ",
      "Nứ",
      "Nhữ"
    ]
  },
  "39": {
    "vietnameseMeaning": "Con cái, trẻ nhỏ, giờ Tý",
    "vietnameseMeanings": [
      "đứa con",
      "hạt mầm",
      "chi Tý (chuột)",
      "thầy (bậc tôn kính)"
    ],
    "vietnameseNames": [
      "Tử",
      "Tý"
    ]
  },
  "40": {
    "vietnameseMeaning": "Mái nhà, nóc nhà",
    "vietnameseMeanings": [
      "mái hiên",
      "ngôi nhà",
      "che phủ"
    ],
    "vietnameseNames": [
      "Miên"
    ]
  },
  "41": {
    "vietnameseMeaning": "Tấc (đo lường), nhỏ bé",
    "vietnameseMeanings": [
      "đơn vị đo tấc",
      "ngắn ngủi",
      "nhỏ hẹp"
    ],
    "vietnameseNames": [
      "Thốn"
    ]
  },
  "42": {
    "vietnameseMeaning": "Nhỏ bé, ít ỏi",
    "vietnameseMeanings": [
      "nhỏ nhắn",
      "bé bỏng",
      "ít ỏi"
    ],
    "vietnameseNames": [
      "Tiểu"
    ]
  },
  "43": {
    "vietnameseMeaning": "Chân vòng kiềng, què quặt",
    "vietnameseMeanings": [
      "chân yếu",
      "tàn tật",
      "què"
    ],
    "vietnameseNames": [
      "Uông"
    ]
  },
  "44": {
    "vietnameseMeaning": "Thi thể, xác ướp",
    "vietnameseMeanings": [
      "xác người",
      "thây ma",
      "hình nhân"
    ],
    "vietnameseNames": [
      "Thi"
    ]
  },
  "45": {
    "vietnameseMeaning": "Mầm non mới nhú",
    "vietnameseMeanings": [
      "cỏ non mới nhú mầm",
      "chồi non"
    ],
    "vietnameseNames": [
      "Triệt"
    ]
  },
  "46": {
    "vietnameseMeaning": "Núi non, gò đất",
    "vietnameseMeanings": [
      "núi",
      "dãy núi",
      "non sông"
    ],
    "vietnameseNames": [
      "San",
      "Sơn"
    ]
  },
  "47": {
    "vietnameseMeaning": "Sông ngòi, dòng chảy",
    "vietnameseMeanings": [
      "dòng sông",
      "dòng nước uốn lượn"
    ],
    "vietnameseNames": [
      "Khôn",
      "Xuyên",
      "Sào"
    ]
  },
  "48": {
    "vietnameseMeaning": "Công thợ, việc làm, khéo léo",
    "vietnameseMeanings": [
      "thợ thủ công",
      "công trình",
      "khéo léo",
      "lao động"
    ],
    "vietnameseNames": [
      "Công"
    ]
  },
  "49": {
    "vietnameseMeaning": "Bản thân mình, can Kỷ",
    "vietnameseMeanings": [
      "bản thân",
      "chính mình",
      "can thứ 6"
    ],
    "vietnameseNames": [
      "Kỷ"
    ]
  },
  "50": {
    "vietnameseMeaning": "Khăn vải, dải lụa",
    "vietnameseMeanings": [
      "khăn lau",
      "vải vóc",
      "khăn đội đầu"
    ],
    "vietnameseNames": [
      "Cân"
    ]
  },
  "51": {
    "vietnameseMeaning": "Can dự, làm khô, bờ cõi",
    "vietnameseMeanings": [
      "can thiệp",
      "khô ráo",
      "khiên chắn",
      "thiên can"
    ],
    "vietnameseNames": [
      "Can"
    ]
  },
  "52": {
    "vietnameseMeaning": "Nhỏ nhắn, sợi chỉ mảnh",
    "vietnameseMeanings": [
      "nhỏ bé",
      "sợi chỉ ngắn",
      "mỏng manh"
    ],
    "vietnameseNames": [
      "Yêu"
    ]
  },
  "53": {
    "vietnameseMeaning": "Mái nhà dựa vách đá",
    "vietnameseMeanings": [
      "mái che bên sườn đồi",
      "ngôi nhà rộng"
    ],
    "vietnameseNames": [
      "Nghiễm",
      "Yểm"
    ]
  },
  "54": {
    "vietnameseMeaning": "Bước dài, sải bước",
    "vietnameseMeanings": [
      "sải bước dài",
      "kéo dài đường đi"
    ],
    "vietnameseNames": [
      "Dẫn"
    ]
  },
  "55": {
    "vietnameseMeaning": "Chắp hai tay, nâng đỡ",
    "vietnameseMeanings": [
      "hai tay chắp lại",
      "nâng đỡ cung kính"
    ],
    "vietnameseNames": [
      "Củng"
    ]
  },
  "56": {
    "vietnameseMeaning": "Cọc gỗ, mũi tên có dây",
    "vietnameseMeanings": [
      "cọc buộc tên",
      "bắn chim có dây buộc"
    ],
    "vietnameseNames": [
      "Dặc"
    ]
  },
  "57": {
    "vietnameseMeaning": "Cái cung bắn tên",
    "vietnameseMeanings": [
      "cánh cung",
      "uốn cong"
    ],
    "vietnameseNames": [
      "Cung"
    ]
  },
  "58": {
    "vietnameseMeaning": "Đầu con heo (lợn)",
    "vietnameseMeanings": [
      "đầu lợn",
      "mõm thú"
    ],
    "vietnameseNames": [
      "Kế",
      "Kệ",
      "Kí",
      "Ký",
      "Tuyết",
      "Kẹ"
    ]
  },
  "59": {
    "vietnameseMeaning": "Lông dài, hoa văn trang trí",
    "vietnameseMeanings": [
      "lông thú dài",
      "vệt râu tóc óng ả",
      "nét chạm trổ"
    ],
    "vietnameseNames": [
      "Sam",
      "Tiệm"
    ]
  },
  "60": {
    "vietnameseMeaning": "Bước chân trái, bước ngắn",
    "vietnameseMeanings": [
      "bước chân đi",
      "chậm rãi trên đường"
    ],
    "vietnameseNames": [
      "Sách"
    ]
  },
  "61": {
    "vietnameseMeaning": "Trái tim, tấm lòng, suy nghĩ",
    "vietnameseMeanings": [
      "quả tim",
      "tâm trí",
      "tấm lòng",
      "tình cảm"
    ],
    "vietnameseNames": [
      "Tâm"
    ]
  },
  "62": {
    "vietnameseMeaning": "Cây giáo, vũ khí cán dài",
    "vietnameseMeanings": [
      "ngọn giáo sắc bén",
      "vũ khí chiến tranh"
    ],
    "vietnameseNames": [
      "Qua"
    ]
  },
  "63": {
    "vietnameseMeaning": "Cửa một cánh, nhà cửa",
    "vietnameseMeanings": [
      "cửa đơn",
      "hộ gia đình",
      "nhà ở"
    ],
    "vietnameseNames": [
      "Hộ"
    ]
  },
  "64": {
    "vietnameseMeaning": "Bàn tay, nắm giữ",
    "vietnameseMeanings": [
      "tay",
      "bàn tay",
      "nắm giữ",
      "thao tác"
    ],
    "vietnameseNames": [
      "Thủ"
    ]
  },
  "65": {
    "vietnameseMeaning": "Cành cây, chống đỡ, chi nhánh",
    "vietnameseMeanings": [
      "cành nhánh",
      "nâng đỡ",
      "chi trả",
      "phân nhánh"
    ],
    "vietnameseNames": [
      "Chi"
    ]
  },
  "66": {
    "vietnameseMeaning": "Đánh nhẹ, gõ khẽ",
    "vietnameseMeanings": [
      "gõ khẽ",
      "đánh phạt nhẹ",
      "thúc đẩy"
    ],
    "vietnameseNames": [
      "Phộc"
    ]
  },
  "67": {
    "vietnameseMeaning": "Văn chương, chữ viết, vẻ đẹp",
    "vietnameseMeanings": [
      "văn học",
      "chữ nghĩa",
      "hoa văn",
      "văn minh"
    ],
    "vietnameseNames": [
      "Văn",
      "Vấn"
    ]
  },
  "68": {
    "vietnameseMeaning": "Cái đấu đong gạo, chòm sao Bắc Đẩu",
    "vietnameseMeanings": [
      "cái đấu (đo lường)",
      "gáo múc rượu",
      "sao Bắc Đẩu"
    ],
    "vietnameseNames": [
      "Đẩu"
    ]
  },
  "69": {
    "vietnameseMeaning": "Cái rìu, đơn vị đo trọng lượng",
    "vietnameseMeanings": [
      "rìu chặt cây",
      "cân (đơn vị đo lường)"
    ],
    "vietnameseNames": [
      "Cân",
      "Cấn"
    ]
  },
  "70": {
    "vietnameseMeaning": "Vuông vắn, phương hướng",
    "vietnameseMeanings": [
      "phương hướng",
      "hình vuông",
      "phương pháp"
    ],
    "vietnameseNames": [
      "Phương"
    ]
  },
  "71": {
    "vietnameseMeaning": "Không, không có",
    "vietnameseMeanings": [
      "hư vô",
      "không tồn tại"
    ],
    "vietnameseNames": [
      "Vô"
    ]
  },
  "72": {
    "vietnameseMeaning": "Mặt trời, ngày",
    "vietnameseMeanings": [
      "mặt trời",
      "ban ngày",
      "ngày tháng"
    ],
    "vietnameseNames": [
      "Nhật"
    ]
  },
  "73": {
    "vietnameseMeaning": "Nói rằng, rằng là",
    "vietnameseMeanings": [
      "nói rằng",
      "thốt lên"
    ],
    "vietnameseNames": [
      "Viết"
    ]
  },
  "74": {
    "vietnameseMeaning": "Mặt trăng, tháng",
    "vietnameseMeanings": [
      "mặt trăng",
      "ánh trăng",
      "tháng"
    ],
    "vietnameseNames": [
      "Nguyệt"
    ]
  },
  "75": {
    "vietnameseMeaning": "Cây cối, gỗ",
    "vietnameseMeanings": [
      "cây cỏ",
      "gỗ",
      "chất gỗ"
    ],
    "vietnameseNames": [
      "Mộc"
    ]
  },
  "76": {
    "vietnameseMeaning": "Ngáp, thiếu thốn",
    "vietnameseMeanings": [
      "ngáp dài",
      "khiếm khuyết",
      "thiếu hụt"
    ],
    "vietnameseNames": [
      "Khiếm"
    ]
  },
  "77": {
    "vietnameseMeaning": "Dừng lại, đứng yên",
    "vietnameseMeanings": [
      "ngừng lại",
      "đình chỉ",
      "ở yên"
    ],
    "vietnameseNames": [
      "Chỉ"
    ]
  },
  "78": {
    "vietnameseMeaning": "Xương tàn, chết chóc, xấu xa",
    "vietnameseMeanings": [
      "xương gãy",
      "chết chóc",
      "tai ương"
    ],
    "vietnameseNames": [
      "Ngạt",
      "Đãi"
    ]
  },
  "79": {
    "vietnameseMeaning": "Cây gậy gỗ, vũ khí đập",
    "vietnameseMeanings": [
      "binh khí không có lưỡi",
      "cây thương nhọn"
    ],
    "vietnameseNames": [
      "Thù"
    ]
  },
  "80": {
    "vietnameseMeaning": "Chớ, đừng, mẹ",
    "vietnameseMeanings": [
      "chớ làm",
      "đừng",
      "người mẹ"
    ],
    "vietnameseNames": [
      "Vô",
      "Mưu"
    ]
  },
  "81": {
    "vietnameseMeaning": "So sánh, kề cận",
    "vietnameseMeanings": [
      "so đo",
      "đối chiếu",
      "sánh đôi",
      "gần gũi"
    ],
    "vietnameseNames": [
      "Bỉ",
      "Bí",
      "Bì",
      "Tỉ"
    ]
  },
  "82": {
    "vietnameseMeaning": "Lông, tóc, sợi lông",
    "vietnameseMeanings": [
      "lông thú",
      "râu tóc",
      "lông vũ"
    ],
    "vietnameseNames": [
      "Mao",
      "Mô"
    ]
  },
  "83": {
    "vietnameseMeaning": "Dòng họ, thị tộc",
    "vietnameseMeanings": [
      "họ hàng",
      "thị tộc",
      "người phái nữ"
    ],
    "vietnameseNames": [
      "Thị",
      "Chi"
    ]
  },
  "84": {
    "vietnameseMeaning": "Hơi thở, không khí, mây trời",
    "vietnameseMeanings": [
      "khí trời",
      "hơi nước",
      "sinh khí"
    ],
    "vietnameseNames": [
      "Khí",
      "Khất"
    ]
  },
  "85": {
    "vietnameseMeaning": "Nước, chất lỏng",
    "vietnameseMeanings": [
      "nước",
      "dòng nước",
      "sông suối"
    ],
    "vietnameseNames": [
      "Thủy"
    ]
  },
  "86": {
    "vietnameseMeaning": "Lửa, ánh sáng rực rỡ",
    "vietnameseMeanings": [
      "ngọn lửa",
      "sức nóng",
      "cháy sáng"
    ],
    "vietnameseNames": [
      "Hỏa"
    ]
  },
  "87": {
    "vietnameseMeaning": "Móng vuốt muông thú",
    "vietnameseMeanings": [
      "móng vuốt nhọn",
      "cào cấu"
    ],
    "vietnameseNames": [
      "Trảo"
    ]
  },
  "88": {
    "vietnameseMeaning": "Cha, người cha",
    "vietnameseMeanings": [
      "người cha",
      "thân phụ",
      "bậc bề trên"
    ],
    "vietnameseNames": [
      "Phụ",
      "Phủ"
    ]
  },
  "89": {
    "vietnameseMeaning": "Hào trong kinh Dịch, đan chéo",
    "vietnameseMeanings": [
      "hào quẻ Dịch",
      "giao nhau",
      "đan xen"
    ],
    "vietnameseNames": [
      "Hào"
    ]
  },
  "90": {
    "vietnameseMeaning": "Mảnh ván xẻ, giường nằm",
    "vietnameseMeanings": [
      "miếng gỗ chẻ đôi bên trái",
      "giường"
    ],
    "vietnameseNames": [
      "Tường"
    ]
  },
  "91": {
    "vietnameseMeaning": "Mảnh ván mỏng, lá mỏng",
    "vietnameseMeanings": [
      "miếng mỏng",
      "tấm phiến",
      "tờ giấy"
    ],
    "vietnameseNames": [
      "Phiến"
    ]
  },
  "92": {
    "vietnameseMeaning": "Răng nanh, ngà voi",
    "vietnameseMeanings": [
      "răng hàm",
      "ngà thú",
      "răng nhọn"
    ],
    "vietnameseNames": [
      "Nha"
    ]
  },
  "93": {
    "vietnameseMeaning": "Con trâu, con bò",
    "vietnameseMeanings": [
      "trâu bò",
      "gia súc kéo cày"
    ],
    "vietnameseNames": [
      "Ngưu"
    ]
  },
  "94": {
    "vietnameseMeaning": "Con chó",
    "vietnameseMeanings": [
      "loài chó",
      "chó săn"
    ],
    "vietnameseNames": [
      "Khuyển"
    ]
  },
  "95": {
    "vietnameseMeaning": "Màu đen huyền, sâu thẳm, huyền bí",
    "vietnameseMeanings": [
      "màu đen thẳm",
      "huyền bí",
      "sâu xa vi diệu"
    ],
    "vietnameseNames": [
      "Huyền"
    ]
  },
  "96": {
    "vietnameseMeaning": "Ngọc quý, đá đẹp",
    "vietnameseMeanings": [
      "đá ngọc",
      "vật báu",
      "đẹp đẽ tinh khiết"
    ],
    "vietnameseNames": [
      "Ngọc",
      "Túc"
    ]
  },
  "97": {
    "vietnameseMeaning": "Quả dưa",
    "vietnameseMeanings": [
      "các loại dưa búp",
      "dưa hấu",
      "dưa gang"
    ],
    "vietnameseNames": [
      "Qua"
    ]
  },
  "98": {
    "vietnameseMeaning": "Ngói lợp nhà, đồ gốm",
    "vietnameseMeanings": [
      "viên ngói đất nung",
      "đồ gốm"
    ],
    "vietnameseNames": [
      "Ngõa"
    ]
  },
  "99": {
    "vietnameseMeaning": "Ngọt ngào, ngon lành",
    "vietnameseMeanings": [
      "vị ngọt",
      "vừa lòng",
      "cam tâm"
    ],
    "vietnameseNames": [
      "Cam"
    ]
  },
  "100": {
    "vietnameseMeaning": "Sinh sôi, sinh sống, sống sót",
    "vietnameseMeanings": [
      "sinh đẻ",
      "sống",
      "sinh sôi",
      "mới mẻ",
      "học trò"
    ],
    "vietnameseNames": [
      "Sanh",
      "Sinh"
    ]
  },
  "101": {
    "vietnameseMeaning": "Sử dụng, dùng đến",
    "vietnameseMeanings": [
      "dùng",
      "áp dụng",
      "công dụng"
    ],
    "vietnameseNames": [
      "Dụng"
    ]
  },
  "102": {
    "vietnameseMeaning": "Ruộng đồng, thửa ruộng",
    "vietnameseMeanings": [
      "ruộng lúa",
      "đồng ruộng"
    ],
    "vietnameseNames": [
      "Điền"
    ]
  },
  "103": {
    "vietnameseMeaning": "Xấp vải, cuộn lụa, chân đi",
    "vietnameseMeanings": [
      "xấp vải (đơn vị)",
      "bước chân",
      "con vật (đếm)"
    ],
    "vietnameseNames": [
      "Sơ",
      "Nhã",
      "Thất"
    ]
  },
  "104": {
    "vietnameseMeaning": "Bệnh tật, đau ốm",
    "vietnameseMeanings": [
      "đau ốm",
      "bệnh tật nằm trên giường"
    ],
    "vietnameseNames": [
      "Nạch"
    ]
  },
  "105": {
    "vietnameseMeaning": "Hai chân gạt ngược, bước đi",
    "vietnameseMeanings": [
      "hai bàn chân quay lưng nhau",
      "bước đi"
    ],
    "vietnameseNames": [
      "Bát"
    ]
  },
  "106": {
    "vietnameseMeaning": "Màu trắng, sáng sủa, rõ ràng",
    "vietnameseMeanings": [
      "màu trắng",
      "trong sáng",
      "thanh khiết",
      "bày tỏ"
    ],
    "vietnameseNames": [
      "Bạch"
    ]
  },
  "107": {
    "vietnameseMeaning": "Da động vật, vỏ ngoài",
    "vietnameseMeanings": [
      "da thú",
      "lớp vỏ ngoài"
    ],
    "vietnameseNames": [
      "Bì"
    ]
  },
  "108": {
    "vietnameseMeaning": "Bát đĩa, đồ đựng thức ăn",
    "vietnameseMeanings": [
      "đĩa",
      "bát",
      "chậu khay đựng đồ ăn"
    ],
    "vietnameseNames": [
      "Mãnh"
    ]
  },
  "109": {
    "vietnameseMeaning": "Mắt, nhìn, đề mục",
    "vietnameseMeanings": [
      "con mắt",
      "ánh nhìn",
      "mục lục",
      "điều khoản"
    ],
    "vietnameseNames": [
      "Mục"
    ]
  },
  "110": {
    "vietnameseMeaning": "Cây giáo đâm, mâu thuẫn",
    "vietnameseMeanings": [
      "ngọn mâu đâm",
      "vũ khí mũi nhọn"
    ],
    "vietnameseNames": [
      "Mâu"
    ]
  },
  "111": {
    "vietnameseMeaning": "Mũi tên, bắn thẳng",
    "vietnameseMeanings": [
      "mũi tên bắn đi",
      "thẳng thắn"
    ],
    "vietnameseNames": [
      "Thỉ"
    ]
  },
  "112": {
    "vietnameseMeaning": "Đá, tảng đá",
    "vietnameseMeanings": [
      "hòn đá",
      "đá cứng",
      "khoáng thạch"
    ],
    "vietnameseNames": [
      "Thạch"
    ]
  },
  "113": {
    "vietnameseMeaning": "Chỉ dẫn, thần linh, mách bảo",
    "vietnameseMeanings": [
      "bày tỏ",
      "hiển thị",
      "thần đất",
      "chỉ dẫn"
    ],
    "vietnameseNames": [
      "Kì",
      "Thị"
    ]
  },
  "114": {
    "vietnameseMeaning": "Vết chân muông thú",
    "vietnameseMeanings": [
      "dấu chân thú giẫm trên đất"
    ],
    "vietnameseNames": [
      "Nhữu",
      "Nhựu"
    ]
  },
  "115": {
    "vietnameseMeaning": "Cây lúa, hoa màu",
    "vietnameseMeanings": [
      "cây lúa trổ bông",
      "ngũ cốc"
    ],
    "vietnameseNames": [
      "Hòa"
    ]
  },
  "116": {
    "vietnameseMeaning": "Hang động, lỗ hổng",
    "vietnameseMeanings": [
      "hang đá",
      "cửa hang",
      "huyệt đạo"
    ],
    "vietnameseNames": [
      "Huyệt"
    ]
  },
  "117": {
    "vietnameseMeaning": "Đứng thẳng, dựng nên",
    "vietnameseMeanings": [
      "đứng thẳng dậy",
      "thiết lập",
      "xây dựng"
    ],
    "vietnameseNames": [
      "Lập"
    ]
  },
  "118": {
    "vietnameseMeaning": "Cây tre, cây trúc",
    "vietnameseMeanings": [
      "tre trúc",
      "óng trúc"
    ],
    "vietnameseNames": [
      "Trúc"
    ]
  },
  "119": {
    "vietnameseMeaning": "Gạo, hạt lúa",
    "vietnameseMeanings": [
      "hạt gạo trắng",
      "ngũ cốc"
    ],
    "vietnameseNames": [
      "Mễ"
    ]
  },
  "120": {
    "vietnameseMeaning": "Sợi tơ lụa, sợi chỉ",
    "vietnameseMeanings": [
      "sợi tơ mảnh",
      "chỉ tơ tằm",
      "dây liên kết"
    ],
    "vietnameseNames": [
      "Mịch"
    ]
  },
  "121": {
    "vietnameseMeaning": "Bình sành, chum vại",
    "vietnameseMeanings": [
      "bình bằng đất nung",
      "chum vại đựng rượu"
    ],
    "vietnameseNames": [
      "Phữu",
      "Phẫu",
      "Phũ"
    ]
  },
  "122": {
    "vietnameseMeaning": "Lưới đánh cá, lưới bắt chim",
    "vietnameseMeanings": [
      "tấm lưới",
      "mạng lưới vây bắt"
    ],
    "vietnameseNames": [
      "Võng"
    ]
  },
  "123": {
    "vietnameseMeaning": "Con dê, con cừu",
    "vietnameseMeanings": [
      "con cừu",
      "con dê",
      "hiền lành"
    ],
    "vietnameseNames": [
      "Dương"
    ]
  },
  "124": {
    "vietnameseMeaning": "Lông vũ, đôi cánh chim",
    "vietnameseMeanings": [
      "lông cánh chim",
      "cánh bay"
    ],
    "vietnameseNames": [
      "Vũ"
    ]
  },
  "125": {
    "vietnameseMeaning": "Già nua, người già",
    "vietnameseMeanings": [
      "người cao tuổi",
      "già dặn",
      "kính trọng"
    ],
    "vietnameseNames": [
      "Lão"
    ]
  },
  "126": {
    "vietnameseMeaning": "Mà, nhưng mà, chòm râu dưới cằm",
    "vietnameseMeanings": [
      "mà lại",
      "và rồi",
      "râu cằm"
    ],
    "vietnameseNames": [
      "Nhi"
    ]
  },
  "127": {
    "vietnameseMeaning": "Cái cày ruộng",
    "vietnameseMeanings": [
      "cán cày gỗ",
      "cày bừa làm ruộng"
    ],
    "vietnameseNames": [
      "Lỗi"
    ]
  },
  "128": {
    "vietnameseMeaning": "Lỗ tai, lắng nghe",
    "vietnameseMeanings": [
      "cái tai",
      "thính giác",
      "nghe ngóng"
    ],
    "vietnameseNames": [
      "Nhĩ"
    ]
  },
  "129": {
    "vietnameseMeaning": "Cây bút lông viết chữ",
    "vietnameseMeanings": [
      "bút lông",
      "viết lách",
      "thuật lại"
    ],
    "vietnameseNames": [
      "Duật"
    ]
  },
  "130": {
    "vietnameseMeaning": "Thịt, xác thịt",
    "vietnameseMeanings": [
      "thịt động vật",
      "cơ bắp",
      "thân thể"
    ],
    "vietnameseNames": [
      "Nhục",
      "Nhụ",
      "Nậu"
    ]
  },
  "131": {
    "vietnameseMeaning": "Bầy tôi, quan lại triều đình",
    "vietnameseMeanings": [
      "quan chức bề tôi",
      "thần dân kính cẩn"
    ],
    "vietnameseNames": [
      "Thần"
    ]
  },
  "132": {
    "vietnameseMeaning": "Tự mình, xuất phát từ",
    "vietnameseMeanings": [
      "chính mình",
      "tự tại",
      "bắt đầu từ"
    ],
    "vietnameseNames": [
      "Tự"
    ]
  },
  "133": {
    "vietnameseMeaning": "Đến nơi, cực điểm",
    "vietnameseMeanings": [
      "đến nơi",
      "tột cùng",
      "cao nhất"
    ],
    "vietnameseNames": [
      "Chí"
    ]
  },
  "134": {
    "vietnameseMeaning": "Cái cối giã gạo",
    "vietnameseMeanings": [
      "cái cối",
      "giã gạo",
      "nghiền nát"
    ],
    "vietnameseNames": [
      "Cữu"
    ]
  },
  "135": {
    "vietnameseMeaning": "Cái lưỡi",
    "vietnameseMeanings": [
      "chiếc lưỡi",
      "vị giác",
      "ngôn từ"
    ],
    "vietnameseNames": [
      "Thiệt"
    ]
  },
  "136": {
    "vietnameseMeaning": "Sai lệch, trái ngược, múa chân",
    "vietnameseMeanings": [
      "nghịch chiều",
      "lỗi lầm",
      "bước múa chân"
    ],
    "vietnameseNames": [
      "Suyễn"
    ]
  },
  "137": {
    "vietnameseMeaning": "Con thuyền, chiếc đò",
    "vietnameseMeanings": [
      "thuyền bè",
      "con đò chở khách qua sông"
    ],
    "vietnameseNames": [
      "Chu"
    ]
  },
  "138": {
    "vietnameseMeaning": "Quẻ Cấn (núi dừng), kiên định",
    "vietnameseMeanings": [
      "quẻ Cấn trong bát quái",
      "dừng lại vững vàng"
    ],
    "vietnameseNames": [
      "Cấn"
    ]
  },
  "139": {
    "vietnameseMeaning": "Màu sắc, vẻ đẹp, diện mạo",
    "vietnameseMeanings": [
      "màu mè",
      "sắc đẹp",
      "nét mặt",
      "vẻ bề ngoài"
    ],
    "vietnameseNames": [
      "Sắc"
    ]
  },
  "140": {
    "vietnameseMeaning": "Cỏ cây, thảo mộc",
    "vietnameseMeanings": [
      "cây cỏ hoang dại",
      "thảo mộc"
    ],
    "vietnameseNames": [
      "Thảo"
    ]
  },
  "141": {
    "vietnameseMeaning": "Vằn da cọp, con hổ dữ",
    "vietnameseMeanings": [
      "hoa văn da hổ",
      "chúa sơn lâm oai phong"
    ],
    "vietnameseNames": [
      "Hô"
    ]
  },
  "142": {
    "vietnameseMeaning": "Sâu bọ, côn trùng",
    "vietnameseMeanings": [
      "côn trùng",
      "sâu bọ",
      "loài bò sát"
    ],
    "vietnameseNames": [
      "Trùng"
    ]
  },
  "143": {
    "vietnameseMeaning": "Máu, huyết thống",
    "vietnameseMeanings": [
      "dòng máu",
      "huyết quản",
      "dòng giống ruột thịt"
    ],
    "vietnameseNames": [
      "Huyết"
    ]
  },
  "144": {
    "vietnameseMeaning": "Đi lại, thi hành, hàng lối",
    "vietnameseMeanings": [
      "bước đi",
      "hành động",
      "thực hiện",
      "hàng dãy"
    ],
    "vietnameseNames": [
      "Hành",
      "Hạnh",
      "Hàng",
      "Hạng"
    ]
  },
  "145": {
    "vietnameseMeaning": "Áo quần, xiêm y",
    "vietnameseMeanings": [
      "áo mặc",
      "trang phục",
      "lớp vỏ bọc"
    ],
    "vietnameseNames": [
      "Y",
      "Ý"
    ]
  },
  "146": {
    "vietnameseMeaning": "Nắp đậy úp lên, phương Tây",
    "vietnameseMeanings": [
      "úp nắp che kín",
      "hướng Tây"
    ],
    "vietnameseNames": [
      "Á"
    ]
  },
  "147": {
    "vietnameseMeaning": "Nhìn thấy, trông thấy, kiến thức",
    "vietnameseMeanings": [
      "nhìn thấy",
      "gặp gỡ",
      "hiểu biết",
      "quan điểm"
    ],
    "vietnameseNames": [
      "Kiến",
      "Hiện"
    ]
  },
  "148": {
    "vietnameseMeaning": "Sừng thú, góc cạnh, đấu tranh",
    "vietnameseMeanings": [
      "cái sừng nhọn",
      "góc vuông",
      "đọ sức"
    ],
    "vietnameseNames": [
      "Giác",
      "Giốc"
    ]
  },
  "149": {
    "vietnameseMeaning": "Lời nói, ngôn ngữ",
    "vietnameseMeanings": [
      "lời ăn tiếng nói",
      "ngôn từ",
      "bày tỏ"
    ],
    "vietnameseNames": [
      "Ngôn",
      "Ngân"
    ]
  },
  "150": {
    "vietnameseMeaning": "Thung lũng, khe núi",
    "vietnameseMeanings": [
      "khe núi sâu",
      "hang suối giữa núi non"
    ],
    "vietnameseNames": [
      "Cốc",
      "Lộc",
      "Dục"
    ]
  },
  "151": {
    "vietnameseMeaning": "Hạt đậu, cái chén đựng thịt tế",
    "vietnameseMeanings": [
      "hạt đỗ hạt đậu",
      "chiếc bát cổ chân cao"
    ],
    "vietnameseNames": [
      "Đậu",
      "Dấu"
    ]
  },
  "152": {
    "vietnameseMeaning": "Con heo, con lợn",
    "vietnameseMeanings": [
      "loài lợn",
      "heo rừng"
    ],
    "vietnameseNames": [
      "Thỉ"
    ]
  },
  "153": {
    "vietnameseMeaning": "Loài thú săn mồi không sừng",
    "vietnameseMeanings": [
      "thú hoang săn mồi",
      "linh thú"
    ],
    "vietnameseNames": [
      "Trĩ",
      "Trại"
    ]
  },
  "154": {
    "vietnameseMeaning": "Vỏ sò, tiền của quý giá",
    "vietnameseMeanings": [
      "con sò",
      "tiền tệ thời cổ",
      "vật báu quý giá"
    ],
    "vietnameseNames": [
      "Bối"
    ]
  },
  "155": {
    "vietnameseMeaning": "Màu đỏ thắm, trần trụi, chân thành",
    "vietnameseMeanings": [
      "màu đỏ thắm",
      "trần như nhộng",
      "chân thành"
    ],
    "vietnameseNames": [
      "Xích",
      "Thích"
    ]
  },
  "156": {
    "vietnameseMeaning": "Chạy nhanh, trốn chạy",
    "vietnameseMeanings": [
      "chạy mau",
      "di chuyển gấp"
    ],
    "vietnameseNames": [
      "Tẩu"
    ]
  },
  "157": {
    "vietnameseMeaning": "Bàn chân, đầy đủ",
    "vietnameseMeanings": [
      "chân đi",
      "đầy đủ",
      "sung túc"
    ],
    "vietnameseNames": [
      "Túc"
    ]
  },
  "158": {
    "vietnameseMeaning": "Thân thể, mình mẩy",
    "vietnameseMeanings": [
      "thân mình",
      "thể xác",
      "bản thân người ta"
    ],
    "vietnameseNames": [
      "Thân",
      "Quyên"
    ]
  },
  "159": {
    "vietnameseMeaning": "Xe cộ, bánh xe",
    "vietnameseMeanings": [
      "cỗ xe",
      "xe cộ",
      "phương tiện chở đồ"
    ],
    "vietnameseNames": [
      "Xa"
    ]
  },
  "160": {
    "vietnameseMeaning": "Vị cay, gian nan cay đắng",
    "vietnameseMeanings": [
      "vị cay xè",
      "khổ sở",
      "vất vả gian truân"
    ],
    "vietnameseNames": [
      "Tân"
    ]
  },
  "161": {
    "vietnameseMeaning": "Chi Thìn (rồng), sáng sớm, thời giờ",
    "vietnameseMeanings": [
      "con rồng (chi Thìn)",
      "sáng sớm 7-9 giờ",
      "sao trời"
    ],
    "vietnameseNames": [
      "Thần",
      "Thìn"
    ]
  },
  "162": {
    "vietnameseMeaning": "Vừa đi vừa dừng, đường đi",
    "vietnameseMeanings": [
      "bước đi rồi dừng lại",
      "hành trình trên đường"
    ],
    "vietnameseNames": [
      "Sước",
      "Xước",
      "Xích"
    ]
  },
  "163": {
    "vietnameseMeaning": "Vùng đất phong, làng xóm, kinh đô",
    "vietnameseMeanings": [
      "xóm làng",
      "vùng đất vua ban",
      "đô hội"
    ],
    "vietnameseNames": [
      "Ấp"
    ]
  },
  "164": {
    "vietnameseMeaning": "Bình rượu, chi Dậu (gà), ủ men",
    "vietnameseMeanings": [
      "bình ủ rượu",
      "chi Dậu (con gà)",
      "men rượu chín"
    ],
    "vietnameseNames": [
      "Dậu"
    ]
  },
  "165": {
    "vietnameseMeaning": "Phân biệt, tách bạch",
    "vietnameseMeanings": [
      "chia tách",
      "phân biệt rạch ròi"
    ],
    "vietnameseNames": [
      "Biện"
    ]
  },
  "166": {
    "vietnameseMeaning": "Dặm đường, làng quê",
    "vietnameseMeanings": [
      "đơn vị dặm đường (lý)",
      "làng xóm quê nhà"
    ],
    "vietnameseNames": [
      "Lý"
    ]
  },
  "167": {
    "vietnameseMeaning": "Kim loại, vàng bạc",
    "vietnameseMeanings": [
      "vàng quý",
      "kim loại cứng rắn",
      "tiền tài"
    ],
    "vietnameseNames": [
      "Kim"
    ]
  },
  "168": {
    "vietnameseMeaning": "Dài lâu, trưởng thượng, lớn lao",
    "vietnameseMeanings": [
      "dài xa",
      "lớn tuổi",
      "người đứng đầu"
    ],
    "vietnameseNames": [
      "Trường",
      "Trưởng",
      "Trướng"
    ]
  },
  "169": {
    "vietnameseMeaning": "Cổng lớn, cửa ngõ",
    "vietnameseMeanings": [
      "cánh cổng",
      "cửa lớn nhà",
      "môn phái",
      "cửa quan"
    ],
    "vietnameseNames": [
      "Môn"
    ]
  },
  "170": {
    "vietnameseMeaning": "Gò đất lớn, đống đất cao",
    "vietnameseMeanings": [
      "gò đất cao",
      "đồi núi thoai thoải"
    ],
    "vietnameseNames": [
      "Phụ"
    ]
  },
  "171": {
    "vietnameseMeaning": "Đuổi bắt, bắt chước, người hầu",
    "vietnameseMeanings": [
      "bám theo bắt giữ",
      "kẻ nô lệ phục dịch"
    ],
    "vietnameseNames": [
      "Đãi"
    ]
  },
  "172": {
    "vietnameseMeaning": "Chim đuôi ngắn",
    "vietnameseMeanings": [
      "loài chim đuôi ngắn (chim sẻ, bồ câu)"
    ],
    "vietnameseNames": [
      "Chuy"
    ]
  },
  "173": {
    "vietnameseMeaning": "Cơn mưa, mưa rơi",
    "vietnameseMeanings": [
      "hạt mưa",
      "mưa rơi tưới mát",
      "mưa gió"
    ],
    "vietnameseNames": [
      "Vũ",
      "Vú"
    ]
  },
  "174": {
    "vietnameseMeaning": "Màu xanh biếc, tươi trẻ",
    "vietnameseMeanings": [
      "màu xanh lá non/xanh biếc trời",
      "tuổi trẻ thanh xuân"
    ],
    "vietnameseNames": [
      "Thanh"
    ]
  },
  "175": {
    "vietnameseMeaning": "Sai trái, không phải",
    "vietnameseMeanings": [
      "không phải",
      "trái ngược với đúng",
      "lỗi lầm"
    ],
    "vietnameseNames": [
      "Phi"
    ]
  },
  "176": {
    "vietnameseMeaning": "Khuôn mặt, bề mặt, diện mạo",
    "vietnameseMeanings": [
      "gương mặt",
      "bề mặt phía trước",
      "bộ mặt"
    ],
    "vietnameseNames": [
      "Diện"
    ]
  },
  "177": {
    "vietnameseMeaning": "Da thuộc, thay đổi cải cách",
    "vietnameseMeanings": [
      "da thú đã lột",
      "thay đổi triệt để",
      "cải cách"
    ],
    "vietnameseNames": [
      "Cách",
      "Cức"
    ]
  },
  "178": {
    "vietnameseMeaning": "Da thuộc mềm, vây quanh ngược",
    "vietnameseMeanings": [
      "loại da mềm uốn được",
      "trái ngược"
    ],
    "vietnameseNames": [
      "Vi"
    ]
  },
  "179": {
    "vietnameseMeaning": "Cây rau hẹ",
    "vietnameseMeanings": [
      "rau hẹ ăn",
      "cây cỏ hẹ mọc lâu năm"
    ],
    "vietnameseNames": [
      "Cửu"
    ]
  },
  "180": {
    "vietnameseMeaning": "Âm thanh, tiếng động, tin tức",
    "vietnameseMeanings": [
      "tiếng động",
      "âm vang",
      "âm nhạc",
      "tin tức truyền lại"
    ],
    "vietnameseNames": [
      "Âm"
    ]
  },
  "181": {
    "vietnameseMeaning": "Trang sách, đầu người",
    "vietnameseMeanings": [
      "trang giấy cuốn sách",
      "đầu người",
      "mặt người"
    ],
    "vietnameseNames": [
      "Hiệt"
    ]
  },
  "182": {
    "vietnameseMeaning": "Gió mát, phong tục, phong thái",
    "vietnameseMeanings": [
      "luồng gió thổi",
      "phong tục tập quán",
      "phong thái",
      "phong vị"
    ],
    "vietnameseNames": [
      "Phong"
    ]
  },
  "183": {
    "vietnameseMeaning": "Bay lượn, phi hành",
    "vietnameseMeanings": [
      "chắp cánh bay lên",
      "phi nhanh"
    ],
    "vietnameseNames": [
      "Phi"
    ]
  },
  "184": {
    "vietnameseMeaning": "Ăn uống, thức ăn",
    "vietnameseMeanings": [
      "thức ăn đồ uống",
      "ăn no",
      "nuôi dưỡng"
    ],
    "vietnameseNames": [
      "Thực",
      "Tự"
    ]
  },
  "185": {
    "vietnameseMeaning": "Cái đầu, thủ lĩnh, trước tiên",
    "vietnameseMeanings": [
      "đầu người",
      "cổ áo",
      "người đứng đầu",
      "khởi đầu"
    ],
    "vietnameseNames": [
      "Thủ",
      "Thú"
    ]
  },
  "186": {
    "vietnameseMeaning": "Mùi hương thơm, trầm hương",
    "vietnameseMeanings": [
      "hương thơm ngào ngạt",
      "nhang khói trầm thơm"
    ],
    "vietnameseNames": [
      "Hương"
    ]
  },
  "187": {
    "vietnameseMeaning": "Con ngựa",
    "vietnameseMeanings": [
      "ngựa chiến",
      "ngựa phi đường dài"
    ],
    "vietnameseNames": [
      "Mã"
    ]
  },
  "188": {
    "vietnameseMeaning": "Khung xương, cốt cách",
    "vietnameseMeanings": [
      "xương khớp cốt cách",
      "khung sườn"
    ],
    "vietnameseNames": [
      "Cốt"
    ]
  },
  "189": {
    "vietnameseMeaning": "Cao ráo, thanh cao, giá cao",
    "vietnameseMeanings": [
      "chiều cao vút",
      "thanh cao",
      "đắt giá"
    ],
    "vietnameseNames": [
      "Cao"
    ]
  },
  "190": {
    "vietnameseMeaning": "Tóc dài buông xõa",
    "vietnameseMeanings": [
      "mái tóc dài thướt tha",
      "bờm ngựa"
    ],
    "vietnameseNames": [
      "Tiêu",
      "Bưu"
    ]
  },
  "191": {
    "vietnameseMeaning": "Đánh nhau, tranh đấu",
    "vietnameseMeanings": [
      "giao tranh",
      "chiến đấu quyết liệt"
    ],
    "vietnameseNames": [
      "Đấu"
    ]
  },
  "192": {
    "vietnameseMeaning": "Rượu thơm cúng tế",
    "vietnameseMeanings": [
      "rượu nếp thơm dùng tế lễ thần linh"
    ],
    "vietnameseNames": [
      "Sưởng"
    ]
  },
  "193": {
    "vietnameseMeaning": "Cái nồi ba chân rỗng đáy",
    "vietnameseMeanings": [
      "chiếc nồi đồng ba chân",
      "đồ nấu cổ"
    ],
    "vietnameseNames": [
      "Cách",
      "Lịch"
    ]
  },
  "194": {
    "vietnameseMeaning": "Con quỷ, linh hồn người chết",
    "vietnameseMeanings": [
      "quỷ thần",
      "hồn ma quỷ quái",
      "tinh ranh"
    ],
    "vietnameseNames": [
      "Quỷ"
    ]
  },
  "195": {
    "vietnameseMeaning": "Con cá dưới nước",
    "vietnameseMeanings": [
      "loài cá",
      "thủy sản bơi lội"
    ],
    "vietnameseNames": [
      "Ngư"
    ]
  },
  "196": {
    "vietnameseMeaning": "Con chim đuôi dài",
    "vietnameseMeanings": [
      "loài chim đuôi dài",
      "chim muông"
    ],
    "vietnameseNames": [
      "Điểu"
    ]
  },
  "197": {
    "vietnameseMeaning": "Đất mặn chứa muối",
    "vietnameseMeanings": [
      "đất phèn chua mặn",
      "muối tự nhiên"
    ],
    "vietnameseNames": [
      "Lỗ"
    ]
  },
  "198": {
    "vietnameseMeaning": "Con hươu, con nai",
    "vietnameseMeanings": [
      "con hươu sao",
      "con nai rừng"
    ],
    "vietnameseNames": [
      "Lộc"
    ]
  },
  "199": {
    "vietnameseMeaning": "Cây lúa mì, lúa mạch",
    "vietnameseMeanings": [
      "cây mạch lúa",
      "lúa mì làm bột"
    ],
    "vietnameseNames": [
      "Mạch"
    ]
  },
  "200": {
    "vietnameseMeaning": "Cây gai, cây đay, tê dại",
    "vietnameseMeanings": [
      "cây gai làm vải sợi",
      "cây đay",
      "tê mê"
    ],
    "vietnameseNames": [
      "Ma"
    ]
  },
  "201": {
    "vietnameseMeaning": "Màu vàng óng",
    "vietnameseMeanings": [
      "màu vàng đất",
      "vàng óng ả"
    ],
    "vietnameseNames": [
      "Hoàng",
      "Huỳnh"
    ]
  },
  "202": {
    "vietnameseMeaning": "Cây kê, hạt kê dẻo",
    "vietnameseMeanings": [
      "cây lúa kê hạt tròn",
      "nếp kê dẻo nấu rượu"
    ],
    "vietnameseNames": [
      "Thử"
    ]
  },
  "203": {
    "vietnameseMeaning": "Màu đen kịt, tối tăm",
    "vietnameseMeanings": [
      "màu đen sẫm",
      "u ám mờ mịt"
    ],
    "vietnameseNames": [
      "Hắc"
    ]
  },
  "204": {
    "vietnameseMeaning": "May vá, thêu thùa hoa văn",
    "vietnameseMeanings": [
      "đường kim mũi chỉ",
      "thêu may thêu gấm"
    ],
    "vietnameseNames": [
      "Chỉ"
    ]
  },
  "205": {
    "vietnameseMeaning": "Con ếch nhái, rùa, nỗ lực",
    "vietnameseMeanings": [
      "con ếch xanh",
      "con rùa",
      "cố gắng chăm chỉ"
    ],
    "vietnameseNames": [
      "Mãnh",
      "Mẫn"
    ]
  },
  "206": {
    "vietnameseMeaning": "Cái vạc ba chân hai tai",
    "vietnameseMeanings": [
      "cái đỉnh đồng nấu tế",
      "vững chãi như kiềng ba chân"
    ],
    "vietnameseNames": [
      "Đỉnh"
    ]
  },
  "207": {
    "vietnameseMeaning": "Cái trống, đánh trống cổ vũ",
    "vietnameseMeanings": [
      "chiếc trống da",
      "gõ trống thúc giục",
      "cổ vũ tinh thần"
    ],
    "vietnameseNames": [
      "Cổ"
    ]
  },
  "208": {
    "vietnameseMeaning": "Con chuột",
    "vietnameseMeanings": [
      "loài chuột gặm nhấm"
    ],
    "vietnameseNames": [
      "Thử"
    ]
  },
  "209": {
    "vietnameseMeaning": "Cái mũi, ngửi mùi",
    "vietnameseMeanings": [
      "chiếc mũi",
      "khứu giác",
      "bắt đầu"
    ],
    "vietnameseNames": [
      "Tị"
    ]
  },
  "210": {
    "vietnameseMeaning": "Đều đặn, tề chỉnh, bằng phẳng",
    "vietnameseMeanings": [
      "ngang bằng nhau",
      "ngăn nắp tề chỉnh",
      "đồng đều"
    ],
    "vietnameseNames": [
      "Tề",
      "Tư",
      "Trai"
    ]
  },
  "211": {
    "vietnameseMeaning": "Răng, tuổi tác, răng cưa",
    "vietnameseMeanings": [
      "hàm răng",
      "răng cưa",
      "tuổi tác thứ bậc"
    ],
    "vietnameseNames": [
      "Xỉ"
    ]
  },
  "212": {
    "vietnameseMeaning": "Con rồng, uy quyền vua chúa",
    "vietnameseMeanings": [
      "thần long linh thiêng",
      "rồng uốn lượn",
      "uy quyền hoàng gia"
    ],
    "vietnameseNames": [
      "Long",
      "Sủng"
    ]
  },
  "213": {
    "vietnameseMeaning": "Con rùa, trường thọ",
    "vietnameseMeanings": [
      "con rùa sống thọ",
      "bói mu rùa"
    ],
    "vietnameseNames": [
      "Quy",
      "Cưu",
      "Quân"
    ]
  },
  "214": {
    "vietnameseMeaning": "Ống sáo ba lỗ, ống đo nhạc",
    "vietnameseMeanings": [
      "chiếc sáo trúc cổ",
      "ống thổi chuẩn âm luật"
    ],
    "vietnameseNames": [
      "Dược",
      "Thược"
    ]
  }
};

export function enrichRadicalWithVietnamese<T extends { id: number; vietnameseMeaning?: string; vietnameseMeanings?: string[]; vietnameseNames?: string[] }>(radical: T): T {
  const meta = RADICAL_VIETNAMESE_DICT[radical.id];
  if (!meta) return radical;
  return {
    ...radical,
    vietnameseMeaning: radical.vietnameseMeaning || meta.vietnameseMeaning,
    vietnameseMeanings: (radical.vietnameseMeanings && radical.vietnameseMeanings.length > 0) ? radical.vietnameseMeanings : meta.vietnameseMeanings,
    vietnameseNames: (radical.vietnameseNames && radical.vietnameseNames.length > 0) ? radical.vietnameseNames : meta.vietnameseNames,
  };
}
