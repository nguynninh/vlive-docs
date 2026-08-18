"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { usePathname } from "next/navigation";

/**
 * Mỗi entry ở đây phải khớp với một location block thật trong
 * nginx/nginx.vdocs.conf (và PM2 process build với BASE_PATH tương ứng).
 * basePath: "" nghĩa là bản mới nhất, phục vụ ở gốc "/".
 * Xem quy tắc đồng bộ trong CONTRIBUTING.md > "Version switcher".
 */
const VERSIONS = [{ label: "1.1.0", basePath: "" }];

export function VersionSwitch() {
  const pathname = usePathname();

  const active = VERSIONS[0];

  // Chỉ 1 bản đang chạy thì hiện nhãn tĩnh, không cần dropdown để bấm.
  if (VERSIONS.length < 2) {
    return (
      <span className="nextra-lang-switch-button" aria-disabled>
        {active.label}
      </span>
    );
  }

  const stripBasePath = (path: string) => {
    const current = VERSIONS.find((v) => v.basePath && path.startsWith(v.basePath));
    return current ? path.slice(current.basePath.length) || "/" : path;
  };

  const restOfPath = stripBasePath(pathname);

  return (
    <Menu as="div" className="nextra-lang-switch">
      <MenuButton className="nextra-lang-switch-button">
        {active.label}
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </MenuButton>
      <MenuItems anchor={{ to: "bottom end", gap: 10, padding: 16 }} className="nextra-lang-switch-items">
        {VERSIONS.map((version) => {
          const isActive = version.label === active.label;
          const href = `${version.basePath}${restOfPath}`;
          return (
            <MenuItem key={version.label} as="a" href={href}>
              {({ focus }) => (
                <span
                  className="nextra-lang-switch-item nextra-lang-switch-item-link"
                  data-focus={focus || undefined}
                  data-active={isActive || undefined}
                >
                  {version.label}
                </span>
              )}
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
