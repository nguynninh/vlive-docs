# Quy trình làm việc với VLive Docs

Tài liệu này mô tả quy trình Git chính thức cho project VLive Docs (Nextra/MDX). Mục tiêu: đơn giản, đủ dùng, không phức tạp hóa như Git Flow.

## Mô hình branch

```
development
  │
  ├── feature/xxx
  ├── fix/xxx
  ├── docs/xxx
  ├── refactor/xxx
  └── chore/xxx

development ── (admin tự merge tay) ──► main
```

- **`development`**: nơi tích hợp hàng ngày. Mọi `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `chore/*` đều tạo từ `development` và PR trở lại `development`. Đây là nhánh mọi người làm việc chung.
- **`main`**: là **production**. Merge vào `main` là release ngay lập tức — CI tự động tính version, tạo tag, build và publish. Vì vậy `development → main` **không tự động**, chỉ admin tự tay merge khi thấy nội dung trên `development` đã sẵn sàng phát hành. Đây là bước quan trọng nên cố tình không giao cho CI hay quy trình tự động quyết định.

```
feature/* ─┐
fix/*      ─┼─ PR ─► development ─── admin tự merge tay ─► main ─► CI tự tag + release
docs/*     ─┘
```

### Quy định đặt tên branch

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Tích hợp | `development` | `development` |
| Production | `main` | `main` |
| Thêm chức năng | `feature/<name>` | `feature/version-switcher` |
| Sửa bug | `fix/<name>` | `fix/sidebar-mobile` |
| Sửa nội dung docs lớn | `docs/<name>` | `docs/ios-integration` |
| Refactor | `refactor/<name>` | `refactor/navigation` |
| Build/config | `chore/<name>` | `chore/nginx-config` |

### Quy trình làm việc mẫu

```bash
git checkout development
git pull
git checkout -b feature/version-switcher

# ... code ...

git add .
git commit -m "feat: add documentation version switcher"
git push -u origin feature/version-switcher
```

Sau đó tạo Pull Request:

```
feature/version-switcher → PR → development
```

Merge vào `development` **chưa** lên production — chỉ là gộp vào nhánh tích hợp chung. Nội dung chỉ thật sự lên production khi admin tự tay merge `development → main` (xem mục [Build static snapshot theo version](#build-static-snapshot-theo-version)).

Merge xong thì xóa branch đã hoàn thành, không giữ lại đống branch cũ.

### Admin release: merge `development` vào `main`

```bash
git checkout main
git pull
git merge development
git push origin main
```

Đây là thao tác thủ công, chỉ admin thực hiện khi đã xem xét nội dung trên `development` đủ ổn định để phát hành — không có PR tự động, không có CI nào tự ý làm bước này.

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

### Quy trình release — tự động tag, chỉ merge lên `main` là thủ công

Không ai chạy `git tag` thủ công. Điểm duy nhất cần tay người là **quyết định khi nào merge `development → main`** (mục trên). Sau khi merge đó xảy ra, CI tự tính version tiếp theo dựa trên Conventional Commits của các commit vừa đưa vào `main`, so với tag cao nhất hiện có:

- Có commit `feat:` → tăng **MINOR** (`1.0.0` → `1.1.0`)
- Chỉ có `fix:`, `docs:`, `style:`, `refactor:`, `chore:` → tăng **PATCH** (`1.0.0` → `1.0.1`)
- Có `BREAKING CHANGE:` trong body commit (hoặc `feat!:`) → tăng **MAJOR** (`1.0.0` → `2.0.0`)

CI tự tạo tag `vX.Y.Z` tương ứng, push tag đó, tạo GitHub Release, rồi build/publish luôn — toàn bộ trong cùng một lần chạy ngay sau khi `main` được cập nhật.

## Build static snapshot theo version

Mỗi khi `main` được cập nhật (do admin merge từ `development`), CI phải tự động tính version mới, tạo tag, build và publish snapshot cho version đó lên VPS, đồng thời cập nhật con trỏ `latest` — không làm thủ công để tránh quên hoặc lệch version.

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

Điểm quan trọng: mỗi lần CI chạy chỉ thấy đúng trạng thái `main` tại thời điểm đó, nên nó không tự biết những version nào đã từng release trước đó. `versions.json` vì vậy **không được sinh ra từ source trong `main`**, mà là file thật nằm ngay tại `/var/www/vlive-docs/versions.json` trên VPS — tồn tại độc lập, tích lũy qua từng lần release.

Không cần S3 hay nhánh `gh-pages`. CI chỉ cần SSH vào VPS: đọc `versions.json` hiện tại → merge version mới vào → ghi đè lại đúng vị trí đó.

### Quy trình CI khi `main` được cập nhật (GitHub Actions)

Trigger: `on: push: branches: ["main"]` (tức là chạy ngay sau khi admin merge `development → main`)

Các bước:

1. Checkout `main` (đã bao gồm nội dung vừa merge từ `development`).
2. Đọc các commit message kể từ tag gần nhất, xác định loại bump (MAJOR/MINOR/PATCH) theo Conventional Commits.
3. Tính version mới, tạo tag `vX.Y.Z` và push tag đó lên repo (đồng thời tạo GitHub Release).
4. `npm ci && npm run build` → build ra `out/`.
5. Rsync/scp `out/` lên VPS vào `/var/www/vlive-docs/versions/<version>/` (bỏ tiền tố `v`).
6. SSH vào VPS, chạy script trên VPS để: đọc `versions.json` hiện tại, so sánh version vừa deploy với `"latest"` (so sánh theo Semantic Versioning, không so sánh chuỗi).
7. Vì trigger là cập nhật `main`, version mới **luôn** là cao nhất — đồng bộ `/var/www/vlive-docs/latest/` bằng đúng nội dung `/versions/<version>/` vừa upload (ví dụ `rsync --delete`), và cập nhật `"latest"` trong `versions.json`.
8. Thêm version mới vào mảng `"versions"` trong `versions.json` (merge vào danh sách cũ, không thay thế).
9. Ghi `versions.json` đã cập nhật đè lại đúng vị trí `/var/www/vlive-docs/versions.json`.

Ví dụ workflow rút gọn (dùng [semantic-release](https://github.com/semantic-release/semantic-release) hoặc script tự viết để tính version từ commit log):

```yaml
name: Auto Version & Deploy
on:
  push:
    branches: ["main"]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # cần full history để đọc hết commit log từ tag gần nhất
      - name: Determine next version & create tag
        id: version
        run: node scripts/next-version.js   # đọc conventional commits, in ra VERSION, tạo + push tag vX.Y.Z
      - run: npm ci && npm run build        # output: out/
      - name: Upload snapshot to VPS
        run: rsync -avz --delete out/ user@vps:/var/www/vlive-docs/versions/${{ steps.version.outputs.VERSION }}/
      - name: Update latest + versions.json (chạy trên VPS qua SSH)
        run: ssh user@vps "bash /var/www/vlive-docs/scripts/publish-version.sh ${{ steps.version.outputs.VERSION }}"
```

`scripts/next-version.js` chịu trách nhiệm: đọc commit log kể từ tag cao nhất hiện có, xác định bump theo Conventional Commits, tạo và push tag mới, xuất `VERSION` cho các step sau dùng.

`scripts/publish-version.sh` (chạy trên VPS) chịu trách nhiệm: đọc `versions.json`, cập nhật `latest` (`rsync --delete` snapshot vào `/latest/`) và ghi lại `versions.json` — vì mọi lần chạy đều là bản mới nhất nên không cần so sánh điều kiện.

**Nguyên tắc quan trọng:**

- Snapshot trong `/versions/<x.y.z>/` là bất biến — không rebuild/sửa lại sau khi đã publish. Muốn sửa nội dung phải ra bản patch mới:

  ```
  v1.0.0
     ↓ sửa
  v1.0.1
  ```

  không đè lên `v1.0.0`.
- `/latest/` không phải version cố định — nó luôn trỏ theo bản cao nhất theo semver, tự động cập nhật mỗi lần `main` có version mới cao hơn.
- Không tự chuyển `latest` khi phát hành bản vá cho version cũ hơn bản đang là latest (ví dụ ra `v1.0.2` trong khi `v2.0.0` đã tồn tại) — chỉ thêm vào `/versions/` và `versions.json`, không đụng `/latest/`.

## Version switcher (dropdown chọn phiên bản trên header)

Dropdown chọn version trên site (`app/[lang]/version-switch.tsx`) là UI thuần — nó **không tự biết** bản nào đang thật sự được giữ song song trên VPS. Mỗi khi quyết định giữ một bản release cũ chạy song song theo path (mục "Build static snapshot theo version" ở trên), phải đồng bộ đúng **cả 3 chỗ** sau, thiếu 1 trong 3 là dropdown sẽ trỏ tới link chết (đã từng xảy ra với `v1.0.3` — path không được build/deploy nhưng vẫn nằm trong dropdown):

1. `nginx/nginx.vdocs.conf` — thêm `location /vX.Y.Z/ { proxy_pass ...; }` trỏ tới PM2 process build với `BASE_PATH=/vX.Y.Z` tương ứng.
2. Deploy thật: build + chạy PM2 ở port riêng cho bản đó (xem `deploy.sh`).
3. `app/[lang]/version-switch.tsx` — thêm entry `{ label: "X.Y.Z", basePath: "/vX.Y.Z" }` vào mảng `VERSIONS`.

**Nguyên tắc:** chỉ thêm version vào `VERSIONS` sau khi bước 1 và 2 đã chạy thật trên VPS — không thêm "trước" cho có, vì lúc đó path chưa tồn tại. Khi ngừng giữ song song một bản cũ (gỡ location block + dừng PM2), phải xóa luôn entry tương ứng khỏi `VERSIONS`. Nếu chỉ còn 1 bản đang chạy, `VersionSwitch` tự ẩn dropdown (không hiển thị menu chỉ có 1 lựa chọn vô nghĩa).

## Nơi thử trước khi merge lên `main`

Vì merge `development → main` là release ngay lập tức, **không còn bước đệm nào sau đó nữa** — nên phải chặn lỗi *trước khi* admin merge, chứ không phải sau.

Có 2 lớp kiểm tra bắt buộc:

1. **CI check trên mỗi PR vào `development`** — chạy `npm run build` (và lint/typecheck nếu có) ngay khi mở PR hoặc push thêm commit. PR không được merge vào `development` nếu bước này fail. Đây là job build-thử, không upload VPS, không tạo tag.
2. **Preview/kiểm tra thủ công trên `development`** trước khi admin bấm merge lên `main` — chạy `npm run dev` hoặc `npm run build && npx serve out/` trên `development`, hoặc dùng CI để build preview link tạm (Cloudflare Pages/Vercel preview) để xem trực quan toàn bộ nội dung đã gộp.

Ví dụ workflow riêng cho PR vào `development` (không đụng tới workflow auto-release ở `main`):

```yaml
name: PR Check
on:
  pull_request:
    branches: ["development"]

jobs:
  build-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
```

## Bảo vệ branch

Khi có nhiều người cùng sửa docs, bật branch protection:

```
development
├── ❌ không force push
├── ❌ developer push thẳng
├── ✅ thay đổi qua Pull Request
├── ✅ build/check phải pass
└── ✅ merge xong xóa branch

main
├── ❌ không force push
├── ❌ không delete
├── ❌ không ai push thẳng, kể cả admin — chỉ merge từ development
└── ✅ chỉ admin có quyền merge development → main
```

Vì project đã có nhiều người cùng phát triển, bật bắt buộc Pull Request và branch protection ngay từ bây giờ — không push thẳng.

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
development
   │
   │ admin tự merge tay khi sẵn sàng release
   ▼
 main
   │
   ▼
GitHub Actions
   │
   ├── xác định version mới (Conventional Commits)
   ├── tạo tag v1.2.0
   ├── npm ci && npm run build
   ├── out/
   │
   ├── /versions/1.2.0/
   ├── update versions.json
   │
   └── /latest/
```

`development` là nơi tích hợp — không tự deploy. Production (`/latest/` trên VPS) chỉ đổi khi admin merge `development → main`.

## Thứ tự triển khai lần đầu

Khi chốt kiến trúc này cho một repo mới, làm theo thứ tự sau, không nhảy cóc:

1. Tạo repo, tạo nhánh `development` từ `main`.
2. Bật branch protection cho cả `development` và `main`.
3. Đưa source Nextra lên qua branch `feature/init-project`, PR vào `development`.
4. Merge PR vào `development`.
5. Admin merge `development → main` để có bản release đầu tiên.
6. Sau đó mới viết CI cho tag (build, upload VPS, cập nhật `versions.json`/`latest/`), trigger theo push vào `main`.

Không cần đụng đến phần version/deploy ngay từ commit đầu tiên.
