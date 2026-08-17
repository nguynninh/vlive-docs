# Quy trình làm việc với VLive Docs

Tài liệu này mô tả quy trình Git chính thức cho project VLive Docs (Nextra/MDX). Mục tiêu: đơn giản, đủ dùng, không phức tạp hóa như Git Flow.

## Mô hình branch

```
main
  │
  ├── feature/xxx
  ├── fix/xxx
  ├── docs/xxx
  ├── refactor/xxx
  └── chore/xxx
```

`main` luôn là **source mới nhất**, không phải production. `main` không tự động deploy — chỉ khi tạo tag mới (`vX.Y.Z`) thì CI mới build và publish snapshot, đồng thời cập nhật `/latest/`. Production thực chất là `/latest/` trên VPS, được cập nhật qua tag chứ không phải qua mỗi lần merge vào `main`.

Hiện tại project đã có nhiều người cùng phát triển, nhưng **chưa thêm** `develop`, `staging`, hay `release/*` vì docs không cần môi trường staging riêng — mọi thay đổi đi qua Pull Request và kiểm tra kỹ trước khi merge vào `main` là đủ để kiểm soát chất lượng.

Chỉ cân nhắc thêm `develop`/`staging` khi:
- Cần một môi trường xem trước (preview) tách biệt khỏi production, hoặc
- Nhiều thay đổi lớn cần gộp và kiểm thử cùng lúc trước khi phát hành.

Cho đến lúc đó, giữ mô hình một nhánh `main` duy nhất + các nhánh ngắn hạn theo tính năng để tránh phức tạp hóa quy trình không cần thiết.

### Quy định đặt tên branch

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Source mới nhất | `main` | `main` |
| Thêm chức năng | `feature/<name>` | `feature/version-switcher` |
| Sửa bug | `fix/<name>` | `fix/sidebar-mobile` |
| Sửa nội dung docs lớn | `docs/<name>` | `docs/ios-integration` |
| Refactor | `refactor/<name>` | `refactor/navigation` |
| Build/config | `chore/<name>` | `chore/nginx-config` |

### Quy trình làm việc mẫu

```bash
git checkout main
git pull
git checkout -b feature/version-switcher

# ... code ...

git add .
git commit -m "feat: add documentation version switcher"
git push -u origin feature/version-switcher
```

Sau đó tạo Pull Request:

```
feature/version-switcher → PR → main
```

Merge vào `main` **chưa** lên production — nội dung chỉ thật sự lên production khi có tag mới và CI publish snapshot (xem mục [Build static snapshot theo version](#build-static-snapshot-theo-version)).

Merge xong thì xóa branch đã hoàn thành, không giữ lại đống branch cũ.

## Quy định commit (Conventional Commits)

```
feat:      thêm chức năng
fix:       sửa lỗi
docs:      thay đổi nội dung tài liệu
refactor:  refactor code
style:     UI/CSS
chore:     config/build/dependency
```

Ví dụ:

```bash
git commit -m "feat: add version switcher"
git commit -m "docs: update Android SDK installation"
git commit -m "fix: correct sidebar navigation"
git commit -m "style: improve documentation header"
git commit -m "chore: update Nextra dependencies"
```

## Quy định version/tag

Chỉ tag trên `main`, dùng đúng một format theo Semantic Versioning:

```
vMAJOR.MINOR.PATCH
```

```
v1.0.0
 │ │ │
 │ │ └── PATCH: sửa nhỏ
 │ └──── MINOR: thêm tính năng/nội dung tương thích
 └────── MAJOR: thay đổi lớn
```

Ví dụ:

```
v1.0.0   release đầu
v1.0.1   sửa typo / link / lỗi docs
v1.1.0   thêm tài liệu SDK/module mới
v2.0.0   SDK/docs thay đổi lớn
```

**Không dùng các format sau:**

- ❌ `1.0`
- ❌ `1.0.0`
- ❌ `docs-v1.0.0`
- ❌ `release-v1`
- ❌ `version-1.0.0`

### Quy trình release

```bash
git checkout main
git pull
git tag -a v1.0.0 -m "VLive Docs v1.0.0"
git push origin v1.0.0
```

GitHub Release cũng dùng chính tag đó (`v1.0.0`).

## Build static snapshot theo version

Mỗi khi push một tag `v*.*.*`, CI phải tự động build và publish snapshot cho version đó lên VPS, đồng thời cập nhật con trỏ `latest` sang version mới nhất — không làm thủ công để tránh quên hoặc lệch version.

Next/Nextra build ra **static export**, output thống nhất là thư mục `out/` (`next build && next export`, hoặc `output: 'export'` trong `next.config`). Không dùng `.next` — đó là thư mục build nội bộ của Next.js, không phải static export dùng để deploy.

### Cấu trúc thư mục trên VPS

```
/var/www/vlive-docs/
├── versions.json
├── latest/
│   ├── index.html
│   ├── _next/
│   └── ...
└── versions/
    ├── 1.0.0/
    ├── 1.0.1/
    ├── 1.1.0/
    └── 2.0.0/
```

Nginx chỉ serve static trực tiếp từ `/var/www/vlive-docs/` — không cần chạy Next.js ở port 3000 trên production vì toàn bộ site là static export.

`versions.json` ví dụ:

```json
{
  "latest": "2.0.0",
  "versions": ["2.0.0", "1.1.0", "1.0.1", "1.0.0"]
}
```

### `versions.json` sống thẳng trên VPS

Điểm quan trọng: mỗi lần CI chạy chỉ checkout đúng **một** tag, nên nó không tự biết những version nào đã từng release trước đó. `versions.json` vì vậy **không được sinh ra từ source trong `main`**, mà là file thật nằm ngay tại `/var/www/vlive-docs/versions.json` trên VPS — tồn tại độc lập, tích lũy qua từng lần release.

Không cần S3 hay nhánh `gh-pages`. CI chỉ cần SSH vào VPS: đọc `versions.json` hiện tại → merge version mới vào → ghi đè lại đúng vị trí đó.

### Quy trình CI khi có tag mới (GitHub Actions)

Trigger: `on: push: tags: ["v*.*.*"]`

Các bước:

1. Checkout đúng commit của tag (source code, để build).
2. `npm ci && npm run build` → build ra `out/`.
3. Rsync/scp `out/` lên VPS vào `/var/www/vlive-docs/versions/<version>/` (bỏ tiền tố `v`, ví dụ tag `v2.0.0` → thư mục `2.0.0`).
4. SSH vào VPS, chạy script trên VPS để: đọc `versions.json` hiện tại, so sánh version vừa deploy với `"latest"` (so sánh theo Semantic Versioning, không so sánh chuỗi).
5. Nếu version mới là cao nhất:
   - Đồng bộ `/var/www/vlive-docs/latest/` bằng đúng nội dung `/versions/<version>/` vừa upload (ví dụ `rsync --delete`).
   - Cập nhật `"latest"` trong `versions.json` sang version mới.
6. Luôn thêm version mới vào mảng `"versions"` trong `versions.json` (merge vào danh sách cũ, không thay thế), kể cả khi không phải bản cao nhất (ví dụ phát hành vá cho version cũ, `v1.0.2` sau khi `v2.0.0` đã ra).
7. Ghi `versions.json` đã cập nhật đè lại đúng vị trí `/var/www/vlive-docs/versions.json`.

Ví dụ workflow rút gọn:

```yaml
name: Build & Deploy Docs Version
on:
  push:
    tags: ["v*.*.*"]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build   # output: out/
      - name: Extract version
        run: echo "VERSION=${GITHUB_REF_NAME#v}" >> $GITHUB_ENV
      - name: Upload snapshot to VPS
        run: rsync -avz --delete out/ user@vps:/var/www/vlive-docs/versions/${{ env.VERSION }}/
      - name: Update latest + versions.json (chạy trên VPS qua SSH)
        run: ssh user@vps "bash /var/www/vlive-docs/scripts/publish-version.sh ${{ env.VERSION }}"
```

`scripts/publish-version.sh` (chạy trên VPS) chịu trách nhiệm: đọc `versions.json`, so sánh semver với `latest` hiện tại, và chỉ `rsync --delete` snapshot vào `/latest/` + cập nhật `versions.json` nếu version mới lớn hơn.

**Nguyên tắc quan trọng:**

- Snapshot trong `/versions/<x.y.z>/` là bất biến — không rebuild/sửa lại sau khi đã publish. Muốn sửa nội dung phải ra bản patch mới:

  ```
  v1.0.0
     ↓ sửa
  v1.0.1
  ```

  không đè lên `v1.0.0`.
- `/latest/` không phải version cố định — nó luôn trỏ theo bản cao nhất theo semver, tự động cập nhật mỗi lần có tag mới cao hơn.
- Không tự chuyển `latest` khi phát hành bản vá cho version cũ hơn bản đang là latest (ví dụ ra `v1.0.2` trong khi `v2.0.0` đã tồn tại) — chỉ thêm vào `/versions/` và `versions.json`, không đụng `/latest/`.

## Bảo vệ branch `main`

Khi có nhiều người cùng sửa docs, bật branch protection cho `main`:

```
main
├── ❌ không force push
├── ❌ không delete
├── ❌ developer push thẳng
├── ✅ thay đổi qua Pull Request
├── ✅ build/check phải pass
└── ✅ merge xong xóa branch
```

Vì project đã có nhiều người cùng phát triển, bật bắt buộc Pull Request và branch protection cho `main` ngay từ bây giờ — không push thẳng.

## Sơ đồ tổng quan

```
feature/*
docs/*
fix/*
   │
   ▼
  PR
   │
   ▼
 main
   │
   │ tạo tag khi release
   ▼
v1.2.0
   │
   ▼
GitHub Actions
   │
   ├── npm ci
   ├── npm run build
   ├── out/
   │
   ├── /versions/1.2.0/
   │
   ├── update versions.json
   │
   └── nếu 1.2.0 cao nhất
          ↓
       /latest/
```

`main` chỉ là source mới nhất — không tự deploy. Production (`/latest/` trên VPS) chỉ đổi khi có tag mới.

## Thứ tự triển khai lần đầu

Khi chốt kiến trúc này cho một repo mới, làm theo thứ tự sau, không nhảy cóc:

1. Tạo repo.
2. Bật branch protection cho `main`.
3. Đưa source Nextra lên qua branch `feature/init-nextra`.
4. Merge PR vào `main`.
5. Sau đó mới viết CI cho tag (build, upload VPS, cập nhật `versions.json`/`latest/`).

Không cần đụng đến phần version/deploy ngay từ commit đầu tiên.
