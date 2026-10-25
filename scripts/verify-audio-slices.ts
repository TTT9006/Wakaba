import fs from 'fs';
import path from 'path';

type SliceDef = {
  examId: string;
  examTitle: string;
  dir: string;
  expectedCount: number;
  segments: { id: string; start: number; end: number }[];
  syncStatus: 'chưa kiểm' | 'khớp tự động' | 'đã soát thủ công';
};

const sliceDefinitions: SliceDef[] = [
  {
    examId: 'jlpt-n5-2024-07',
    examTitle: 'JLPT N5 07/2024',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2024-07',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 197.8, end: 240.0 },
      { id: 'q02', start: 251.5, end: 311.0 },
      { id: 'q03', start: 322.3, end: 372.0 },
      { id: 'q04', start: 383.3, end: 434.0 },
      { id: 'q05', start: 444.8, end: 514.5 },
      { id: 'q06', start: 525.6, end: 582.0 },
      { id: 'q07', start: 593.1, end: 651.0 },
      { id: 'q08', start: 778.6, end: 838.0 },
      { id: 'q09', start: 848.8, end: 891.0 },
      { id: 'q10', start: 902.4, end: 953.0 },
      { id: 'q11', start: 964.4, end: 1018.0 },
      { id: 'q12', start: 1029.0, end: 1089.0 },
      { id: 'q13', start: 1099.8, end: 1153.0 },
      { id: 'q14', start: 1290.8, end: 1317.0 },
      { id: 'q15', start: 1326.3, end: 1346.0 },
      { id: 'q16', start: 1355.6, end: 1381.0 },
      { id: 'q17', start: 1390.4, end: 1416.5 },
      { id: 'q18', start: 1425.9, end: 1453.5 },
      { id: 'q19', start: 1539.0, end: 1559.5 },
      { id: 'q20', start: 1566.8, end: 1589.5 },
      { id: 'q21', start: 1597.0, end: 1616.5 },
      { id: 'q22', start: 1623.8, end: 1644.5 },
      { id: 'q23', start: 1652.1, end: 1672.0 },
      { id: 'q24', start: 1679.7, end: 1699.5 },
    ],
  },
  {
    examId: 'jlpt-n5-2010-2011',
    examTitle: 'JLPT N5 2010-2011',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2010-2011',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 172.5, end: 235.0 },
      { id: 'q02', start: 235.0, end: 293.0 },
      { id: 'q03', start: 293.0, end: 346.5 },
      { id: 'q04', start: 346.5, end: 412.5 },
      { id: 'q05', start: 412.5, end: 486.5 },
      { id: 'q06', start: 486.5, end: 554.0 },
      { id: 'q07', start: 554.0, end: 618.0 },
      { id: 'q08', start: 757.5, end: 826.5 },
      { id: 'q09', start: 826.5, end: 899.5 },
      { id: 'q10', start: 899.5, end: 963.5 },
      { id: 'q11', start: 963.5, end: 1025.5 },
      { id: 'q12', start: 1025.5, end: 1091.5 },
      { id: 'q13', start: 1091.5, end: 1152.5 },
      { id: 'q14', start: 1259.5, end: 1292.5 },
      { id: 'q15', start: 1292.5, end: 1328.0 },
      { id: 'q16', start: 1328.0, end: 1361.0 },
      { id: 'q17', start: 1361.0, end: 1396.5 },
      { id: 'q18', start: 1396.5, end: 1435.0 },
      { id: 'q19', start: 1518.5, end: 1546.5 },
      { id: 'q20', start: 1546.5, end: 1576.5 },
      { id: 'q21', start: 1576.5, end: 1606.5 },
      { id: 'q22', start: 1606.5, end: 1637.5 },
      { id: 'q23', start: 1637.5, end: 1665.5 },
      { id: 'q24', start: 1665.5, end: 1700.0 },
    ],
  },
  {
    examId: 'jlpt-n5-2012-12',
    examTitle: 'JLPT N5 12/2012',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2012-12',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 214.5, end: 261.5 },
      { id: 'q02', start: 261.5, end: 318.5 },
      { id: 'q03', start: 318.5, end: 373.5 },
      { id: 'q04', start: 373.5, end: 430.5 },
      { id: 'q05', start: 430.5, end: 493.5 },
      { id: 'q06', start: 493.5, end: 558.0 },
      { id: 'q07', start: 558.0, end: 630.0 },
      { id: 'q08', start: 767.0, end: 823.0 },
      { id: 'q09', start: 823.0, end: 885.5 },
      { id: 'q10', start: 885.5, end: 947.5 },
      { id: 'q11', start: 947.5, end: 1010.5 },
      { id: 'q12', start: 1010.5, end: 1087.0 },
      { id: 'q13', start: 1087.0, end: 1160.0 },
      { id: 'q14', start: 1293.0, end: 1325.5 },
      { id: 'q15', start: 1325.5, end: 1360.0 },
      { id: 'q16', start: 1360.0, end: 1395.0 },
      { id: 'q17', start: 1395.0, end: 1432.5 },
      { id: 'q18', start: 1432.5, end: 1465.0 },
      { id: 'q19', start: 1549.5, end: 1580.5 },
      { id: 'q20', start: 1580.5, end: 1612.5 },
      { id: 'q21', start: 1612.5, end: 1642.0 },
      { id: 'q22', start: 1642.0, end: 1672.5 },
      { id: 'q23', start: 1672.5, end: 1704.5 },
      { id: 'q24', start: 1704.5, end: 1735.0 },
    ],
  },
  {
    examId: 'jlpt-n5-2013-07',
    examTitle: 'JLPT N5 07/2013',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2013-07',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 208.0, end: 257.5 },
      { id: 'q02', start: 269.0, end: 313.0 },
      { id: 'q03', start: 324.5, end: 375.2 },
      { id: 'q04', start: 386.8, end: 438.9 },
      { id: 'q05', start: 450.4, end: 501.9 },
      { id: 'q06', start: 513.3, end: 575.1 },
      { id: 'q07', start: 586.5, end: 655.6 },
      { id: 'q08', start: 794.0, end: 836.2 },
      { id: 'q09', start: 847.7, end: 900.2 },
      { id: 'q10', start: 911.7, end: 959.8 },
      { id: 'q11', start: 971.3, end: 1022.0 },
      { id: 'q12', start: 1033.5, end: 1086.2 },
      { id: 'q13', start: 1097.7, end: 1168.2 },
      { id: 'q14', start: 1320.0, end: 1339.6 },
      { id: 'q15', start: 1349.1, end: 1379.0 },
      { id: 'q16', start: 1388.5, end: 1415.1 },
      { id: 'q17', start: 1424.5, end: 1450.1 },
      { id: 'q18', start: 1459.6, end: 1488.0 },
      { id: 'q19', start: 1583.8, end: 1602.2 },
      { id: 'q20', start: 1609.7, end: 1631.3 },
      { id: 'q21', start: 1638.8, end: 1662.7 },
      { id: 'q22', start: 1670.1, end: 1694.8 },
      { id: 'q23', start: 1702.3, end: 1726.2 },
      { id: 'q24', start: 1733.7, end: 1761.5 },
    ],
  },
  {
    examId: 'jlpt-n5-2018',
    examTitle: 'JLPT N5 2018',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2018',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 159.5, end: 220.5 },
      { id: 'q02', start: 220.5, end: 280.5 },
      { id: 'q03', start: 280.5, end: 343.0 },
      { id: 'q04', start: 343.0, end: 413.5 },
      { id: 'q05', start: 413.5, end: 501.5 },
      { id: 'q06', start: 501.5, end: 564.0 },
      { id: 'q07', start: 564.0, end: 635.0 },
      { id: 'q08', start: 757.0, end: 812.0 },
      { id: 'q09', start: 812.0, end: 869.5 },
      { id: 'q10', start: 869.5, end: 930.0 },
      { id: 'q11', start: 930.0, end: 1007.5 },
      { id: 'q12', start: 1007.5, end: 1106.0 },
      { id: 'q13', start: 1106.0, end: 1175.0 },
      { id: 'q14', start: 1267.0, end: 1310.5 },
      { id: 'q15', start: 1310.5, end: 1346.5 },
      { id: 'q16', start: 1346.5, end: 1367.5 },
      { id: 'q17', start: 1367.5, end: 1402.5 },
      { id: 'q18', start: 1402.5, end: 1450.0 },
      { id: 'q19', start: 1530.0, end: 1567.5 },
      { id: 'q20', start: 1567.5, end: 1596.5 },
      { id: 'q21', start: 1596.5, end: 1616.0 },
      { id: 'q22', start: 1616.0, end: 1650.0 },
      { id: 'q23', start: 1650.0, end: 1682.5 },
      { id: 'q24', start: 1682.5, end: 1715.0 },
    ],
  },
  {
    examId: 'jlpt-n5-2021-12',
    examTitle: 'JLPT N5 12/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n5-2021-12',
    expectedCount: 24,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 206.5, end: 251.5 },
      { id: 'q02', start: 263.0, end: 317.8 },
      { id: 'q03', start: 329.5, end: 380.6 },
      { id: 'q04', start: 392.0, end: 441.3 },
      { id: 'q05', start: 452.8, end: 506.4 },
      { id: 'q06', start: 518.0, end: 583.5 },
      { id: 'q07', start: 595.0, end: 653.8 },
      { id: 'q08', start: 799.0, end: 847.1 },
      { id: 'q09', start: 858.5, end: 902.8 },
      { id: 'q10', start: 914.2, end: 958.3 },
      { id: 'q11', start: 969.8, end: 1020.6 },
      { id: 'q12', start: 1032.0, end: 1080.6 },
      { id: 'q13', start: 1092.0, end: 1154.1 },
      { id: 'q14', start: 1306.0, end: 1331.6 },
      { id: 'q15', start: 1341.2, end: 1363.9 },
      { id: 'q16', start: 1373.4, end: 1395.1 },
      { id: 'q17', start: 1404.5, end: 1433.1 },
      { id: 'q18', start: 1442.5, end: 1468.3 },
      { id: 'q19', start: 1564.0, end: 1581.0 },
      { id: 'q20', start: 1585.5, end: 1607.5 },
      { id: 'q21', start: 1612.0, end: 1634.5 },
      { id: 'q22', start: 1639.0, end: 1662.3 },
      { id: 'q23', start: 1669.8, end: 1695.1 },
      { id: 'q24', start: 1702.6, end: 1729.7 },
    ],
  },
  {
    examId: 'jlpt-n4-2024-07',
    examTitle: 'JLPT N4 07/2024',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n4-2024-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 188.0, end: 255.0 },
      { id: 'q02', start: 260.0, end: 328.0 },
      { id: 'q03', start: 334.0, end: 405.0 },
      { id: 'q04', start: 411.5, end: 490.0 },
      { id: 'q05', start: 495.0, end: 570.0 },
      { id: 'q06', start: 574.5, end: 635.0 },
      { id: 'q07', start: 643.0, end: 712.0 },
      { id: 'q08', start: 718.0, end: 798.0 },
      { id: 'q09', start: 935.5, end: 1022.0 },
      { id: 'q10', start: 1028.0, end: 1115.0 },
      { id: 'q11', start: 1120.0, end: 1218.0 },
      { id: 'q12', start: 1223.5, end: 1314.0 },
      { id: 'q13', start: 1320.0, end: 1408.0 },
      { id: 'q14', start: 1414.0, end: 1498.0 },
      { id: 'q15', start: 1504.5, end: 1630.0 },
      { id: 'q16', start: 1718.5, end: 1750.0 },
      { id: 'q17', start: 1752.5, end: 1786.0 },
      { id: 'q18', start: 1788.5, end: 1820.0 },
      { id: 'q19', start: 1821.5, end: 1852.0 },
      { id: 'q20', start: 1854.5, end: 1886.0 },
      { id: 'q21', start: 1968.0, end: 1993.0 },
      { id: 'q22', start: 1995.0, end: 2023.0 },
      { id: 'q23', start: 2025.0, end: 2051.0 },
      { id: 'q24', start: 2052.0, end: 2079.0 },
      { id: 'q25', start: 2080.0, end: 2106.0 },
      { id: 'q26', start: 2108.0, end: 2136.0 },
      { id: 'q27', start: 2137.0, end: 2167.0 },
      { id: 'q28', start: 2168.0, end: 2198.0 },
    ],
  },
  {
    examId: 'jlpt-n3-2023-07',
    examTitle: 'JLPT N3 07/2023',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n3-2023-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 0.0, end: 80.0 },
      { id: 'q02', start: 81.0, end: 162.0 },
      { id: 'q03', start: 163.0, end: 237.0 },
      { id: 'q04', start: 238.0, end: 334.0 },
      { id: 'q05', start: 335.0, end: 428.0 },
      { id: 'q06', start: 429.0, end: 511.0 },
      { id: 'q07', start: 512.0, end: 615.0 },
      { id: 'q08', start: 616.0, end: 716.0 },
      { id: 'q09', start: 717.0, end: 825.0 },
      { id: 'q10', start: 826.0, end: 937.0 },
      { id: 'q11', start: 938.0, end: 1029.0 },
      { id: 'q12', start: 1030.0, end: 1129.0 },
      { id: 'q13', start: 1130.0, end: 1229.0 },
      { id: 'q14', start: 1229.0, end: 1311.5 },
      { id: 'q15', start: 1311.5, end: 1405.0 },
      { id: 'q16', start: 1405.0, end: 1437.0 },
      { id: 'q17', start: 1437.0, end: 1470.0 },
      { id: 'q18', start: 1470.0, end: 1506.0 },
      { id: 'q19', start: 1506.0, end: 1540.0 },
      { id: 'q20', start: 1540.0, end: 1570.0 },
      { id: 'q21', start: 1570.0, end: 1602.0 },
      { id: 'q22', start: 1602.0, end: 1635.0 },
      { id: 'q23', start: 1635.0, end: 1666.0 },
      { id: 'q24', start: 1666.0, end: 1695.0 },
      { id: 'q25', start: 1695.0, end: 1728.0 },
      { id: 'q26', start: 1728.0, end: 1760.0 },
      { id: 'q27', start: 1760.0, end: 1790.0 },
      { id: 'q28', start: 1790.0, end: 1821.5 },
    ],
  },
  {
    examId: 'jlpt-n2-2023-07',
    examTitle: 'JLPT N2 07/2023',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n2-2023-07',
    expectedCount: 29,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 0.0, end: 109.0 },
      { id: 'q02', start: 110.0, end: 198.0 },
      { id: 'q03', start: 199.0, end: 294.0 },
      { id: 'q04', start: 295.0, end: 392.0 },
      { id: 'q05', start: 393.0, end: 455.0 },
      { id: 'q06', start: 456.0, end: 575.0 },
      { id: 'q07', start: 576.0, end: 699.0 },
      { id: 'q08', start: 700.0, end: 827.0 },
      { id: 'q09', start: 828.0, end: 950.0 },
      { id: 'q10', start: 951.0, end: 1050.0 },
      { id: 'q11', start: 1051.0, end: 1157.0 },
      { id: 'q12', start: 1158.0, end: 1250.0 },
      { id: 'q13', start: 1251.0, end: 1345.0 },
      { id: 'q14', start: 1346.0, end: 1443.0 },
      { id: 'q15', start: 1444.0, end: 1536.0 },
      { id: 'q16', start: 1537.0, end: 1639.0 },
      { id: 'q17', start: 1640.0, end: 1670.0 },
      { id: 'q18', start: 1671.0, end: 1703.0 },
      { id: 'q19', start: 1704.0, end: 1733.0 },
      { id: 'q20', start: 1734.0, end: 1765.0 },
      { id: 'q21', start: 1766.0, end: 1794.0 },
      { id: 'q22', start: 1795.0, end: 1825.0 },
      { id: 'q23', start: 1826.0, end: 1856.0 },
      { id: 'q24', start: 1857.0, end: 1889.0 },
      { id: 'q25', start: 1890.0, end: 1921.0 },
      { id: 'q26', start: 1922.0, end: 1953.0 },
      { id: 'q27', start: 1953.0, end: 2100.0 },
      { id: 'q28', start: 2100.0, end: 2225.0 },
      { id: 'q29', start: 2225.0, end: 2254.5 },
    ],
  },
  {
    examId: 'jlpt-n1-2023-07',
    examTitle: 'JLPT N1 07/2023',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n1-2023-07',
    expectedCount: 30,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 0.0, end: 82.0 },
      { id: 'q02', start: 82.0, end: 182.0 },
      { id: 'q03', start: 182.0, end: 274.0 },
      { id: 'q04', start: 274.0, end: 378.0 },
      { id: 'q05', start: 378.0, end: 464.0 },
      { id: 'q06', start: 464.0, end: 599.0 },
      { id: 'q07', start: 599.0, end: 735.0 },
      { id: 'q08', start: 735.0, end: 832.0 },
      { id: 'q09', start: 832.0, end: 984.0 },
      { id: 'q10', start: 984.0, end: 1071.0 },
      { id: 'q11', start: 1071.0, end: 1184.0 },
      { id: 'q12', start: 1184.0, end: 1294.0 },
      { id: 'q13', start: 1294.0, end: 1387.0 },
      { id: 'q14', start: 1387.0, end: 1490.0 },
      { id: 'q15', start: 1490.0, end: 1572.0 },
      { id: 'q16', start: 1572.0, end: 1670.0 },
      { id: 'q17', start: 1670.0, end: 1700.0 },
      { id: 'q18', start: 1700.0, end: 1736.0 },
      { id: 'q19', start: 1736.0, end: 1769.0 },
      { id: 'q20', start: 1769.0, end: 1794.0 },
      { id: 'q21', start: 1794.0, end: 1833.0 },
      { id: 'q22', start: 1833.0, end: 1866.0 },
      { id: 'q23', start: 1866.0, end: 1890.0 },
      { id: 'q24', start: 1890.0, end: 1920.0 },
      { id: 'q25', start: 1920.0, end: 1950.0 },
      { id: 'q26', start: 1950.0, end: 1987.0 },
      { id: 'q27', start: 1987.0, end: 2014.0 },
      { id: 'q28', start: 2014.0, end: 2161.0 },
      { id: 'q29', start: 2161.0, end: 2295.0 },
      { id: 'q30', start: 2295.0, end: 2325.6 },
    ],
  },
  {
    examId: 'jlpt-n2-2022-07',
    examTitle: 'JLPT N2 07/2022',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n2-2022-07',
    expectedCount: 31,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 90.11, end: 160.1 },
      { id: 'q02', start: 160.1, end: 246.04 },
      { id: 'q03', start: 246.04, end: 359.98 },
      { id: 'q04', start: 359.98, end: 451.24 },
      { id: 'q05', start: 451.24, end: 542.28 },
      { id: 'q06', start: 575.76, end: 714.11 },
      { id: 'q07', start: 714.11, end: 821.34 },
      { id: 'q08', start: 821.34, end: 938.89 },
      { id: 'q09', start: 938.89, end: 1033.22 },
      { id: 'q10', start: 1033.22, end: 1180.56 },
      { id: 'q11', start: 1180.56, end: 1328.2 },
      { id: 'q12', start: 1368.98, end: 1460.0 },
      { id: 'q13', start: 1460.0, end: 1562.38 },
      { id: 'q14', start: 1562.38, end: 1659.12 },
      { id: 'q15', start: 1659.12, end: 1748.0 },
      { id: 'q16', start: 1748.0, end: 1867.55 },
      { id: 'q17', start: 1898.64, end: 1931.96 },
      { id: 'q18', start: 1931.96, end: 1968.78 },
      { id: 'q19', start: 1968.78, end: 2002.0 },
      { id: 'q20', start: 2002.0, end: 2035.49 },
      { id: 'q21', start: 2035.49, end: 2066.62 },
      { id: 'q22', start: 2066.62, end: 2098.61 },
      { id: 'q23', start: 2098.61, end: 2129.78 },
      { id: 'q24', start: 2129.78, end: 2165.26 },
      { id: 'q25', start: 2165.26, end: 2203.66 },
      { id: 'q26', start: 2203.66, end: 2237.22 },
      { id: 'q27', start: 2237.22, end: 2255.0 },
      { id: 'q28', start: 2255.0, end: 2270.42 },
      { id: 'q29', start: 2282.75, end: 2447.55 },
      { id: 'q30', start: 2447.55, end: 2595.59 },
      { id: 'q31', start: 2595.59, end: 2617.73 },
    ],
  },
  {
    examId: 'jlpt-n3-2022-07',
    examTitle: 'JLPT N3 07/2022',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n3-2022-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 120.0, end: 193.0 },
      { id: 'q02', start: 193.0, end: 289.0 },
      { id: 'q03', start: 289.0, end: 393.0 },
      { id: 'q04', start: 393.0, end: 473.0 },
      { id: 'q05', start: 473.0, end: 568.0 },
      { id: 'q06', start: 568.0, end: 678.0 },
      { id: 'q07', start: 719.0, end: 834.0 },
      { id: 'q08', start: 834.0, end: 962.0 },
      { id: 'q09', start: 962.0, end: 1065.0 },
      { id: 'q10', start: 1065.0, end: 1176.0 },
      { id: 'q11', start: 1176.0, end: 1274.0 },
      { id: 'q12', start: 1274.0, end: 1423.0 },
      { id: 'q13', start: 1475.0, end: 1580.0 },
      { id: 'q14', start: 1580.0, end: 1682.0 },
      { id: 'q15', start: 1682.0, end: 1773.0 },
      { id: 'q16', start: 1795.0, end: 1846.0 },
      { id: 'q17', start: 1846.0, end: 1887.0 },
      { id: 'q18', start: 1887.0, end: 1934.0 },
      { id: 'q19', start: 1934.0, end: 1982.0 },
      { id: 'q20', start: 2016.0, end: 2050.0 },
      { id: 'q21', start: 2050.0, end: 2086.0 },
      { id: 'q22', start: 2086.0, end: 2125.0 },
      { id: 'q23', start: 2125.0, end: 2160.0 },
      { id: 'q24', start: 2160.0, end: 2194.0 },
      { id: 'q25', start: 2194.0, end: 2230.0 },
      { id: 'q26', start: 2230.0, end: 2265.0 },
      { id: 'q27', start: 2265.0, end: 2300.0 },
      { id: 'q28', start: 2300.0, end: 2445.6 },
    ],
  },
  {
    examId: 'jlpt-n4-2017-07',
    examTitle: 'JLPT N4 07/2017',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n4-2017-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 161.0, end: 227.0 },
      { id: 'q02', start: 227.0, end: 302.0 },
      { id: 'q03', start: 302.0, end: 366.0 },
      { id: 'q04', start: 366.0, end: 442.0 },
      { id: 'q05', start: 442.0, end: 517.0 },
      { id: 'q06', start: 517.0, end: 585.0 },
      { id: 'q07', start: 585.0, end: 640.0 },
      { id: 'q08', start: 640.0, end: 735.0 },
      { id: 'q09', start: 872.0, end: 961.0 },
      { id: 'q10', start: 961.0, end: 1064.0 },
      { id: 'q11', start: 1064.0, end: 1151.0 },
      { id: 'q12', start: 1151.0, end: 1227.0 },
      { id: 'q13', start: 1227.0, end: 1339.0 },
      { id: 'q14', start: 1339.0, end: 1440.0 },
      { id: 'q15', start: 1440.0, end: 1537.0 },
      { id: 'q16', start: 1623.0, end: 1660.0 },
      { id: 'q17', start: 1660.0, end: 1699.0 },
      { id: 'q18', start: 1699.0, end: 1739.0 },
      { id: 'q19', start: 1739.0, end: 1777.0 },
      { id: 'q20', start: 1777.0, end: 1815.0 },
      { id: 'q21', start: 1902.0, end: 1930.0 },
      { id: 'q22', start: 1930.0, end: 1961.0 },
      { id: 'q23', start: 1961.0, end: 1993.0 },
      { id: 'q24', start: 1993.0, end: 2025.0 },
      { id: 'q25', start: 2025.0, end: 2056.0 },
      { id: 'q26', start: 2056.0, end: 2087.0 },
      { id: 'q27', start: 2087.0, end: 2117.0 },
      { id: 'q28', start: 2117.0, end: 2250.77 },
    ],
  },
  {
    examId: 'jlpt-n2-2021-12',
    examTitle: 'JLPT N2 12/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n2-2021-12',
    expectedCount: 30,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 35, end: 126 },
      { id: 'q02', start: 126, end: 190 },
      { id: 'q03', start: 190, end: 300 },
      { id: 'q04', start: 300, end: 406 },
      { id: 'q05', start: 406, end: 515 },
      { id: 'q06', start: 558, end: 648 },
      { id: 'q07', start: 648, end: 763 },
      { id: 'q08', start: 763, end: 875 },
      { id: 'q09', start: 875, end: 1009 },
      { id: 'q10', start: 1009, end: 1098 },
      { id: 'q11', start: 1098, end: 1243 },
      { id: 'q12', start: 1296, end: 1403 },
      { id: 'q13', start: 1403, end: 1506 },
      { id: 'q14', start: 1506, end: 1600 },
      { id: 'q15', start: 1600, end: 1691 },
      { id: 'q16', start: 1691, end: 1802 },
      { id: 'q17', start: 1845, end: 1875 },
      { id: 'q18', start: 1875, end: 1908 },
      { id: 'q19', start: 1908, end: 1944 },
      { id: 'q20', start: 1944, end: 1977 },
      { id: 'q21', start: 1977, end: 2007 },
      { id: 'q22', start: 2007, end: 2049 },
      { id: 'q23', start: 2049, end: 2085 },
      { id: 'q24', start: 2085, end: 2118 },
      { id: 'q25', start: 2118, end: 2148 },
      { id: 'q26', start: 2148, end: 2178 },
      { id: 'q27', start: 2178, end: 2223 },
      { id: 'q28', start: 2260, end: 2440 },
      { id: 'q29', start: 2458, end: 2564 },
      { id: 'q30', start: 2564, end: 2602.92 },
    ],
  },
  {
    examId: 'jlpt-n3-2021-12',
    examTitle: 'JLPT N3 12/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n3-2021-12',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 195, end: 259 },
      { id: 'q02', start: 259, end: 367 },
      { id: 'q03', start: 367, end: 447 },
      { id: 'q04', start: 447, end: 506 },
      { id: 'q05', start: 506, end: 609 },
      { id: 'q06', start: 609, end: 715 },
      { id: 'q07', start: 864, end: 956 },
      { id: 'q08', start: 956, end: 1065 },
      { id: 'q09', start: 1065, end: 1172 },
      { id: 'q10', start: 1172, end: 1284 },
      { id: 'q11', start: 1284, end: 1397 },
      { id: 'q12', start: 1397, end: 1545 },
      { id: 'q13', start: 1714, end: 1803 },
      { id: 'q14', start: 1803, end: 1886 },
      { id: 'q15', start: 1886, end: 1969 },
      { id: 'q16', start: 2054, end: 2089 },
      { id: 'q17', start: 2089, end: 2124 },
      { id: 'q18', start: 2124, end: 2163 },
      { id: 'q19', start: 2163, end: 2209 },
      { id: 'q20', start: 2298, end: 2328 },
      { id: 'q21', start: 2328, end: 2362 },
      { id: 'q22', start: 2362, end: 2390 },
      { id: 'q23', start: 2390, end: 2427 },
      { id: 'q24', start: 2427, end: 2450 },
      { id: 'q25', start: 2450, end: 2490 },
      { id: 'q26', start: 2490, end: 2521 },
      { id: 'q27', start: 2521, end: 2556 },
      { id: 'q28', start: 2556, end: 2597.43 },
    ],
  },
  {
    examId: 'jlpt-n3-2018-12',
    examTitle: 'JLPT N3 12/2018',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n3-2018-12',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 56, end: 145 },
      { id: 'q02', start: 145, end: 206 },
      { id: 'q03', start: 206, end: 316 },
      { id: 'q04', start: 316, end: 406 },
      { id: 'q05', start: 406, end: 506 },
      { id: 'q06', start: 506, end: 614 },
      { id: 'q07', start: 655, end: 756 },
      { id: 'q08', start: 756, end: 848 },
      { id: 'q09', start: 848, end: 963 },
      { id: 'q10', start: 963, end: 1101 },
      { id: 'q11', start: 1101, end: 1225 },
      { id: 'q12', start: 1225, end: 1397 },
      { id: 'q13', start: 1444, end: 1539 },
      { id: 'q14', start: 1539, end: 1640 },
      { id: 'q15', start: 1640, end: 1733 },
      { id: 'q16', start: 1762, end: 1798 },
      { id: 'q17', start: 1798, end: 1844 },
      { id: 'q18', start: 1844, end: 1892 },
      { id: 'q19', start: 1892, end: 1937 },
      { id: 'q20', start: 1974, end: 2006 },
      { id: 'q21', start: 2006, end: 2039 },
      { id: 'q22', start: 2039, end: 2069 },
      { id: 'q23', start: 2069, end: 2099 },
      { id: 'q24', start: 2099, end: 2140 },
      { id: 'q25', start: 2140, end: 2171 },
      { id: 'q26', start: 2171, end: 2202 },
      { id: 'q27', start: 2202, end: 2234 },
      { id: 'q28', start: 2234, end: 2289.28 },
    ],
  },
  {
    examId: 'jlpt-n4-2021-12',
    examTitle: 'JLPT N4 12/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n4-2021-12',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 204, end: 263 },
      { id: 'q02', start: 263, end: 337 },
      { id: 'q03', start: 337, end: 400 },
      { id: 'q04', start: 400, end: 480 },
      { id: 'q05', start: 480, end: 575 },
      { id: 'q06', start: 575, end: 634 },
      { id: 'q07', start: 634, end: 721 },
      { id: 'q08', start: 721, end: 807 },
      { id: 'q09', start: 954, end: 1040 },
      { id: 'q10', start: 1040, end: 1141 },
      { id: 'q11', start: 1141, end: 1219 },
      { id: 'q12', start: 1219, end: 1329 },
      { id: 'q13', start: 1329, end: 1452 },
      { id: 'q14', start: 1452, end: 1544 },
      { id: 'q15', start: 1544, end: 1693 },
      { id: 'q16', start: 1778, end: 1814 },
      { id: 'q17', start: 1814, end: 1854 },
      { id: 'q18', start: 1854, end: 1898 },
      { id: 'q19', start: 1898, end: 1935 },
      { id: 'q20', start: 1935, end: 1977 },
      { id: 'q21', start: 2063, end: 2096 },
      { id: 'q22', start: 2096, end: 2128 },
      { id: 'q23', start: 2128, end: 2158 },
      { id: 'q24', start: 2158, end: 2188 },
      { id: 'q25', start: 2188, end: 2218 },
      { id: 'q26', start: 2218, end: 2248 },
      { id: 'q27', start: 2248, end: 2285 },
      { id: 'q28', start: 2285, end: 2320 },
    ],
  },
  {
    examId: 'jlpt-n4-2021-07',
    examTitle: 'JLPT N4 07/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n4-2021-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 202, end: 268 },
      { id: 'q02', start: 268, end: 362 },
      { id: 'q03', start: 362, end: 458 },
      { id: 'q04', start: 458, end: 531 },
      { id: 'q05', start: 531, end: 605 },
      { id: 'q06', start: 605, end: 682 },
      { id: 'q07', start: 682, end: 766 },
      { id: 'q08', start: 766, end: 846 },
      { id: 'q09', start: 985, end: 1075 },
      { id: 'q10', start: 1075, end: 1183 },
      { id: 'q11', start: 1183, end: 1302 },
      { id: 'q12', start: 1302, end: 1406 },
      { id: 'q13', start: 1406, end: 1517 },
      { id: 'q14', start: 1517, end: 1607 },
      { id: 'q15', start: 1607, end: 1750 },
      { id: 'q16', start: 1834, end: 1872 },
      { id: 'q17', start: 1872, end: 1905 },
      { id: 'q18', start: 1905, end: 1938 },
      { id: 'q19', start: 1938, end: 1987 },
      { id: 'q20', start: 1987, end: 2025 },
      { id: 'q21', start: 2110, end: 2137 },
      { id: 'q22', start: 2137, end: 2164 },
      { id: 'q23', start: 2164, end: 2198 },
      { id: 'q24', start: 2198, end: 2221 },
      { id: 'q25', start: 2221, end: 2261 },
      { id: 'q26', start: 2261, end: 2298 },
      { id: 'q27', start: 2298, end: 2331 },
      { id: 'q28', start: 2331, end: 2368 },
    ],
  },
  {
    examId: 'jlpt-n1-2022-12',
    examTitle: 'JLPT N1 12/2022',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n1-2022-12',
    expectedCount: 30,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 187.5, end: 299.5 },
      { id: 'q02', start: 299.5, end: 383.5 },
      { id: 'q03', start: 383.5, end: 466.5 },
      { id: 'q04', start: 466.5, end: 552 },
      { id: 'q05', start: 552, end: 670 },
      { id: 'q06', start: 831.5, end: 940.5 },
      { id: 'q07', start: 940.5, end: 1048 },
      { id: 'q08', start: 1048, end: 1208 },
      { id: 'q09', start: 1208, end: 1300 },
      { id: 'q10', start: 1300, end: 1415 },
      { id: 'q11', start: 1415, end: 1595 },
      { id: 'q12', start: 1736, end: 1838 },
      { id: 'q13', start: 1838, end: 1945.5 },
      { id: 'q14', start: 1945.5, end: 2049 },
      { id: 'q15', start: 2049, end: 2154.5 },
      { id: 'q16', start: 2154.5, end: 2261.5 },
      { id: 'q17', start: 2340.5, end: 2368.5 },
      { id: 'q18', start: 2368.5, end: 2408.5 },
      { id: 'q19', start: 2408.5, end: 2436.5 },
      { id: 'q20', start: 2436.5, end: 2476.5 },
      { id: 'q21', start: 2476.5, end: 2507.5 },
      { id: 'q22', start: 2507.5, end: 2541.5 },
      { id: 'q23', start: 2541.5, end: 2579.5 },
      { id: 'q24', start: 2579.5, end: 2608.5 },
      { id: 'q25', start: 2608.5, end: 2651.5 },
      { id: 'q26', start: 2651.5, end: 2684.5 },
      { id: 'q27', start: 2684.5, end: 2717.5 },
      { id: 'q28', start: 2734.5, end: 2913.5 },
      { id: 'q29', start: 2913.5, end: 3094.5 },
      { id: 'q30', start: 3094.5, end: 3120 },
    ],
  },
  {
    examId: 'jlpt-n3-2021-07',
    examTitle: 'JLPT N3 07/2021',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n3-2021-07',
    expectedCount: 28,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 122, end: 189.5 },
      { id: 'q02', start: 189.5, end: 263 },
      { id: 'q03', start: 263, end: 328 },
      { id: 'q04', start: 328, end: 409 },
      { id: 'q05', start: 409, end: 495.5 },
      { id: 'q06', start: 495.5, end: 598 },
      { id: 'q07', start: 651, end: 756 },
      { id: 'q08', start: 756, end: 842 },
      { id: 'q09', start: 842, end: 966 },
      { id: 'q10', start: 966, end: 1063 },
      { id: 'q11', start: 1063, end: 1177 },
      { id: 'q12', start: 1177, end: 1330 },
      { id: 'q13', start: 1383, end: 1464 },
      { id: 'q14', start: 1464, end: 1549 },
      { id: 'q15', start: 1549, end: 1636 },
      { id: 'q16', start: 1668, end: 1702 },
      { id: 'q17', start: 1702, end: 1735 },
      { id: 'q18', start: 1735, end: 1779 },
      { id: 'q19', start: 1779, end: 1824 },
      { id: 'q20', start: 1849, end: 1880 },
      { id: 'q21', start: 1880, end: 1909 },
      { id: 'q22', start: 1909, end: 1940 },
      { id: 'q23', start: 1940, end: 1982 },
      { id: 'q24', start: 1982, end: 2014 },
      { id: 'q25', start: 2014, end: 2047 },
      { id: 'q26', start: 2047, end: 2080 },
      { id: 'q27', start: 2080, end: 2120 },
      { id: 'q28', start: 2120, end: 2155 },
    ],
  },
  {
    examId: 'jlpt-n1-2022-07',
    examTitle: 'JLPT N1 07/2022',
    dir: 'd:\\Demo\\public\\audio\\jlpt\\n1-2022-07',
    expectedCount: 35,
    syncStatus: 'khớp tự động',
    segments: [
      { id: 'q01', start: 96, end: 183 },
      { id: 'q02', start: 183, end: 270 },
      { id: 'q03', start: 270, end: 369.5 },
      { id: 'q04', start: 369.5, end: 466.5 },
      { id: 'q05', start: 466.5, end: 549 },
      { id: 'q06', start: 549, end: 650 },
      { id: 'q07', start: 684.5, end: 819 },
      { id: 'q08', start: 819, end: 912 },
      { id: 'q09', start: 912, end: 1066 },
      { id: 'q10', start: 1066, end: 1219 },
      { id: 'q11', start: 1219, end: 1346.5 },
      { id: 'q12', start: 1346.5, end: 1481.5 },
      { id: 'q13', start: 1481.5, end: 1638 },
      { id: 'q14', start: 1679.5, end: 1770.5 },
      { id: 'q15', start: 1770.5, end: 1889 },
      { id: 'q16', start: 1889, end: 2021.5 },
      { id: 'q17', start: 2021.5, end: 2116.5 },
      { id: 'q18', start: 2116.5, end: 2219.5 },
      { id: 'q19', start: 2219.5, end: 2320 },
      { id: 'q20', start: 2340.5, end: 2371.5 },
      { id: 'q21', start: 2371.5, end: 2402.5 },
      { id: 'q22', start: 2402.5, end: 2453 },
      { id: 'q23', start: 2453, end: 2478.5 },
      { id: 'q24', start: 2478.5, end: 2511.5 },
      { id: 'q25', start: 2511.5, end: 2556.5 },
      { id: 'q26', start: 2556.5, end: 2587.5 },
      { id: 'q27', start: 2587.5, end: 2613.5 },
      { id: 'q28', start: 2613.5, end: 2654.5 },
      { id: 'q29', start: 2654.5, end: 2692.5 },
      { id: 'q30', start: 2692.5, end: 2716.5 },
      { id: 'q31', start: 2716.5, end: 2763.5 },
      { id: 'q32', start: 2763.5, end: 2802 },
      { id: 'q33', start: 2813.5, end: 2981 },
      { id: 'q34', start: 2981, end: 3152 },
      { id: 'q35', start: 3152, end: 3182 },
    ],
  },
];

type VerificationResult = {
  examId: string;
  examTitle: string;
  syncStatus: string;
  totalSegments: number;
  expectedCount: number;
  hasCorrectCount: boolean;
  hasEmptySegments: boolean;
  hasOverlaps: boolean;
  isChronological: boolean;
  details: {
    id: string;
    start: number;
    end: number;
    duration: number;
    sizeBytes: number;
    status: 'ok' | 'suspicious' | 'error';
    note?: string;
  }[];
  suspiciousCount: number;
};

const results: VerificationResult[] = [];
const flaggedForReview: any[] = [];

console.log('--- BẮT ĐẦU KIỂM TRA ĐỒNG BỘ ÂM THANH TỰ ĐỘNG ---');

for (const def of sliceDefinitions) {
  let hasEmpty = false;
  let hasOverlap = false;
  let isChronological = true;

  const filesInDir = fs.existsSync(def.dir) ? fs.readdirSync(def.dir).filter(f => f.endsWith('.mp3')) : [];
  const correctCount = filesInDir.length === def.expectedCount && def.segments.length === def.expectedCount;

  const details: VerificationResult['details'] = [];

  for (let i = 0; i < def.segments.length; i++) {
    const seg = def.segments[i];
    const filePath = path.join(def.dir, `${seg.id}.mp3`);
    let size = 0;
    if (fs.existsSync(filePath)) {
      size = fs.statSync(filePath).size;
    }

    const duration = +(seg.end - seg.start).toFixed(1);
    let status: 'ok' | 'suspicious' | 'error' = 'ok';
    const notes: string[] = [];

    if (size === 0) {
      hasEmpty = true;
      status = 'error';
      notes.push('File rỗng hoặc không tồn tại (0 bytes)');
    } else if (size < 50000) {
      status = 'suspicious';
      notes.push(`Dung lượng nhỏ bất thường (${(size / 1024).toFixed(1)} KB)`);
    }

    if (duration <= 1.0) {
      hasEmpty = true;
      status = 'error';
      notes.push('Thời lượng quá ngắn <= 1.0s');
    } else if (duration < 15.0) {
      // Short questions: check if Mondai 3 or 4 which are naturally short, else suspicious
      const qNum = parseInt(seg.id.replace('q', ''), 10);
      if (qNum <= 12) {
        status = 'suspicious';
        notes.push(`Thời lượng câu Mondai 1/2 ngắn bất thường (${duration}s)`);
      }
    } else if (duration > 185.0) {
      status = 'suspicious';
      notes.push(`Thời lượng câu quá dài (${duration}s)`);
    }

    // Check overlap with next question
    if (i < def.segments.length - 1) {
      const nextSeg = def.segments[i + 1];
      if (seg.end > nextSeg.start) {
        hasOverlap = true;
        status = 'error';
        notes.push(`Chồng lấn với câu tiếp theo (kết thúc ${seg.end}s > bắt đầu ${nextSeg.start}s)`);
      }
      if (nextSeg.start < seg.start) {
        isChronological = false;
        status = 'error';
        notes.push('Thứ tự thời gian bị đảo ngược');
      }
    }

    if (status !== 'ok') {
      flaggedForReview.push({
        exam: def.examTitle,
        question: seg.id,
        range: `${seg.start}s - ${seg.end}s (${duration}s)`,
        sizeKb: (size / 1024).toFixed(1),
        status,
        issues: notes.join('; '),
      });
    }

    details.push({
      id: seg.id,
      start: seg.start,
      end: seg.end,
      duration,
      sizeBytes: size,
      status,
      note: notes.join('; '),
    });
  }

  const suspiciousCount = details.filter(d => d.status !== 'ok').length;
  results.push({
    examId: def.examId,
    examTitle: def.examTitle,
    syncStatus: def.syncStatus,
    totalSegments: def.segments.length,
    expectedCount: def.expectedCount,
    hasCorrectCount: correctCount,
    hasEmptySegments: hasEmpty,
    hasOverlaps: hasOverlap,
    isChronological,
    details,
    suspiciousCount,
  });

  console.log(`[${def.examTitle}]`);
  console.log(` - Số đoạn: ${filesInDir.length}/${def.expectedCount} ${correctCount ? '✔ ĐỦ' : '❌ THIẾU'}`);
  console.log(` - Chồng lấn: ${hasOverlap ? '❌ CÓ CHỒNG LẤN' : '✔ KHÔNG CHỒNG LẤN'}`);
  console.log(` - Đoạn rỗng: ${hasEmpty ? '❌ CÓ ĐOẠN RỖNG' : '✔ KHÔNG CÓ'}`);
  console.log(` - Thứ tự: ${isChronological ? '✔ CHÍNH XÁC' : '❌ SAI THỨ TỰ'}`);
  console.log(` - Cần người soát lại: ${suspiciousCount} câu`);
}

// Write flagged-audio-review.json
const jsonPath = 'd:\\Demo\\docs\\flagged-audio-review.json';
fs.writeFileSync(jsonPath, JSON.stringify({ results, flaggedForReview }, null, 2), 'utf8');

// Write flagged-audio-review.md
let md = `# Báo cáo đối chiếu và kiểm tra đồng bộ Audio — 24/10/2026\n\n`;
md += `Báo cáo kiểm tra tự động 4 tiêu chí chất lượng cho từng đoạn cắt audio theo yêu cầu:\n`;
md += `1. **Số đoạn = số câu hỏi** (24 câu mỗi đề N5; 28-30 câu đề N4, N3, N2, N1).\n`;
md += `2. **Không chồng lấn thời gian** (no overlapping timestamps).\n`;
md += `3. **Không đoạn rỗng** (dung lượng > 0, thời lượng hợp lệ).\n`;
md += `4. **Thứ tự tăng dần chuẩn xác** theo dòng thời gian bài nghe.\n\n`;

md += `## 1. Bảng tổng hợp các đề thi JLPT (N5 – N1)\n\n`;
md += `| Đề thi | Số đoạn | Không chồng lấn | Không đoạn rỗng | Thứ tự | Trạng thái đồng bộ | Cần người soát |\n`;
md += `|---|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
for (const r of results) {
  md += `| ${r.examTitle} | ${r.totalSegments}/${r.expectedCount} (${r.hasCorrectCount ? 'Đạt' : 'Lỗi'}) | ${r.hasOverlaps ? '❌ Chồng lấn' : '✔ Hợp lệ'} | ${r.hasEmptySegments ? '❌ Có rỗng' : '✔ Hợp lệ'} | ${r.isChronological ? '✔ Đúng' : '❌ Sai'} | \`${r.syncStatus}\` | ${r.suspiciousCount} câu |\n`;
}

md += `\n> **Ghi chú về quy ước trạng thái:** Mọi đoạn audio cắt tự động chỉ được đặt là \`khớp tự động\`. Tuyệt đối không tự đặt là \`đã soát thủ công\` khi chưa có xác nhận từ người dùng.\n\n`;

md += `## 2. Danh sách các câu nghi ngờ cần người nghe lại (${flaggedForReview.length} mục)\n\n`;
if (flaggedForReview.length === 0) {
  md += `*Không có câu nào phát hiện lỗi nghiêm trọng hoặc chồng lấn. Tất cả các mốc cắt đều nằm trong ngưỡng an toàn.*\n`;
} else {
  md += `| Đề thi | Câu hỏi | Mốc thời gian | Dung lượng | Vấn đề ghi nhận |\n`;
  md += `|---|:---:|:---:|:---:|---|\n`;
  for (const item of flaggedForReview) {
    md += `| ${item.exam} | ${item.question} | ${item.range} | ${item.sizeKb} KB | ${item.issues} |\n`;
  }
}

const mdPath = 'd:\\Demo\\docs\\flagged-audio-review.md';
fs.writeFileSync(mdPath, md, 'utf8');

console.log(`\nĐã xuất kết quả kiểm tra vào:`);
console.log(` - ${mdPath}`);
console.log(` - ${jsonPath}`);
