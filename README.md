# csmju-software-license-manager

CS Software License Manager — ระบบย่อยของโครงการ CSMJU2030

มาตรฐานกลางอยู่ใน `standards/` (submodule ของ CSMJU2030/csmju2030-standards)
สร้างจาก standards v1.0.0

## เริ่มทำงาน

```bash
git submodule update --init --remote standards/
pnpm install
git checkout -b feature/software-license-manager/<เรื่องที่ทำ>
```

ก่อนเปิด PR อ่าน `standards/docs/github-workflow.md` ข้อ 1

## การกำหนดสิทธิ์

- Core Hub role `admin` ได้สิทธิ์ผู้ดูแลระบบทั้งหมด
- `student`, `alumni`, `staff` และ `lecturer` อ่านข้อมูลได้อย่างเดียว รวม Dashboard และรายการผู้ได้รับ License
- `guest` และ role ที่ไม่ได้ระบุใน `subsystem.yaml` เข้าใช้งานไม่ได้
- สิทธิ์อิงจาก role ใน token ที่ Core Hub ตรวจสอบแล้ว ไม่ได้อิงจากอีเมลหรือชื่อบัญชี

ปัจจุบัน Core Hub ยังไม่ใส่ role ของสิทธิ์พิเศษรายบุคคลลงใน token
ดังนั้นบัญชีบุคลากรที่ต้องเป็นผู้ดูแลต้องได้รับ Core Hub role `admin` ก่อน
การยื่น exception รายบุคคลจะยังไม่มีผลจนกว่า Core Hub จะรองรับการออก role ดังกล่าว
